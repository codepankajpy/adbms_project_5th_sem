# Vehicle Service Management System

**Advanced Database Management System (ADBMS) University Mini Project**  
*A comprehensive, database-centric, full-stack application built natively on PostgreSQL.*

---

## Contributors
- Pankaj – 24BCS12303
- Pankaj Suthar – 24BCS12551
- Harsh Raj– 24BCS12444

### Section - 24BCS-KRG-617A
---

## 1. Project Overview

The **Vehicle Service Management System** is an enterprise-grade automobile workshop platform engineered to demonstrate advanced relational database engineering, PL/pgSQL procedural programming, query optimization, and strict ACID transaction management.

Rather than relying on high-level ORM abstractions, this project executes **native parameterized SQL queries** directly through the PostgreSQL engine (`pg`). All business logic—appointment validations, technician workload dispatching, state-machine transitions, invoice total calculations, compliance auditing, and reporting cursors—is enforced at the database layer using **PostgreSQL stored procedures, functions, triggers, and views**.

The web application features a **monochrome, high-density desktop interface** designed with Tailwind CSS, along with a dedicated **DBMS Lab / Database Explorer** route at `/admin/dbms-lab` for live oral viva presentations to professors.

---

## 2. Key Features

### Role-Based Access Control (RBAC)
* **Administrator:** Complete workshop monitoring, customer directory, technician workload management, vehicle registry, service catalog pricing, appointment dispatch, invoice generation, payment auditing, and full access to the **DBMS Lab**.
* **Customer:** Personal garage asset management, service browsing, atomic appointment scheduling with bay capacity checks, lifecycle timeline tracking, review submission, and online invoice settlement.
* **Mechanic (Technician):** Dedicated workshop bay terminal, assigned active jobs list, inspection notes logging, odometer updates, and job finalization via stored procedures.

### Advanced DBMS Features Implemented
* **18 Relational Tables (3NF):** Formally normalized with composite keys, cascading foreign keys, check constraints, and JSONB audit trails.
* **40 Categorized SQL Demonstrations:** Covering SELECT, filtering, multi-table joins, subqueries, set operations, window functions, and recursive CTEs.
* **5 PL/pgSQL Stored Procedures:** Transaction-safe routines for booking, technician assignment, service completion, invoice generation, and payment processing.
* **6 User-Defined Functions (UDF):** Scalar financial calculators and polymorphic table-returning functions (`RETURNS TABLE (...)`).
* **5 Real Database Triggers:** State-machine lifecycle validation, automatic timestamp synchronization, line-item financial recalculation, and JSONB compliance auditing.
* **2 Explicit PL/pgSQL Cursors:** Demonstrating the traditional `DECLARE → OPEN → FETCH → EXIT WHEN → CLOSE` lifecycle.
* **5 Relational Views:** Reporting and dashboard summaries encapsulated in reusable database views.
* **Optimized Indexing Strategy:** B-tree, composite, partial, and unique indexes with EXPLAIN ANALYZE execution profiling.
* **DBMS Lab / Database Explorer (`/admin/dbms-lab`):** An academic inspection suite introspecting live PostgreSQL system catalogs (`information_schema`, `pg_proc`, `pg_trigger`, `pg_indexes`, `pg_stat_user_tables`).

---

## 3. Technology Stack

* **Database Engine:** PostgreSQL 16+ / 18 (Native SQL, PL/pgSQL procedural language, no ORM)
* **Backend:** Node.js 20+, TypeScript, Fastify, `pg` (node-postgres), Zod, bcrypt, `@fastify/jwt`
* **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React
* **Containerization:** Docker & Docker Compose

---

## 4. Project Structure

