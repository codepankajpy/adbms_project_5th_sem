-- ============================================================================
-- seed.sql
-- Vehicle Service Management System - Advanced DBMS Project
-- Purpose: Realistic seed data for academic demonstrations, queries, views & viva
-- Demo Credentials:
--   Admin:    admin@vehicleservice.com    / Admin@123
--   Customer: customer@example.com       / Customer@123
--   Mechanic: mechanic@example.com       / Mechanic@123
-- ============================================================================

-- Clean existing data in reverse topological order
TRUNCATE TABLE 
    audit_logs,
    reviews,
    service_status_history,
    payments,
    invoice_items,
    invoices,
    service_records,
    service_assignments,
    booking_services,
    service_bookings,
    services,
    service_categories,
    vehicles,
    vehicle_models,
    vehicle_brands,
    mechanics,
    customers,
    users
RESTART IDENTITY CASCADE;

-- ============================================================================
-- 1. USERS (Admins, Mechanics, Customers)
-- Password for all demo accounts is 'Admin@123', 'Mechanic@123', 'Customer@123'
-- ============================================================================
INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active) VALUES
-- Admins (1-3)
(1, 'admin@vehicleservice.com', crypt('Admin@123', gen_salt('bf', 10)), 'admin', 'Rajesh Sharma', '+91 98765 43210', TRUE),
(2, 'sarah.connor@vehicleservice.com', crypt('Admin@123', gen_salt('bf', 10)), 'admin', 'Sarah Connor', '+1 555-0199', TRUE),
(3, 'vikram.aditya@vehicleservice.com', crypt('Admin@123', gen_salt('bf', 10)), 'admin', 'Vikram Aditya', '+91 98111 22334', TRUE),

-- Mechanics (4-13)
(4, 'mechanic@example.com', crypt('Mechanic@123', gen_salt('bf', 10)), 'mechanic', 'Ramesh Kumar', '+91 98222 33445', TRUE),
(5, 'john.doe.tech@example.com', crypt('Mechanic@123', gen_salt('bf', 10)), 'mechanic', 'John Doe', '+1 555-0144', TRUE),
(6, 'anil.verma@example.com', crypt('Mechanic@123', gen_salt('bf', 10)), 'mechanic', 'Anil Verma', '+91 98333 44556', TRUE),
(7, 'carlos.mendez@example.com', crypt('Mechanic@123', gen_salt('bf', 10)), 'mechanic', 'Carlos Mendez', '+1 555-0155', TRUE),
(8, 'deepak.joshi@example.com', crypt('Mechanic@123', gen_salt('bf', 10)), 'mechanic', 'Deepak Joshi', '+91 98444 55667', TRUE),
(9, 'david.miller@example.com', crypt('Mechanic@123', gen_salt('bf', 10)), 'mechanic', 'David Miller', '+1 555-0166', TRUE),
(10, 'sunil.patel@example.com', crypt('Mechanic@123', gen_salt('bf', 10)), 'mechanic', 'Sunil Patel', '+91 98555 66778', TRUE),
(11, 'marcus.vance@example.com', crypt('Mechanic@123', gen_salt('bf', 10)), 'mechanic', 'Marcus Vance', '+1 555-0177', TRUE),
(12, 'rohit.gupta@example.com', crypt('Mechanic@123', gen_salt('bf', 10)), 'mechanic', 'Rohit Gupta', '+91 98666 77889', TRUE),
(13, 'elena.rostova@example.com', crypt('Mechanic@123', gen_salt('bf', 10)), 'mechanic', 'Elena Rostova', '+1 555-0188', TRUE),

-- Customers (14-28)
(14, 'customer@example.com', crypt('Customer@123', gen_salt('bf', 10)), 'customer', 'Priya Singh', '+91 99111 11222', TRUE),
(15, 'michael.scott@dundermifflin.com', crypt('Customer@123', gen_salt('bf', 10)), 'customer', 'Michael Scott', '+1 555-0101', TRUE),
(16, 'aarav.sharma@example.com', crypt('Customer@123', gen_salt('bf', 10)), 'customer', 'Aarav Sharma', '+91 99222 22333', TRUE),
(17, 'emily.watson@example.com', crypt('Customer@123', gen_salt('bf', 10)), 'customer', 'Emily Watson', '+1 555-0102', TRUE),
(18, 'kavita.nair@example.com', crypt('Customer@123', gen_salt('bf', 10)), 'customer', 'Kavita Nair', '+91 99333 33444', TRUE),
(19, 'james.wilson@example.com', crypt('Customer@123', gen_salt('bf', 10)), 'customer', 'James Wilson', '+1 555-0103', TRUE),
(20, 'arjun.reddy@example.com', crypt('Customer@123', gen_salt('bf', 10)), 'customer', 'Arjun Reddy', '+91 99444 44555', TRUE),
(21, 'sophia.taylor@example.com', crypt('Customer@123', gen_salt('bf', 10)), 'customer', 'Sophia Taylor', '+1 555-0104', TRUE),
(22, 'neha.kapoor@example.com', crypt('Customer@123', gen_salt('bf', 10)), 'customer', 'Neha Kapoor', '+91 99555 55666', TRUE),
(23, 'lucas.brown@example.com', crypt('Customer@123', gen_salt('bf', 10)), 'customer', 'Lucas Brown', '+1 555-0105', TRUE),
(24, 'manoj.tiwari@example.com', crypt('Customer@123', gen_salt('bf', 10)), 'customer', 'Manoj Tiwari', '+91 99666 66777', TRUE),
(25, 'olivia.martin@example.com', crypt('Customer@123', gen_salt('bf', 10)), 'customer', 'Olivia Martin', '+1 555-0106', TRUE),
(26, 'rohan.mehta@example.com', crypt('Customer@123', gen_salt('bf', 10)), 'customer', 'Rohan Mehta', '+91 99777 77888', TRUE),
(27, 'daniel.anderson@example.com', crypt('Customer@123', gen_salt('bf', 10)), 'customer', 'Daniel Anderson', '+1 555-0107', TRUE),
(28, 'ananya.iyer@example.com', crypt('Customer@123', gen_salt('bf', 10)), 'customer', 'Ananya Iyer', '+91 99888 88999', TRUE);

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- ============================================================================
-- 2. CUSTOMERS
-- ============================================================================
INSERT INTO customers (id, user_id, address, city, state, postal_code, emergency_contact) VALUES
(1, 14, 'Flat 402, Green Glen Layout, Bellandur', 'Bengaluru', 'Karnataka', '560103', '+91 98888 00001'),
(2, 15, '1725 Slough Avenue, Suite 200', 'Scranton', 'Pennsylvania', '18503', '+1 555-0100'),
(3, 16, 'Plot 88, Sector 14, Rohini', 'New Delhi', 'Delhi', '110085', '+91 98888 00002'),
(4, 17, '452 Elm Street', 'Austin', 'Texas', '78701', '+1 555-0109'),
(5, 18, 'TC 24/182, Kowdiar', 'Thiruvananthapuram', 'Kerala', '695003', '+91 98888 00003'),
(6, 19, '88 Kingsway Crescent', 'Seattle', 'Washington', '98101', '+1 555-0110'),
(7, 20, 'B-12 Road No. 10, Banjara Hills', 'Hyderabad', 'Telangana', '500034', '+91 98888 00004'),
(8, 21, '712 Beacon Street', 'Boston', 'Massachusetts', '02215', '+1 555-0111'),
(9, 22, '14 Bandra West, Perry Cross Road', 'Mumbai', 'Maharashtra', '400050', '+91 98888 00005'),
(10, 23, '1004 Pine Street', 'Denver', 'Colorado', '80202', '+1 555-0112'),
(11, 24, '45 Aliganj Main Road', 'Lucknow', 'Uttar Pradesh', '226024', '+91 98888 00006'),
(12, 25, '330 Biscayne Blvd', 'Miami', 'Florida', '33132', '+1 555-0113'),
(13, 26, '78 CG Road, Navrangpura', 'Ahmedabad', 'Gujarat', '380009', '+91 98888 00007'),
(14, 27, '600 Market Street', 'San Francisco', 'California', '94104', '+1 555-0114'),
(15, 28, '92 Alwarpet High Road', 'Chennai', 'Tamil Nadu', '600018', '+91 98888 00008');

SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));

-- ============================================================================
-- 3. MECHANICS
-- ============================================================================
INSERT INTO mechanics (id, user_id, specialization, experience_years, hourly_rate, status, is_available) VALUES
(1, 4, 'Brake Systems & Suspension', 8, 450.00, 'active', TRUE),
(2, 5, 'Master Engine & Transmission Diagnostic', 12, 600.00, 'active', TRUE),
(3, 6, 'Auto Electricals & ECU Tuning', 6, 400.00, 'active', TRUE),
(4, 7, 'Diesel Powertrains & Exhaust Systems', 9, 500.00, 'active', TRUE),
(5, 8, 'Hybrid & EV Powertrain Specialist', 5, 550.00, 'active', TRUE),
(6, 9, 'Transmission Overhauls & Gearbox', 14, 650.00, 'active', TRUE),
(7, 10, 'General Maintenance & Quick Service', 4, 350.00, 'active', TRUE),
(8, 11, 'HVAC & Climate Control Specialist', 7, 420.00, 'active', TRUE),
(9, 12, 'Brake Hydraulics & ABS Electronics', 10, 520.00, 'active', TRUE),
(10, 13, 'Precision Wheel Alignment & Suspension', 8, 480.00, 'active', TRUE);

SELECT setval('mechanics_id_seq', (SELECT MAX(id) FROM mechanics));

-- ============================================================================
-- 4. VEHICLE BRANDS
-- ============================================================================
INSERT INTO vehicle_brands (id, name, country) VALUES
(1, 'Toyota', 'Japan'),
(2, 'Honda', 'Japan'),
(3, 'Ford', 'United States'),
(4, 'BMW', 'Germany'),
(5, 'Mercedes-Benz', 'Germany'),
(6, 'Hyundai', 'South Korea'),
(7, 'Volkswagen', 'Germany'),
(8, 'Audi', 'Germany'),
(9, 'Chevrolet', 'United States'),
(10, 'Nissan', 'Japan');

SELECT setval('vehicle_brands_id_seq', (SELECT MAX(id) FROM vehicle_brands));

-- ============================================================================
-- 5. VEHICLE MODELS
-- ============================================================================
INSERT INTO vehicle_models (id, brand_id, model_name, body_type, fuel_type) VALUES
(1, 1, 'Corolla Altis', 'Sedan', 'petrol'),
(2, 1, 'Camry Hybrid', 'Sedan', 'hybrid'),
(3, 1, 'Innova Crysta', 'MPV', 'diesel'),
(4, 2, 'Civic Turbo', 'Sedan', 'petrol'),
(5, 2, 'City 5th Gen', 'Sedan', 'petrol'),
(6, 2, 'CR-V AWD', 'SUV', 'diesel'),
(7, 3, 'Mustang GT', 'Coupe', 'petrol'),
(8, 3, 'F-150 Lightning', 'Truck', 'electric'),
(9, 4, '3 Series 330i', 'Sedan', 'petrol'),
(10, 4, 'X5 xDrive40i', 'SUV', 'diesel'),
(11, 5, 'C-Class C200', 'Sedan', 'petrol'),
(12, 5, 'E-Class E350d', 'Sedan', 'diesel'),
(13, 6, 'Creta SX(O)', 'SUV', 'diesel'),
(14, 6, 'Ioniq 5', 'Crossover', 'electric'),
(15, 7, 'Virtus GT', 'Sedan', 'petrol'),
(16, 7, 'Tiguan 2.0 TSI', 'SUV', 'petrol'),
(17, 8, 'A4 40 TFSI', 'Sedan', 'petrol'),
(18, 8, 'Q7 Quattro', 'SUV', 'diesel'),
(19, 9, 'Camaro SS', 'Coupe', 'petrol'),
(20, 10, 'Magnite Turbo', 'Compact SUV', 'petrol');

SELECT setval('vehicle_models_id_seq', (SELECT MAX(id) FROM vehicle_models));

-- ============================================================================
-- 6. VEHICLES (25 vehicles owned by customers)
-- ============================================================================
INSERT INTO vehicles (id, customer_id, model_id, registration_number, vin, year, color, mileage_km, transmission) VALUES
(1, 1, 1, 'KA-01-MJ-2021', '1HGCR2F83HA001001', 2021, 'Pearl White', 24500, 'automatic'),
(2, 1, 13, 'KA-03-NB-4482', '1HGCR2F83HA001002', 2022, 'Phantom Black', 18200, 'manual'),
(3, 2, 7, 'PA-SCR-1988', '1FA6P8CF9H5001003', 2020, 'Race Red', 32000, 'manual'),
(4, 3, 5, 'DL-04-CA-1122', 'MAKGM668MJC001004', 2021, 'Radiant Red', 41200, 'automatic'),
(5, 4, 8, 'TX-EV-9901', '1FT6W1EV9NW001005', 2023, 'Antimatter Blue', 12400, 'automatic'),
(6, 5, 3, 'KL-01-BZ-5500', 'MBJ11EB24MK001006', 2019, 'Silver Metallic', 82500, 'manual'),
(7, 6, 9, 'WA-330-SEA', 'WBA5R1C56KAH01007', 2022, 'Portimao Blue', 21300, 'automatic'),
(8, 7, 2, 'TS-09-EQ-7788', '4T1B11HK5MU001008', 2021, 'Platinum White', 36000, 'automatic'),
(9, 8, 4, 'MA-BOS-2022', '2HGFC2F59HH001009', 2022, 'Lunar Silver', 19800, 'manual'),
(10, 9, 11, 'MH-02-DW-3344', 'WDD2050402F001010', 2020, 'Obsidian Black', 45000, 'automatic'),
(11, 10, 10, 'CO-DEN-4411', '5UXCR6C08L9001011', 2021, 'Mineral White', 38900, 'automatic'),
(12, 11, 15, 'UP-32-KN-9009', 'WVWZZZAWZNY001012', 2023, 'Wild Cherry Red', 9500, 'automatic'),
(13, 12, 14, 'FL-MIA-5522', 'KM8KR4UC5NU001013', 2023, 'Gravity Gold', 14200, 'automatic'),
(14, 13, 16, 'GJ-01-XY-6611', 'WVGZZZ5NZMW001014', 2022, 'Deep Black Pearl', 29000, 'automatic'),
(15, 14, 17, 'CA-SF-8800', 'WAUZZZF43NA001015', 2021, 'Ibis White', 31500, 'automatic'),
(16, 15, 18, 'TN-07-BP-1234', 'WAUZZZ4M1MD001016', 2020, 'Navarra Blue', 52000, 'automatic'),
(17, 1, 4, 'KA-05-MM-9999', '2HGFC2F75HH001017', 2023, 'Sonic Gray', 7400, 'automatic'),
(18, 3, 13, 'DL-08-ZZ-3300', 'MAKCreta2021001018', 2021, 'Titan Grey', 34000, 'manual'),
(19, 5, 1, 'KL-07-CD-8811', '1HGCR2F83HA001019', 2018, 'Super White', 98000, 'manual'),
(20, 7, 10, 'TS-10-XX-4455', '5UXCR6C08L9001020', 2022, 'Phytonic Blue', 26000, 'automatic'),
(21, 9, 12, 'MH-01-AA-7007', 'WDD2130042A001021', 2021, 'Selenite Grey', 41000, 'automatic'),
(22, 11, 6, 'UP-32-RT-8888', '2HKRW2H87LH001022', 2020, 'Modern Steel', 61000, 'automatic'),
(23, 13, 20, 'GJ-06-NN-1010', 'MDHBA1677NJ001023', 2022, 'Flare Garnet Red', 23000, 'manual'),
(24, 14, 19, 'CA-CAM-6969', '1G1FA1R78J0001024', 2019, 'Crush Orange', 48000, 'manual'),
(25, 15, 5, 'TN-09-QQ-4040', 'MAKGM668MJC001025', 2022, 'Golden Brown', 17000, 'automatic');

SELECT setval('vehicles_id_seq', (SELECT MAX(id) FROM vehicles));

