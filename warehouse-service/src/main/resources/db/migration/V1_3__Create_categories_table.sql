-- Flyway migration: Create categories table
-- Version: 1.3
-- Description: Creates categories table with full support for
--              multi-tenant, multilingual fields (JSONB), recursive parent-child structure,
--              level tracking, and path tracking

-- ============================================================================
-- TABLE: categories
-- ============================================================================
CREATE TABLE categories (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL,
    
    -- Multilingual Fields (JSONB)
    name_translations JSONB NOT NULL,
    
    -- Hierarchy Fields
    parent_id UUID,  -- Nullable for root categories
    
    -- Tree Structure Fields
    level INTEGER NOT NULL DEFAULT 0,  -- Depth in tree (0 = root)
    path TEXT,  -- Full path from root (e.g., "/root-id/child-id/grandchild-id")
    
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
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) 
        REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT chk_categories_level_non_negative CHECK (level >= 0),
    CONSTRAINT chk_categories_root_level CHECK (
        (parent_id IS NULL AND level = 0) OR 
        (parent_id IS NOT NULL AND level > 0)
    )
);

-- ============================================================================
-- INDEXES: categories
-- ============================================================================

-- Index for tenant isolation and soft delete filtering (most common query pattern)
CREATE INDEX ix_categories_tenant_deleted ON categories(tenant_id, is_deleted) 
    WHERE is_deleted = false;

-- Index for parent-child relationships
CREATE INDEX ix_categories_parent ON categories(parent_id) 
    WHERE parent_id IS NOT NULL AND is_deleted = false;

-- Index for root categories (parent_id IS NULL)
CREATE INDEX ix_categories_root ON categories(tenant_id, parent_id) 
    WHERE parent_id IS NULL AND is_deleted = false;

-- Index for level filtering
CREATE INDEX ix_categories_level ON categories(level) 
    WHERE is_deleted = false;

-- Index for path queries (for tree traversal)
CREATE INDEX ix_categories_path ON categories(path) 
    WHERE path IS NOT NULL AND is_deleted = false;

-- GIN index for JSONB name_translations queries
CREATE INDEX ix_categories_name_translations ON categories USING GIN (name_translations) 
    WHERE name_translations IS NOT NULL;

-- Composite index for tenant + parent queries
CREATE INDEX ix_categories_tenant_parent ON categories(tenant_id, parent_id) 
    WHERE is_deleted = false;

-- ============================================================================
-- FUNCTION: Update category path and level
-- ============================================================================
-- This function calculates the path and level for a category based on its parent.
-- It should be called via triggers or application logic.

CREATE OR REPLACE FUNCTION update_category_path_and_level()
RETURNS TRIGGER AS $$
DECLARE
    parent_path TEXT;
    parent_level INTEGER;
BEGIN
    -- If parent_id is NULL, this is a root category
    IF NEW.parent_id IS NULL THEN
        NEW.level := 0;
        NEW.path := '/' || NEW.id::TEXT;
    ELSE
        -- Get parent's path and level
        SELECT path, level INTO parent_path, parent_level
        FROM categories
        WHERE id = NEW.parent_id AND is_deleted = false;
        
        -- If parent not found, set as root
        IF parent_path IS NULL THEN
            NEW.level := 0;
            NEW.path := '/' || NEW.id::TEXT;
        ELSE
            -- Calculate new level and path
            NEW.level := parent_level + 1;
            NEW.path := parent_path || '/' || NEW.id::TEXT;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-update path and level on insert/update
-- ============================================================================
CREATE TRIGGER trg_categories_update_path_level
    BEFORE INSERT OR UPDATE OF parent_id ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_category_path_and_level();

-- ============================================================================
-- FUNCTION: Update descendants' paths when parent path changes
-- ============================================================================
-- This function updates all descendants' paths when a category's path changes.
-- It should be called when a category's parent changes.

CREATE OR REPLACE FUNCTION update_descendant_paths()
RETURNS TRIGGER AS $$
DECLARE
    old_path_prefix TEXT;
    new_path_prefix TEXT;
    path_difference TEXT;
BEGIN
    -- Only update if path actually changed
    IF OLD.path IS DISTINCT FROM NEW.path THEN
        old_path_prefix := OLD.path || '/';
        new_path_prefix := NEW.path || '/';
        
        -- Update all descendants' paths
        UPDATE categories
        SET path = REPLACE(path, old_path_prefix, new_path_prefix),
            level = level + (NEW.level - OLD.level)
        WHERE path LIKE old_path_prefix || '%'
          AND is_deleted = false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-update descendant paths when parent path changes
-- ============================================================================
CREATE TRIGGER trg_categories_update_descendant_paths
    AFTER UPDATE OF path ON categories
    FOR EACH ROW
    WHEN (OLD.path IS DISTINCT FROM NEW.path)
    EXECUTE FUNCTION update_descendant_paths();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE categories IS 'Categories table with hierarchical tree structure support';
COMMENT ON COLUMN categories.tenant_id IS 'Tenant ID for multi-tenant isolation';
COMMENT ON COLUMN categories.name_translations IS 'JSONB field storing multilingual category names. Structure: {"en": "Category Name", "ar": "اسم الفئة"}';
COMMENT ON COLUMN categories.parent_id IS 'Parent category ID (NULL for root categories)';
COMMENT ON COLUMN categories.level IS 'Depth in tree hierarchy (0 = root, 1 = first level, etc.)';
COMMENT ON COLUMN categories.path IS 'Full path from root to this category. Format: "/root-id/child-id/grandchild-id"';
COMMENT ON FUNCTION update_category_path_and_level() IS 'Automatically calculates and sets category path and level based on parent';
COMMENT ON FUNCTION update_descendant_paths() IS 'Updates all descendant paths when a category path changes';

-- ============================================================================
-- EXAMPLE DATA STRUCTURE
-- ============================================================================
-- name_translations: {
--   "en": "Electronics",
--   "ar": "إلكترونيات",
--   "fr": "Électronique"
-- }
--
-- Example tree structure:
-- Root: /uuid-1 (level 0)
--   Child: /uuid-1/uuid-2 (level 1)
--     Grandchild: /uuid-1/uuid-2/uuid-3 (level 2)

