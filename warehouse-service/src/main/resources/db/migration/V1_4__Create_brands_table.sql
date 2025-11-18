-- Flyway migration: Create brands table
-- Version: 1.4
-- Description: Creates brands table with full support for
--              multi-tenant, multilingual fields (JSONB), country of origin, and custom attributes

-- ============================================================================
-- TABLE: brands
-- ============================================================================
CREATE TABLE brands (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL,
    
    -- Multilingual Fields (JSONB)
    name_translations JSONB NOT NULL,
    
    -- Country of Origin
    -- Can be 2-letter ISO country code (e.g., "US", "DE") or UUID reference
    country_origin VARCHAR(50),
    
    -- Custom Attributes (JSONB for tenant-specific fields)
    custom_attributes JSONB,
    
    -- Soft Delete & Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Fields
    created_by_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_id UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Optimistic Locking
    row_version BIGINT NOT NULL DEFAULT 0
);

-- ============================================================================
-- INDEXES: brands
-- ============================================================================

-- Index for tenant isolation and soft delete filtering (most common query pattern)
CREATE INDEX ix_brands_tenant_deleted ON brands(tenant_id, is_deleted) 
    WHERE is_deleted = false;

-- Index for country of origin filtering
CREATE INDEX ix_brands_country_origin ON brands(country_origin) 
    WHERE country_origin IS NOT NULL AND is_deleted = false;

-- Composite index for tenant + country queries
CREATE INDEX ix_brands_tenant_country ON brands(tenant_id, country_origin) 
    WHERE is_deleted = false;

-- GIN index for JSONB name_translations queries
CREATE INDEX ix_brands_name_translations ON brands USING GIN (name_translations) 
    WHERE name_translations IS NOT NULL;

-- GIN index for JSONB custom_attributes queries
CREATE INDEX ix_brands_custom_attributes ON brands USING GIN (custom_attributes) 
    WHERE custom_attributes IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE brands IS 'Brands/manufacturers table with support for multi-tenant, multilingual fields, country of origin, and custom attributes';
COMMENT ON COLUMN brands.tenant_id IS 'Tenant ID for multi-tenant isolation';
COMMENT ON COLUMN brands.name_translations IS 'JSONB field storing multilingual brand names. Structure: {"en": "Brand Name", "ar": "اسم العلامة التجارية"}';
COMMENT ON COLUMN brands.country_origin IS 'Country of origin - can be 2-letter ISO code (e.g., "US", "DE") or UUID reference to country entity';
COMMENT ON COLUMN brands.custom_attributes IS 'JSONB field for tenant-specific custom attributes (e.g., {"foundedYear": 1990, "headquarters": "New York"})';

-- ============================================================================
-- EXAMPLE DATA STRUCTURE
-- ============================================================================
-- name_translations: {
--   "en": "Apple Inc.",
--   "ar": "شركة آبل",
--   "fr": "Apple Inc."
-- }
--
-- country_origin: "US" or "uuid-of-country"
--
-- custom_attributes: {
--   "foundedYear": 1976,
--   "headquarters": "Cupertino, California",
--   "website": "https://www.apple.com",
--   "industry": "Technology"
-- }

