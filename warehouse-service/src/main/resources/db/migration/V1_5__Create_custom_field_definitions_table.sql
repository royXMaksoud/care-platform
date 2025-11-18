-- Flyway migration: Create custom_field_definitions table
-- Version: 1.5
-- Description: Creates custom_field_definitions table for metadata-based dynamic field system

-- ============================================================================
-- TABLE: custom_field_definitions
-- ============================================================================
CREATE TABLE custom_field_definitions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL,
    
    -- Entity Type
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('MATERIAL', 'WAREHOUSE', 'WAREHOUSE_ITEM')),
    
    -- Field Definition
    field_key VARCHAR(100) NOT NULL,
    
    -- Multilingual Labels (JSONB)
    label_translations JSONB NOT NULL,
    
    -- Field Type
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('TEXT', 'NUMBER', 'DATE', 'DROPDOWN_SINGLE', 'DROPDOWN_MULTI', 'BOOLEAN', 'MEDIA')),
    
    -- Field Properties
    is_required BOOLEAN NOT NULL DEFAULT false,
    is_global BOOLEAN NOT NULL DEFAULT false,
    
    -- Validation Rules (JSONB)
    validation_rules JSONB,
    
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
    CONSTRAINT uq_custom_field_definitions_tenant_entity_key UNIQUE (tenant_id, entity_type, field_key)
);

-- ============================================================================
-- INDEXES: custom_field_definitions
-- ============================================================================

-- Index for tenant isolation and soft delete filtering
CREATE INDEX ix_custom_field_definitions_tenant_deleted ON custom_field_definitions(tenant_id, is_deleted) 
    WHERE is_deleted = false;

-- Index for entity type filtering
CREATE INDEX ix_custom_field_definitions_entity_type ON custom_field_definitions(entity_type) 
    WHERE is_deleted = false;

-- Composite index for tenant + entity type queries
CREATE INDEX ix_custom_field_definitions_tenant_entity ON custom_field_definitions(tenant_id, entity_type) 
    WHERE is_deleted = false;

-- Index for global fields
CREATE INDEX ix_custom_field_definitions_global ON custom_field_definitions(is_global) 
    WHERE is_global = true AND is_deleted = false;

-- GIN index for JSONB label_translations queries
CREATE INDEX ix_custom_field_definitions_label_translations ON custom_field_definitions USING GIN (label_translations) 
    WHERE label_translations IS NOT NULL;

-- GIN index for JSONB validation_rules queries
CREATE INDEX ix_custom_field_definitions_validation_rules ON custom_field_definitions USING GIN (validation_rules) 
    WHERE validation_rules IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE custom_field_definitions IS 'Metadata definitions for custom fields that can be attached to different entity types';
COMMENT ON COLUMN custom_field_definitions.tenant_id IS 'Tenant ID for multi-tenant isolation';
COMMENT ON COLUMN custom_field_definitions.entity_type IS 'Entity type this field applies to (MATERIAL, WAREHOUSE, WAREHOUSE_ITEM)';
COMMENT ON COLUMN custom_field_definitions.field_key IS 'Unique key for the field within entity type and tenant. Used to identify the field in custom_attributes JSONB';
COMMENT ON COLUMN custom_field_definitions.label_translations IS 'JSONB field storing multilingual field labels. Structure: {"en": "Field Label", "ar": "تسمية الحقل"}';
COMMENT ON COLUMN custom_field_definitions.field_type IS 'Field type: TEXT, NUMBER, DATE, DROPDOWN_SINGLE, DROPDOWN_MULTI, BOOLEAN, MEDIA';
COMMENT ON COLUMN custom_field_definitions.is_required IS 'Whether this field is required';
COMMENT ON COLUMN custom_field_definitions.is_global IS 'Whether this field is global (applies to all tenants). Global fields are defined by system admin';
COMMENT ON COLUMN custom_field_definitions.validation_rules IS 'JSONB field for validation rules. Structure depends on field type';