-- ============================================================================
-- 7. SERVICE CATEGORIES
-- ============================================================================
INSERT INTO service_categories (id, name, description, icon) VALUES
(1, 'Periodic Maintenance', 'Routine preventative fluid checks, oil changes and multi-point inspections', 'wrench'),
(2, 'Brake & Safety Systems', 'Brake pads, rotors, caliper servicing, fluid flushing and ABS calibration', 'shield-alert'),
(3, 'Engine & Transmission', 'Comprehensive diagnostics, tune-ups, timing belts and transmission overhauls', 'cpu'),
(4, 'Electrical & Battery', 'Alternators, starters, computer module scanning and EV/hybrid battery testing', 'zap'),
(5, 'Suspension & Steering', 'Struts, shock absorbers, tie rods, wheel alignment and dynamic balancing', 'activity'),
(6, 'Climate Control & Detailing', 'AC refrigerant leak detection, compressor service, sanitization and interior care', 'wind');

SELECT setval('service_categories_id_seq', (SELECT MAX(id) FROM service_categories));

-- ============================================================================
-- 8. SERVICES (Catalog of automotive services)
-- ============================================================================
INSERT INTO services (id, category_id, name, description, base_price, estimated_duration_minutes, is_active) VALUES
(1, 1, 'Full Synthetic Engine Oil & Filter Change', 'Premium synthetic motor oil replacement, OEM oil filter, fluid top-up and 30-point inspection', 1200.00, 45, TRUE),
(2, 1, 'Comprehensive 50-Point Periodic Inspection', 'Full mechanical, safety and electronic system health assessment', 850.00, 60, TRUE),
(3, 2, 'Front & Rear Brake Pad Replacement', 'Installation of high-performance ceramic brake pads and caliper slide pin greasing', 2400.00, 90, TRUE),
(4, 2, 'Brake Rotor Resurfacing & Trueing', 'Machining discs to factory tolerances to eliminate brake pulsation and judder', 1600.00, 60, TRUE),
(5, 2, 'Complete Brake Fluid Flush (DOT 4)', 'High-temperature hydraulic pressure bleeding to restore crisp pedal feel', 750.00, 45, TRUE),
(6, 3, 'Engine Diagnostic & ECU Scan', 'Computerized fault code scan, live sensor graphing and technician analysis', 950.00, 45, TRUE),
(7, 3, 'Automatic Transmission Fluid (ATF) Service', 'Complete synthetic transmission oil renewal and sump pan gasket replacement', 3200.00, 120, TRUE),
(8, 3, 'Spark Plug Set Replacement (Iridium)', 'Four to six laser iridium spark plugs installed to restore fuel efficiency', 1800.00, 60, TRUE),
(9, 4, 'Automotive Battery Health Test & Replacement', 'Heavy-duty AGM/Lead-acid battery replacement with terminal anticorrosion treatment', 4200.00, 30, TRUE),
(10, 4, 'Alternator & Starter Electrical Overhaul', 'Load test, voltage regulator check, wiring repair and bench testing', 2100.00, 90, TRUE),
(11, 5, '3D Laser Wheel Alignment & Road Force Balance', 'Computerized 4-wheel alignment and dynamic tire balancing', 1100.00, 60, TRUE),
(12, 5, 'Front Struts & Suspension Bushing Replacement', 'Replacement of worn suspension control arm bushings and stabilizer links', 3800.00, 150, TRUE),
(13, 6, 'AC Gas Refill & Cooling Coil Disinfection', 'R134a/R1234yf refrigerant evac and recharge with antibacterial ozone sanitization', 1750.00, 60, TRUE),
(14, 6, 'Cabin Air Filter & Engine Air Filter Combo', 'Dual high-efficiency HEPA particulate and carbon cabin filters', 650.00, 20, TRUE),
(15, 6, 'Executive Interior & Exterior Detailing', 'Deep steam interior extraction, leather conditioning and 3-stage exterior gloss polish', 2900.00, 180, TRUE),
(16, 1, 'Coolant & Radiator Chemical Flush', 'Drain and flush cooling system with organic acid technology (OAT) long-life coolant', 1350.00, 60, TRUE);

SELECT setval('services_id_seq', (SELECT MAX(id) FROM services));

-- ============================================================================
-- 9. SERVICE BOOKINGS (40 realistic appointments spanning various dates & states)
-- ============================================================================
INSERT INTO service_bookings (id, booking_number, customer_id, vehicle_id, booking_date, time_slot, status, customer_notes, total_estimated_cost) VALUES
-- Completed bookings (1-25)
(1, 'BK-20261010-1001', 1, 1, '2026-10-10', '09:00 - 10:00', 'completed', 'Routine 25k km service, check slight steering squeak', 2050.00),
(2, 'BK-20261012-1002', 2, 3, '2026-10-12', '10:00 - 11:00', 'completed', 'Brakes squeaking loudly during cold stops', 4000.00),
(3, 'BK-20261014-1003', 3, 4, '2026-10-14', '11:00 - 12:00', 'completed', 'Annual synthetic oil service and tire rotation', 2300.00),
(4, 'BK-20261016-1004', 4, 5, '2026-10-16', '14:00 - 15:00', 'completed', 'Check battery state of health and 12V auxiliary system', 950.00),
(5, 'BK-20261018-1005', 5, 6, '2026-10-18', '09:00 - 10:00', 'completed', 'Suspension thudding over highway expansion joints', 4900.00),
(6, 'BK-20261020-1006', 6, 7, '2026-10-20', '10:00 - 11:00', 'completed', 'Perform full ECU scan and transmission fluid change', 4150.00),
(7, 'BK-20261022-1007', 7, 8, '2026-10-22', '11:00 - 12:00', 'completed', 'AC not cooling efficiently in afternoon traffic', 2400.00),
(8, 'BK-20261024-1008', 8, 9, '2026-10-24', '14:00 - 15:00', 'completed', 'Brake pad replacement and brake fluid bleeding', 3150.00),
(9, 'BK-20261025-1009', 9, 10, '2026-10-25', '09:00 - 10:00', 'completed', 'Full synthetic oil change and spark plug replacement', 3000.00),
(10, 'BK-20261027-1010', 10, 11, '2026-10-27', '10:00 - 11:00', 'completed', 'Executive full detailing before festive season road trip', 2900.00),
(11, 'BK-20261028-1011', 11, 12, '2026-10-28', '11:00 - 12:00', 'completed', 'Front alignment pulling slightly to the left', 1100.00),
(12, 'BK-20261030-1012', 12, 13, '2026-10-30', '14:00 - 15:00', 'completed', 'Routine periodic inspection and cabin filter change', 1500.00),
(13, 'BK-20261101-1013', 13, 14, '2026-11-01', '09:00 - 10:00', 'completed', 'Coolant flush and multi-point winter preparation', 2200.00),
(14, 'BK-20261102-1014', 14, 15, '2026-11-02', '10:00 - 11:00', 'completed', 'Battery failing to hold crank charge in the morning', 4200.00),
(15, 'BK-20261103-1015', 15, 16, '2026-11-03', '11:00 - 12:00', 'completed', '50k major periodic service and brake system overhaul', 6000.00),
(16, 'BK-20261104-1016', 1, 2, '2026-11-04', '14:00 - 15:00', 'completed', 'Engine oil and coolant replacement on second vehicle', 2550.00),
(17, 'BK-20261105-1017', 2, 3, '2026-11-05', '09:00 - 10:00', 'completed', 'Post-track day brake inspection and laser wheel alignment', 1950.00),
(18, 'BK-20261106-1018', 3, 18, '2026-11-06', '10:00 - 11:00', 'completed', 'Creta 30k periodic service and filter renewal', 1850.00),
(19, 'BK-20261107-1019', 4, 5, '2026-11-07', '11:00 - 12:00', 'completed', 'Tire balance and electronic module health check', 2050.00),
(20, 'BK-20261108-1020', 5, 19, '2026-11-08', '14:00 - 15:00', 'completed', 'High-mileage engine tune-up and spark plugs', 3000.00),
(21, 'BK-20261109-1021', 6, 7, '2026-11-09', '09:00 - 10:00', 'completed', 'AC cooling coil clean and cabin air filter change', 2400.00),
(22, 'BK-20261110-1022', 7, 20, '2026-11-10', '10:00 - 11:00', 'completed', 'Brake pad swap and rotor skimming', 4000.00),
(23, 'BK-20261111-1023', 8, 9, '2026-11-11', '11:00 - 12:00', 'completed', 'Full synthetic oil and filter change', 1200.00),
(24, 'BK-20261112-1024', 9, 21, '2026-11-12', '14:00 - 15:00', 'completed', 'Luxury sedan 40k inspection and laser alignment', 1950.00),
(25, 'BK-20261113-1025', 10, 11, '2026-11-13', '09:00 - 10:00', 'completed', 'Starter motor overhaul and electrical diagnostic', 3050.00),

