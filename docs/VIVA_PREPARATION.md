# ADBMS Viva Voce Preparation & Technical Oral Guide

**Course:** Advanced Database Management Systems (ADBMS)  
**Project:** Vehicle Service Management System  
**Engine:** PostgreSQL Native  

---

## 1. Schema Normalization & Functional Dependencies

### Q1: "Explain how your schema achieves Third Normal Form (3NF). Point to a specific table."
**Answer:**
"In our project, we have 18 relations, each satisfying 1NF, 2NF, and 3NF.
* **1NF:** Every column has atomic values. For example, in `service_bookings`, requested services are not stored as a delimited string; instead, we created a bridge table `booking_services` where each tuple `(booking_id, service_id)` is atomic.
* **2NF:** There are no partial functional dependencies. In `booking_services`, the composite primary key is `(booking_id, service_id)`. The attribute `unit_price` depends on *both* the booking and the service (representing the locked-in historical price at booking time). Service attributes like `description` or `estimated_duration_minutes` are dependent solely on `service_id` and are kept strictly in the `services` relation.
* **3NF:** There are no transitive dependencies ($X \to Y$ and $Y \to Z$). A classic pitfall in vehicle management is storing vehicle model and brand details inside the `vehicles` table: $\text{vehicle\_id} \to \text{model\_id} \to \text{brand\_id} \to \text{country}$. We decomposed this into `vehicle_brands`, `vehicle_models`, and `vehicles`. The `vehicles` table holds only the foreign key `model_id`."

### Q2: "What functional dependencies exist in your `invoices` table?"
**Answer:**
"In `invoices`:
* $\text{id} \to \text{invoice\_number}, \text{booking\_id}, \text{customer\_id}, \text{subtotal}, \text{tax\_rate}, \text{tax\_amount}, \text{total\_amount}, \text{status}, \text{due\_date}, \text{issued\_at}$
* $\text{invoice\_number} \to \text{id}, \text{booking\_id}, \text{total\_amount}$
* $\text{booking\_id} \to \text{id}, \text{customer\_id}$ (since an appointment produces at most one invoice, enforced by a `UNIQUE(booking_id)` constraint).
Candidate keys are `{id}`, `{invoice_number}`, and `{booking_id}`."

---

## 2. Relational Joins & Set Operations

### Q3: "What is the difference between an INNER JOIN, LEFT JOIN, and FULL OUTER JOIN in your project?"
**Answer:**
* **INNER JOIN (Query 13):** Returns rows only when there is a matching key on both sides. When querying completed bookings with invoices, if a booking does not yet have an invoice, it is excluded.
* **LEFT JOIN (Query 14):** Preserves all rows from the left relation. We use `vehicles LEFT JOIN service_bookings` so that newly registered customer vehicles that have *never* had a service booking still appear in fleet reports with a booking count of `0`.
* **FULL OUTER JOIN (Query 16):** Preserves rows from both relations, filling unmatched sides with NULL. We demonstrated this on `invoices FULL OUTER JOIN payments` to detect ledger anomalies: invoices with zero payments alongside any orphaned payments that do not link to a valid invoice."

### Q4: "Where did you use a SELF JOIN and a CROSS JOIN?"
**Answer:**
* **SELF JOIN (Query 18):** Joined `mechanics m1 JOIN mechanics m2 ON m1.hourly_rate = m2.hourly_rate AND m1.id < m2.id`. This pairs mechanics who charge the exact same hourly labor rate, using `<` to eliminate mirror duplicates and reflexive pairs ($m_1$ paired with $m_1$).
* **CROSS JOIN (Query 17):** Formed the Cartesian product `mechanics CROSS JOIN service_categories` to generate an evaluation matrix pairing every technician with every service category for training audits."

---

## 3. Subqueries & Modern SQL Standard Aggregations

