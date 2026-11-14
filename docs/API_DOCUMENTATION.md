# REST API Documentation

**Backend Server:** Fastify + TypeScript + `pg` (node-postgres)  
**Base URL:** `http://localhost:4000`  
**Authentication Scheme:** Bearer JWT (`Authorization: Bearer <token>`)  

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/login`
* **Description:** Authenticates user via email and bcrypt password verification.
* **Payload:**
  ```json
  {
    "email": "admin@vehicleservice.com",
    "password": "Admin@123"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Authentication successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": 1,
        "email": "admin@vehicleservice.com",
        "role": "admin",
        "fullName": "Rajesh Sharma",
        "phone": "+91 98765 43210"
      }
    }
  }
  ```

### `POST /api/auth/register`
* **Description:** Creates customer account within an atomic database transaction.
* **Payload:**
  ```json
  {
    "fullName": "Arun Kumar",
    "email": "arun@example.com",
    "password": "Password@123",
    "phone": "+91 98111 22334",
    "address": "42 MG Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "postalCode": "560001"
  }
  ```

### `GET /api/auth/me`
* **Description:** Returns profile and role IDs for the authenticated session user.

---

## 2. Customer Endpoints (`/api/customers`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/customers` | `admin` | Lists all customers with vehicle count and spending. |
| `GET` | `/api/customers/:id` | `admin`, `customer` | Gets specific customer profile and spending. |
| `PUT` | `/api/customers/:id` | `admin`, `customer` | Updates address, phone, and emergency contact. |

---

## 3. Mechanic Endpoints (`/api/mechanics`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/mechanics` | Any Authenticated | Lists mechanics with workload and rating metrics from view. |
| `GET` | `/api/mechanics/:id` | Any Authenticated | Gets technician KPIs via `get_mechanic_completed_jobs()`. |
| `PUT` | `/api/mechanics/:id` | `admin` | Updates technician availability or hourly rate. |

---

## 4. Vehicle Endpoints (`/api/vehicles`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/vehicles/catalog` | Any Authenticated | Returns brand and model catalog for vehicle forms. |
| `GET` | `/api/vehicles` | `admin`, `customer` | Retrieves fleet vehicles (filtered to owner for customers). |
| `GET` | `/api/vehicles/:id` | `admin`, `customer` | Returns vehicle details and full service history function output. |
| `POST` | `/api/vehicles` | `admin`, `customer` | Registers new vehicle asset with VIN uniqueness checks. |
| `PUT` | `/api/vehicles/:id` | `admin`, `customer` | Updates mileage, color, or transmission. |

---

## 5. Service Catalog Endpoints (`/api/services`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/services/catalog` | Public | Returns active categories and service menu items. |
| `GET` | `/api/services` | `admin` | Returns all services with booking counts and revenue. |
| `POST` | `/api/services` | `admin` | Creates new catalog repair item. |
| `PUT` | `/api/services/:id` | `admin` | Updates base pricing, duration, or active status. |

---

## 6. Appointment Booking Endpoints (`/api/bookings`)

### `POST /api/bookings`
* **Description:** Calls stored procedure `book_service_appointment()` with slot capacity checks.
* **Payload:**
  ```json
  {
    "vehicleId": 1,
    "bookingDate": "2026-11-20",
    "timeSlot": "09:00 - 10:00",
    "serviceIds": [1, 3],
    "customerNotes": "Check front brake noise"
  }
  ```

### `POST /api/bookings/:id/assign`
* **Description:** Calls stored procedure `assign_mechanic()` enforcing max 3 job workload limit.
* **Payload:** `{ "mechanicId": 2, "mechanicNotes": "Bay 1 assignment" }`

### `POST /api/bookings/:id/complete`
* **Description:** Calls stored procedure `complete_service()` to write technical logs and update mileage.

### `PATCH /api/bookings/:id/status`
* **Description:** Directly transitions status; evaluated by database trigger `trg_validate_booking_status`.

---

## 7. Billing & Payment Endpoints (`/api/invoices`, `/api/payments`)

* `GET /api/invoices`: Returns customer invoices and balance due.
* `POST /api/invoices/generate`: Calls stored procedure `generate_invoice()`.
* `POST /api/payments/process`: Calls stored procedure `process_invoice_payment()` with row-level `FOR UPDATE` lock.

---

## 8. DBMS Lab Academic Endpoints (`/api/dbms`)

* `GET /api/dbms/overview`: Count cards of all database objects.
* `GET /api/dbms/schema`: Table metadata, column types, constraints, and indexes.
* `GET /api/dbms/queries`: List of all 40 academic demonstration queries.
* `POST /api/dbms/queries/:id/execute`: Executes query safely and returns execution time in ms.
* `GET /api/dbms/procedures`: Introspects PL/pgSQL procedures from `pg_proc`.
* `GET /api/dbms/functions`: Introspects user-defined functions from `pg_proc`.
* `GET /api/dbms/triggers`: Introspects triggers from `pg_trigger`.
* `GET /api/dbms/cursors`: Executes cursor functions and displays row outputs.
* `GET /api/dbms/views`: Introspects views from `information_schema.views` with sample rows.
* `GET /api/dbms/indexes`: Inspects index sizes and scan counts from `pg_stat_user_indexes`.
* `POST /api/dbms/transactions/simulate`: Simulates an ACID transaction with `SAVEPOINT` and `ROLLBACK`.
* `GET /api/dbms/statistics`: Database disk footprints and live/dead tuple diagnostics.

