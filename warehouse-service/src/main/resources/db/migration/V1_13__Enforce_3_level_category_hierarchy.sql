-- Flyway migration: Enforce 3-level category hierarchy constraint
-- Version: 1.13
-- Description: Adds CHECK constraint to enforce maximum 3 levels in category hierarchy
--              (category → subcategory → itemCategory)
--              Also updates application-level validation in CategoryServiceImpl

-- ============================================================================
-- ALTER TABLE: categories
-- ============================================================================

-- Add CHECK constraint to enforce maximum level of 2 (0, 1, 2 = 3 levels total)
-- Level 0 = root category (category)
-- Level 1 = subcategory
-- Level 2 = itemCategory
ALTER TABLE categories
    ADD CONSTRAINT chk_categories_max_level CHECK (level <= 2);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON CONSTRAINT chk_categories_max_level ON categories IS 'Enforces maximum 3-level hierarchy: level 0 (category), level 1 (subcategory), level 2 (itemCategory). Prevents deeper nesting.';

-- ============================================================================
-- VALIDATION NOTE
-- ============================================================================
-- Application-level validation should also be updated in CategoryServiceImpl
-- to prevent creating categories beyond level 2 and provide user-friendly error messages.
-- 
-- Note: This constraint will prevent INSERT/UPDATE operations that would create
-- categories with level > 2. Existing categories with level > 2 will need to be
-- migrated before applying this constraint.