### Q5: "What is the computational difference between a scalar subquery and a correlated subquery?"
**Answer:**
* **Scalar Subquery (Query 19):** Executes once for the entire query statement. In our catalog query: `WHERE base_price > (SELECT AVG(base_price) FROM services)`, the subquery computes the single global average first, and the outer query filters rows against that static constant.
* **Correlated Subquery (Query 20):** Evaluates once for *every candidate tuple* in the outer query because it references outer attributes. In Query 20:
  ```sql
  WHERE v.mileage_km > (
      SELECT AVG(v2.mileage_km)
      FROM vehicles v2
      JOIN vehicle_models vm2 ON vm2.id = v2.model_id
      WHERE vm2.brand_id = vb.id -- Correlated reference to outer brand
  )
  ```
  The average mileage is dynamically computed for each individual vehicle's specific brand."

### Q6: "Why use `COUNT(*) FILTER (WHERE ...)` instead of `COUNT(CASE ...)`?"
**Answer:**
"The `FILTER (WHERE predicate)` clause (Query 26) is the official SQL:2003 standard implemented in modern PostgreSQL. In our billing overview:
```sql
SELECT 
  COUNT(*) AS total_invoices,
  COUNT(*) FILTER (WHERE status = 'paid') AS paid_count,
  SUM(total_amount) FILTER (WHERE status = 'paid') AS total_collected
FROM invoices;
```
It computes conditional aggregates in a single relational scan with cleaner syntax and faster execution plans than nested `CASE` statements."

---

## 4. Common Table Expressions (CTEs) & Window Functions

### Q7: "What is a Recursive CTE and why did you use it in this project?"
**Answer:**
"A Common Table Expression (`WITH` clause) creates a temporary result set for the query. A **Recursive CTE** (Query 29) references itself to iteratively generate data:
```sql
WITH RECURSIVE date_series AS (
    SELECT '2026-11-10'::DATE AS booking_day -- Base anchor member
    UNION ALL
    SELECT (booking_day + INTERVAL '1 day')::DATE -- Recursive member
    FROM date_series
    WHERE booking_day < '2026-11-20'::DATE -- Termination condition
)
SELECT ds.booking_day, COUNT(sb.id)
FROM date_series ds
LEFT JOIN service_bookings sb ON sb.booking_date = ds.booking_day
GROUP BY ds.booking_day;
```
We use it to generate a continuous calendar date range. A standard query grouping `service_bookings` by date completely skips dates with zero appointments. By joining our generated recursive date series against bookings with a `LEFT JOIN`, dates with zero bookings report `0` rather than disappearing."

### Q8: "How does a Window Function differ from `GROUP BY`? Explain `ROW_NUMBER()`, `LAG()`, and `SUM() OVER`."
**Answer:**
"`GROUP BY` collapses multiple tuples into a single aggregated summary row. A **Window Function** performs calculations across a set of table rows related to the current row *without collapsing rows*—the output preserves every original row.
1. **`ROW_NUMBER()` / `DENSE_RANK()` (Query 30):** Ranks services within each category ordered by price: `ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY base_price DESC)`.
2. **`LAG()` (Query 31):** Looks behind at preceding rows in the ordered window. We use `LAG(booking_date) OVER (PARTITION BY vehicle_id ORDER BY booking_date)` to calculate the exact days elapsed between consecutive workshop visits for a vehicle.
3. **`SUM() OVER` (Query 32):** Computes a cumulative running total of workshop revenue across payments ordered chronologically: `SUM(amount) OVER (ORDER BY payment_date ASC)`."

---

## 5. Stored Procedures vs. Functions

