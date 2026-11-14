-- ============================================================================
-- 007_procedures.sql
-- Vehicle Service Management System - Advanced DBMS Project
-- Purpose: PL/pgSQL Stored Procedures with Transaction Logic & Exception Handling
-- ============================================================================

-- Procedure 1: book_service_appointment
-- Handles atomic appointment booking with slot validation, ownership checking, and service linking
CREATE OR REPLACE PROCEDURE book_service_appointment(
    p_customer_id INT,
    p_vehicle_id INT,
    p_booking_date DATE,
    p_time_slot VARCHAR,
    p_service_ids INT[],
    p_customer_notes TEXT,
    INOUT p_booking_id INT DEFAULT NULL,
    INOUT p_booking_number VARCHAR DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_owner_id INT;
    v_is_available BOOLEAN;
    v_service_id INT;
    v_service_price NUMERIC(10, 2);
    v_total_cost NUMERIC(10, 2) := 0.00;
    v_random_suffix VARCHAR(6);
BEGIN
    -- 1. Validate customer existence
    IF NOT EXISTS (SELECT 1 FROM customers WHERE id = p_customer_id) THEN
        RAISE EXCEPTION 'Customer ID % does not exist', p_customer_id;
    END IF;

    -- 2. Validate vehicle ownership
    SELECT customer_id INTO v_owner_id FROM vehicles WHERE id = p_vehicle_id;
    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Vehicle ID % does not exist', p_vehicle_id;
    END IF;
    IF v_owner_id <> p_customer_id THEN
        RAISE EXCEPTION 'Security Violation: Vehicle % does not belong to customer %', p_vehicle_id, p_customer_id;
    END IF;

    -- 3. Validate appointment date (cannot be in the past)
    IF p_booking_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Invalid date: Appointment cannot be scheduled in the past (% < %)', p_booking_date, CURRENT_DATE;
    END IF;

    -- 4. Check slot availability using capacity function with advisory locking
    v_is_available := check_slot_availability(p_booking_date, p_time_slot);
    IF NOT v_is_available THEN
        RAISE EXCEPTION 'Appointment slot % on % is fully booked. Please select an alternate slot.', p_time_slot, p_booking_date;
    END IF;

    -- 5. Generate formatted unique booking number: BK-YYYYMMDD-XXXX
    v_random_suffix := LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
    p_booking_number := 'BK-' || TO_CHAR(p_booking_date, 'YYYYMMDD') || '-' || v_random_suffix;

    -- 6. Insert service booking header
    INSERT INTO service_bookings (
        booking_number,
        customer_id,
        vehicle_id,
        booking_date,
        time_slot,
        status,
        customer_notes,
        total_estimated_cost
    ) VALUES (
        p_booking_number,
        p_customer_id,
        p_vehicle_id,
        p_booking_date,
        p_time_slot,
        'pending',
        p_customer_notes,
        0.00
    ) RETURNING id INTO p_booking_id;

    -- 7. Link selected services and accumulate estimated cost
    IF p_service_ids IS NOT NULL AND ARRAY_LENGTH(p_service_ids, 1) > 0 THEN
        FOREACH v_service_id IN ARRAY p_service_ids
        LOOP
            SELECT base_price INTO v_service_price FROM services WHERE id = v_service_id AND is_active = TRUE;
            IF v_service_price IS NULL THEN
                RAISE EXCEPTION 'Active service with ID % was not found in catalog', v_service_id;
            END IF;

            INSERT INTO booking_services (booking_id, service_id, unit_price, notes)
            VALUES (p_booking_id, v_service_id, v_service_price, 'Booked via customer portal');

            v_total_cost := v_total_cost + v_service_price;
        END LOOP;
    END IF;

    -- 8. Update calculated total estimated cost
    UPDATE service_bookings
    SET total_estimated_cost = v_total_cost
    WHERE id = p_booking_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

-- Procedure 2: assign_mechanic
-- Assigns a certified technician to an appointment with status synchronization and workload guardrails
CREATE OR REPLACE PROCEDURE assign_mechanic(
    p_booking_id INT,
    p_mechanic_id INT,
    p_mechanic_notes TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_status booking_status;
    v_active_jobs_count INT;
    v_is_available BOOLEAN;
BEGIN
    -- 1. Validate booking existence and status
    SELECT status INTO v_current_status FROM service_bookings WHERE id = p_booking_id;
    IF v_current_status IS NULL THEN
        RAISE EXCEPTION 'Service booking ID % does not exist', p_booking_id;
    END IF;
    IF v_current_status IN ('completed', 'cancelled') THEN
        RAISE EXCEPTION 'Cannot assign mechanic to a booking with status %', v_current_status;
    END IF;

    -- 2. Validate mechanic availability and existence
    SELECT is_available INTO v_is_available FROM mechanics WHERE id = p_mechanic_id AND status = 'active';
    IF v_is_available IS NULL THEN
        RAISE EXCEPTION 'Mechanic ID % does not exist or is inactive', p_mechanic_id;
    END IF;

    -- 3. Check workload capacity (maximum 3 concurrent active assignments per mechanic)
    SELECT COUNT(*)
    INTO v_active_jobs_count
    FROM service_assignments
    WHERE mechanic_id = p_mechanic_id
      AND status IN ('assigned', 'in_progress');

    IF v_active_jobs_count >= 3 THEN
        RAISE EXCEPTION 'Mechanic ID % is currently overloaded with % active jobs. Max allowed is 3.', 
            p_mechanic_id, v_active_jobs_count;
    END IF;

    -- 4. Mark existing assignment as reassigned if one exists
    UPDATE service_assignments
    SET status = 'reassigned', updated_at = CURRENT_TIMESTAMP
    WHERE booking_id = p_booking_id AND status IN ('assigned', 'in_progress');

    -- 5. Insert new assignment
    INSERT INTO service_assignments (
        booking_id,
        mechanic_id,
        assigned_at,
        status,
        mechanic_notes
    ) VALUES (
        p_booking_id,
        p_mechanic_id,
        CURRENT_TIMESTAMP,
        'assigned',
        p_mechanic_notes
    );

    -- 6. Transition booking status to 'confirmed' if still 'pending'
    IF v_current_status = 'pending' THEN
        UPDATE service_bookings
        SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
        WHERE id = p_booking_id;
    END IF;
END;
$$;

-- Procedure 3: complete_service
-- Marks a workshop job completed, writes technical service records, and timestamps assignments
CREATE OR REPLACE PROCEDURE complete_service(
    p_booking_id INT,
    p_mechanic_id INT,
    p_odometer_reading INT,
    p_work_performed TEXT,
    p_parts_replaced TEXT DEFAULT NULL,
    p_diagnostic_notes TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_vehicle_id INT;
    v_booking_status booking_status;
BEGIN
    -- 1. Validate booking
    SELECT vehicle_id, status INTO v_vehicle_id, v_booking_status
    FROM service_bookings
    WHERE id = p_booking_id;

    IF v_vehicle_id IS NULL THEN
        RAISE EXCEPTION 'Booking ID % not found', p_booking_id;
    END IF;

    IF v_booking_status = 'completed' THEN
        RAISE EXCEPTION 'Booking % is already completed', p_booking_id;
    END IF;

    -- 2. Mark assignment completed
    UPDATE service_assignments
    SET status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE booking_id = p_booking_id AND mechanic_id = p_mechanic_id;

    -- 3. Update vehicle mileage to latest odometer reading
    UPDATE vehicles
    SET mileage_km = GREATEST(mileage_km, p_odometer_reading),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_vehicle_id;

    -- 4. Create or update technical service record
    INSERT INTO service_records (
        booking_id,
        vehicle_id,
        mechanic_id,
        completed_date,
        work_performed,
        parts_replaced,
        diagnostic_notes,
        odometer_reading
    ) VALUES (
        p_booking_id,
        v_vehicle_id,
        p_mechanic_id,
        CURRENT_TIMESTAMP,
        p_work_performed,
        p_parts_replaced,
        p_diagnostic_notes,
        p_odometer_reading
    )
    ON CONFLICT (booking_id) DO UPDATE
    SET work_performed = EXCLUDED.work_performed,
        parts_replaced = EXCLUDED.parts_replaced,
        diagnostic_notes = EXCLUDED.diagnostic_notes,
        odometer_reading = EXCLUDED.odometer_reading;

    -- 5. Transition booking status to 'completed'
    UPDATE service_bookings
    SET status = 'completed',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_booking_id;
END;
$$;

-- Procedure 4: generate_invoice
-- Creates customer invoice and line items based on completed service booking
CREATE OR REPLACE PROCEDURE generate_invoice(
    p_booking_id INT,
    p_discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    INOUT p_invoice_id INT DEFAULT NULL,
    INOUT p_invoice_number VARCHAR DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_customer_id INT;
    v_booking_status booking_status;
    v_subtotal NUMERIC(10, 2) := 0.00;
    v_tax_rate NUMERIC(5, 2) := 18.00;
    v_tax_amount NUMERIC(10, 2) := 0.00;
    v_total_amount NUMERIC(10, 2) := 0.00;
    v_due_date DATE;
    v_item RECORD;
BEGIN
    -- 1. Validate booking and check if invoice already generated
    SELECT customer_id, status INTO v_customer_id, v_booking_status
    FROM service_bookings
    WHERE id = p_booking_id;

    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Booking ID % not found', p_booking_id;
    END IF;

    SELECT id, invoice_number INTO p_invoice_id, p_invoice_number
    FROM invoices
    WHERE booking_id = p_booking_id;

    IF p_invoice_id IS NOT NULL THEN
        -- Invoice already exists, return existing
        RETURN;
    END IF;

    -- 2. Generate unique invoice number: INV-YYYYMMDD-XXXX
    p_invoice_number := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
    v_due_date := CURRENT_DATE + INTERVAL '7 days';

    -- 3. Create invoice header
    INSERT INTO invoices (
        invoice_number,
        booking_id,
        customer_id,
        subtotal,
        tax_rate,
        tax_amount,
        discount_amount,
        total_amount,
        status,
        due_date,
        issued_at
    ) VALUES (
        p_invoice_number,
        p_booking_id,
        v_customer_id,
        0.00,
        v_tax_rate,
        0.00,
        p_discount_amount,
        0.00,
        'issued',
        v_due_date,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO p_invoice_id;

    -- 4. Copy booking services into invoice line items
    FOR v_item IN 
        SELECT bs.service_id, s.name, bs.unit_price
        FROM booking_services bs
        JOIN services s ON s.id = bs.service_id
        WHERE bs.booking_id = p_booking_id
    LOOP
        INSERT INTO invoice_items (invoice_id, service_id, description, quantity, unit_price, line_total)
        VALUES (p_invoice_id, v_item.service_id, v_item.name, 1, v_item.unit_price, v_item.unit_price);

        v_subtotal := v_subtotal + v_item.unit_price;
    END LOOP;

    -- 5. Calculate taxes and final total
    v_tax_amount := ROUND((v_subtotal * (v_tax_rate / 100.0)), 2);
    v_total_amount := GREATEST(0.00, (v_subtotal + v_tax_amount - p_discount_amount));

    -- 6. Update invoice header with final financial calculations
    UPDATE invoices
    SET subtotal = v_subtotal,
        tax_amount = v_tax_amount,
        discount_amount = p_discount_amount,
        total_amount = v_total_amount
    WHERE id = p_invoice_id;
END;
$$;

-- Procedure 5: process_invoice_payment
-- Atomic transaction processing a customer payment and updating invoice settlement status
CREATE OR REPLACE PROCEDURE process_invoice_payment(
    p_invoice_id INT,
    p_amount NUMERIC(10, 2),
    p_payment_method payment_method,
    p_transaction_id VARCHAR,
    p_remarks TEXT DEFAULT NULL,
    INOUT p_payment_id INT DEFAULT NULL,
    INOUT p_payment_reference VARCHAR DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_invoice_total NUMERIC(10, 2);
    v_current_paid NUMERIC(10, 2);
    v_new_total_paid NUMERIC(10, 2);
BEGIN
    -- 1. Validate payment amount
    IF p_amount <= 0.00 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero. Received: %', p_amount;
    END IF;

    -- 2. Lock invoice row FOR UPDATE to prevent race conditions during concurrent payments
    SELECT total_amount INTO v_invoice_total
    FROM invoices
    WHERE id = p_invoice_id
    FOR UPDATE;

    IF v_invoice_total IS NULL THEN
        RAISE EXCEPTION 'Invoice ID % does not exist', p_invoice_id;
    END IF;

    -- 3. Calculate currently paid sum
    SELECT COALESCE(SUM(amount), 0.00) INTO v_current_paid
    FROM payments
    WHERE invoice_id = p_invoice_id AND status = 'completed';

    v_new_total_paid := v_current_paid + p_amount;

    -- 4. Generate unique payment reference: PAY-YYYYMMDD-XXXX
    p_payment_reference := 'PAY-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

    -- 5. Record payment transaction
    INSERT INTO payments (
        payment_reference,
        invoice_id,
        amount,
        payment_method,
        status,
        transaction_id,
        payment_date,
        remarks
    ) VALUES (
        p_payment_reference,
        p_invoice_id,
        p_amount,
        p_payment_method,
        'completed',
        p_transaction_id,
        CURRENT_TIMESTAMP,
        p_remarks
    ) RETURNING id INTO p_payment_id;

    -- 6. Update invoice settlement status based on total cleared funds
    IF v_new_total_paid >= v_invoice_total THEN
        UPDATE invoices
        SET status = 'paid', updated_at = CURRENT_TIMESTAMP
        WHERE id = p_invoice_id;
    ELSE
        UPDATE invoices
        SET status = 'partially_paid', updated_at = CURRENT_TIMESTAMP
        WHERE id = p_invoice_id;
    END IF;
END;
$$;

