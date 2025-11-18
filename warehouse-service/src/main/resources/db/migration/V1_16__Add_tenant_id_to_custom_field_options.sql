-- Flyway migration: Add tenant_id to custom_field_options table
-- Version: 1.16
-- Description: Adds tenant_id column to custom_field_options table for multi-tenant support

-- ============================================================================
-- ALTER TABLE: Add tenant_id column
-- ============================================================================

-- Check if column doesn't exist before adding (for safety)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'custom_field_options' 
        AND column_name = 'tenant_id'
    ) THEN
        -- Add tenant_id column as nullable first
        ALTER TABLE custom_field_options 
        ADD COLUMN tenant_id UUID;
        
        -- Update existing rows with a default tenant ID (you may need to adjust this)
        -- For now, using a placeholder UUID - you should update this based on your actual tenant data
        -- Try to get tenant_id from custom_field_definition (new table)
        UPDATE custom_field_options 
        SET tenant_id = (
            SELECT tenant_id 
            FROM custom_field_definition 
            WHERE custom_field_definition.field_id = custom_field_options.definition_id 
            LIMIT 1
        )
        WHERE tenant_id IS NULL;
        
        -- If still null, try custom_field_definitions (old table)
        UPDATE custom_field_options 
        SET tenant_id = (
            SELECT tenant_id 
            FROM custom_field_definitions 
            WHERE custom_field_definitions.id = custom_field_options.definition_id 
            LIMIT 1
        )
        WHERE tenant_id IS NULL;
        
        -- If still null (no matching definition), set to a default
        -- WARNING: This is a temporary fix - you should review and update these rows manually
        UPDATE custom_field_options 
        SET tenant_id = '00000000-0000-0000-0000-000000000000'::UUID
        WHERE tenant_id IS NULL;
        
        -- Now make it NOT NULL
        ALTER TABLE custom_field_options 
        ALTER COLUMN tenant_id SET NOT NULL;
        
        -- Add index for tenant isolation
        CREATE INDEX IF NOT EXISTS ix_custom_field_options_tenant 
        ON custom_field_options(tenant_id) 
        WHERE is_deleted = false;
        
        -- Add comment
        COMMENT ON COLUMN custom_field_options.tenant_id IS 'Tenant ID for multi-tenant isolation.';
    END IF;
END $$;

