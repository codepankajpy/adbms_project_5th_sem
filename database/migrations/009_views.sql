-- ============================================================================
-- 009_views.sql
-- Vehicle Service Management System - Advanced DBMS Project
-- Purpose: Academic & Operational PostgreSQL Views for Reporting and Dashboard Summaries
-- ============================================================================

-- View 1: customer_vehicle_overview
-- Consolidates customer profiles with registered garage assets and active booking counts
CREATE OR REPLACE VIEW customer_vehicle_overview AS
SELECT 
    c.id AS customer_id,
    u.full_name AS customer_name,
    u.email AS customer_email,
    u.phone AS customer_phone,
    c.city,
    v.id AS vehicle_id,
    v.registration_number,
    vb.name AS brand_name,
    vm.model_name,
    v.year,
    v.color,
    v.mileage_km,
    v.transmission,
    COUNT(sb.id) FILTER (WHERE sb.status IN ('pending', 'confirmed', 'in_progress')) AS active_bookings_count,
    COUNT(sb.id) FILTER (WHERE sb.status = 'completed') AS completed_services_count
FROM customers c
JOIN users u ON u.id = c.user_id
LEFT JOIN vehicles v ON v.customer_id = c.id
LEFT JOIN vehicle_models vm ON vm.id = v.model_id
LEFT JOIN vehicle_brands vb ON vb.id = vm.brand_id
LEFT JOIN service_bookings sb ON sb.vehicle_id = v.id
GROUP BY c.id, u.full_name, u.email, u.phone, c.city, v.id, v.registration_number, vb.name, vm.model_name, v.year, v.color, v.mileage_km, v.transmission;


-- View 2: booking_details_view
-- Central operational view joining appointment, customer, vehicle, assigned mechanic, and billing info
CREATE OR REPLACE VIEW booking_details_view AS
SELECT 
    sb.id AS booking_id,
    sb.booking_number,
    sb.booking_date,
    sb.time_slot,
    sb.status AS booking_status,
    sb.customer_notes,
    sb.total_estimated_cost,
    c.id AS customer_id,
    cu.full_name AS customer_name,
    cu.email AS customer_email,
    cu.phone AS customer_phone,
    v.id AS vehicle_id,
    v.registration_number,
    vb.name AS brand,
    vm.model_name AS model,
    m.id AS mechanic_id,
    mu.full_name AS mechanic_name,
    mu.phone AS mechanic_phone,
    sa.status AS assignment_status,
    inv.id AS invoice_id,
    inv.invoice_number,
    inv.total_amount AS invoice_total,
    inv.status AS invoice_status,
    COALESCE(
        (SELECT STRING_AGG(s.name, ', ')
         FROM booking_services bs
         JOIN services s ON s.id = bs.service_id
         WHERE bs.booking_id = sb.id),
        'None'
    ) AS booked_services_list,
    sb.created_at
FROM service_bookings sb
JOIN customers c ON c.id = sb.customer_id
JOIN users cu ON cu.id = c.user_id
JOIN vehicles v ON v.id = sb.vehicle_id
JOIN vehicle_models vm ON vm.id = v.model_id
JOIN vehicle_brands vb ON vb.id = vm.brand_id
LEFT JOIN service_assignments sa ON sa.booking_id = sb.id AND sa.status IN ('assigned', 'in_progress', 'completed')
LEFT JOIN mechanics m ON m.id = sa.mechanic_id
LEFT JOIN users mu ON mu.id = m.user_id
LEFT JOIN invoices inv ON inv.booking_id = sb.id;


-- View 3: mechanic_workload_view
-- Real-time workshop capacity monitoring displaying active load and historical performance ratings
CREATE OR REPLACE VIEW mechanic_workload_view AS
SELECT 
    m.id AS mechanic_id,
    u.full_name AS mechanic_name,
    u.email AS mechanic_email,
    u.phone AS mechanic_phone,
    m.specialization,
    m.experience_years,
    m.hourly_rate,
    m.status AS employment_status,
    m.is_available,
    COUNT(sa.id) FILTER (WHERE sa.status IN ('assigned', 'in_progress')) AS current_active_jobs,
    COUNT(sa.id) FILTER (WHERE sa.status = 'completed') AS total_completed_jobs,
    COALESCE(ROUND(AVG(r.rating), 2), 0.00) AS average_rating,
    COUNT(r.id) AS total_reviews_received
FROM mechanics m
JOIN users u ON u.id = m.user_id
LEFT JOIN service_assignments sa ON sa.mechanic_id = m.id
LEFT JOIN reviews r ON r.booking_id = sa.booking_id
GROUP BY m.id, u.full_name, u.email, u.phone, m.specialization, m.experience_years, m.hourly_rate, m.status, m.is_available;


-- View 4: revenue_summary_view
-- Financial intelligence view aggregating invoice billings, tax collections, discounts, and payments
CREATE OR REPLACE VIEW revenue_summary_view AS
SELECT 
    TO_CHAR(i.issued_at, 'YYYY-MM') AS billing_month,
    COUNT(i.id) AS total_invoices_issued,
    SUM(i.subtotal) AS gross_subtotal,
    SUM(i.tax_amount) AS total_tax_collected,
    SUM(i.discount_amount) AS total_discounts_granted,
    SUM(i.total_amount) AS net_invoiced_amount,
    COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0.00) AS total_cleared_payments,
    SUM(i.total_amount) - COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0.00) AS outstanding_receivables
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id
GROUP BY TO_CHAR(i.issued_at, 'YYYY-MM')
ORDER BY billing_month DESC;


-- View 5: pending_payments_view
-- Accounts receivable queue showing open invoices with customer contacts and remaining balances
CREATE OR REPLACE VIEW pending_payments_view AS
SELECT 
    i.id AS invoice_id,
    i.invoice_number,
    i.issued_at::DATE AS invoice_date,
    i.due_date,
    CURRENT_DATE - i.due_date AS days_overdue,
    i.total_amount AS invoice_total,
    COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0.00) AS amount_paid,
    i.total_amount - COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0.00) AS outstanding_balance,
    i.status AS invoice_status,
    c.id AS customer_id,
    u.full_name AS customer_name,
    u.email AS customer_email,
    u.phone AS customer_phone,
    sb.booking_number
FROM invoices i
JOIN customers c ON c.id = i.customer_id
JOIN users u ON u.id = c.user_id
JOIN service_bookings sb ON sb.id = i.booking_id
LEFT JOIN payments p ON p.invoice_id = i.id
WHERE i.status IN ('issued', 'partially_paid')
GROUP BY i.id, i.invoice_number, i.issued_at, i.due_date, i.total_amount, i.status, c.id, u.full_name, u.email, u.phone, sb.booking_number
HAVING (i.total_amount - COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0.00)) > 0
ORDER BY i.due_date ASC;

