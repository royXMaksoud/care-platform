-- Flyway migration: Create custom_field_value table
-- Version: 1.11
-- Description: Creates custom_field_value table for storing actual custom field values
-- 
-- This table stores the actual values for custom fields on entity records.
-- Each row represents one custom field value for one entity record.
-- 
-- Key features:
-- - Multi-tenant support
-- - Entity-type and record reference
-- - Field definition reference
-- - Flexible value storage (JSONB)
-- - Unique constraint per entity record + field

-- ============================================================================
-- TABLE: custom_field_value
-- ============================================================================
CREATE TABLE custom_field_value (
    -- Primary Key
    value_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL,
    
    -- Entity Reference
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
        'MATERIAL', 'WAREHOUSE', 'ORDER', 'CUSTOMER', 'STOCK_ITEM', 'BRAND', 'CATEGORY'
    )),
    entity_record_id UUID NOT NULL,
    
    -- Field Definition Reference
    field_id UUID NOT NULL,
    
    -- Value (JSONB)
    -- Structure depends on field's data_type:
    -- - STRING: "string value"
    -- - NUMBER: 123 or 123.45
    -- - BOOLEAN: true
    -- - DATE: "2024-01-15"
    -- - DATETIME: "2024-01-15T10:30:00Z"
    -- - ENUM: "code" (e.g., "Samsung", "Apple")
    -- - LIST: ["code1", "code2"] (array of codes)
    -- - JSON: {"key": "value", "nested": {...}}
    -- - MEDIA: "file://path/to/file" or UUID
    value JSONB NOT NULL,
    
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
    CONSTRAINT fk_custom_field_value_field 
        FOREIGN KEY (field_id) 
        REFERENCES custom_field_definition(field_id) 
        ON DELETE CASCADE,
    CONSTRAINT uq_custom_field_value_unique 
        UNIQUE (tenant_id, entity_type, entity_record_id, field_id)
);

-- ============================================================================
-- INDEXES: custom_field_value
-- ============================================================================

-- Index for tenant isolation
CREATE INDEX ix_custom_field_value_tenant 
    ON custom_field_value(tenant_id);

-- Index for entity record lookup (most common query pattern)
CREATE INDEX ix_custom_field_value_entity_record 
    ON custom_field_value(tenant_id, entity_type, entity_record_id);

-- Index for field definition lookup
CREATE INDEX ix_custom_field_value_field 
    ON custom_field_value(field_id);

-- Composite index for entity type + field queries
CREATE INDEX ix_custom_field_value_entity_field 
    ON custom_field_value(tenant_id, entity_type, field_id);

-- GIN index for JSONB value queries (enables efficient value searches)
CREATE INDEX ix_custom_field_value_value 
    ON custom_field_value USING GIN (value) 
    WHERE value IS NOT NULL;

-- Index for bulk operations (get all values for an entity record)
CREATE INDEX ix_custom_field_value_record_lookup 
    ON custom_field_value(entity_type, entity_record_id) 
    WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE custom_field_value IS 
    'Stores actual values for custom fields on entity records. Each row represents one custom field value for one entity record.';

COMMENT ON COLUMN custom_field_value.tenant_id IS 
    'Tenant ID for multi-tenant isolation.';

COMMENT ON COLUMN custom_field_value.entity_type IS 
    'Entity type this value belongs to (MATERIAL, WAREHOUSE, ORDER, etc.).';

COMMENT ON COLUMN custom_field_value.entity_record_id IS 
    'ID of the entity record this value belongs to. Example: If entity_type is MATERIAL, this is the Material''s ID.';

COMMENT ON COLUMN custom_field_value.field_id IS 
    'Reference to custom_field_definition.id. Links this value to its metadata definition.';

COMMENT ON COLUMN custom_field_value.value IS 
    'The actual field value stored as JSONB. Structure depends on the field''s data_type: STRING: string, NUMBER: number, BOOLEAN: boolean, DATE: ISO date string, DATETIME: ISO datetime string, ENUM: string (option code), LIST: array of strings (option codes), JSON: any JSON structure, MEDIA: string (file reference or UUID).';

COMMENT ON COLUMN custom_field_value.is_active IS 
    'Whether this field value is active. Inactive values are not shown in UI.';

COMMENT ON COLUMN custom_field_value.is_deleted IS 
    'Soft delete flag - marks entity as deleted without physical removal.';

COMMENT ON CONSTRAINT uq_custom_field_value_unique ON custom_field_value IS 
    'Ensures each entity record can have only one value per custom field. Prevents duplicate values for the same field on the same record.';

