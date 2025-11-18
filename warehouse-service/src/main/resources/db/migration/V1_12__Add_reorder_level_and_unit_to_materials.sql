-- Flyway migration: Add reorder_level and unit to materials table
-- Version: 1.12
-- Description: Adds reorder_level (INTEGER, optional) and unit (VARCHAR, optional)
--              fields to the materials table for inventory management

-- ============================================================================
-- ALTER TABLE: materials
-- ============================================================================

-- Add reorder_level column (optional, for inventory reorder threshold)
ALTER TABLE materials
    ADD COLUMN reorder_level INTEGER;

-- Add unit column (optional, for measurement unit like "KG", "PCS", "L", etc.)
ALTER TABLE materials
    ADD COLUMN unit VARCHAR(50);

-- ============================================================================
-- INDEXES: materials
-- ============================================================================

-- Index for reorder_level filtering (useful for finding items below reorder level)
CREATE INDEX ix_materials_reorder_level ON materials(reorder_level)
    WHERE reorder_level IS NOT NULL AND is_deleted = false;

-- Index for unit filtering (useful for filtering by unit type)
CREATE INDEX ix_materials_unit ON materials(unit)
    WHERE unit IS NOT NULL AND is_deleted = false;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN materials.reorder_level IS 'Minimum stock level threshold. When stock falls below this level, reorder should be triggered. Optional field for inventory management.';
COMMENT ON COLUMN materials.unit IS 'Unit of measurement for the material (e.g., "KG", "PCS", "L", "M", "BOX", "PACK"). Optional field for inventory tracking.';

