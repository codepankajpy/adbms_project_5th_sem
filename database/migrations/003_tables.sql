-- ============================================================================
-- 003_tables.sql
-- Vehicle Service Management System - Advanced DBMS Project
-- Purpose: Schema definitions for all 18 normalized relational entities (1NF, 2NF, 3NF compliant)
-- ============================================================================

-- 1. USERS: Central authentication and identity table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. CUSTOMERS: Specific profile attributes for customer role
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    emergency_contact VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. MECHANICS: Workshop technicians and specialist mechanics
CREATE TABLE IF NOT EXISTS mechanics (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(150) NOT NULL,
    experience_years INT NOT NULL DEFAULT 1,
    hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 400.00,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. VEHICLE BRANDS: Manufacturers (Toyota, Honda, BMW, etc.)
CREATE TABLE IF NOT EXISTS vehicle_brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    country VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. VEHICLE MODELS: Specific vehicle model lines
CREATE TABLE IF NOT EXISTS vehicle_models (
    id SERIAL PRIMARY KEY,
    brand_id INT NOT NULL REFERENCES vehicle_brands(id) ON DELETE RESTRICT,
    model_name VARCHAR(100) NOT NULL,
    body_type VARCHAR(50) NOT NULL,
    fuel_type fuel_type NOT NULL DEFAULT 'petrol',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_brand_model UNIQUE(brand_id, model_name)
);

-- 6. VEHICLES: Registered customer automobiles
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    model_id INT NOT NULL REFERENCES vehicle_models(id) ON DELETE RESTRICT,
    registration_number VARCHAR(20) NOT NULL UNIQUE,
    vin VARCHAR(50) NOT NULL UNIQUE,
    year INT NOT NULL,
    color VARCHAR(50) NOT NULL,
    mileage_km INT NOT NULL DEFAULT 0,
    transmission transmission_type NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. SERVICE CATEGORIES: Groupings of automotive work (Periodic, Brake, Engine, etc.)
CREATE TABLE IF NOT EXISTS service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'wrench',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. SERVICES: Discrete catalog of service offerings with pricing
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    base_price NUMERIC(10, 2) NOT NULL,
    estimated_duration_minutes INT NOT NULL DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_category_service UNIQUE(category_id, name)
);

-- 9. SERVICE BOOKINGS: Appointment header entity
CREATE TABLE IF NOT EXISTS service_bookings (
    id SERIAL PRIMARY KEY,
    booking_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    customer_notes TEXT,
    total_estimated_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. BOOKING SERVICES: Many-to-many bridge linking bookings to requested services
CREATE TABLE IF NOT EXISTS booking_services (
    booking_id INT NOT NULL REFERENCES service_bookings(id) ON DELETE CASCADE,
    service_id INT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    unit_price NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    PRIMARY KEY (booking_id, service_id)
);

-- 11. SERVICE ASSIGNMENTS: Mechanics assigned to bookings
CREATE TABLE IF NOT EXISTS service_assignments (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES service_bookings(id) ON DELETE CASCADE,
    mechanic_id INT NOT NULL REFERENCES mechanics(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status assignment_status NOT NULL DEFAULT 'assigned',
    mechanic_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. SERVICE RECORDS: Completed technical service log and work record
CREATE TABLE IF NOT EXISTS service_records (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE REFERENCES service_bookings(id) ON DELETE RESTRICT,
    vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    mechanic_id INT NOT NULL REFERENCES mechanics(id) ON DELETE RESTRICT,
    completed_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    work_performed TEXT NOT NULL,
    parts_replaced TEXT,
    diagnostic_notes TEXT,
    odometer_reading INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. INVOICES: Financial billing records for completed bookings
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    booking_id INT NOT NULL UNIQUE REFERENCES service_bookings(id) ON DELETE RESTRICT,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status invoice_status NOT NULL DEFAULT 'issued',
    due_date DATE NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. INVOICE ITEMS: Granular billing line items
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    service_id INT REFERENCES services(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    line_total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. PAYMENTS: Monetary transactions made against invoices
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_reference VARCHAR(64) NOT NULL UNIQUE,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method payment_method NOT NULL DEFAULT 'credit_card',
    status payment_status NOT NULL DEFAULT 'completed',
    transaction_id VARCHAR(100),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 16. SERVICE STATUS HISTORY: Audit trail of lifecycle status transitions
CREATE TABLE IF NOT EXISTS service_status_history (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES service_bookings(id) ON DELETE CASCADE,
    previous_status booking_status,
    new_status booking_status NOT NULL,
    changed_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    change_reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 17. REVIEWS: Customer ratings and reviews for services
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE REFERENCES service_bookings(id) ON DELETE CASCADE,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    rating INT NOT NULL,
    comment TEXT,
    review_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 18. AUDIT LOGS: System-wide compliance and modification records with JSONB metadata
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(64) NOT NULL,
    record_id INT,
    action VARCHAR(10) NOT NULL,
    changed_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

