-- ============================================================================
-- 004_constraints.sql
-- Vehicle Service Management System - Advanced DBMS Project
-- Purpose: Integrity rules, domain constraints, CHECK expressions, and business validations
-- ============================================================================

-- Email format validation
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS chk_user_email_format,
    ADD CONSTRAINT chk_user_email_format
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Mechanics constraints
ALTER TABLE mechanics
    DROP CONSTRAINT IF EXISTS chk_mechanic_experience,
    DROP CONSTRAINT IF EXISTS chk_mechanic_hourly_rate,
    ADD CONSTRAINT chk_mechanic_experience CHECK (experience_years >= 0 AND experience_years <= 60),
    ADD CONSTRAINT chk_mechanic_hourly_rate CHECK (hourly_rate >= 0.00);

-- Vehicle year and odometer constraints
ALTER TABLE vehicles
    DROP CONSTRAINT IF EXISTS chk_vehicle_year,
    DROP CONSTRAINT IF EXISTS chk_vehicle_mileage,
    ADD CONSTRAINT chk_vehicle_year CHECK (year >= 1980 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    ADD CONSTRAINT chk_vehicle_mileage CHECK (mileage_km >= 0);

-- Service pricing constraints
ALTER TABLE services
    DROP CONSTRAINT IF EXISTS chk_service_base_price,
    DROP CONSTRAINT IF EXISTS chk_service_duration,
    ADD CONSTRAINT chk_service_base_price CHECK (base_price >= 0.00),
    ADD CONSTRAINT chk_service_duration CHECK (estimated_duration_minutes > 0);

-- Booking pricing constraint
ALTER TABLE service_bookings
    DROP CONSTRAINT IF EXISTS chk_booking_estimated_cost,
    ADD CONSTRAINT chk_booking_estimated_cost CHECK (total_estimated_cost >= 0.00);

-- Booking services unit price constraint
ALTER TABLE booking_services
    DROP CONSTRAINT IF EXISTS chk_booking_service_price,
    ADD CONSTRAINT chk_booking_service_price CHECK (unit_price >= 0.00);

-- Service record odometer reading constraint
ALTER TABLE service_records
    DROP CONSTRAINT IF EXISTS chk_record_odometer,
    ADD CONSTRAINT chk_record_odometer CHECK (odometer_reading >= 0);

-- Invoice financial constraints (prevent negative billing)
ALTER TABLE invoices
    DROP CONSTRAINT IF EXISTS chk_invoice_subtotal,
    DROP CONSTRAINT IF EXISTS chk_invoice_tax_rate,
    DROP CONSTRAINT IF EXISTS chk_invoice_tax_amount,
    DROP CONSTRAINT IF EXISTS chk_invoice_discount_amount,
    DROP CONSTRAINT IF EXISTS chk_invoice_total_amount,
    DROP CONSTRAINT IF EXISTS chk_invoice_due_date,
    ADD CONSTRAINT chk_invoice_subtotal CHECK (subtotal >= 0.00),
    ADD CONSTRAINT chk_invoice_tax_rate CHECK (tax_rate >= 0.00 AND tax_rate <= 100.00),
    ADD CONSTRAINT chk_invoice_tax_amount CHECK (tax_amount >= 0.00),
    ADD CONSTRAINT chk_invoice_discount_amount CHECK (discount_amount >= 0.00),
    ADD CONSTRAINT chk_invoice_total_amount CHECK (total_amount >= 0.00),
    ADD CONSTRAINT chk_invoice_due_date CHECK (due_date >= (issued_at AT TIME ZONE 'UTC')::DATE);

-- Invoice item pricing constraints
ALTER TABLE invoice_items
    DROP CONSTRAINT IF EXISTS chk_item_quantity,
    DROP CONSTRAINT IF EXISTS chk_item_unit_price,
    DROP CONSTRAINT IF EXISTS chk_item_line_total,
    ADD CONSTRAINT chk_item_quantity CHECK (quantity > 0),
    ADD CONSTRAINT chk_item_unit_price CHECK (unit_price >= 0.00),
    ADD CONSTRAINT chk_item_line_total CHECK (line_total >= 0.00);

-- Payment constraints (strictly positive payment amounts)
ALTER TABLE payments
    DROP CONSTRAINT IF EXISTS chk_payment_amount,
    ADD CONSTRAINT chk_payment_amount CHECK (amount > 0.00);

-- Review rating constraint (1 to 5 stars)
ALTER TABLE reviews
    DROP CONSTRAINT IF EXISTS chk_review_rating,
    ADD CONSTRAINT chk_review_rating CHECK (rating >= 1 AND rating <= 5);

-- Audit log action constraint
ALTER TABLE audit_logs
    DROP CONSTRAINT IF EXISTS chk_audit_action,
    ADD CONSTRAINT chk_audit_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'));

