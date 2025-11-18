-- Flyway migration: Create order_items table
-- Version: 1.9
-- Description: Creates order_items table for order line items

-- ============================================================================
-- TABLE: order_items
-- ============================================================================
CREATE TABLE order_items (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference to Order
    order_id UUID NOT NULL,
    
    -- Material Reference
    material_id UUID NOT NULL,
    
    -- Quantities
    qty_requested DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    qty_approved DOUBLE PRECISION,
    qty_fulfilled DOUBLE PRECISION DEFAULT 0.0,
    
    -- Custom Data
    custom_data JSONB,
    
    -- Constraints
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) 
        REFERENCES orders_master(id) ON DELETE CASCADE,
    CONSTRAINT chk_order_items_qty_requested_non_negative CHECK (qty_requested >= 0),
    CONSTRAINT chk_order_items_qty_approved_non_negative CHECK (qty_approved IS NULL OR qty_approved >= 0),
    CONSTRAINT chk_order_items_qty_fulfilled_non_negative CHECK (qty_fulfilled IS NULL OR qty_fulfilled >= 0),
    CONSTRAINT chk_order_items_qty_approved_not_exceed_requested CHECK (qty_approved IS NULL OR qty_approved <= qty_requested),
    CONSTRAINT chk_order_items_qty_fulfilled_not_exceed_approved CHECK (qty_fulfilled IS NULL OR qty_fulfilled <= qty_approved)
);

-- ============================================================================
-- INDEXES: order_items
-- ============================================================================

-- Index for order lookup
CREATE INDEX ix_order_items_order ON order_items(order_id);

-- Index for material lookup
CREATE INDEX ix_order_items_material ON order_items(material_id);

-- Composite index for order + material queries
CREATE INDEX ix_order_items_order_material ON order_items(order_id, material_id);

-- GIN index for JSONB custom_data queries
CREATE INDEX ix_order_items_custom_data ON order_items USING GIN (custom_data) 
    WHERE custom_data IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE order_items IS 'Line items for orders (consumption and replenishment)';
COMMENT ON COLUMN order_items.order_id IS 'Reference to orders_master.id';
COMMENT ON COLUMN order_items.material_id IS 'Reference to materials.id';
COMMENT ON COLUMN order_items.qty_requested IS 'Requested quantity';
COMMENT ON COLUMN order_items.qty_approved IS 'Approved quantity (may be less than requested)';
COMMENT ON COLUMN order_items.qty_fulfilled IS 'Fulfilled quantity (may be less than approved)';
COMMENT ON COLUMN order_items.custom_data IS 'JSONB field for custom item data';