-- In-progress bookings (26-29)
(26, 'BK-20261114-1026', 1, 1, '2026-11-14', '09:00 - 10:00', 'in_progress', 'Pre-winter comprehensive checkup and alignment', 1950.00),
(27, 'BK-20261114-1027', 11, 22, '2026-11-14', '10:00 - 11:00', 'in_progress', 'Suspension overhaul and bushing replacement in bay 2', 3800.00),
(28, 'BK-20261114-1028', 12, 13, '2026-11-14', '11:00 - 12:00', 'in_progress', 'Full interior detailing and sanitization in progress', 2900.00),
(29, 'BK-20261114-1029', 13, 23, '2026-11-14', '14:00 - 15:00', 'in_progress', 'Oil service and spark plug upgrade', 3000.00),

-- Confirmed bookings (30-34)
(30, 'BK-20261115-1030', 2, 3, '2026-11-15', '09:00 - 10:00', 'confirmed', 'Ford Mustang dyno tuneup and spark plugs', 2750.00),
(31, 'BK-20261115-1031', 3, 4, '2026-11-15', '10:00 - 11:00', 'confirmed', 'Civic periodic 40k maintenance scheduled', 1200.00),
(32, 'BK-20261116-1032', 4, 5, '2026-11-16', '11:00 - 12:00', 'confirmed', 'Electric truck laser wheel alignment and tire check', 1100.00),
(33, 'BK-20261116-1033', 5, 6, '2026-11-16', '14:00 - 15:00', 'confirmed', 'Innova diesel transmission flush and coolant change', 4550.00),
(34, 'BK-20261117-1034', 14, 24, '2026-11-17', '09:00 - 10:00', 'confirmed', 'Camaro performance brake inspection and fluid flush', 3150.00),

-- Pending bookings (35-38)
(35, 'BK-20261118-1035', 6, 7, '2026-11-18', '09:00 - 10:00', 'pending', 'Customer requested general maintenance slot', 1200.00),
(36, 'BK-20261118-1036', 7, 8, '2026-11-18', '10:00 - 11:00', 'pending', 'Hybrid battery diagnostic checkup requested', 950.00),
(37, 'BK-20261119-1037', 8, 9, '2026-11-19', '11:00 - 12:00', 'pending', 'Scheduled periodic service inquiry', 850.00),
(38, 'BK-20261119-1038', 15, 25, '2026-11-19', '14:00 - 15:00', 'pending', 'Air conditioning inspection booking', 1750.00),

-- Cancelled bookings (39-40)
(39, 'BK-20261005-1039', 9, 10, '2026-10-05', '09:00 - 10:00', 'cancelled', 'Customer rescheduled due to business travel', 1200.00),
(40, 'BK-20261008-1040', 10, 11, '2026-10-08', '14:00 - 15:00', 'cancelled', 'Duplicate booking placed accidentally', 2400.00);

SELECT setval('service_bookings_id_seq', (SELECT MAX(id) FROM service_bookings));

-- ============================================================================
-- 10. BOOKING SERVICES (Bridge table items)
-- ============================================================================
INSERT INTO booking_services (booking_id, service_id, unit_price, notes) VALUES
(1, 1, 1200.00, 'Synthetic oil standard'),
(1, 2, 850.00, 'Multi-point inspection'),
(2, 3, 2400.00, 'Ceramic front pads'),
(2, 4, 1600.00, 'Rotors resurfaced'),
(3, 1, 1200.00, 'Synthetic oil change'),
(3, 11, 1100.00, 'Alignment and balance'),
(4, 6, 950.00, 'Diagnostic module check'),
(5, 11, 1100.00, 'Alignment'),
(5, 12, 3800.00, 'Struts & bushing kit'),
(6, 6, 950.00, 'ECU diagnostic'),
(6, 7, 3200.00, 'Synthetic ATF'),
(7, 13, 1750.00, 'AC recharge'),
(7, 14, 650.00, 'Cabin filter'),
(8, 3, 2400.00, 'Brake pads replacement'),
(8, 5, 750.00, 'Brake fluid bleed'),
(9, 1, 1200.00, 'Synthetic oil'),
(9, 8, 1800.00, 'Iridium plugs'),
(10, 15, 2900.00, 'Full detailing'),
(11, 11, 1100.00, 'Laser alignment'),
(12, 2, 850.00, 'Periodic check'),
(12, 14, 650.00, 'Dual filters'),
(13, 16, 1350.00, 'Coolant flush'),
(13, 2, 850.00, 'Safety inspection'),
(14, 9, 4200.00, 'Heavy duty battery'),
(15, 1, 1200.00, 'Oil service'),
(15, 3, 2400.00, 'Brake pads'),
(15, 4, 1600.00, 'Rotors'),
(15, 8, 1800.00, 'Plugs (discounted bundle)'),
(16, 1, 1200.00, 'Oil change'),
(16, 16, 1350.00, 'Coolant service'),
(17, 2, 850.00, 'Track day check'),
(17, 11, 1100.00, 'Laser alignment'),
(18, 1, 1200.00, 'Oil change'),
(18, 14, 650.00, 'Filters'),
(19, 6, 950.00, 'ECU scan'),
(19, 11, 1100.00, 'Alignment'),
(20, 1, 1200.00, 'Oil change'),
(20, 8, 1800.00, 'Plugs'),
(21, 13, 1750.00, 'AC service'),
(21, 14, 650.00, 'Filter replacement'),
(22, 3, 2400.00, 'Brake pads'),
(22, 4, 1600.00, 'Rotors'),
(23, 1, 1200.00, 'Oil service'),
(24, 2, 850.00, 'Periodic inspection'),
(24, 11, 1100.00, 'Wheel alignment'),
(25, 6, 950.00, 'Diagnostic'),
(25, 10, 2100.00, 'Alternator service'),
-- In progress bookings
(26, 2, 850.00, 'Winter inspection'),
(26, 11, 1100.00, 'Wheel balance'),
(27, 12, 3800.00, 'Suspension overhaul'),
(28, 15, 2900.00, 'Detailing'),
(29, 1, 1200.00, 'Oil change'),
(29, 8, 1800.00, 'Spark plugs'),
-- Confirmed & pending
(30, 6, 950.00, 'ECU tune check'),
(30, 8, 1800.00, 'Performance plugs'),
(31, 1, 1200.00, 'Periodic oil change'),
(32, 11, 1100.00, 'EV alignment'),
(33, 7, 3200.00, 'Diesel ATF service'),
(33, 16, 1350.00, 'Coolant flush'),
(34, 3, 2400.00, 'Ceramic brake pads'),
(34, 5, 750.00, 'DOT 4 fluid'),
(35, 1, 1200.00, 'Oil change'),
(36, 6, 950.00, 'Hybrid scan'),
(37, 2, 850.00, 'Routine inspection'),
(38, 13, 1750.00, 'AC gas recharge'),
(39, 1, 1200.00, 'Cancelled oil change'),
(40, 3, 2400.00, 'Cancelled brake job');

