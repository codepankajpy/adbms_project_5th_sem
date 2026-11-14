-- ============================================================================
-- 001_extensions.sql
-- Vehicle Service Management System - Advanced DBMS Project
-- Author: DBMS Project Team
-- Purpose: Enable PostgreSQL extensions required for cryptographic hashing and UUID generation
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