```
vehicle-service-management/
│
├── apps/
│   ├── web/                          # Next.js 14 Frontend Application
│   │   ├── app/                      # App router pages (admin, customer, mechanic, login)
│   │   │   └── admin/dbms-lab/       # Academic DBMS Explorer suite
│   │   ├── components/               # Reusable UI components (Navbar, Sidebar, Card, Modal)
│   │   ├── lib/                      # Auth context & API client
│   │   └── tailwind.config.js        # Black & white palette configuration
│   │
│   └── api/                          # Fastify REST Backend
│       ├── src/
│       │   ├── config/               # Environment variable loading
│       │   ├── db/                   # PostgreSQL connection pool & transaction helper
│       │   ├── middleware/           # JWT authentication & RBAC authorization
│       │   ├── modules/              # Domain modules (auth, bookings, vehicles, dbms, etc.)
│       │   ├── app.ts                # Fastify app configuration
│       │   └── server.ts             # Server entrypoint
│       └── scripts/                  # Automated migration and seed runners
│
├── database/
│   ├── migrations/                   # 10 Sequential SQL migration files
│   │   ├── 001_extensions.sql        # pgcrypto, uuid-ossp
│   │   ├── 002_types.sql             # Domain ENUMs (user_role, booking_status, etc.)
│   │   ├── 003_tables.sql            # 18 Normalized tables (3NF)
│   │   ├── 004_constraints.sql       # CHECK constraints & domain invariants
│   │   ├── 005_indexes.sql           # B-tree, composite, partial & unique indexes
│   │   ├── 006_functions.sql         # PL/pgSQL user-defined functions
│   │   ├── 007_procedures.sql        # PL/pgSQL stored procedures
│   │   ├── 008_triggers.sql          # State-machine & audit triggers
│   │   ├── 009_views.sql             # 5 Relational views
│   │   └── 010_cursors.sql           # Explicit cursor demonstrations
│   │
│   ├── queries/
│   │   └── demonstration_queries.sql # 40 Categorized SQL queries
│   │
│   ├── seeds/
│   │   └── seed.sql                  # Realistic seed dataset
│   │
│   └── diagrams/
│       └── er-diagram.mmd            # Mermaid Entity-Relationship diagram
│
├── docs/
│   ├── DATABASE_DESIGN.md            # Normalization proofs (1NF-3NF) & dependencies
│   ├── SQL_CONCEPTS.md               # 40 Queries classification matrix
│   ├── ADVANCED_FEATURES.md          # PL/pgSQL procedures, triggers, functions, cursors
│   ├── API_DOCUMENTATION.md          # Complete REST API specifications
│   └── VIVA_PREPARATION.md           # Professor Q&A interview guide
│
├── docker-compose.yml                # PostgreSQL container definition
├── .env.example                      # Environment variables template
├── .gitignore
├── package.json                      # Workspace root scripts
└── README.md
```

---

## 5. Demo Credentials (Viva Quick Fill)

The database includes realistic pre-seeded accounts. On the login screen, you can also click the **1-Click Quick Fill** buttons:

| Role | Email Address | Password | Primary Purpose in Demonstration |
|---|---|---|---|
| **Admin** | `admin@vehicleservice.com` | `Admin@123` | Full workshop control + `/admin/dbms-lab` access |
| **Customer** | `customer@example.com` | `Customer@123` | Personal garage, booking appointment, payment |
| **Mechanic** | `mechanic@example.com` | `Mechanic@123` | Assigned bay terminal, completing work orders |

---

## 6. Getting Started & Setup

### Prerequisites
* **Node.js:** v18.0.0 or higher (v20+ recommended)
* **PostgreSQL:** v16+ (Local Homebrew service OR Docker container)
* **npm:** v9+

---

### Step 1: Environment Configuration
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Ensure your database credentials match your local setup:
```ini
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=vehicle_service_db
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vehicle_service_db

API_PORT=4000
JWT_SECRET=super_secret_jwt_key_for_adbms_vehicle_service_2026_university_project
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

### Step 2: Database Startup (Docker or Local)

#### Option A: Running PostgreSQL via Docker Compose
```bash
# Start PostgreSQL container in background
docker compose up -d

# Verify container health
docker compose ps
```

#### Option B: Running Local PostgreSQL (macOS Homebrew)
```bash
brew services start postgresql@18
psql -d postgres -c "CREATE DATABASE vehicle_service_db;"
```

---

### Step 3: Database Initialization (Migrations & Seeds)

Initialize all 10 SQL migrations and seed 40+ appointments, vehicles, and users with one command:
```bash
# Run migrations and seed data
npm run db:reset
```
Or execute individually:
```bash
npm run db:migrate   # Applies 001_extensions through 010_cursors
npm run db:seed      # Seeds realistic relational dataset
```

---

### Step 4: Start Backend API (Fastify)
Open a terminal and start the backend service:
```bash
npm run dev:api
```
* Backend runs at: `http://localhost:4000`
* Health check: `curl http://localhost:4000/health`

---

### Step 5: Start Frontend Application (Next.js)
Open a second terminal and start the web interface:
```bash
npm run dev:web
```
* Web application runs at: `http://localhost:3000`

---

## 7. Demonstrating the Project to a Professor

