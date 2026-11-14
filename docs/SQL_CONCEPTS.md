# SQL Concepts & Query Library (40 Demonstrations)

**Project:** Vehicle Service Management System  
**Academic Requirement:** 30–40 Meaningful Queries Covering Basic, Intermediate, and Advanced SQL Concepts  
**SQL Source File:** `database/queries/demonstration_queries.sql`  

---

## 1. Classification Matrix of Covered Concepts

| # | Query Topic | Concept Demonstrated | Relational Entities Involved | Use Case |
|---|---|---|---|---|
| 1 | SELECT | Column Projection & Calculated Fields | `services` | Menu duration in hours |
| 2 | INSERT | Atomic Surrogate Key Retrieval with `RETURNING` | `vehicle_brands` | Auto brand registration |
| 3 | UPDATE | Arithmetic Modifications on Numeric Columns | `services` | 5% price revision |
| 4 | DELETE | Guarded Deletion with Referential Safety | `invoices`, `payments` | Purging unbilled drafts |
| 5 | WHERE | Compound Boolean Logic (`AND`, `OR`, `NOT`) | `vehicles`, `vehicle_models` | High mileage diesel check |
| 6 | ORDER BY | Deterministic Multi-Column Sorting | `mechanics`, `users` | Best available tech dispatch |
| 7 | GROUP BY | Multi-Metric Group Aggregations | `service_categories`, `services` | Pricing spread report |
| 8 | HAVING | Post-Aggregation Filtering on Group Counts | `vehicle_brands`, `vehicles` | Fleet brands volume check |
| 9 | DISTINCT | Duplicate Tuple Elimination | `customers` | Geographic city territories |
| 10 | BETWEEN | Inclusive Boundary Range Evaluation | `service_bookings` | Monthly schedule query |
| 11 | IN | Discrete Set Membership Evaluation | `service_bookings` | Active status floor screen |
| 12 | LIKE / ILIKE | Case-Insensitive Pattern Matching | `users` | Customer search bar |
| 13 | INNER JOIN | Equi-Join across 6 Relations | `bookings`, `vehicles`, `invoices`, etc. | Executive job breakdown |
| 14 | LEFT JOIN | Preserving Unserviced Entities | `vehicles`, `service_bookings` | Dormant vehicles audit |
| 15 | RIGHT JOIN | Preserving Right Entity Tuples | `service_assignments`, `mechanics` | Technician idle status |
| 16 | FULL OUTER JOIN | Bidirectional Ledger Orphan Detection | `invoices`, `payments` | Unsettled account checks |
| 17 | CROSS JOIN | Cartesian Product Combinatorics | `mechanics`, `service_categories` | Skill competency matrix |
| 18 | SELF JOIN | Relational Join on Same Entity | `mechanics` | Labor tariff tier parity |
| 19 | Subqueries | Benchmark Scalar Comparison | `services` | Above-average pricing |
| 20 | Correlated Subquery | Subquery Dependent on Outer Tuple | `vehicles`, `vehicle_brands` | Brand-relative mileage wear |
| 21 | EXISTS | Semi-Join Existence Validation | `customers`, `invoices` | Verified paying customers |
| 22 | NOT EXISTS | Anti-Semi-Join Non-Existence Check | `customers`, `service_bookings` | Inactive registrants |
| 23 | UNION | Set Union with Discriminator Tag | `customers`, `mechanics`, `users` | Broadcast contact roster |
| 24 | INTERSECT | Set Intersection | `vehicles`, `vehicle_models` | Multi-transmission models |
| 25 | EXCEPT | Relational Set Difference | `vehicle_models`, `service_bookings`| Unserviced catalog lines |
| 26 | Aggregates | Modern SQL Standard with `FILTER` | `invoices` | Single-pass billing summary |
| 27 | CASE | Conditional Logic & Tier Classification | `customers`, `invoices` | Loyalty customer tiers |
| 28 | CTEs | Named Temporary Tables (`WITH` clause) | `customers`, `payments` | Top spenders vs benchmark |
| 29 | Recursive CTE | Dynamic Calendar Date Generation | `service_bookings` | Capacity density per day |
| 30 | Window Functions | `ROW_NUMBER()` and `DENSE_RANK()` | `services`, `service_categories` | Price ranks per category |
| 31 | Window Functions | `LAG()` Inter-Row Interval Evaluation | `service_bookings`, `vehicles` | Cadence between visits |
| 32 | Window Functions | `SUM() OVER` Cumulative Running Totals | `payments` | Rolling cash flow curve |
| 33 | UPSERT | `INSERT ... ON CONFLICT DO UPDATE` | `reviews` | Feedback modification |
| 34 | JSONB | Semi-Structured Document Querying (`?`, `->>`) | `audit_logs` | Forensics on status changes |
| 35 | STRING_AGG | Group Concatenation of Many-to-Many Rows | `service_bookings`, `services` | Flattened booked items |
| 36 | Catalog Query | `pg_stat_user_tables` Inspection | `pg_stat_user_tables` | Live/dead tuple bloat |
| 37 | Catalog Query | `pg_stat_user_indexes` Index Usage | `pg_stat_user_indexes` | Scan counts and disk sizes |
| 38 | EXPLAIN ANALYZE | Runtime Profiling & Buffer Hits | `service_bookings`, `customers` | Cost estimation & engine plan |
| 39 | Transactions | `SAVEPOINT` and `ROLLBACK TO SAVEPOINT` | `service_bookings`, `users` | Partial rollback checkpoint |
| 40 | Synthesis Query | 7-Table Relational Join Matrix | Workshop Ecosystem | Comprehensive scorecard |

---

## 2. Exemplary Advanced SQL Implementations

### A. Window Function Running Total (Query 32)
```sql
SELECT 
    p.payment_date::DATE AS payment_day,
    p.payment_reference,
    p.amount,
    SUM(p.amount) OVER (ORDER BY p.payment_date ASC, p.id ASC) AS cumulative_revenue
FROM payments p
WHERE p.status = 'completed'
ORDER BY p.payment_date ASC;
```
* **Explanation:** Rather than collapsing rows like a standard `GROUP BY`, the `SUM(...) OVER (...)` window clause evaluates a dynamic running frame from the beginning of time up to the current row tuple, charting cumulative revenue over chronological time.

### B. Recursive CTE Continuous Date Series (Query 29)
```sql
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
```
* **Explanation:** Solves the classic reporting challenge where dates with zero bookings would normally vanish from standard relational joins. The recursive base case anchors the start date, while the recursive step increments day-by-day. A `LEFT JOIN` guarantees that every calendar day is presented with `0` rather than omitted.

