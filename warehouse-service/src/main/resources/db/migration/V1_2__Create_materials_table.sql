-- Flyway migration: Create materials table
-- Version: 1.2
-- Description: Creates materials table with full support for
--              multi-tenant, multilingual fields (JSONB), determiners (JSONB),
--              category/brand references, and custom attributes

-- ============================================================================
-- TABLE: materials
-- ============================================================================
CREATE TABLE materials (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL,
    
    -- Business Fields
    code VARCHAR(100) NOT NULL,
    
    -- Multilingual Fields (JSONB)
    name_translations JSONB,
    description_translations JSONB,
    
    -- References (UUID references, no FK constraints - cross-database)
    category_id UUID,  -- Reference to category (code_table_value or category entity)
    brand_id UUID,     -- Reference to brand (code_table_value or brand entity)
    
    -- Determiners (JSONB array of determiner objects)
    -- Structure: [{"type": "BARCODE", "value": "1234567890"}, {"type": "SERIAL_NUMBER", "value": "SN-001"}]
    determiners JSONB,
    
    -- Material Properties
    is_trackable BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DISCONTINUED', 'PENDING_APPROVAL')),
    
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
    row_version BIGINT NOT NULL DEFAULT 0,
    
    -- Constraints
    CONSTRAINT uq_materials_tenant_code UNIQUE (tenant_id, code)
);

-- ============================================================================
-- INDEXES: materials
-- ============================================================================

-- Index for tenant isolation and soft delete filtering (most common query pattern)
CREATE INDEX ix_materials_tenant_deleted ON materials(tenant_id, is_deleted) 
    WHERE is_deleted = false;

-- Index for tenant and code lookup
CREATE INDEX ix_materials_tenant_code ON materials(tenant_id, code) 
    WHERE is_deleted = false;

-- Index for category filtering
CREATE INDEX ix_materials_category ON materials(category_id) 
    WHERE category_id IS NOT NULL AND is_deleted = false;

-- Index for brand filtering
CREATE INDEX ix_materials_brand ON materials(brand_id) 
    WHERE brand_id IS NOT NULL AND is_deleted = false;

-- Index for status filtering
CREATE INDEX ix_materials_status ON materials(status) 
    WHERE is_deleted = false;

-- Index for trackable filtering
CREATE INDEX ix_materials_trackable ON materials(is_trackable) 
    WHERE is_deleted = false;

-- GIN indexes for JSONB queries
CREATE INDEX ix_materials_name_translations ON materials USING GIN (name_translations) 
    WHERE name_translations IS NOT NULL;

CREATE INDEX ix_materials_description_translations ON materials USING GIN (description_translations) 
    WHERE description_translations IS NOT NULL;

CREATE INDEX ix_materials_determiners ON materials USING GIN (determiners) 
    WHERE determiners IS NOT NULL;

CREATE INDEX ix_materials_custom_attributes ON materials USING GIN (custom_attributes) 
    WHERE custom_attributes IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE materials IS 'Materials/items table with support for multi-tenant, multilingual fields, determiners, and custom attributes';
COMMENT ON COLUMN materials.tenant_id IS 'Tenant ID for multi-tenant isolation (references tenants.tenant_id in access-management-service DB)';
COMMENT ON COLUMN materials.code IS 'Unique material code within tenant (e.g., MAT-001, PROD-123)';
COMMENT ON COLUMN materials.name_translations IS 'JSONB field storing multilingual material names. Structure: {"en": "Material Name", "ar": "اسم المادة"}';
COMMENT ON COLUMN materials.description_translations IS 'JSONB field storing multilingual material descriptions. Structure: {"en": "Description", "ar": "الوصف"}';
COMMENT ON COLUMN materials.category_id IS 'Reference to category (code_table_value.id or category entity id)';
COMMENT ON COLUMN materials.brand_id IS 'Reference to brand (code_table_value.id or brand entity id)';
COMMENT ON COLUMN materials.determiners IS 'JSONB array of determiner objects. Structure: [{"type": "BARCODE", "value": "1234567890", "metadata": {}}]';
COMMENT ON COLUMN materials.is_trackable IS 'Whether this material requires unique identification (tracking). If true, each unit must have a unique identifier';
COMMENT ON COLUMN materials.status IS 'Material status: ACTIVE, INACTIVE, DISCONTINUED, PENDING_APPROVAL';
COMMENT ON COLUMN materials.custom_attributes IS 'JSONB field for tenant-specific custom attributes (e.g., {"weight": 1.5, "dimensions": {"length": 10, "width": 5}})';

-- ============================================================================
-- EXAMPLE DATA STRUCTURE
-- ============================================================================
-- name_translations: {
--   "en": "Laptop Computer",
--   "ar": "جهاز كمبيوتر محمول",
--   "fr": "Ordinateur portable"
-- }
--
-- description_translations: {
--   "en": "High-performance laptop for business use",
--   "ar": "جهاز كمبيوتر محمول عالي الأداء للاستخدام التجاري"
-- }
--
-- determiners: [
--   {"type": "BARCODE", "value": "1234567890123"},
--   {"type": "SKU", "value": "LAPTOP-001"},
--   {"type": "SERIAL_NUMBER", "value": "SN-2025-001"}
-- ]
--
-- custom_attributes: {
--   "weight": 2.5,
--   "dimensions": {
--     "length": 35,
--     "width": 24,
--     "height": 2
--   },
--   "color": "silver",
--   "warrantyMonths": 24
-- }

