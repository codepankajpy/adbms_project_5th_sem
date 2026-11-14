-- ============================================================================
-- demonstration_queries.sql
-- Vehicle Service Management System - Advanced DBMS Project
-- Academic SQL Library: 40 Demonstrations Covering Standard & Advanced SQL Concepts
-- ============================================================================

-- ----------------------------------------------------------------------------
-- QUERY 1: SELECT & Column Projection
-- Concept: Basic Projection with Aliases and Calculated Expressions
-- Use Case: Retrieve active workshop services with estimated duration formatted in hours
-- ----------------------------------------------------------------------------
SELECT 
    id AS service_id,
    name AS service_title,
    base_price,
    ROUND(estimated_duration_minutes / 60.0, 1) AS estimated_hours
FROM services
WHERE is_active = TRUE;


-- ----------------------------------------------------------------------------
-- QUERY 2: INSERT with RETURNING Clause
-- Concept: Data Manipulation with Atomic ID Retrieval
-- Use Case: Register a new vehicle brand and immediately obtain the generated surrogate key
-- ----------------------------------------------------------------------------
INSERT INTO vehicle_brands (name, country)
VALUES ('Volvo', 'Sweden')
ON CONFLICT (name) DO NOTHING
RETURNING id, name, country, created_at;


-- ----------------------------------------------------------------------------
-- QUERY 3: UPDATE with Arithmetic Modification
-- Concept: Data Modification with Percentage-Based Computation
-- Use Case: Apply a 5% inflation price adjustment to services in category 1
-- ----------------------------------------------------------------------------
UPDATE services
SET base_price = ROUND(base_price * 1.05, 2),
    updated_at = CURRENT_TIMESTAMP
WHERE category_id = 1
RETURNING id, name, base_price;


-- ----------------------------------------------------------------------------
-- QUERY 4: DELETE with Subquery Constraint Safety
-- Concept: Data Deletion with Referential Integrity Safeguards
-- Use Case: Safely remove draft status invoices that have no associated payments
-- ----------------------------------------------------------------------------
DELETE FROM invoices
WHERE status = 'draft'
  AND id NOT IN (SELECT DISTINCT invoice_id FROM payments);


-- ----------------------------------------------------------------------------
-- QUERY 5: WHERE Clause with Multiple Predicates (AND, OR, NOT)
-- Concept: Compound Boolean Filtering
-- Use Case: Find customer vehicles that have high mileage (>50,000 km) and are diesel or electric
-- ----------------------------------------------------------------------------
SELECT 
    v.id,
    v.registration_number,
    v.mileage_km,
    vm.model_name,
    vm.fuel_type
FROM vehicles v
JOIN vehicle_models vm ON vm.id = v.model_id
WHERE v.mileage_km > 30000 
  AND (vm.fuel_type = 'diesel' OR vm.fuel_type = 'electric');


-- ----------------------------------------------------------------------------
-- QUERY 6: ORDER BY with NULLS FIRST / LAST and Multi-Column Sorting
-- Concept: Deterministic Result Ordering
-- Use Case: Order mechanics by availability status, then experience descending, then hourly rate
-- ----------------------------------------------------------------------------
SELECT 
    m.id,
    u.full_name,
    m.specialization,
    m.experience_years,
    m.hourly_rate,
    m.is_available
FROM mechanics m
JOIN users u ON u.id = m.user_id
ORDER BY m.is_available DESC, m.experience_years DESC, m.hourly_rate ASC;


-- ----------------------------------------------------------------------------
-- QUERY 7: GROUP BY with Multiple Aggregations
-- Concept: Aggregate Grouping (COUNT, SUM, AVG, MIN, MAX)
-- Use Case: Calculate service count, average price, min price, and max price per service category
-- ----------------------------------------------------------------------------
SELECT 
    sc.name AS category_name,
    COUNT(s.id) AS service_count,
    ROUND(AVG(s.base_price), 2) AS average_price,
    MIN(s.base_price) AS cheapest_service,
    MAX(s.base_price) AS most_expensive_service