### 1. Opening the DBMS Lab (`/admin/dbms-lab`)
1. Sign in as Admin (`admin@vehicleservice.com` / `Admin@123`).
2. Click **DBMS Lab** in the navigation header or visit `http://localhost:3000/admin/dbms-lab`.
3. Walk the professor through the **10 Dedicated Academic Sections**:
   * **Schema Explorer:** Click on `service_bookings` to reveal live column types, default expressions, foreign keys, and estimated live rows from `information_schema.columns`.
   * **SQL Query Library:** Show the 40 categorized queries. Click **"Run Query"** on Query #29 (Recursive CTE) or Query #32 (Window Function Running Sum) to execute live against PostgreSQL and inspect the returned execution time in milliseconds.
   * **Stored Procedures:** Review the actual PL/pgSQL source code for `book_service_appointment` introspected directly from catalog `pg_proc`.
   * **Functions (UDF):** Inspect `get_vehicle_service_history` showing the polymorphic `RETURNS TABLE (...)` definition.
   * **Triggers:** Point to the visual flow showing how `trg_validate_booking_status` rejects invalid state transitions.
   * **Cursor Demonstrations:** View the live execution of the explicit cursor `cursor_customer_service_summary()` iterating row-by-row through completed jobs.
   * **Index Explorer:** Inspect B-tree and partial index sizes from `pg_stat_user_indexes` alongside real execution buffer plans via `EXPLAIN (ANALYZE, BUFFERS)`.
   * **ACID Transactions:** Click **"Run ACID Simulation"** to trigger a live multi-statement transaction in PostgreSQL with `SAVEPOINT` and partial rollback.
   * **Engine Statistics:** View live table sizes, active connections, and PostgreSQL version from `pg_stat_user_tables`.

### 2. Demonstrating Core Business Workflows
* **Customer Workflow:** Log in as Customer → Go to **"Book Appointment"** → Select vehicle, schedule slot, and select multiple services → Observe the transaction calling stored procedure `book_service_appointment()`.
* **Mechanic Workflow:** Log in as Mechanic → Go to **"Assigned Jobs"** → Click **"Bring Vehicle into Bay"** → Click **"Complete Service"** → Enter odometer and inspection log → Submit to execute `complete_service()`.
* **Admin Invoicing:** Return to Admin → Go to **"Appointments"** → Click **"Invoice"** to execute procedure `generate_invoice()` which calculates 18% tax and creates line items → Go to **"Invoices"** to audit the bill.

---

## 8. Relational Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o| customers : "has profile"
    users ||--o| mechanics : "has profile"
    users ||--o{ audit_logs : "triggers"
    users ||--o{ service_status_history : "records"

    customers ||--o{ vehicles : "owns"
    customers ||--o{ service_bookings : "books"
    customers ||--o{ invoices : "billed to"
    customers ||--o{ reviews : "writes"

    vehicle_brands ||--o{ vehicle_models : "manufactures"
    vehicle_models ||--o{ vehicles : "defines model"

    vehicles ||--o{ service_bookings : "serviced in"
    vehicles ||--o{ service_records : "service history"

    service_categories ||--o{ services : "categorizes"

    service_bookings ||--o{ booking_services : "contains"
    services ||--o{ booking_services : "included in"

    service_bookings ||--o{ service_assignments : "assigned to"
    mechanics ||--o{ service_assignments : "performs"

    service_bookings ||--o| service_records : "produces"
    mechanics ||--o{ service_records : "executes"

    service_bookings ||--o| invoices : "billed via"
    invoices ||--o{ invoice_items : "itemized with"
    services ||--o{ invoice_items : "referenced in"

    invoices ||--o{ payments : "settled through"

    service_bookings ||--o{ service_status_history : "state transitions"
    service_bookings ||--o| reviews : "reviewed in"
```

---

## 9. Useful Database Commands

```bash
# Connect to PostgreSQL container or local via psql
psql "postgresql://postgres:postgres@localhost:5432/vehicle_service_db"

# List all tables
\dt

# List all views
\dv

# List all stored procedures and functions
\df

# Test an explicit cursor in psql
SELECT * FROM cursor_customer_service_summary();

# Test a table-returning function in psql
SELECT * FROM get_vehicle_service_history(1);

# Inspect live query execution plan
EXPLAIN ANALYZE SELECT * FROM booking_details_view;
```

---

## 10. Academic Documentation Reference

For comprehensive technical viva preparation, refer to the documentation in `/docs`:
* [`DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md): Detailed 1NF, 2NF, 3NF normalization proofs, functional dependencies, and candidate keys.
* [`SQL_CONCEPTS.md`](docs/SQL_CONCEPTS.md): Complete list of 40 categorized queries with explanations.
* [`ADVANCED_FEATURES.md`](docs/ADVANCED_FEATURES.md): In-depth breakdown of PL/pgSQL procedures, triggers, functions, cursors, and views.
* [`API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md): Complete REST endpoint documentation.
* [`VIVA_PREPARATION.md`](docs/VIVA_PREPARATION.md): Extensive viva interview questions and project-specific answers.

