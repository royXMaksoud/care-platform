-- Flyway migration: Add multilingual fields to warehouses table
-- Version: 1.1
-- Description: Adds JSONB columns for name_translations and description_translations
--              to support multilingual warehouse names and descriptions

-- ============================================================================
-- ALTER TABLE: warehouses
-- ============================================================================

-- Add name_translations JSONB column
-- Structure: { "en": "Main Warehouse", "ar": "المستودع الرئيسي", "fr": "Entrepôt Principal" }
ALTER TABLE warehouses 
ADD COLUMN IF NOT EXISTS name_translations JSONB;

-- Add description_translations JSONB column
-- Structure: { "en": "Primary distribution center", "ar": "مركز التوزيع الرئيسي", "fr": "Centre de distribution principal" }
ALTER TABLE warehouses 
ADD COLUMN IF NOT EXISTS description_translations JSONB;

-- Add index for JSONB queries on name_translations
CREATE INDEX IF NOT EXISTS ix_warehouses_name_translations 
ON warehouses USING GIN (name_translations) 
WHERE name_translations IS NOT NULL;

-- Add index for JSONB queries on description_translations
CREATE INDEX IF NOT EXISTS ix_warehouses_description_translations 
ON warehouses USING GIN (description_translations) 
WHERE description_translations IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN warehouses.name_translations IS 'JSONB field storing multilingual warehouse names. Structure: {"en": "Main Warehouse", "ar": "المستودع الرئيسي"}';
COMMENT ON COLUMN warehouses.description_translations IS 'JSONB field storing multilingual warehouse descriptions. Structure: {"en": "Primary distribution center", "ar": "مركز التوزيع الرئيسي"}';

-- ============================================================================
-- EXAMPLE DATA STRUCTURE
-- ============================================================================
-- name_translations: {
--   "en": "Main Warehouse",
--   "ar": "المستودع الرئيسي",
--   "fr": "Entrepôt Principal",
--   "de": "Hauptlager"
-- }
--
-- description_translations: {
--   "en": "Primary distribution center for the region",
--   "ar": "مركز التوزيع الرئيسي للمنطقة",
--   "fr": "Centre de distribution principal pour la région"
-- }

