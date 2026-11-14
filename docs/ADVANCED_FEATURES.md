# Advanced PostgreSQL Features & Database Programming

**Project:** Vehicle Service Management System  
**Engine:** PostgreSQL Native Procedural Language (PL/pgSQL)  

---

## 1. Stored Procedures (PL/pgSQL)

PostgreSQL stored procedures (introduced in PG 11) allow server-side batch transaction management without requiring application-side coordination loops.

### Procedure 1: `book_service_appointment`
* **File:** `database/migrations/007_procedures.sql`
* **Signature:**
  ```sql
  PROCEDURE book_service_appointment(
      p_customer_id INT,
      p_vehicle_id INT,
      p_booking_date DATE,
      p_time_slot VARCHAR,
      p_service_ids INT[],
      p_customer_notes TEXT,
      INOUT p_booking_id INT,
      INOUT p_booking_number VARCHAR
  )
  ```
* **Transactional Logic:**
  1. Validates customer and vehicle existence.
  2. Enforces vehicle ownership security ($vehicle.customer\_id = p\_customer\_id$).
  3. Verifies slot capacity by calling function `check_slot_availability()`.
  4. Formats unique surrogate booking number `BK-YYYYMMDD-XXXX`.
  5. Inserts appointment record into `service_bookings`.
  6. Iterates through array of requested services `p_service_ids`, queries `base_price` from `services`, and inserts rows into `booking_services`.
  7. Calculates total cost and updates `total_estimated_cost`.

### Procedure 2: `assign_mechanic`
* **Purpose:** Safely assigns an active technician to an eligible booking.
* **Guardrails:**
  * Validates booking status is neither `completed` nor `cancelled`.
  * Verifies technician is active and marked available.
  * Enforces workload capacity limit: prevents assigning a technician who already holds 3 or more concurrent active jobs.
  * Updates any existing active assignment on that booking to `reassigned` before creating the new assignment record.

### Procedure 3: `complete_service`
* **Purpose:** Completes a workshop job and records mechanical notes.
* **Logic:**
  * Verifies current status is not already completed.
  * Marks assignment status as `completed` and sets `completed_at = CURRENT_TIMESTAMP`.
  * Updates vehicle mileage to latest odometer reading (`GREATEST(mileage_km, p_odometer_reading)`).
  * Upserts `service_records` with work performed, parts replaced, and diagnostic notes.
  * Transitions booking status to `completed`.

### Procedure 4: `generate_invoice`
* **Purpose:** Generates itemized customer billing with 18% tax calculation.
* **Logic:**
  * Checks for idempotency (returns existing invoice if already issued).
  * Creates invoice header with due date set 7 days ahead.
  * Copies requested services from `booking_services` into `invoice_items`.
  * Computes subtotal, statutory 18% tax amount, subtracts discount, and updates invoice totals.

### Procedure 5: `process_invoice_payment`
* **Purpose:** Clears customer payments and settles invoice state.
* **Concurrency Protection:** Uses `SELECT total_amount FROM invoices WHERE id = p_invoice_id FOR UPDATE;` to lock the invoice row against concurrent race conditions.
* Reconciles total payments against total billed; marks invoice status as `paid` or `partially_paid`.

---

## 2. User-Defined Functions (PL/pgSQL)

| Function Name | Return Type | Purpose |
|---|---|---|
| `calculate_vehicle_service_cost(p_vehicle_id INT)` | `NUMERIC(10, 2)` | Computes lifetime cumulative expenditure across all paid invoices for a given vehicle. |
| `get_customer_total_spending(p_customer_id INT)` | `NUMERIC(10, 2)` | Computes total cleared funds paid by customer across all invoices. |
| `get_mechanic_completed_jobs(p_mechanic_id INT)` | `TABLE (...)` | Computes technician KPIs: completed count, average review rating, and total labor hours logged. |
| `get_vehicle_service_history(p_vehicle_id INT)` | `TABLE (...)` | Table-returning function compiling historical bookings, mechanics, odometer readings, and costs. |
| `check_slot_availability(p_date DATE, p_time_slot VARCHAR)` | `BOOLEAN` | Workshop capacity check ensuring no more than 5 bookings occur in a single bay slot. |
| `calculate_invoice_balance(p_invoice_id INT)` | `NUMERIC(10, 2)` | Reconciles invoice total minus all completed payments to return net outstanding receivables. |

---

## 3. Database Triggers (PL/pgSQL)

### Trigger 1: `trg_set_updated_at` (Timestamp Synchronization)
* **Event:** `BEFORE UPDATE` on all mutable tables (`users`, `customers`, `vehicles`, `service_bookings`, `invoices`, etc.).
* **Action:** Automatically assigns `NEW.updated_at = CURRENT_TIMESTAMP;`.

