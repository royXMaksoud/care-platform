-- Flyway migration: Create custom_field_definition table
-- Version: 1.10
-- Description: Creates custom_field_definition table for dynamic custom fields metadata engine
-- 
-- This table stores metadata definitions for custom fields that can be attached
-- to different entity types (MATERIAL, WAREHOUSE, ORDER, etc.).
-- 
-- Key features:
-- - Multi-tenant support
-- - Entity-type specific definitions
-- - Multilingual labels (JSONB)
-- - Flexible data types
-- - Validation rules (min/max, allowed values)
-- - Sort order for UI display

-- ============================================================================
-- TABLE: custom_field_definition
-- ============================================================================
CREATE TABLE custom_field_definition (
    -- Primary Key
    field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL,
    
    -- Entity Type
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
        'MATERIAL', 'WAREHOUSE', 'ORDER', 'CUSTOMER', 'STOCK_ITEM', 'BRAND', 'CATEGORY'
    )),
    
    -- Field Definition
    field_key VARCHAR(100) NOT NULL,
    
    -- Multilingual Labels (JSONB)
    -- Structure: {"en": "Field Label", "ar": "تسمية الحقل", "fr": "Libellé du champ"}
    label_translations JSONB NOT NULL,
    
    -- Data Type
    data_type VARCHAR(50) NOT NULL CHECK (data_type IN (
        'STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'DATETIME', 'ENUM', 'LIST', 'JSON', 'MEDIA'
    )),
    
    -- Field Properties
    is_required BOOLEAN NOT NULL DEFAULT false,
    
    -- Allowed Values (JSONB) - for ENUM and LIST fields
    -- Structure: [
    --   {"code": "Samsung", "label": {"en": "Samsung", "ar": "سامسونغ"}},
    --   {"code": "Apple", "label": {"en": "Apple", "ar": "أبل"}}
    -- ]
    allowed_values JSONB,
    
    -- Validation Constraints
    min_value NUMERIC(20, 6), -- For NUMBER: min value, for STRING: min_length, for DATE/DATETIME: min_date (as timestamp)
    max_value NUMERIC(20, 6), -- For NUMBER: max value, for STRING: max_length, for DATE/DATETIME: max_date (as timestamp)
    
    -- Regex Pattern for STRING validation
    regex_pattern VARCHAR(500),
    
    -- Display Order
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Status
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
    CONSTRAINT uq_custom_field_definition_tenant_entity_key 
        UNIQUE (tenant_id, entity_type, field_key)
);

-- ============================================================================
-- INDEXES: custom_field_definition
-- ============================================================================

-- Index for tenant isolation and soft delete filtering
CREATE INDEX ix_custom_field_definition_tenant_deleted 
    ON custom_field_definition(tenant_id, is_deleted) 
    WHERE is_deleted = false;

-- Index for entity type filtering
CREATE INDEX ix_custom_field_definition_entity_type 
    ON custom_field_definition(entity_type) 
    WHERE is_deleted = false;

-- Composite index for tenant + entity type queries (most common query pattern)
CREATE INDEX ix_custom_field_definition_tenant_entity 
    ON custom_field_definition(tenant_id, entity_type) 
    WHERE is_deleted = false AND is_active = true;

-- Index for active field definitions lookup
CREATE INDEX ix_custom_field_definition_active 
    ON custom_field_definition(tenant_id, entity_type, is_active) 
    WHERE is_deleted = false AND is_active = true;

-- GIN index for JSONB label_translations queries
CREATE INDEX ix_custom_field_definition_label_translations 
    ON custom_field_definition USING GIN (label_translations) 
    WHERE label_translations IS NOT NULL;

-- GIN index for JSONB allowed_values queries
CREATE INDEX ix_custom_field_definition_allowed_values 
    ON custom_field_definition USING GIN (allowed_values) 
    WHERE allowed_values IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE custom_field_definition IS 
    'Metadata definitions for custom fields that can be attached to different entity types. This table defines the schema, validation rules, and multilingual labels for dynamic fields.';

COMMENT ON COLUMN custom_field_definition.tenant_id IS 
    'Tenant ID for multi-tenant isolation. Each tenant can define their own custom fields.';

COMMENT ON COLUMN custom_field_definition.entity_type IS 
    'Entity type this field applies to (MATERIAL, WAREHOUSE, ORDER, etc.). Each entity type can have multiple custom field definitions.';

COMMENT ON COLUMN custom_field_definition.field_key IS 
    'Unique key for the field within entity type and tenant. Used to identify the field in custom_field_value records. Example: "warranty_period", "manufacturing_date", "supplier_code"';

COMMENT ON COLUMN custom_field_definition.label_translations IS 
    'JSONB field storing multilingual field labels for UI display. Structure: {"en": "Warranty Period", "ar": "فترة الضمان", "fr": "Période de garantie"}';

COMMENT ON COLUMN custom_field_definition.data_type IS 
    'Data type of the field value: STRING, NUMBER, BOOLEAN, DATE, DATETIME, ENUM, LIST, JSON, MEDIA. Determines validation rules and UI input type.';

COMMENT ON COLUMN custom_field_definition.is_required IS 
    'Whether this field is required. If true, entity records must have a value for this field.';

COMMENT ON COLUMN custom_field_definition.allowed_values IS 
    'JSONB array of allowed values for ENUM and LIST fields. Structure: [{"code": "Samsung", "label": {"en": "Samsung", "ar": "سامسونغ"}}, ...]';

COMMENT ON COLUMN custom_field_definition.min_value IS 
    'Minimum value for NUMBER/DECIMAL fields, or minimum length for TEXT fields, or minimum date for DATE/DATETIME fields.';

COMMENT ON COLUMN custom_field_definition.max_value IS 
    'Maximum value for NUMBER/DECIMAL fields, or maximum length for TEXT fields, or maximum date for DATE/DATETIME fields.';

COMMENT ON COLUMN custom_field_definition.sort_order IS 
    'Sort order for UI display. Lower numbers appear first in forms and lists.';

COMMENT ON COLUMN custom_field_definition.regex_pattern IS 
    'Regular expression pattern for STRING field validation. If provided, string values must match this pattern.';

