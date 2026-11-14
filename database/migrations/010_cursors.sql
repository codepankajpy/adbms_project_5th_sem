-- ============================================================================
-- 010_cursors.sql
-- Vehicle Service Management System - Advanced DBMS Project
-- Purpose: Explicit PL/pgSQL Cursor Demonstrations (DECLARE, OPEN, FETCH, EXIT WHEN, CLOSE)
-- ============================================================================

-- Cursor Demonstration 1: cursor_customer_service_summary
-- Demonstrates traditional explicit cursor lifecycle:
-- DECLARE -> OPEN -> FETCH row-by-row -> EXIT WHEN NOT FOUND -> CLOSE
-- Iterates over completed service bookings to aggregate customer milestone metrics.
CREATE OR REPLACE FUNCTION cursor_customer_service_summary()
RETURNS TABLE (
    summary_line TEXT,
    customer_name VARCHAR,
    total_completed_services INT,
    total_amount_billed NUMERIC(10, 2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    -- 1. DECLARE the cursor with an explicit query
    cur_completed_bookings CURSOR FOR
        SELECT 
            u.full_name,
            c.id AS cust_id,
            COUNT(sb.id) AS completed_count,
            COALESCE(SUM(inv.total_amount), 0.00) AS total_spent
        FROM customers c
        JOIN users u ON u.id = c.user_id
        JOIN service_bookings sb ON sb.customer_id = c.id
        LEFT JOIN invoices inv ON inv.booking_id = sb.id
        WHERE sb.status = 'completed'
        GROUP BY u.full_name, c.id
        ORDER BY total_spent DESC;

    -- Local record variable to hold each fetched row
    v_record RECORD;
    v_row_count INT := 0;
BEGIN
    -- 2. OPEN the explicit cursor
    OPEN cur_completed_bookings;

    LOOP
        -- 3. FETCH next row into the record buffer
        FETCH cur_completed_bookings INTO v_record;

        -- 4. EXIT WHEN condition to terminate loop when no more rows exist
        EXIT WHEN NOT FOUND;

        v_row_count := v_row_count + 1;

        -- Prepare output row
        summary_line := FORMAT(
            'Rank #%s: Customer %s (ID: %s) completed %s service(s) totaling $%s',
            v_row_count,
            v_record.full_name,
            v_record.cust_id,
            v_record.completed_count,
            v_record.total_spent
        );
        customer_name := v_record.full_name;
        total_completed_services := v_record.completed_count;
        total_amount_billed := v_record.total_spent;

        -- Return the current processed row
        RETURN NEXT;
    END LOOP;

    -- 5. CLOSE the cursor to release execution memory resources
    CLOSE cur_completed_bookings;

    RETURN;
END;
$$;


-- Cursor Demonstration 2: cursor_audit_pending_invoices
-- Demonstrates parameterized cursor lifecycle with conditional logic:
-- Iterates through unpaid/overdue invoices, calculates penalty/aging interest, and produces an aging ledger report.
CREATE OR REPLACE FUNCTION cursor_audit_pending_invoices(p_threshold_days INT DEFAULT 0)
RETURNS TABLE (
    audit_report_id INT,
    invoice_number VARCHAR,
    customer_email VARCHAR,
    days_overdue INT,
    principal_balance NUMERIC(10, 2),
    estimated_late_fee NUMERIC(10, 2),
    recovery_status VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    -- 1. DECLARE cursor with parameter support
    cur_pending_invoices CURSOR(p_days INT) FOR
        SELECT 
            i.id,
            i.invoice_number,
            u.email,
            (CURRENT_DATE - i.due_date) AS overdue_days,
            (i.total_amount - COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0.00)) AS outstanding
        FROM invoices i
        JOIN customers c ON c.id = i.customer_id
        JOIN users u ON u.id = c.user_id
        LEFT JOIN payments p ON p.invoice_id = i.id
        WHERE i.status IN ('issued', 'partially_paid')
        GROUP BY i.id, i.invoice_number, u.email, i.due_date, i.total_amount
        HAVING (CURRENT_DATE - i.due_date) >= p_days
           AND (i.total_amount - COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0.00)) > 0
        ORDER BY overdue_days DESC;

    -- Record variable for fetching
    v_inv RECORD;
    v_counter INT := 0;
    v_fee NUMERIC(10, 2);
    v_urgency VARCHAR;
BEGIN
    -- 2. OPEN parameterized cursor passing argument
    OPEN cur_pending_invoices(p_threshold_days);

    LOOP
        -- 3. FETCH next invoice tuple
        FETCH cur_pending_invoices INTO v_inv;

        -- 4. Terminate when cursor exhaustively scanned
        EXIT WHEN NOT FOUND;

        v_counter := v_counter + 1;

        -- Compute late interest charge: 1.5% if overdue > 15 days, 3% if > 30 days
        IF v_inv.overdue_days > 30 THEN
            v_fee := ROUND((v_inv.outstanding * 0.03), 2);
            v_urgency := 'CRITICAL_COLLECTION';
        ELSIF v_inv.overdue_days > 15 THEN
            v_fee := ROUND((v_inv.outstanding * 0.015), 2);
            v_urgency := 'URGENT_NOTICE';
        ELSE
            v_fee := 0.00;
            v_urgency := 'STANDARD_PENDING';
        END IF;

        audit_report_id := v_counter;
        invoice_number := v_inv.invoice_number;
        customer_email := v_inv.email;
        days_overdue := v_inv.overdue_days;
        principal_balance := v_inv.outstanding;
        estimated_late_fee := v_fee;
        recovery_status := v_urgency;

        RETURN NEXT;
    END LOOP;

    -- 5. CLOSE the cursor
    CLOSE cur_pending_invoices;

    RETURN;
END;
$$;