### Q9: "When do you use a Stored Procedure versus a User-Defined Function in PostgreSQL?"
**Answer:**
* **Functions (`CREATE FUNCTION ... RETURNS`):** Designed to compute and return a value (scalar or table). They are invoked inside SQL statements like `SELECT calculate_vehicle_service_cost(1);` or `SELECT * FROM get_mechanic_completed_jobs(2);`. Functions in PostgreSQL execute inside the caller's transaction and cannot issue `COMMIT` or `ROLLBACK` commands.
* **Stored Procedures (`CREATE PROCEDURE ... CALL`):** Introduced in PostgreSQL 11 to execute standalone business processes. They are invoked using `CALL book_service_appointment(...);`. Procedures can start and commit transactions independently and return data through `INOUT` parameters."

### Q10: "Explain the stored procedure `book_service_appointment`."
**Answer:**
"The procedure handles atomic appointment bookings:
1. Validates that the customer exists and that the vehicle is genuinely registered to that customer (preventing unauthorized bookings).
2. Checks slot capacity using `check_slot_availability()`.
3. Generates a unique booking number: `BK-YYYYMMDD-XXXX`.
4. Inserts the booking header into `service_bookings`.
5. Iterates through the array of selected service IDs, looks up the current `base_price` from `services`, and inserts rows into `booking_services`.
6. Calculates the total estimated cost and updates the booking row.
If any step fails (e.g. invalid date or vehicle), an exception is raised, triggering a complete transaction rollback."

---

## 6. Triggers & State Invariants

### Q11: "Explain how your triggers prevent illegal booking status transitions."
**Answer:**
"We implemented a `BEFORE UPDATE` trigger `trg_validate_booking_status` on `service_bookings`.
When an application attempts to modify `status`:
* If `OLD.status = 'completed'`, it throws: `RAISE EXCEPTION 'Booking is completed and cannot be modified'`.
* If `OLD.status = 'cancelled'`, reactivation is forbidden.
* Permitted forward paths are strictly validated: `pending \to confirmed`, `confirmed \to in_progress`, `in_progress \to completed`.
This guarantees that business rules are enforced directly by the database engine, ensuring data integrity even if an admin directly issues an arbitrary SQL update."

### Q12: "How does your invoice total stay synchronized with line items?"
**Answer:**
"Through trigger `trg_invoice_items_recalc`, which fires `AFTER INSERT OR UPDATE OR DELETE ON invoice_items`.
Whenever a line item is inserted, modified, or removed, the trigger function recalculates the sum of `line_total`, multiplies by the invoice's `tax_rate` (18%), subtracts `discount_amount`, and updates the parent `invoices` table atomically."

---

## 7. Explicit Cursors

### Q13: "What are the 5 phases of an explicit cursor in PL/pgSQL? Where are they implemented in your project?"
**Answer:**
"In migration `010_cursors.sql`, we demonstrated the complete explicit cursor lifecycle:
1. **`DECLARE`:** Defines the query and allocates the cursor pointer:
   `cur_completed_bookings CURSOR FOR SELECT ...`
2. **`OPEN`:** Parses and binds the query, allocating memory resources:
   `OPEN cur_completed_bookings;`
3. **`FETCH`:** Reads the current row into a local record variable and advances the pointer:
   `FETCH cur_completed_bookings INTO v_record;`
4. **`EXIT WHEN NOT FOUND`:** Evaluates the termination condition when all tuples have been processed.
5. **`CLOSE`:** Releases the execution memory:
   `CLOSE cur_completed_bookings;`
We demonstrated this in `cursor_customer_service_summary()` to compute milestone rewards and in `cursor_audit_pending_invoices(threshold_days)` to calculate late fees on overdue invoices."

---

## 8. Indexing, Query Optimization & EXPLAIN ANALYZE