### Trigger 2: `trg_track_booking_status` (Lifecycle Audit Trail)
* **Event:** `AFTER UPDATE ON service_bookings`
* **Action:** Detects if `OLD.status IS DISTINCT FROM NEW.status`. When changed, automatically creates an immutable audit row in `service_status_history` logging the old status, new status, change reason, and timestamp.

### Trigger 3: `trg_validate_booking_status` (State Machine Invariant)
* **Event:** `BEFORE UPDATE ON service_bookings`
* **Action:** Rejects illegal backwards transitions at the database engine level:
  * Completed bookings cannot be altered.
  * Cancelled bookings cannot be reactivated.
  * Permitted flow: `pending \to confirmed \to in_progress \to completed`.

### Trigger 4: `trg_invoice_items_recalc` (Automatic Financial Recalculation)
* **Event:** `AFTER INSERT OR UPDATE OR DELETE ON invoice_items`
* **Action:** Recalculates `subtotal`, 18% `tax_amount`, and `total_amount` on the parent `invoices` row, ensuring parent-child balance consistency.

### Trigger 5: `trg_audit_entity_changes` (JSONB Compliance Audit)
* **Event:** `AFTER INSERT OR UPDATE OR DELETE ON payments, invoices, service_bookings`
* **Action:** Captures `to_jsonb(OLD)` and `to_jsonb(NEW)` into `audit_logs` along with client IP address (`inet_client_addr()`) and operation type (`INSERT`, `UPDATE`, `DELETE`).

---

## 4. Explicit Cursor Demonstrations

### Cursor 1: Customer Service Summary (`cursor_customer_service_summary`)
```sql
DECLARE
    cur_completed_bookings CURSOR FOR
        SELECT u.full_name, c.id AS cust_id, COUNT(sb.id) AS completed_count,
               COALESCE(SUM(inv.total_amount), 0.00) AS total_spent
        FROM customers c
        JOIN users u ON u.id = c.user_id
        JOIN service_bookings sb ON sb.customer_id = c.id
        LEFT JOIN invoices inv ON inv.booking_id = sb.id
        WHERE sb.status = 'completed'
        GROUP BY u.full_name, c.id
        ORDER BY total_spent DESC;
    v_record RECORD;
BEGIN
    OPEN cur_completed_bookings;
    LOOP
        FETCH cur_completed_bookings INTO v_record;
        EXIT WHEN NOT FOUND;
        -- Process each row tuple
        summary_line := FORMAT('Customer %s completed %s services totaling $%s', ...);
        RETURN NEXT;
    END LOOP;
    CLOSE cur_completed_bookings;
END;
```

### Cursor 2: Parameterized Overdue Invoice Audit (`cursor_audit_pending_invoices`)
Iterates row-by-row across pending receivables, calculates late aging interest (1.5% if overdue > 15 days, 3.0% if overdue > 30 days), assigns urgency classification, and outputs an aging ledger report.

---

## 5. Relational Views

1. **`customer_vehicle_overview`:** Joins customer personal details with vehicle fleet attributes, aggregating active vs completed service counts.
2. **`booking_details_view`:** Denormalizes appointment headers with customer contacts, vehicle make/model, assigned mechanic name, booked services list, and invoice details.
3. **`mechanic_workload_view`:** Live technician monitor displaying active assigned jobs, historical completed count, and average review stars.
4. **`revenue_summary_view`:** Monthly financial intelligence summarizing gross billings, 18% tax collections, discounts, and cleared cash.
5. **`pending_payments_view`:** Accounts receivable queue displaying overdue invoices with customer contact numbers.

---

## 6. Indexing Strategy

* **B-Tree Indexes:** Primary and foreign keys, frequently filtered registration numbers and emails (`idx_users_email`, `idx_vehicles_reg_num`).
* **Composite Indexes:** Frequently combined predicates such as `(booking_date, time_slot)` for conflict checking, and `(specialization, is_available)` for technician dispatching.
* **Partial Indexes:** Reduces index size and write overhead by indexing only relevant subsets of rows:
  * `idx_users_active` indexes only `WHERE is_active = TRUE`.
  * `idx_bookings_active` indexes only appointments `WHERE status IN ('pending', 'confirmed', 'in_progress')`.
  * `idx_invoices_unpaid` indexes only invoices `WHERE status IN ('issued', 'partially_paid')`.
* **Unique Partial Index:** `uq_active_assignment_per_booking` guarantees at most one technician can be actively assigned to an appointment at any given time.