-- ============================================================================
-- 11. SERVICE ASSIGNMENTS
-- ============================================================================
INSERT INTO service_assignments (id, booking_id, mechanic_id, assigned_at, started_at, completed_at, status, mechanic_notes) VALUES
(1, 1, 1, '2026-10-10 08:30:00', '2026-10-10 09:05:00', '2026-10-10 10:45:00', 'completed', 'Oil changed, steering squeak resolved by lubricating strut mount'),
(2, 2, 1, '2026-10-12 09:30:00', '2026-10-12 10:00:00', '2026-10-12 12:15:00', 'completed', 'Replaced front pads and resurfaced warped brake rotors'),
(3, 3, 7, '2026-10-14 10:30:00', '2026-10-14 11:00:00', '2026-10-14 12:45:00', 'completed', 'Completed oil change and wheel alignment on rack 3'),
(4, 4, 3, '2026-10-16 13:30:00', '2026-10-16 14:00:00', '2026-10-16 15:10:00', 'completed', 'High voltage isolation test passed, 12V auxiliary in good condition'),
(5, 5, 10, '2026-10-18 08:30:00', '2026-10-18 09:10:00', '2026-10-18 12:30:00', 'completed', 'New struts installed; road tested over test track without noise'),
(6, 6, 2, '2026-10-20 09:30:00', '2026-10-20 10:00:00', '2026-10-20 12:30:00', 'completed', 'ATF flush completed with OE filter and pan gasket'),
(7, 7, 8, '2026-10-22 10:30:00', '2026-10-22 11:05:00', '2026-10-22 12:20:00', 'completed', 'Replaced leaking Schrader valve and recharged 550g R134a'),
(8, 8, 9, '2026-10-24 13:30:00', '2026-10-24 14:00:00', '2026-10-24 15:40:00', 'completed', 'Cleaned brake calipers and pressure bled system with DOT 4'),
(9, 9, 2, '2026-10-25 08:30:00', '2026-10-25 09:00:00', '2026-10-25 11:00:00', 'completed', 'Replaced 4 spark plugs and executed electronic throttle body relearn'),
(10, 10, 7, '2026-10-27 09:30:00', '2026-10-27 10:00:00', '2026-10-27 13:45:00', 'completed', '3-stage compounding and ceramic sealant applied'),
(11, 11, 10, '2026-10-28 10:30:00', '2026-10-28 11:00:00', '2026-10-28 12:00:00', 'completed', 'Adjusted front toe angles to zero degrees within spec'),
(12, 12, 7, '2026-10-30 13:30:00', '2026-10-30 14:00:00', '2026-10-30 15:20:00', 'completed', 'Replaced dirty cabin filter; 50-point report provided to customer'),
(13, 13, 4, '2026-11-01 08:30:00', '2026-11-01 09:00:00', '2026-11-01 10:45:00', 'completed', 'Radiator descaled and refilled with premixed 50/50 coolant'),
(14, 14, 3, '2026-11-02 09:30:00', '2026-11-02 10:00:00', '2026-11-02 11:00:00', 'completed', 'Installed new 75Ah AGM battery and coded into gateway'),
(15, 15, 1, '2026-11-03 10:30:00', '2026-11-03 11:00:00', '2026-11-03 14:15:00', 'completed', 'Major service overhaul completed in bay 1'),
(16, 16, 7, '2026-11-04 13:30:00', '2026-11-04 14:00:00', '2026-11-04 15:30:00', 'completed', 'Oil and coolant renewed'),
(17, 17, 10, '2026-11-05 08:30:00', '2026-11-05 09:00:00', '2026-11-05 10:30:00', 'completed', 'Suspension checked and high-speed road force balanced'),
(18, 18, 7, '2026-11-06 09:30:00', '2026-11-06 10:00:00', '2026-11-06 11:30:00', 'completed', 'Filters and lubrication service carried out cleanly'),
(19, 19, 3, '2026-11-07 10:30:00', '2026-11-07 11:00:00', '2026-11-07 12:45:00', 'completed', 'Diagnostic clear; all wheels balanced within 5 grams'),
(20, 20, 2, '2026-11-08 13:30:00', '2026-11-08 14:00:00', '2026-11-08 16:00:00', 'completed', 'Engine tuneup done; idle rpm smoothed to 750 rpm'),
(21, 21, 8, '2026-11-09 08:30:00', '2026-11-09 09:00:00', '2026-11-09 10:45:00', 'completed', 'Evaporator foam sanitized and fresh cabin filter fitted'),
(22, 22, 9, '2026-11-10 09:30:00', '2026-11-10 10:00:00', '2026-11-10 12:15:00', 'completed', 'Rotors machined on lathe, low dust ceramic pads seated'),
(23, 23, 7, '2026-11-11 10:30:00', '2026-11-11 11:00:00', '2026-11-11 12:00:00', 'completed', 'Synthetic oil service completed'),
(24, 24, 10, '2026-11-12 13:30:00', '2026-11-12 14:00:00', '2026-11-12 15:30:00', 'completed', 'Chassis multi-point completed and alignment documented'),
(25, 25, 3, '2026-11-13 08:30:00', '2026-11-13 09:00:00', '2026-11-13 11:30:00', 'completed', 'Alternator diode pack replaced and charging at 14.2V'),
-- Currently active assignments
(26, 26, 10, '2026-11-14 08:30:00', '2026-11-14 09:15:00', NULL, 'in_progress', 'Car on alignment rack; technician adjusting front camber'),
(27, 27, 1, '2026-11-14 09:30:00', '2026-11-14 10:00:00', NULL, 'in_progress', 'Lower control arms removed; pressing new polyurethane bushings'),
(28, 28, 7, '2026-11-14 10:30:00', '2026-11-14 11:00:00', NULL, 'in_progress', 'Polishing exterior hood and upholstery steam cleaning'),
(29, 29, 2, '2026-11-14 13:30:00', '2026-11-14 14:00:00', NULL, 'in_progress', 'Draining oil; preparing spark plug torque socket'),
-- Confirmed future assignments
(30, 30, 2, '2026-11-14 14:00:00', NULL, NULL, 'assigned', 'Pre-assigned for tomorrow morning tune-up'),
(31, 31, 7, '2026-11-14 14:15:00', NULL, NULL, 'assigned', 'Pre-assigned for regular maintenance'),
(32, 32, 10, '2026-11-14 14:30:00', NULL, NULL, 'assigned', 'Pre-assigned for laser wheel alignment');

SELECT setval('service_assignments_id_seq', (SELECT MAX(id) FROM service_assignments));