### Q14: "Why not create an index on every single column? What types of indexes did you use?"
**Answer:**
"Every index incurs write overhead on `INSERT`, `UPDATE`, and `DELETE` operations because the database must update both the heap table and the index tree. Blindly indexing causes index bloat.
We used targeted index types:
* **B-Tree Indexes:** For high-cardinality equality lookups (`users.email`, `vehicles.registration_number`).
* **Composite Indexes:** On columns frequently queried together: `(booking_date, time_slot)` for slot conflict checking, and `(specialization, is_available)` for technician dispatching.
* **Partial Indexes:** Indexes with a `WHERE` predicate. For example:
  ```sql
  CREATE INDEX idx_bookings_active ON service_bookings (id, status, booking_date)
  WHERE status IN ('pending', 'confirmed', 'in_progress');
  ```
  Completed and cancelled historical bookings make up the vast majority of rows. By indexing only active bookings, the index size remains tiny and cache-resident.
* **Unique Partial Index:** `uq_active_assignment_per_booking` enforces that only one active assignment exists per booking."

### Q15: "What does `EXPLAIN (ANALYZE, BUFFERS)` tell you?"
**Answer:**
* `EXPLAIN` without `ANALYZE` displays only the query planner's *estimates* (cost, rows, width).
* `EXPLAIN (ANALYZE, BUFFERS)` actually executes the query and reports:
  1. **Actual Startup & Total Time** in milliseconds.
  2. **Actual Row Count** returned vs estimated rows.
  3. **Join Algorithm Used:** Hash Join, Nested Loop, or Merge Join.
  4. **Buffers Hit / Read:** How many 8kB memory blocks were read from shared buffer cache (`shared hit`) vs fetched from disk (`read`)."

---

## 9. Transactions, ACID & Concurrency Control

### Q16: "How does PostgreSQL guarantee the 4 ACID properties in this project?"
**Answer:**
1. **Atomicity:** Ensured via Write-Ahead Logging (WAL) and transaction boundaries (`BEGIN` / `COMMIT` / `ROLLBACK`). If any step in invoice payment fails, all preceding changes are rolled back.
2. **Consistency:** Schema invariants, foreign key cascades, NOT NULL, and CHECK constraints (such as `amount > 0` and `rating BETWEEN 1 AND 5`) prevent invalid data from persisting.
3. **Isolation:** PostgreSQL uses Multi-Version Concurrency Control (MVCC) with snapshot isolation. In our payment procedure, we explicitly execute `SELECT total_amount FROM invoices WHERE id = $1 FOR UPDATE;` to lock the invoice row against concurrent payment attempts.
4. **Durability:** WAL records are flushed to disk with fsync before returning a successful `COMMIT`, guaranteeing data survives sudden server crashes."

### Q17: "What is a SAVEPOINT and when would you use it?"
**Answer:**
"A `SAVEPOINT` creates a checkpoint inside an active transaction. Unlike a full rollback which aborts the entire transaction block, `ROLLBACK TO SAVEPOINT` undoes changes back to the savepoint while leaving preceding valid statements intact.
In our DBMS Lab `/api/dbms/transactions/simulate`, we demonstrate this live: updating customer contact info, establishing a `SAVEPOINT`, attempting a check-violating update, rolling back to the savepoint upon error, and cleanly committing the customer contact change."

---

## 10. PostgreSQL System Catalogs

### Q18: "What system catalogs did you query in your DBMS Lab Explorer?"
**Answer:**
"We did not hardcode descriptions—the DBMS Lab queries live PostgreSQL catalog tables:
* **`information_schema.tables` & `information_schema.columns`:** For table definitions, ordinals, nullability, and default expressions.
* **`pg_proc`:** Introspects source code and argument signatures for stored procedures (`prokind = 'p'`) and functions (`prokind = 'f'`) using `pg_get_functiondef(oid)`.
* **`pg_trigger` & `pg_class`:** Introspects trigger names, event bitmasks (INSERT/UPDATE/DELETE), and timing (BEFORE/AFTER).
* **`pg_indexes` & `pg_stat_user_indexes`:** Inspects physical index definitions, scan counts (`idx_scan`), and byte sizes (`pg_relation_size`).
* **`pg_stat_user_tables`:** Tracks live tuples (`n_live_tup`), dead tuples (`n_dead_tup`), and vacuum events."

