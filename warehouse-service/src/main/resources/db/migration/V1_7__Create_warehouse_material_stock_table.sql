-- Flyway migration: Create warehouse_material_stock table
-- Version: 1.7
-- Description: Creates warehouse_material_stock table for stock levels per warehouse per material

-- ============================================================================
-- TABLE: warehouse_material_stock
-- ============================================================================
CREATE TABLE warehouse_material_stock (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL,
    
    -- References
    material_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,
    
    -- Stock Levels
    stock_current DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    stock_reserved DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    reorder_level DOUBLE PRECISION,
    
    -- Optional Fields
    expiry_date TIMESTAMP,
    lot_number VARCHAR(100),
    bin_location_code VARCHAR(50),
    
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
    CONSTRAINT uq_warehouse_material_stock_unique UNIQUE (tenant_id, material_id, warehouse_id, lot_number),
    CONSTRAINT chk_warehouse_material_stock_current_non_negative CHECK (stock_current >= 0),
    CONSTRAINT chk_warehouse_material_stock_reserved_non_negative CHECK (stock_reserved >= 0),
    CONSTRAINT chk_warehouse_material_stock_reserved_not_exceed_current CHECK (stock_reserved <= stock_current)
);

-- ============================================================================
-- INDEXES: warehouse_material_stock
-- ============================================================================

-- Index for tenant isolation and soft delete filtering
CREATE INDEX ix_warehouse_material_stock_tenant_deleted ON warehouse_material_stock(tenant_id, is_deleted) 
    WHERE is_deleted = false;

-- Index for material lookup
CREATE INDEX ix_warehouse_material_stock_material ON warehouse_material_stock(material_id) 
    WHERE is_deleted = false;

-- Index for warehouse lookup
CREATE INDEX ix_warehouse_material_stock_warehouse ON warehouse_material_stock(warehouse_id) 
    WHERE is_deleted = false;

-- Composite index for material + warehouse queries
CREATE INDEX ix_warehouse_material_stock_material_warehouse ON warehouse_material_stock(material_id, warehouse_id) 
    WHERE is_deleted = false;

-- Composite index for tenant + material queries
CREATE INDEX ix_warehouse_material_stock_tenant_material ON warehouse_material_stock(tenant_id, material_id) 
    WHERE is_deleted = false;

-- Index for reorder level threshold checking
CREATE INDEX ix_warehouse_material_stock_reorder ON warehouse_material_stock(tenant_id, reorder_level) 
    WHERE reorder_level IS NOT NULL AND is_deleted = false;

-- Index for expiry date queries
CREATE INDEX ix_warehouse_material_stock_expiry ON warehouse_material_stock(expiry_date) 
    WHERE expiry_date IS NOT NULL AND is_deleted = false;

-- Index for lot number lookup
CREATE INDEX ix_warehouse_material_stock_lot ON warehouse_material_stock(lot_number) 
    WHERE lot_number IS NOT NULL AND is_deleted = false;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE warehouse_material_stock IS 'Stock levels for materials in warehouses';
COMMENT ON COLUMN warehouse_material_stock.tenant_id IS 'Tenant ID for multi-tenant isolation';
COMMENT ON COLUMN warehouse_material_stock.material_id IS 'Reference to materials.id';
COMMENT ON COLUMN warehouse_material_stock.warehouse_id IS 'Reference to warehouses.id';
COMMENT ON COLUMN warehouse_material_stock.stock_current IS 'Current available stock quantity';
COMMENT ON COLUMN warehouse_material_stock.stock_reserved IS 'Reserved stock quantity (allocated but not yet shipped)';
COMMENT ON COLUMN warehouse_material_stock.reorder_level IS 'Reorder level threshold. When stock_current falls below this, notification should be sent';
COMMENT ON COLUMN warehouse_material_stock.expiry_date IS 'Optional expiry date for the stock batch';
COMMENT ON COLUMN warehouse_material_stock.lot_number IS 'Optional lot/batch number';
COMMENT ON COLUMN warehouse_material_stock.bin_location_code IS 'Bin/shelf location code within the warehouse';

