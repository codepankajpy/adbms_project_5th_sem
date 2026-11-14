-- ============================================================================
-- 005_indexes.sql
-- Vehicle Service Management System - Advanced DBMS Project
-- Purpose: Optimized indexing strategy including B-Tree, Composite, Partial, and Foreign Key Indexes
-- ============================================================================

-- 1. B-Tree index on users email (Accelerates authentication queries during login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users USING btree(email);

-- 2. Partial index on active users (Accelerates filtering for active accounts only, reduces index bloat)
CREATE INDEX IF NOT EXISTS idx_users_active ON users (id) WHERE is_active = TRUE;

-- 3. Foreign key index on customers user_id (Joins between users and customers)
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers USING btree(user_id);

-- 4. Composite index on mechanics specialization and availability (Assigning eligible mechanics)
CREATE INDEX IF NOT EXISTS idx_mechanics_spec_avail ON mechanics USING btree(specialization, is_available);

-- 5. Foreign key index on vehicle_models brand_id (Catalog lookups by brand)
CREATE INDEX IF NOT EXISTS idx_vehicle_models_brand ON vehicle_models USING btree(brand_id);

-- 6. Foreign key index on vehicles customer_id (Fetching a customer's garage)
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles USING btree(customer_id);

-- 7. B-Tree index on registration_number (Fast lookup during vehicle check-in)
CREATE INDEX IF NOT EXISTS idx_vehicles_reg_num ON vehicles USING btree(registration_number);

-- 8. Composite index on service_bookings (customer_id, status) (Customer appointment history filtering)
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status ON service_bookings USING btree(customer_id, status);

-- 9. Composite index on service_bookings (booking_date, time_slot) (Slot availability conflict check)
CREATE INDEX IF NOT EXISTS idx_bookings_date_slot ON service_bookings USING btree(booking_date, time_slot);

-- 10. Partial index on service_bookings for active / in-progress bookings (Operational workshop dashboard)
CREATE INDEX IF NOT EXISTS idx_bookings_active ON service_bookings (id, status, booking_date)
    WHERE status IN ('pending', 'confirmed', 'in_progress');

-- 11. Foreign key index on booking_services booking_id (Aggregating invoice items and total costs)
CREATE INDEX IF NOT EXISTS idx_booking_services_booking ON booking_services USING btree(booking_id);

-- 12. Composite index on service_assignments (mechanic_id, status) (Mechanic workload & assigned tasks)
CREATE INDEX IF NOT EXISTS idx_assignments_mechanic_status ON service_assignments USING btree(mechanic_id, status);

-- 13. Unique index on active assignment per booking (Ensures only one active mechanic assignment per booking)
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_assignment_per_booking
    ON service_assignments (booking_id)
    WHERE status IN ('assigned', 'in_progress');

-- 14. Partial index on unpaid invoices (Finance dashboard searching for overdue receivables)
CREATE INDEX IF NOT EXISTS idx_invoices_unpaid ON invoices (customer_id, due_date, total_amount)
    WHERE status IN ('issued', 'partially_paid');

-- 15. Foreign key index on payments invoice_id (Ledger balance reconciliation)
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments USING btree(invoice_id);

-- 16. B-Tree index on payments status and date (Financial reporting by period and settlement state)
CREATE INDEX IF NOT EXISTS idx_payments_status_date ON payments USING btree(status, payment_date);

-- 17. Foreign key index on service_status_history booking_id (Timeline inspection of a job)
CREATE INDEX IF NOT EXISTS idx_status_history_booking ON service_status_history USING btree(booking_id);

-- 18. Index on audit_logs (table_name, record_id, created_at) (Entity history forensics)
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs USING btree(table_name, record_id, created_at DESC);