FROM service_categories sc
JOIN services s ON s.category_id = sc.id
GROUP BY sc.id, sc.name;


-- ----------------------------------------------------------------------------
-- QUERY 8: HAVING Clause Filtering on Aggregated Values
-- Concept: Post-Aggregation Filtering
-- Use Case: Identify vehicle brands that have 2 or more registered customer vehicles in the database
-- ----------------------------------------------------------------------------
SELECT 
    vb.name AS brand_name,
    COUNT(v.id) AS registered_vehicle_count
FROM vehicle_brands vb
JOIN vehicle_models vm ON vm.brand_id = vb.id
JOIN vehicles v ON v.model_id = vm.id
GROUP BY vb.id, vb.name
HAVING COUNT(v.id) >= 2
ORDER BY registered_vehicle_count DESC;


-- ----------------------------------------------------------------------------
-- QUERY 9: DISTINCT Keyword with Single and Multi-Column Uniqueness
-- Concept: Elimination of Duplicate Result Tuples
-- Use Case: Find all distinct cities where active customers reside
-- ----------------------------------------------------------------------------
SELECT DISTINCT city, state
FROM customers
WHERE city IS NOT NULL
ORDER BY state, city;


-- ----------------------------------------------------------------------------
-- QUERY 10: BETWEEN Operator for Range Queries
-- Concept: Inclusive Boundary Range Evaluation
-- Use Case: Find all service bookings scheduled during October 2026
-- ----------------------------------------------------------------------------
SELECT 
    booking_number,
    booking_date,
    time_slot,
    status,
    total_estimated_cost
FROM service_bookings
WHERE booking_date BETWEEN '2026-10-01' AND '2026-10-31'
ORDER BY booking_date ASC;


-- ----------------------------------------------------------------------------
-- QUERY 11: IN Operator with Dynamic Value Set
-- Concept: Membership Evaluation in Value Sets
-- Use Case: Find appointments that require urgent attention (in progress or confirmed)
-- ----------------------------------------------------------------------------
SELECT 
    booking_number,
    customer_id,
    booking_date,
    time_slot,
    status
FROM service_bookings
WHERE status IN ('confirmed', 'in_progress')
ORDER BY booking_date ASC;


-- ----------------------------------------------------------------------------
-- QUERY 12: LIKE and ILIKE Pattern Matching
-- Concept: Case-Insensitive String Regex/Pattern Searching
-- Use Case: Find customers whose names contain 'sharma' or emails ending in '.com'
-- ----------------------------------------------------------------------------
SELECT 
    id,
    full_name,
    email,
    phone
FROM users
WHERE full_name ILIKE '%sharma%' OR email ILIKE '%example.com';


-- ----------------------------------------------------------------------------
-- QUERY 13: INNER JOIN Across Multiple Relations
-- Concept: Relational Join on Equi-Join Predicates
-- Use Case: List completed service bookings with customer full name, car model, and invoice total
-- ----------------------------------------------------------------------------
SELECT 
    sb.booking_number,
    u.full_name AS customer_name,
    vb.name AS vehicle_brand,
    vm.model_name AS vehicle_model,
    v.registration_number,
    i.total_amount AS invoice_total
FROM service_bookings sb
INNER JOIN customers c ON c.id = sb.customer_id
INNER JOIN users u ON u.id = c.user_id
INNER JOIN vehicles v ON v.id = sb.vehicle_id
INNER JOIN vehicle_models vm ON vm.id = v.model_id
INNER JOIN vehicle_brands vb ON vb.id = vm.brand_id
INNER JOIN invoices i ON i.booking_id = sb.id
WHERE sb.status = 'completed';


