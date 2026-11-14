-- ============================================================================
-- 008_triggers.sql
-- Vehicle Service Management System - Advanced DBMS Project
-- Purpose: PL/pgSQL Triggers for Audit Logging, Status History, Business Invariants & Auto-Recalculation
-- ============================================================================

-- ============================================================================
-- TRIGGER 1: Generalized updated_at Timestamp Synchronization
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_mechanics_updated_at ON mechanics;
CREATE TRIGGER trg_mechanics_updated_at
BEFORE UPDATE ON mechanics
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_vehicles_updated_at ON vehicles;
CREATE TRIGGER trg_vehicles_updated_at
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_services_updated_at ON services;
CREATE TRIGGER trg_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON service_bookings;
CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON service_bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON invoices;
CREATE TRIGGER trg_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================================
-- TRIGGER 2: Automatic Lifecycle Status History Tracking
-- Maintains immutable audit log of booking state transitions
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_track_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO service_status_history (
            booking_id,
            previous_status,
            new_status,
            changed_by_user_id,
            change_reason,
            changed_at
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NULL, -- Can be populated if application sets session variable
            'Status transition from ' || OLD.status || ' to ' || NEW.status,
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_booking_status ON service_bookings;
CREATE TRIGGER trg_track_booking_status
AFTER UPDATE ON service_bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_track_booking_status_change();


-- ============================================================================
-- TRIGGER 3: Enforce Valid Booking State Transitions (State Machine)
-- Prevents illegal backwards workflow mutations
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_validate_booking_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Completed bookings are locked and immutable
    IF OLD.status = 'completed' THEN
        RAISE EXCEPTION 'Invalid State Transition: Booking % is completed and cannot be changed to %',
            OLD.id, NEW.status;
    END IF;

    -- Cancelled bookings cannot be reactivated
    IF OLD.status = 'cancelled' THEN
        RAISE EXCEPTION 'Invalid State Transition: Booking % is cancelled and cannot be transitioned to %',
            OLD.id, NEW.status;
    END IF;

    -- Allowed transitions:
    -- pending -> confirmed, cancelled
    -- confirmed -> in_progress, cancelled
    -- in_progress -> completed, cancelled
    IF OLD.status = 'pending' AND NEW.status NOT IN ('confirmed', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid Transition: Pending booking can only transition to confirmed or cancelled (attempted: %)', NEW.status;
    ELSIF OLD.status = 'confirmed' AND NEW.status NOT IN ('in_progress', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid Transition: Confirmed booking can only transition to in_progress or cancelled (attempted: %)', NEW.status;
    ELSIF OLD.status = 'in_progress' AND NEW.status NOT IN ('completed', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid Transition: In-progress booking can only transition to completed or cancelled (attempted: %)', NEW.status;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_booking_status ON service_bookings;
CREATE TRIGGER trg_validate_booking_status
BEFORE UPDATE ON service_bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_validate_booking_status_transition();


-- ============================================================================
-- TRIGGER 4: Automatic Invoice Total Recalculation on Invoice Items DML
-- Maintains financial consistency between parent invoice and child line items
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_recalculate_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_invoice_id INT;
    v_subtotal NUMERIC(10, 2);
    v_tax_rate NUMERIC(5, 2);
    v_tax_amount NUMERIC(10, 2);
    v_discount NUMERIC(10, 2);
    v_total NUMERIC(10, 2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        v_invoice_id := NEW.invoice_id;
    END IF;

    -- Sum line totals
    SELECT COALESCE(SUM(line_total), 0.00)
    INTO v_subtotal
    FROM invoice_items
    WHERE invoice_id = v_invoice_id;

    -- Fetch tax rate and discount
    SELECT tax_rate, discount_amount
    INTO v_tax_rate, v_discount
    FROM invoices
    WHERE id = v_invoice_id;

    v_tax_amount := ROUND((v_subtotal * (COALESCE(v_tax_rate, 18.00) / 100.0)), 2);
    v_total := GREATEST(0.00, v_subtotal + v_tax_amount - COALESCE(v_discount, 0.00));

    -- Update parent invoice
    UPDATE invoices
    SET subtotal = v_subtotal,
        tax_amount = v_tax_amount,
        total_amount = v_total,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_invoice_id;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_items_recalc ON invoice_items;
CREATE TRIGGER trg_invoice_items_recalc
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_invoice_totals();


-- ============================================================================
-- TRIGGER 5: Comprehensive Security & Data Modification Audit Log
-- Captures row changes into audit_logs table with JSONB delta payloads
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_audit_entity_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_record_id INT;
    v_old_json JSONB := NULL;
    v_new_json JSONB := NULL;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_record_id := OLD.id;
        v_old_json := to_jsonb(OLD);
    ELSIF TG_OP = 'UPDATE' THEN
        v_record_id := NEW.id;
        v_old_json := to_jsonb(OLD);
        v_new_json := to_jsonb(NEW);
    ELSIF TG_OP = 'INSERT' THEN
        v_record_id := NEW.id;
        v_new_json := to_jsonb(NEW);
    END IF;

    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        changed_by_user_id,
        old_data,
        new_data,
        ip_address,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        v_record_id,
        TG_OP,
        NULL,
        v_old_json,
        v_new_json,
        inet_client_addr()::TEXT,
        CURRENT_TIMESTAMP
    );

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_payments ON payments;
CREATE TRIGGER trg_audit_payments
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW
EXECUTE FUNCTION trigger_audit_entity_changes();

DROP TRIGGER IF EXISTS trg_audit_invoices ON invoices;
CREATE TRIGGER trg_audit_invoices
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW
EXECUTE FUNCTION trigger_audit_entity_changes();

DROP TRIGGER IF EXISTS trg_audit_bookings ON service_bookings;
CREATE TRIGGER trg_audit_bookings
AFTER INSERT OR UPDATE OR DELETE ON service_bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_audit_entity_changes();

