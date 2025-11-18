-- Flyway migration: Create custom_field_options table
-- Version: 1.6
-- Description: Creates custom_field_options table for dropdown field options

-- ============================================================================
-- TABLE: custom_field_options
-- ============================================================================
CREATE TABLE custom_field_options (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL,
    
    -- Reference to Custom Field Definition
    definition_id UUID NOT NULL,
    
    -- Option Definition
    value_key VARCHAR(100) NOT NULL,
    
    -- Multilingual Option Values (JSONB)
    value_translations JSONB NOT NULL,
    
    -- Display Order
    sort_order INTEGER NOT NULL DEFAULT 0,
    
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
    CONSTRAINT fk_custom_field_options_definition FOREIGN KEY (definition_id) 
        REFERENCES custom_field_definition(field_id) ON DELETE CASCADE,
    CONSTRAINT uq_custom_field_options_definition_key UNIQUE (definition_id, value_key)
);

-- ============================================================================
-- INDEXES: custom_field_options
-- ============================================================================

-- Index for tenant isolation
CREATE INDEX ix_custom_field_options_tenant ON custom_field_options(tenant_id) 
    WHERE is_deleted = false;

-- Index for definition lookup
CREATE INDEX ix_custom_field_options_definition ON custom_field_options(definition_id) 
    WHERE is_deleted = false;

-- Index for sorting
CREATE INDEX ix_custom_field_options_sort ON custom_field_options(definition_id, sort_order) 
    WHERE is_deleted = false;

-- GIN index for JSONB value_translations queries
CREATE INDEX ix_custom_field_options_value_translations ON custom_field_options USING GIN (value_translations) 
    WHERE value_translations IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE custom_field_options IS 'Options for dropdown custom fields (DROPDOWN_SINGLE, DROPDOWN_MULTI)';
COMMENT ON COLUMN custom_field_options.tenant_id IS 'Tenant ID for multi-tenant isolation.';
COMMENT ON COLUMN custom_field_options.definition_id IS 'Reference to custom_field_definition.field_id';
COMMENT ON COLUMN custom_field_options.value_key IS 'Unique key for the option within the definition. Used as the value in custom_attributes JSONB';
COMMENT ON COLUMN custom_field_options.value_translations IS 'JSONB field storing multilingual option values. Structure: {"en": "Option Value", "ar": "قيمة الخيار"}';
COMMENT ON COLUMN custom_field_options.sort_order IS 'Sort order for display (lower numbers appear first)';