-- ----------------------------------------------------------------------------
-- QUERY 14: LEFT OUTER JOIN
-- Concept: Preserve All Tuples from the Left Relation
-- Use Case: Display all registered vehicles along with their latest service date, even if never serviced
-- ----------------------------------------------------------------------------
SELECT 
    v.id AS vehicle_id,
    v.registration_number,
    vm.model_name,
    MAX(sb.booking_date) AS last_booking_date,
    COUNT(sb.id) AS lifetime_bookings_count
FROM vehicles v
JOIN vehicle_models vm ON vm.id = v.model_id
LEFT JOIN service_bookings sb ON sb.vehicle_id = v.id
GROUP BY v.id, v.registration_number, vm.model_name
ORDER BY lifetime_bookings_count DESC;


-- ----------------------------------------------------------------------------
-- QUERY 15: RIGHT OUTER JOIN
-- Concept: Preserve All Tuples from the Right Relation
-- Use Case: List all mechanics and show whether they have any active job assignment right now
-- ----------------------------------------------------------------------------
SELECT 
    sa.id AS assignment_id,
    sa.status AS assignment_status,
    m.id AS mechanic_id,
    u.full_name AS mechanic_name,
    m.specialization
FROM service_assignments sa
RIGHT OUTER JOIN mechanics m ON m.id = sa.mechanic_id AND sa.status IN ('assigned', 'in_progress')
RIGHT OUTER JOIN users u ON u.id = m.user_id;


-- ----------------------------------------------------------------------------
-- QUERY 16: FULL OUTER JOIN
-- Concept: Bidirectional Preservation of Unmatched Rows
-- Use Case: Audit all invoices and all payments to identify unmatched orphaned records on either side
-- ----------------------------------------------------------------------------
SELECT 
    i.invoice_number,
    i.total_amount AS invoice_amount,
    p.payment_reference,
    p.amount AS payment_amount,
    p.status AS payment_status
FROM invoices i
FULL OUTER JOIN payments p ON p.invoice_id = i.id
WHERE i.id IS NULL OR p.id IS NULL;


-- ----------------------------------------------------------------------------
-- QUERY 17: CROSS JOIN (Cartesian Product)
-- Concept: Unconditional Combinatorial Tuple Pairing
-- Use Case: Generate a matrix pairing every mechanic with every service category for training evaluations
-- ----------------------------------------------------------------------------
SELECT 
    u.full_name AS mechanic_name,
    sc.name AS competency_category
FROM mechanics m
JOIN users u ON u.id = m.user_id
CROSS JOIN service_categories sc
WHERE m.id <= 3
ORDER BY mechanic_name, competency_category;


-- ----------------------------------------------------------------------------
-- QUERY 18: SELF JOIN
-- Concept: Relational Join of an Entity with Itself
-- Use Case: Find pairs of mechanics who share the exact same hourly labor rate
-- ----------------------------------------------------------------------------
SELECT 
    u1.full_name AS mechanic_a,
    u2.full_name AS mechanic_b,
    m1.hourly_rate
FROM mechanics m1
JOIN mechanics m2 ON m1.hourly_rate = m2.hourly_rate AND m1.id < m2.id
JOIN users u1 ON u1.id = m1.user_id
JOIN users u2 ON u2.id = m2.user_id
ORDER BY m1.hourly_rate DESC;


-- ----------------------------------------------------------------------------
-- QUERY 19: Scalar Subquery in SELECT & WHERE
-- Concept: Nested Query Returning a Single Value
-- Use Case: List services whose base price is greater than the overall workshop average price
-- ----------------------------------------------------------------------------
SELECT 
    name,
    base_price,
    ROUND((SELECT AVG(base_price) FROM services), 2) AS workshop_avg_price,
    ROUND(base_price - (SELECT AVG(base_price) FROM services), 2) AS price_difference
FROM services
WHERE base_price > (SELECT AVG(base_price) FROM services)
ORDER BY base_price DESC;


