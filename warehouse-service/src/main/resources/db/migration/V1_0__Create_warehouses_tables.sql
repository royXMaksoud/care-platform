-- Flyway migration: Create warehouses tables
-- Version: 1.0
-- Description: Creates warehouses and warehouse_language tables with full support for
--              multi-tenant, hierarchy, geospatial data, and multilingual support

-- ============================================================================
-- TABLE: warehouses
-- ============================================================================
-- Note: warehouse_type is stored as VARCHAR with CHECK constraint.
-- Later, this will be replaced with code_table_value_id reference
-- to support multilingual warehouse types via code_table_value_language
CREATE TABLE warehouses (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL,
    
    -- Business Fields
    code VARCHAR(100) NOT NULL,
    warehouse_type VARCHAR(50) NOT NULL CHECK (warehouse_type IN ('MAIN', 'BRANCH', 'STORE', 'SUPPLIER', 'THIRD_PARTY_LOGISTICS')),
    
    -- Hierarchy (self-reference)
    parent_warehouse_id UUID,
    
    -- Location References (from access-management-service)
    country_id UUID,  -- Reference to code_countries.country_id
    location_id UUID, -- Reference to locations.location_id
    
    -- Address Fields
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country_code VARCHAR(2),  -- ISO 2-letter country code (e.g., 'SY', 'US')
    
    -- Geospatial Coordinates
    latitude DOUBLE PRECISION CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    longitude DOUBLE PRECISION CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
    
    -- Time Zone
    time_zone VARCHAR(50),  -- e.g., 'Europe/Berlin', 'Asia/Damascus'
    
    -- Custom Data (JSONB for tenant-specific fields)
    custom_data JSONB,
    
    -- Soft Delete & Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Fields
    created_by_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_id UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Optimistic Locking
    row_version BIGINT NOT NULL DEFAULT 0,
    
    -- Constraints
    CONSTRAINT uq_warehouses_tenant_code UNIQUE (tenant_id, code),
    CONSTRAINT fk_warehouses_parent FOREIGN KEY (parent_warehouse_id) 
        REFERENCES warehouses(id) ON DELETE SET NULL,
    
    -- Check constraints for geospatial data
    CONSTRAINT chk_warehouses_latitude_range CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    CONSTRAINT chk_warehouses_longitude_range CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

-- ============================================================================
-- INDEXES: warehouses
-- ============================================================================

-- Index for tenant isolation and soft delete filtering (most common query pattern)
CREATE INDEX ix_warehouses_tenant_deleted ON warehouses(tenant_id, is_deleted) 
    WHERE is_deleted = false;

-- Index for tenant and warehouse type filtering
CREATE INDEX ix_warehouses_tenant_type ON warehouses(tenant_id, warehouse_type) 
    WHERE is_deleted = false;

-- Index for hierarchy queries (finding children of a warehouse)
CREATE INDEX ix_warehouses_parent ON warehouses(parent_warehouse_id) 
    WHERE parent_warehouse_id IS NOT NULL AND is_deleted = false;

-- Index for country filtering
CREATE INDEX ix_warehouses_country ON warehouses(country_id) 
    WHERE country_id IS NOT NULL AND is_deleted = false;

-- Index for location filtering
CREATE INDEX ix_warehouses_location ON warehouses(location_id) 
    WHERE location_id IS NOT NULL AND is_deleted = false;

-- Index for geospatial queries (PostGIS can be added later for advanced queries)
CREATE INDEX ix_warehouses_coordinates ON warehouses(latitude, longitude) 
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND is_deleted = false;

-- Index for code lookup (within tenant)
CREATE INDEX ix_warehouses_tenant_code ON warehouses(tenant_id, code) 
    WHERE is_deleted = false;

-- Index for custom_data JSONB queries (GIN index for efficient JSON queries)
CREATE INDEX ix_warehouses_custom_data ON warehouses USING GIN (custom_data) 
    WHERE custom_data IS NOT NULL;

-- ============================================================================
-- TABLE: warehouse_language
-- ============================================================================
-- Multilingual support for warehouse names and descriptions
CREATE TABLE warehouse_language (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Key to warehouse
    warehouse_id UUID NOT NULL,
    
    -- Language Code (ISO 639-1, e.g., 'en', 'ar', 'fr')
    language_code VARCHAR(10) NOT NULL,
    
    -- Multilingual Fields
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Audit Fields (inherited pattern)
    tenant_id UUID NOT NULL,  -- For tenant isolation
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_by_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_id UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    row_version BIGINT NOT NULL DEFAULT 0,
    
    -- Constraints
    CONSTRAINT fk_warehouse_language_warehouse FOREIGN KEY (warehouse_id) 
        REFERENCES warehouses(id) ON DELETE CASCADE,
    CONSTRAINT uq_warehouse_language_warehouse_lang UNIQUE (warehouse_id, language_code),
    CONSTRAINT chk_warehouse_language_code_length CHECK (LENGTH(language_code) >= 2)
);

-- ============================================================================
-- INDEXES: warehouse_language
-- ============================================================================

-- Index for tenant isolation
CREATE INDEX ix_warehouse_language_tenant ON warehouse_language(tenant_id, is_deleted) 
    WHERE is_deleted = false;

-- Index for warehouse lookup
CREATE INDEX ix_warehouse_language_warehouse ON warehouse_language(warehouse_id) 
    WHERE is_deleted = false;

-- Index for language lookup
CREATE INDEX ix_warehouse_language_lang ON warehouse_language(language_code) 
    WHERE is_deleted = false;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE warehouses IS 'Main warehouses table with support for multi-tenant, hierarchy, geospatial data, and custom fields';
COMMENT ON COLUMN warehouses.tenant_id IS 'Tenant ID for multi-tenant isolation (references tenants.tenant_id in access-management-service DB)';
COMMENT ON COLUMN warehouses.code IS 'Unique warehouse code within tenant (e.g., WH-001, HQ-WH)';
COMMENT ON COLUMN warehouses.warehouse_type IS 'Type of warehouse: MAIN, BRANCH, STORE, SUPPLIER, THIRD_PARTY_LOGISTICS. Will be replaced with code_table_value_id later';
COMMENT ON COLUMN warehouses.parent_warehouse_id IS 'Self-reference for warehouse hierarchy (e.g., BRANCH -> MAIN)';
COMMENT ON COLUMN warehouses.country_id IS 'Reference to code_countries.country_id in access-management-service';
COMMENT ON COLUMN warehouses.location_id IS 'Reference to locations.location_id in access-management-service';
COMMENT ON COLUMN warehouses.latitude IS 'GPS latitude (-90 to 90)';
COMMENT ON COLUMN warehouses.longitude IS 'GPS longitude (-180 to 180)';
COMMENT ON COLUMN warehouses.custom_data IS 'JSONB field for tenant-specific custom fields (e.g., {"capacity": 1000, "manager": "John Doe"})';
COMMENT ON COLUMN warehouses.time_zone IS 'IANA timezone (e.g., Europe/Berlin, Asia/Damascus)';

COMMENT ON TABLE warehouse_language IS 'Multilingual translations for warehouse names and descriptions';
COMMENT ON COLUMN warehouse_language.language_code IS 'ISO 639-1 language code (e.g., en, ar, fr)';
COMMENT ON COLUMN warehouse_language.name IS 'Translated warehouse name';
COMMENT ON COLUMN warehouse_language.description IS 'Translated warehouse description';

-- ============================================================================
-- FUTURE ENHANCEMENTS (Not included in this migration)
-- ============================================================================
-- 1. Add code_table_value_id column to replace warehouse_type enum
--    ALTER TABLE warehouses ADD COLUMN warehouse_type_id UUID;
--    CREATE INDEX ix_warehouses_type_id ON warehouses(warehouse_type_id);
--
-- 2. Add PostGIS extension for advanced geospatial queries
--    CREATE EXTENSION IF NOT EXISTS postgis;
--    ALTER TABLE warehouses ADD COLUMN coordinates POINT;
--    CREATE INDEX ix_warehouses_coordinates_gist ON warehouses USING GIST(coordinates);
--
-- 3. Add IoT sensor references table (for future IoT integration)
--    CREATE TABLE warehouse_sensors (...);
--
-- 4. Add blockchain movement log table (for future blockchain traceability)
--    CREATE TABLE warehouse_movement_logs (...);

