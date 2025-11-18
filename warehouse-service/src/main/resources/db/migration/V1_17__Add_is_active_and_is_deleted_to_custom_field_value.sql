-- Flyway migration: Add is_active and is_deleted to custom_field_value table
-- Version: 1.17
-- Description: Adds is_active and is_deleted columns to custom_field_value table for soft delete and status management

-- ============================================================================
-- ALTER TABLE: Add is_active and is_deleted columns
-- ============================================================================

DO $$
BEGIN
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'custom_field_value' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE custom_field_value 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        
        COMMENT ON COLUMN custom_field_value.is_active IS 
            'Whether this field value is active. Inactive values are not shown in UI.';
    END IF;
    
    -- Add is_deleted column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'custom_field_value' 
        AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE custom_field_value 
        ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false;
        
        COMMENT ON COLUMN custom_field_value.is_deleted IS 
            'Soft delete flag - marks entity as deleted without physical removal.';
    END IF;
END $$;