-- ============================================================================
-- 12. SERVICE RECORDS (Completed jobs documentation)
-- ============================================================================
INSERT INTO service_records (id, booking_id, vehicle_id, mechanic_id, completed_date, work_performed, parts_replaced, diagnostic_notes, odometer_reading) VALUES
(1, 1, 1, 1, '2026-10-10 10:45:00', 'Drained old oil, installed genuine Toyota oil filter, refilled with 0W-20 Mobil 1 Synthetic. Lubricated front upper strut bearings.', 'Oil filter element, 4.2L 0W-20 synthetic oil, sump washer', 'ECU zero DTC codes. Tire tread depths at 6mm all around.', 24500),
(2, 2, 3, 1, '2026-10-12 12:15:00', 'Removed front wheels, replaced glazed brake pads with ceramic compound, resurfaced front brake discs.', 'Front brake pad set (Ceramic), brake cleaner', 'Rotor runout within 0.02mm specification.', 32000),
(3, 3, 4, 7, '2026-10-14 12:45:00', 'Full oil service and 4-wheel computerized alignment.', 'Engine oil 5W-30, OEM oil filter', 'Front left toe corrected from -0.35 deg to +0.05 deg.', 41200),
(4, 4, 5, 3, '2026-10-16 15:10:00', 'High voltage battery diagnostic, checked thermal management coolant loop and 12V auxiliary lead.', 'None', 'Main traction pack health at 98.4% capacity.', 12400),
(5, 5, 6, 10, '2026-10-18 12:30:00', 'Installed front OEM strut assemblies and heavy duty sway bar links.', 'Front left and right shock absorbers, stabilizer links', 'Road tested over speed bumps; ride quality fully restored.', 82500),
(6, 6, 7, 2, '2026-10-20 12:30:00', 'Computer diagnostic scan followed by full transmission fluid flush.', 'ZF 8-speed transmission fluid 7L, pan with integrated filter', 'Smooth shifts observed across all 8 gear ratios.', 21300),
(7, 7, 8, 8, '2026-10-22 12:20:00', 'AC system pressure test, leak detection, low-side port valve replacement, and refrigerant vacuum refill.', 'Low-pressure valve core, R134a refrigerant 550 grams', 'Center vent discharge temperature dropped to 4.8 deg C.', 36000),
(8, 8, 9, 9, '2026-10-24 15:40:00', 'Installed front Akebono ceramic pads and flushed brake hydraulic system.', 'Akebono ceramic brake pads, 1L Castrol DOT 4 brake fluid', 'Pedal feel stiff and responsive under panic test stop.', 19800),
(9, 9, 10, 2, '2026-10-25 11:00:00', 'Replaced engine oil, filter, and 4 NGK Laser Iridium spark plugs.', 'Mobil 1 0W-40 oil, oil filter, 4x NGK Laser Iridium plugs', 'Cold start misfire eradicated; engine revs cleanly.', 45000),
(10, 10, 11, 7, '2026-10-27 13:45:00', 'Detailed exterior paint with clay bar, dual action polish, and leather treatment inside.', 'Ceramic sealant spray, leather balm, detailing chemicals', 'Paint gloss measured 94 GU (gloss units).', 38900),
(11, 11, 12, 10, '2026-10-28 12:00:00', 'Corrosion cleanup on tie-rod threads and calibrated laser wheel alignment.', 'None', 'Thrust angle aligned perfectly to 0.00 degrees.', 9500),
(12, 12, 13, 7, '2026-10-30 15:20:00', 'Performed multi-point safety check and installed carbon cabin air filter.', 'Activated carbon pollen filter', 'All fluids, belts, lights, and suspension joints verified OK.', 14200),
(13, 13, 14, 4, '2026-11-01 10:45:00', 'Drained old coolant, performed chemical flush cycle, refilled with factory G12evo coolant.', 'G12evo concentrated coolant 4L, distilled water', 'Thermostat opens at 87 deg C; auxiliary fan cycles properly.', 29000),
(14, 14, 15, 3, '2026-11-02 11:00:00', 'Tested failing battery (showing 180 CCA out of 650 rated). Installed new Exide AGM battery.', 'Exide AGM 70Ah battery', 'Battery registration updated in Audi Gateway module.', 31500),
(15, 15, 16, 1, '2026-11-03 14:15:00', 'Extensive 50k service: engine oil, brake pads, rotor turning, and fresh spark plugs.', 'Brake pads, rotors turned, 6 spark plugs, oil filter, oil', 'Comprehensive test drive completed with customer.', 52000),
(16, 16, 2, 7, '2026-11-04 15:30:00', 'Renewed diesel engine oil, oil filter and refreshed engine coolant.', 'Castrol Edge 5W-30 5.5L, oil filter, long life coolant', 'Diesel particulate filter (DPF) soot load at healthy 12%.', 18200),
(17, 17, 3, 10, '2026-11-05 10:30:00', 'Safety inspection after track weekend and high-speed tire balance.', 'Balancing clip weights', 'Zero brake fluid boil detected; wheels true and round.', 32000),
(18, 18, 18, 7, '2026-11-06 11:30:00', '30k periodic inspection, oil renewal and fresh engine air filter.', 'Engine oil, air filter, washer fluid', 'Brake pad life remaining at 65% front, 75% rear.', 34000),
(19, 19, 5, 3, '2026-11-07 12:45:00', 'Calibrated tire pressure sensors and ran electronic subsystem checks.', 'None', 'All sensors responding on CAN bus.', 12400),
(20, 20, 19, 2, '2026-11-08 16:00:00', 'Routine high mileage checkup with 4 new spark plugs.', '4x Denso spark plugs, 5W-30 mineral/synthetic blend', 'Exhaust emissions test within legal standards.', 98000),
(21, 21, 7, 8, '2026-11-09 10:45:00', 'Cleaned AC evaporator core with anti-microbial foam; fitted pollen filter.', 'Cabin pollen filter, aerosol antibacterial spray', 'Eliminated musty smell on startup.', 21300),
(22, 22, 20, 9, '2026-11-10 12:15:00', 'Fitted premium front brake pads and smoothed disc faces.', 'Textar brake pad set', 'Firm pedal and zero vibration.', 26000),
(23, 23, 9, 7, '2026-11-11 12:00:00', 'Regular oil and filter change.', 'Synthetic oil 4L, oil filter', 'Checked tire pressure and adjusted to 33 psi.', 19800),
(24, 24, 21, 10, '2026-11-12 15:30:00', '40k service inspection and 4-wheel alignment.', 'None', 'Chassis bushings inspected; no tearing or cracking found.', 41000),
(25, 25, 11, 3, '2026-11-13 11:30:00', 'Bench tested alternator, replaced internal rectifier bridge.', 'Alternator rectifier assembly', 'Output rock steady at 14.3 Volts under 60A electrical load.', 45000);

SELECT setval('service_records_id_seq', (SELECT MAX(id) FROM service_records));

-- ============================================================================
-- 13. INVOICES (For completed and some in-progress bookings)
-- ============================================================================
INSERT INTO invoices (id, invoice_number, booking_id, customer_id, subtotal, tax_rate, tax_amount, discount_amount, total_amount, status, due_date, issued_at) VALUES
(1, 'INV-20261010-8801', 1, 1, 2050.00, 18.00, 369.00, 0.00, 2419.00, 'paid', '2026-10-17', '2026-10-10 11:00:00'),
(2, 'INV-20261012-8802', 2, 2, 4000.00, 18.00, 720.00, 200.00, 4520.00, 'paid', '2026-10-19', '2026-10-12 12:30:00'),
(3, 'INV-20261014-8803', 3, 3, 2300.00, 18.00, 414.00, 0.00, 2714.00, 'paid', '2026-10-21', '2026-10-14 13:00:00'),
(4, 'INV-20261016-8804', 4, 4, 950.00, 18.00, 171.00, 50.00, 1071.00, 'paid', '2026-10-23', '2026-10-16 15:30:00'),
(5, 'INV-20261018-8805', 5, 5, 4900.00, 18.00, 882.00, 300.00, 5482.00, 'paid', '2026-10-25', '2026-10-18 13:00:00'),
(6, 'INV-20261020-8806', 6, 6, 4150.00, 18.00, 747.00, 150.00, 4747.00, 'paid', '2026-10-27', '2026-10-20 13:00:00'),
(7, 'INV-20261022-8807', 7, 7, 2400.00, 18.00, 432.00, 0.00, 2832.00, 'paid', '2026-10-29', '2026-10-22 13:00:00'),
(8, 'INV-20261024-8808', 8, 8, 3150.00, 18.00, 567.00, 100.00, 3617.00, 'paid', '2026-10-31', '2026-10-24 16:00:00'),
(9, 'INV-20261025-8809', 9, 9, 3000.00, 18.00, 540.00, 0.00, 3540.00, 'paid', '2026-11-01', '2026-10-25 11:30:00'),
(10, 'INV-20261027-8810', 10, 10, 2900.00, 18.00, 522.00, 0.00, 3422.00, 'paid', '2026-11-03', '2026-10-27 14:00:00'),
(11, 'INV-20261028-8811', 11, 11, 1100.00, 18.00, 198.00, 0.00, 1298.00, 'paid', '2026-11-04', '2026-10-28 12:30:00'),
(12, 'INV-20261030-8812', 12, 12, 1500.00, 18.00, 270.00, 0.00, 1770.00, 'paid', '2026-11-06', '2026-10-30 15:45:00'),
(13, 'INV-20261101-8813', 13, 13, 2200.00, 18.00, 396.00, 0.00, 2596.00, 'paid', '2026-11-08', '2026-11-01 11:00:00'),
(14, 'INV-20261102-8814', 14, 14, 4200.00, 18.00, 756.00, 200.00, 4756.00, 'paid', '2026-11-09', '2026-11-02 11:30:00'),
(15, 'INV-20261103-8815', 15, 15, 6000.00, 18.00, 1080.00, 500.00, 6580.00, 'paid', '2026-11-10', '2026-11-03 14:45:00'),
(16, 'INV-20261104-8816', 16, 1, 2550.00, 18.00, 459.00, 0.00, 3009.00, 'paid', '2026-11-11', '2026-11-04 16:00:00'),
(17, 'INV-20261105-8817', 17, 2, 1950.00, 18.00, 351.00, 0.00, 2301.00, 'paid', '2026-11-12', '2026-11-05 11:00:00'),
(18, 'INV-20261106-8818', 18, 3, 1850.00, 18.00, 333.00, 0.00, 2183.00, 'issued', '2026-11-13', '2026-11-06 12:00:00'),
(19, 'INV-20261107-8819', 19, 4, 2050.00, 18.00, 369.00, 0.00, 2419.00, 'partially_paid', '2026-11-14', '2026-11-07 13:00:00'),
(20, 'INV-20261108-8820', 20, 5, 3000.00, 18.00, 540.00, 0.00, 3540.00, 'issued', '2026-11-15', '2026-11-08 16:30:00'),
(21, 'INV-20261109-8821', 21, 6, 2400.00, 18.00, 432.00, 0.00, 2832.00, 'issued', '2026-11-16', '2026-11-09 11:00:00'),
(22, 'INV-20261110-8822', 22, 7, 4000.00, 18.00, 720.00, 150.00, 4570.00, 'partially_paid', '2026-11-17', '2026-11-10 12:30:00'),
(23, 'INV-20261111-8823', 23, 8, 1200.00, 18.00, 216.00, 0.00, 1416.00, 'issued', '2026-11-18', '2026-11-11 12:30:00'),
(24, 'INV-20261112-8824', 24, 9, 1950.00, 18.00, 351.00, 0.00, 2301.00, 'issued', '2026-11-19', '2026-11-12 16:00:00'),
(25, 'INV-20261113-8825', 25, 10, 3050.00, 18.00, 549.00, 0.00, 3599.00, 'issued', '2026-11-20', '2026-11-13 12:00:00');