-- ----------------------------------------------------------------------------
-- QUERY 20: Correlated Subquery
-- Concept: Inner Query Dependent on Outer Tuple Values
-- Use Case: Find vehicles whose mileage is strictly above the average mileage of vehicles sharing the same brand
-- ----------------------------------------------------------------------------
SELECT 
    v.id,
    v.registration_number,
    vb.name AS brand,
    v.mileage_km
FROM vehicles v
JOIN vehicle_models vm ON vm.id = v.model_id
JOIN vehicle_brands vb ON vb.id = vm.brand_id
WHERE v.mileage_km > (
    SELECT AVG(v2.mileage_km)
    FROM vehicles v2
    JOIN vehicle_models vm2 ON vm2.id = v2.model_id
    WHERE vm2.brand_id = vb.id
)
ORDER BY v.mileage_km DESC;


-- ----------------------------------------------------------------------------
-- QUERY 21: EXISTS Operator
-- Concept: Semi-Join Testing for Row Existence in Subquery
-- Use Case: Retrieve customers who have at least one paid invoice in the system
-- ----------------------------------------------------------------------------
SELECT 
    c.id AS customer_id,
    u.full_name,
    u.email
FROM customers c
JOIN users u ON u.id = c.user_id
WHERE EXISTS (
    SELECT 1 
    FROM invoices i 
    WHERE i.customer_id = c.id AND i.status = 'paid'
);


-- ----------------------------------------------------------------------------
-- QUERY 22: NOT EXISTS Operator
-- Concept: Anti-Semi-Join Testing for Non-Existence
-- Use Case: Find registered customers who have never created any service booking
-- ----------------------------------------------------------------------------
SELECT 
    c.id AS customer_id,
    u.full_name,
    u.email,
    c.city
FROM customers c
JOIN users u ON u.id = c.user_id
WHERE NOT EXISTS (
    SELECT 1 
    FROM service_bookings sb 
    WHERE sb.customer_id = c.id
);


-- ----------------------------------------------------------------------------
-- QUERY 23: UNION Operator (Set Union)
-- Concept: Combine Distinct Result Sets
-- Use Case: Unified list of all registered phone contacts for both customers and mechanics
-- ----------------------------------------------------------------------------
SELECT 
    u.full_name,
    u.phone,
    'Customer' AS user_type
FROM customers c
JOIN users u ON u.id = c.user_id

UNION

SELECT 
    u.full_name,
    u.phone,
    'Mechanic' AS user_type
FROM mechanics m
JOIN users u ON u.id = m.user_id
ORDER BY full_name;


-- ----------------------------------------------------------------------------
-- QUERY 24: INTERSECT Operator (Set Intersection)
-- Concept: Tuples Present in Both Relations
-- Use Case: Identify vehicle models that have both manual AND automatic transmissions registered
-- ----------------------------------------------------------------------------
SELECT vm.model_name
FROM vehicles v
JOIN vehicle_models vm ON vm.id = v.model_id
WHERE v.transmission = 'manual'

INTERSECT

SELECT vm.model_name
FROM vehicles v
JOIN vehicle_models vm ON vm.id = v.model_id
WHERE v.transmission = 'automatic';


-- ----------------------------------------------------------------------------
-- QUERY 25: EXCEPT Operator (Set Difference)
-- Concept: Tuples in Relation A but Not in Relation B
-- Use Case: Find vehicle models that exist in the catalog but have never been serviced yet
-- ----------------------------------------------------------------------------
SELECT vm.id, vm.model_name
FROM vehicle_models vm

EXCEPT

SELECT DISTINCT vm.id, vm.model_name
FROM service_bookings sb
JOIN vehicles v ON v.id = sb.vehicle_id
JOIN vehicle_models vm ON vm.id = v.model_id;


