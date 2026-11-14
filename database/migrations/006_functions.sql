-- ============================================================================
-- 006_functions.sql
-- Vehicle Service Management System - Advanced DBMS Project
-- Purpose: PL/pgSQL User-Defined Functions (Scalar & Table-Returning)
-- ============================================================================

-- Function 1: calculate_vehicle_service_cost
-- Computes the lifetime cumulative service cost for a specific vehicle across all paid invoices
CREATE OR REPLACE FUNCTION calculate_vehicle_service_cost(p_vehicle_id INT)
RETURNS NUMERIC(10, 2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total NUMERIC(10, 2);
BEGIN
    SELECT COALESCE(SUM(i.total_amount), 0.00)
    INTO v_total
    FROM invoices i
    JOIN service_bookings sb ON sb.id = i.booking_id
    WHERE sb.vehicle_id = p_vehicle_id
      AND i.status = 'paid';

    RETURN v_total;
END;
$$;

-- Function 2: get_customer_total_spending
-- Computes the total money paid by a customer across all completed payment records
CREATE OR REPLACE FUNCTION get_customer_total_spending(p_customer_id INT)
RETURNS NUMERIC(10, 2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total NUMERIC(10, 2);
BEGIN
    SELECT COALESCE(SUM(p.amount), 0.00)
    INTO v_total
    FROM payments p
    JOIN invoices i ON i.id = p.invoice_id
    WHERE i.customer_id = p_customer_id
      AND p.status = 'completed';

    RETURN v_total;
END;
$$;

-- Function 3: get_mechanic_completed_jobs
-- Computes operational productivity metrics for a technician
CREATE OR REPLACE FUNCTION get_mechanic_completed_jobs(p_mechanic_id INT)
RETURNS TABLE (
    mechanic_id INT,
    mechanic_name VARCHAR,
    specialization VARCHAR,
    completed_jobs_count BIGINT,
    average_rating NUMERIC(3, 2),
    total_service_hours NUMERIC(10, 2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id AS mechanic_id,
        u.full_name AS mechanic_name,
        m.specialization,
        COUNT(DISTINCT sa.booking_id) AS completed_jobs_count,
        COALESCE(ROUND(AVG(r.rating), 2), 0.00) AS average_rating,
        COALESCE(
            ROUND(
                SUM(EXTRACT(EPOCH FROM (sa.completed_at - sa.started_at)) / 3600.0)::NUMERIC,
                2
            ),
            0.00
        ) AS total_service_hours
    FROM mechanics m
    JOIN users u ON u.id = m.user_id
    LEFT JOIN service_assignments sa ON sa.mechanic_id = m.id AND sa.status = 'completed'
    LEFT JOIN reviews r ON r.booking_id = sa.booking_id
    WHERE m.id = p_mechanic_id
    GROUP BY m.id, u.full_name, m.specialization;
END;
$$;

-- Function 4: get_vehicle_service_history (Table-returning)
-- Comprehensive timeline report of all services, assigned mechanics, and costs for a given vehicle
CREATE OR REPLACE FUNCTION get_vehicle_service_history(p_vehicle_id INT)
RETURNS TABLE (
    booking_id INT,
    booking_number VARCHAR,
    booking_date DATE,
    service_names TEXT,
    mechanic_name VARCHAR,
    odometer_reading INT,
    work_performed TEXT,
    invoice_total NUMERIC(10, 2),
    payment_status VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sb.id AS booking_id,
        sb.booking_number,
        sb.booking_date,
        COALESCE(STRING_AGG(DISTINCT s.name, ', '), 'General Service') AS service_names,
        COALESCE(mu.full_name, 'Unassigned') AS mechanic_name,
        COALESCE(sr.odometer_reading, v.mileage_km) AS odometer_reading,
        COALESCE(sr.work_performed, 'Pending or in progress') AS work_performed,
        COALESCE(inv.total_amount, sb.total_estimated_cost) AS invoice_total,
        COALESCE(inv.status::VARCHAR, 'unbilled') AS payment_status
    FROM service_bookings sb
    JOIN vehicles v ON v.id = sb.vehicle_id
    LEFT JOIN booking_services bs ON bs.booking_id = sb.id
    LEFT JOIN services s ON s.id = bs.service_id
    LEFT JOIN service_assignments sa ON sa.booking_id = sb.id AND sa.status IN ('completed', 'in_progress', 'assigned')
    LEFT JOIN mechanics m ON m.id = sa.mechanic_id
    LEFT JOIN users mu ON mu.id = m.user_id
    LEFT JOIN service_records sr ON sr.booking_id = sb.id
    LEFT JOIN invoices inv ON inv.booking_id = sb.id
    WHERE sb.vehicle_id = p_vehicle_id
    GROUP BY sb.id, sb.booking_number, sb.booking_date, mu.full_name, sr.odometer_reading, 
             v.mileage_km, sr.work_performed, inv.total_amount, inv.status
    ORDER BY sb.booking_date DESC;
END;
$$;

-- Function 5: check_slot_availability
-- Validates if a date and time slot has remaining workshop bay capacity (max 5 bays per slot)
CREATE OR REPLACE FUNCTION check_slot_availability(p_date DATE, p_time_slot VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_booked_count INT;
    c_max_bay_capacity CONSTANT INT := 5;
BEGIN
    SELECT COUNT(*)
    INTO v_booked_count
    FROM service_bookings
    WHERE booking_date = p_date
      AND time_slot = p_time_slot
      AND status NOT IN ('cancelled');

    RETURN v_booked_count < c_max_bay_capacity;
END;
$$;

-- Function 6: calculate_invoice_balance
-- Returns remaining unpaid balance on an invoice
CREATE OR REPLACE FUNCTION calculate_invoice_balance(p_invoice_id INT)
RETURNS NUMERIC(10, 2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total NUMERIC(10, 2);
    v_paid NUMERIC(10, 2);
BEGIN
    SELECT total_amount INTO v_total FROM invoices WHERE id = p_invoice_id;
    IF NOT FOUND THEN
        RETURN 0.00;
    END IF;

    SELECT COALESCE(SUM(amount), 0.00)
    INTO v_paid
    FROM payments
    WHERE invoice_id = p_invoice_id
      AND status = 'completed';

    RETURN GREATEST(0.00, v_total - v_paid);
END;
$$;