SELECT setval('invoices_id_seq', (SELECT MAX(id) FROM invoices));

-- ============================================================================
-- 14. INVOICE ITEMS
-- ============================================================================
INSERT INTO invoice_items (id, invoice_id, service_id, description, quantity, unit_price, line_total) VALUES
(1, 1, 1, 'Full Synthetic Engine Oil & Filter Change', 1, 1200.00, 1200.00),
(2, 1, 2, 'Comprehensive 50-Point Periodic Inspection', 1, 850.00, 850.00),
(3, 2, 3, 'Front & Rear Brake Pad Replacement', 1, 2400.00, 2400.00),
(4, 2, 4, 'Brake Rotor Resurfacing & Trueing', 1, 1600.00, 1600.00),
(5, 3, 1, 'Full Synthetic Engine Oil & Filter Change', 1, 1200.00, 1200.00),
(6, 3, 11, '3D Laser Wheel Alignment & Road Force Balance', 1, 1100.00, 1100.00),
(7, 4, 6, 'Engine Diagnostic & ECU Scan', 1, 950.00, 950.00),
(8, 5, 11, '3D Laser Wheel Alignment & Road Force Balance', 1, 1100.00, 1100.00),
(9, 5, 12, 'Front Struts & Suspension Bushing Replacement', 1, 3800.00, 3800.00),
(10, 6, 6, 'Engine Diagnostic & ECU Scan', 1, 950.00, 950.00),
(11, 6, 7, 'Automatic Transmission Fluid (ATF) Service', 1, 3200.00, 3200.00),
(12, 7, 13, 'AC Gas Refill & Cooling Coil Disinfection', 1, 1750.00, 1750.00),
(13, 7, 14, 'Cabin Air Filter & Engine Air Filter Combo', 1, 650.00, 650.00),
(14, 8, 3, 'Front & Rear Brake Pad Replacement', 1, 2400.00, 2400.00),
(15, 8, 5, 'Complete Brake Fluid Flush (DOT 4)', 1, 750.00, 750.00),
(16, 9, 1, 'Full Synthetic Engine Oil & Filter Change', 1, 1200.00, 1200.00),
(17, 9, 8, 'Spark Plug Set Replacement (Iridium)', 1, 1800.00, 1800.00),
(18, 10, 15, 'Executive Interior & Exterior Detailing', 1, 2900.00, 2900.00),
(19, 11, 11, '3D Laser Wheel Alignment & Road Force Balance', 1, 1100.00, 1100.00),
(20, 12, 2, 'Comprehensive 50-Point Periodic Inspection', 1, 850.00, 850.00),
(21, 12, 14, 'Cabin Air Filter & Engine Air Filter Combo', 1, 650.00, 650.00),
(22, 13, 16, 'Coolant & Radiator Chemical Flush', 1, 1350.00, 1350.00),
(23, 13, 2, 'Comprehensive 50-Point Periodic Inspection', 1, 850.00, 850.00),
(24, 14, 9, 'Automotive Battery Health Test & Replacement', 1, 4200.00, 4200.00),
(25, 15, 1, 'Full Synthetic Engine Oil & Filter Change', 1, 1200.00, 1200.00),
(26, 15, 3, 'Front & Rear Brake Pad Replacement', 1, 2400.00, 2400.00),
(27, 15, 4, 'Brake Rotor Resurfacing & Trueing', 1, 1600.00, 1600.00),
(28, 15, 8, 'Spark Plug Set Replacement (Iridium)', 1, 1800.00, 1800.00),
(29, 16, 1, 'Full Synthetic Engine Oil & Filter Change', 1, 1200.00, 1200.00),
(30, 16, 16, 'Coolant & Radiator Chemical Flush', 1, 1350.00, 1350.00),
(31, 17, 2, 'Comprehensive 50-Point Periodic Inspection', 1, 850.00, 850.00),
(32, 17, 11, '3D Laser Wheel Alignment & Road Force Balance', 1, 1100.00, 1100.00),
(33, 18, 1, 'Full Synthetic Engine Oil & Filter Change', 1, 1200.00, 1200.00),
(34, 18, 14, 'Cabin Air Filter & Engine Air Filter Combo', 1, 650.00, 650.00),
(35, 19, 6, 'Engine Diagnostic & ECU Scan', 1, 950.00, 950.00),
(36, 19, 11, '3D Laser Wheel Alignment & Road Force Balance', 1, 1100.00, 1100.00),
(37, 20, 1, 'Full Synthetic Engine Oil & Filter Change', 1, 1200.00, 1200.00),
(38, 20, 8, 'Spark Plug Set Replacement (Iridium)', 1, 1800.00, 1800.00),
(39, 21, 13, 'AC Gas Refill & Cooling Coil Disinfection', 1, 1750.00, 1750.00),
(40, 21, 14, 'Cabin Air Filter & Engine Air Filter Combo', 1, 650.00, 650.00),
(41, 22, 3, 'Front & Rear Brake Pad Replacement', 1, 2400.00, 2400.00),
(42, 22, 4, 'Brake Rotor Resurfacing & Trueing', 1, 1600.00, 1600.00),
(43, 23, 1, 'Full Synthetic Engine Oil & Filter Change', 1, 1200.00, 1200.00),
(44, 24, 2, 'Comprehensive 50-Point Periodic Inspection', 1, 850.00, 850.00),
(45, 24, 11, '3D Laser Wheel Alignment & Road Force Balance', 1, 1100.00, 1100.00),
(46, 25, 6, 'Engine Diagnostic & ECU Scan', 1, 950.00, 950.00),
(47, 25, 10, 'Alternator & Starter Electrical Overhaul', 1, 2100.00, 2100.00);

SELECT setval('invoice_items_id_seq', (SELECT MAX(id) FROM invoice_items));