-- ----------------------------------------------------------------------------
-- QUERY 26: Aggregate Functions with FILTER Clause (Modern SQL Standard)
-- Concept: Conditional Aggregations in Single Pass
-- Use Case: Financial breakdown of invoice counts and amounts categorized by payment state
-- ----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_invoices,
    COUNT(*) FILTER (WHERE status = 'paid') AS paid_count,
    COUNT(*) FILTER (WHERE status = 'issued') AS pending_count,
    COUNT(*) FILTER (WHERE status = 'partially_paid') AS partial_count,
    SUM(total_amount) AS total_billed,
    SUM(total_amount) FILTER (WHERE status = 'paid') AS total_collected,
    SUM(total_amount) FILTER (WHERE status IN ('issued', 'partially_paid')) AS total_outstanding
FROM invoices;


-- ----------------------------------------------------------------------------
-- QUERY 27: CASE Expression (Conditional Logic in SQL)
-- Concept: Value Transformation Based on Boolean Predicates
-- Use Case: Segment customers into spending tiers based on cumulative lifetime invoice totals
-- ----------------------------------------------------------------------------
SELECT 
    u.full_name,
    COALESCE(SUM(i.total_amount), 0.00) AS lifetime_spend,
    CASE 
        WHEN COALESCE(SUM(i.total_amount), 0.00) >= 6000.00 THEN 'PLATINUM VIP'
        WHEN COALESCE(SUM(i.total_amount), 0.00) >= 3000.00 THEN 'GOLD MEMBER'
        WHEN COALESCE(SUM(i.total_amount), 0.00) > 0.00 THEN 'SILVER REGULAR'
        ELSE 'NEW / INACTIVE'
    END AS customer_tier
FROM customers c
JOIN users u ON u.id = c.user_id
LEFT JOIN invoices i ON i.customer_id = c.id AND i.status = 'paid'
GROUP BY c.id, u.full_name
ORDER BY lifetime_spend DESC;


-- ----------------------------------------------------------------------------
-- QUERY 28: Common Table Expression (CTE / WITH clause)
-- Concept: Modular Named Temporary Result Set for Query Readability
-- Use Case: Calculate average customer spend and retrieve customers who exceed that average
-- ----------------------------------------------------------------------------
WITH customer_spending AS (
    SELECT 
        c.id AS customer_id,
        u.full_name,
        COALESCE(SUM(p.amount), 0.00) AS total_paid
    FROM customers c
    JOIN users u ON u.id = c.user_id
    LEFT JOIN invoices i ON i.customer_id = c.id
    LEFT JOIN payments p ON p.invoice_id = i.id AND p.status = 'completed'
    GROUP BY c.id, u.full_name
),
spend_statistics AS (
    SELECT AVG(total_paid) AS overall_avg_spend
    FROM customer_spending
)
SELECT 
    cs.full_name,
    cs.total_paid,
    ROUND(ss.overall_avg_spend, 2) AS benchmark_average
FROM customer_spending cs, spend_statistics ss
WHERE cs.total_paid > ss.overall_avg_spend
ORDER BY cs.total_paid DESC;


-- ----------------------------------------------------------------------------
-- QUERY 29: Recursive CTE (Hierarchical / Graph Traversal)
-- Concept: Recursive Iteration in SQL for Sequential Number Generation & Date Ranges
-- Use Case: Generate a consecutive calendar date series and aggregate daily booking counts
-- ----------------------------------------------------------------------------
WITH RECURSIVE date_series AS (
    SELECT '2026-11-10'::DATE AS booking_day
    UNION ALL
    SELECT (booking_day + INTERVAL '1 day')::DATE
    FROM date_series
    WHERE booking_day < '2026-11-20'::DATE
)
SELECT 
    ds.booking_day,
    COUNT(sb.id) AS total_appointments_booked,
    COALESCE(SUM(sb.total_estimated_cost), 0.00) AS daily_estimated_pipeline
FROM date_series ds
LEFT JOIN service_bookings sb ON sb.booking_date = ds.booking_day
GROUP BY ds.booking_day
ORDER BY ds.booking_day ASC;