-- ============================================================================
-- 15. PAYMENTS (Various methods and statuses)
-- ============================================================================
INSERT INTO payments (id, payment_reference, invoice_id, amount, payment_method, status, transaction_id, payment_date, remarks) VALUES
(1, 'PAY-20261010-9001', 1, 2419.00, 'credit_card', 'completed', 'txn_visa_48123982', '2026-10-10 11:15:00', 'Cleared via Razorpay Gateway'),
(2, 'PAY-20261012-9002', 2, 4520.00, 'credit_card', 'completed', 'txn_mc_59102812', '2026-10-12 12:45:00', 'Mastercard authorization approved'),
(3, 'PAY-20261014-9003', 3, 2714.00, 'upi', 'completed', 'upi_hdfc_88291029', '2026-10-14 13:10:00', 'UPI transaction success'),
(4, 'PAY-20261016-9004', 4, 1071.00, 'debit_card', 'completed', 'txn_db_39102881', '2026-10-16 15:45:00', 'Debit POS transaction'),
(5, 'PAY-20261018-9005', 5, 5482.00, 'bank_transfer', 'completed', 'neft_sbi_48102981', '2026-10-18 13:30:00', 'NEFT wire settlement'),
(6, 'PAY-20261020-9006', 6, 4747.00, 'upi', 'completed', 'upi_icici_77192839', '2026-10-20 13:15:00', 'Google Pay UPI'),
(7, 'PAY-20261022-9007', 7, 2832.00, 'cash', 'completed', 'cash_pos_counter_1', '2026-10-22 13:10:00', 'Cash received at billing counter'),
(8, 'PAY-20261024-9008', 8, 3617.00, 'credit_card', 'completed', 'txn_amex_91028312', '2026-10-24 16:15:00', 'Amex transaction cleared'),
(9, 'PAY-20261025-9009', 9, 3540.00, 'upi', 'completed', 'upi_paytm_38192839', '2026-10-25 11:45:00', 'PhonePe UPI reference cleared'),
(10, 'PAY-20261027-9010', 10, 3422.00, 'credit_card', 'completed', 'txn_visa_38192800', '2026-10-27 14:15:00', 'Visa international card'),
(11, 'PAY-20261028-9011', 11, 1298.00, 'cash', 'completed', 'cash_pos_counter_1', '2026-10-28 12:45:00', 'Exact cash payment received'),
(12, 'PAY-20261030-9012', 12, 1770.00, 'upi', 'completed', 'upi_axis_88291028', '2026-10-30 16:00:00', 'Axis Bank UPI cleared'),
(13, 'PAY-20261101-9013', 13, 2596.00, 'debit_card', 'completed', 'txn_db_99182736', '2026-11-01 11:15:00', 'Chip & PIN verified'),
(14, 'PAY-20261102-9014', 14, 4756.00, 'bank_transfer', 'completed', 'rtgs_kotak_381928', '2026-11-02 11:45:00', 'RTGS direct settlement'),
(15, 'PAY-20261103-9015', 15, 6580.00, 'credit_card', 'completed', 'txn_mc_77281920', '2026-11-03 15:00:00', 'Mastercard cleared'),
(16, 'PAY-20261104-9016', 16, 3009.00, 'upi', 'completed', 'upi_hdfc_99182736', '2026-11-04 16:15:00', 'BHIM UPI payment'),
(17, 'PAY-20261105-9017', 17, 2301.00, 'credit_card', 'completed', 'txn_visa_11223344', '2026-11-05 11:20:00', 'Credit card transaction complete'),
-- Partial payments for demonstration
(18, 'PAY-20261107-9018', 19, 1000.00, 'upi', 'completed', 'upi_part_112233', '2026-11-07 14:00:00', 'Initial partial advance payment'),
(19, 'PAY-20261110-9019', 22, 2000.00, 'cash', 'completed', 'cash_part_9988', '2026-11-10 13:00:00', 'Deposit paid in cash; balance pending'),
-- Failed payment attempt for error handling demonstration
(20, 'PAY-20261112-9020', 24, 2301.00, 'credit_card', 'failed', 'txn_declined_insufficient_funds', '2026-11-12 16:30:00', 'Card declined due to insufficient credit limit');

SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));

-- ============================================================================
-- 16. SERVICE STATUS HISTORY (Lifecycle log)
-- ============================================================================
INSERT INTO service_status_history (booking_id, previous_status, new_status, changed_by_user_id, change_reason, changed_at) VALUES
(1, NULL, 'pending', 14, 'Customer created online booking', '2026-10-09 10:00:00'),
(1, 'pending', 'confirmed', 1, 'Admin assigned mechanic Ramesh Kumar', '2026-10-09 11:30:00'),
(1, 'confirmed', 'in_progress', 4, 'Vehicle received in bay 1', '2026-10-10 09:05:00'),
(1, 'in_progress', 'completed', 4, 'Test drive approved and service logged', '2026-10-10 10:45:00'),

(2, NULL, 'pending', 15, 'Customer created online booking', '2026-10-11 09:15:00'),
(2, 'pending', 'confirmed', 1, 'Admin confirmed brake service booking', '2026-10-11 10:00:00'),
(2, 'confirmed', 'in_progress', 4, 'Brake disassembly initiated', '2026-10-12 10:00:00'),
(2, 'in_progress', 'completed', 4, 'Ceramic pads fitted and road tested', '2026-10-12 12:15:00'),

(26, NULL, 'pending', 14, 'Customer requested winter check', '2026-11-13 14:00:00'),
(26, 'pending', 'confirmed', 1, 'Admin scheduled technician Sunil Patel', '2026-11-13 15:30:00'),
(26, 'confirmed', 'in_progress', 10, 'Car positioned on alignment rack', '2026-11-14 09:15:00'),

(39, NULL, 'pending', 22, 'Customer booked maintenance slot', '2026-10-04 11:00:00'),
(39, 'pending', 'cancelled', 22, 'Customer cancelled appointment due to urgent business travel', '2026-10-05 08:30:00');

SELECT setval('service_status_history_id_seq', (SELECT MAX(id) FROM service_status_history));

-- ============================================================================
-- 17. REVIEWS (Customer feedback and ratings)
-- ============================================================================
INSERT INTO reviews (id, booking_id, customer_id, rating, comment, review_date) VALUES
(1, 1, 1, 5, 'Ramesh diagnosed the steering noise in 5 minutes! Outstanding workmanship and transparent billing.', '2026-10-10 14:00:00'),
(2, 2, 2, 5, 'Mustang brakes feel sharper than ever. Best workshop in the area. 10/10 recommend!', '2026-10-12 15:30:00'),
(3, 3, 3, 5, 'Super quick turnaround time. Clean waiting lounge and detailed digital inspection report.', '2026-10-14 16:00:00'),
(4, 4, 4, 4, 'Very knowledgeable EV technician. Verified my F-150 Lightning traction pack thoroughly.', '2026-10-16 17:15:00'),
(5, 5, 5, 5, 'Innova suspension feels factory fresh again. Deepak Joshi is a true suspension wizard.', '2026-10-18 15:00:00'),
(6, 6, 6, 5, 'BMW transmission shifts like butter now. Genuine ZF fluids used.', '2026-10-20 16:30:00'),
(7, 7, 7, 4, 'AC cools down the cabin in seconds even under scorching heat. Fair pricing.', '2026-10-22 15:00:00'),
(8, 8, 8, 5, 'Honest advice on pad thickness. Did not try to upsell unnecessary parts.', '2026-10-24 18:00:00'),
(9, 9, 9, 5, 'Engine purrs effortlessly after the iridium spark plug upgrade. Great job!', '2026-10-25 14:30:00'),
(10, 10, 10, 5, 'The detailing was astonishing! Showroom shine brought back to my X5.', '2026-10-27 16:45:00'),
(11, 11, 11, 4, 'Steering pull completely solved. High-tech laser alignment setup.', '2026-10-28 14:00:00'),
(12, 12, 12, 5, 'Smooth booking experience and polite staff. Will visit again for next periodic service.', '2026-10-30 17:00:00'),
(13, 13, 13, 5, 'Radiator flush done cleanly without any spillage. Engine running cooler now.', '2026-11-01 13:00:00'),
(14, 14, 14, 5, 'Saved me from getting stranded! Battery swapped and coded within an hour.', '2026-11-02 14:00:00'),
(15, 15, 15, 5, 'Heavy overhaul performed with exceptional professionalism. Worth every penny.', '2026-11-03 16:30:00');

SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));

-- ============================================================================
-- 18. AUDIT LOGS (Compliance metadata)
-- Note: triggers trg_audit_payments, trg_audit_invoices, and trg_audit_bookings
-- automatically capture DML events during seeding! We also record initial system startup logs:
-- ============================================================================
INSERT INTO audit_logs (table_name, record_id, action, changed_by_user_id, old_data, new_data, ip_address, created_at) VALUES
('system_bootstrap', 1, 'INSERT', 1, NULL, '{"event": "system_bootstrap_initialization", "version": "1.0.0"}'::jsonb, '127.0.0.1', '2026-10-01 00:00:00'),
('security_policy', 1, 'UPDATE', 1, '{"policy": "default"}'::jsonb, '{"policy": "strict_rbac_enabled"}'::jsonb, '127.0.0.1', '2026-10-01 00:05:00');