-- ----------------------------------------------------------------------------
-- QUERY 30: Window Functions (ROW_NUMBER, DENSE_RANK, OVER Partition)
-- Concept: Analytics Calculation Over Window Frames Without Collapsing Rows
-- Use Case: Rank services within each category based on base price
-- ----------------------------------------------------------------------------
SELECT 
    sc.name AS category_name,
    s.name AS service_name,
    s.base_price,
    ROW_NUMBER() OVER (PARTITION BY s.category_id ORDER BY s.base_price DESC) AS price_rank,
    DENSE_RANK() OVER (PARTITION BY s.category_id ORDER BY s.base_price DESC) AS price_dense_rank
FROM services s
JOIN service_categories sc ON sc.id = s.category_id;


-- ----------------------------------------------------------------------------
-- QUERY 31: Window Functions (LEAD & LAG)
-- Concept: Inter-Row Relative Lookups in Ordered Windows
-- Use Case: Calculate the time difference (in days) between consecutive bookings for customer vehicles
-- ----------------------------------------------------------------------------
SELECT 
    v.registration_number,
    sb.booking_number,
    sb.booking_date,
    LAG(sb.booking_date) OVER (PARTITION BY sb.vehicle_id ORDER BY sb.booking_date) AS previous_booking_date,
    sb.booking_date - LAG(sb.booking_date) OVER (PARTITION BY sb.vehicle_id ORDER BY sb.booking_date) AS days_since_last_service
FROM service_bookings sb
JOIN vehicles v ON v.id = sb.vehicle_id
ORDER BY v.registration_number, sb.booking_date ASC;


-- ----------------------------------------------------------------------------
-- QUERY 32: Window Functions (Running Totals with SUM() OVER)
-- Concept: Cumulative Running Balance Computations
-- Use Case: Compute cumulative running total of workshop revenue over time
-- ----------------------------------------------------------------------------
SELECT 
    p.payment_date::DATE AS payment_day,
    p.payment_reference,
    p.amount,
    SUM(p.amount) OVER (ORDER BY p.payment_date ASC, p.id ASC) AS cumulative_revenue
FROM payments p
WHERE p.status = 'completed'
ORDER BY p.payment_date ASC;


-- ----------------------------------------------------------------------------
-- QUERY 33: UPSERT (INSERT ... ON CONFLICT DO UPDATE)
-- Concept: Idempotent Insert or In-Place Update
-- Use Case: Upsert customer review; update rating and comment if review already submitted
-- ----------------------------------------------------------------------------
INSERT INTO reviews (booking_id, customer_id, rating, comment, review_date)
VALUES (1, 1, 5, 'Updated review: exceptional follow-up service and care!', CURRENT_TIMESTAMP)
ON CONFLICT (booking_id) 
DO UPDATE SET 
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    review_date = EXCLUDED.review_date
RETURNING id, booking_id, rating, comment;


-- ----------------------------------------------------------------------------
-- QUERY 34: JSONB Operations and Operators
-- Concept: Semi-Structured NoSQL Querying in Relational PostgreSQL
-- Use Case: Query audit logs to find all record modifications involving a specific JSON attribute
-- ----------------------------------------------------------------------------
SELECT 
    id,
    table_name,
    action,
    new_data->>'status' AS new_status_value,
    new_data,
    created_at
FROM audit_logs
WHERE new_data ? 'status'
ORDER BY created_at DESC;


-- ----------------------------------------------------------------------------
-- QUERY 35: String Aggregation (STRING_AGG)
-- Concept: Group Concatenation of Many-to-Many Attributes
-- Use Case: Aggregate list of booked services into a comma-delimited string per booking
-- ----------------------------------------------------------------------------
SELECT 
    sb.id AS booking_id,
    sb.booking_number,
    u.full_name AS customer_name,
    STRING_AGG(s.name, ' | ' ORDER BY s.name) AS combined_services_list
FROM service_bookings sb
JOIN customers c ON c.id = sb.customer_id
JOIN users u ON u.id = c.user_id
JOIN booking_services bs ON bs.booking_id = sb.id
JOIN services s ON s.id = bs.service_id
GROUP BY sb.id, sb.booking_number, u.full_name;


-- ----------------------------------------------------------------------------
-- QUERY 36: PostgreSQL System Catalog Inspection (pg_stat_user_tables)
-- Concept: Database Metadata Introspection
-- Use Case: Monitor dead row tuples and vacuum metrics across project tables
-- ----------------------------------------------------------------------------
SELECT 
    relname AS table_name,
    n_live_tup AS live_row_count,
    n_dead_tup AS dead_tuple_count,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;


-- ----------------------------------------------------------------------------
-- QUERY 37: PostgreSQL Index Usage Catalog Query
-- Concept: Database Physical Index Monitoring
-- Use Case: Inspect index scan count and disk space consumption for tuning
-- ----------------------------------------------------------------------------
SELECT 
    indexrelname AS index_name,
    relname AS table_name,
    idx_scan AS number_of_scans,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;


-- ----------------------------------------------------------------------------
-- QUERY 38: EXPLAIN (ANALYZE, BUFFERS) Execution Plan Inspection
-- Concept: Cost Estimation and Runtime Performance Profiling
-- Use Case: Observe query execution plan and verify index scans for booking lookups
-- ----------------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS)
SELECT sb.booking_number, sb.status, u.full_name
FROM service_bookings sb
JOIN customers c ON c.id = sb.customer_id
JOIN users u ON u.id = c.user_id
WHERE sb.status = 'completed';


-- ----------------------------------------------------------------------------
-- QUERY 39: Transaction Simulation with SAVEPOINT & ROLLBACK
-- Concept: Atomic Sub-Transaction Checkpointing
-- Use Case: Demonstrate partial rollback inside an active transaction block
-- ----------------------------------------------------------------------------
BEGIN;
    -- Step 1: Update customer phone
    UPDATE users SET phone = '+91 99999 00000' WHERE id = 14;

    -- Step 2: Establish savepoint
    SAVEPOINT sp_before_bad_update;

    -- Step 3: Bad operation (e.g. invalid status test)
    UPDATE service_bookings SET total_estimated_cost = -500.00 WHERE id = 1;

    -- Step 4: Rollback to savepoint upon error
    ROLLBACK TO SAVEPOINT sp_before_bad_update;

    -- Step 5: Commit remaining valid updates
COMMIT;


-- ----------------------------------------------------------------------------
-- QUERY 40: Multi-Table Revenue & Productivity Analysis
-- Concept: Advanced Synthesis Query Joining 7 Normalized Relational Tables
-- Use Case: Comprehensive workshop performance matrix combining technicians, jobs, revenue and satisfaction
-- ----------------------------------------------------------------------------
SELECT 
    m.id AS mechanic_id,
    u.full_name AS technician_name,
    m.specialization,
    COUNT(DISTINCT sa.booking_id) AS total_assigned_bookings,
    COUNT(DISTINCT sa.booking_id) FILTER (WHERE sa.status = 'completed') AS completed_jobs,
    COALESCE(SUM(i.total_amount), 0.00) AS revenue_generated,
    COALESCE(ROUND(AVG(r.rating), 2), 0.00) AS customer_satisfaction_rating
FROM mechanics m
JOIN users u ON u.id = m.user_id
LEFT JOIN service_assignments sa ON sa.mechanic_id = m.id
LEFT JOIN service_bookings sb ON sb.id = sa.booking_id
LEFT JOIN invoices i ON i.booking_id = sb.id AND i.status = 'paid'
LEFT JOIN reviews r ON r.booking_id = sb.id
GROUP BY m.id, u.full_name, m.specialization
ORDER BY revenue_generated DESC, customer_satisfaction_rating DESC;

