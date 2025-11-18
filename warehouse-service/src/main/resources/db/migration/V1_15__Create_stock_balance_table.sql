-- Flyway migration: Create stock_balance table
-- Version: 1.15
-- Description: Creates stock_balance table for current stock levels per warehouse per material
--              This is a materialized view-like table that is updated by stock transactions
--              PRIMARY KEY: (warehouse_id, material_id)

-- ============================================================================
-- TABLE: stock_balance
-- ============================================================================
CREATE TABLE stock_balance (
    -- Composite Primary Key
    warehouse_id UUID NOT NULL,
    material_id UUID NOT NULL,
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL,
    
    -- Current Balance
    quantity DECIMAL(18, 4) NOT NULL DEFAULT 0.0 CHECK (quantity >= 0),
    
    -- Last Transaction Reference (for audit trail)
    last_transaction_id UUID,  -- Reference to stock_transaction.transaction_id
    
    -- Audit Fields
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_id UUID,
    
    -- Primary Key Constraint
    CONSTRAINT pk_stock_balance PRIMARY KEY (warehouse_id, material_id)
);

-- ============================================================================
-- INDEXES: stock_balance
-- ============================================================================

-- Index for tenant isolation
CREATE INDEX ix_stock_balance_tenant ON stock_balance(tenant_id);

-- Index for material lookup
CREATE INDEX ix_stock_balance_material ON stock_balance(material_id);

-- Index for warehouse lookup
CREATE INDEX ix_stock_balance_warehouse ON stock_balance(warehouse_id);

-- Composite index for tenant + material queries
CREATE INDEX ix_stock_balance_tenant_material ON stock_balance(tenant_id, material_id);

-- Composite index for tenant + warehouse queries
CREATE INDEX ix_stock_balance_tenant_warehouse ON stock_balance(tenant_id, warehouse_id);

-- Index for low stock queries (quantity = 0 or below threshold)
CREATE INDEX ix_stock_balance_quantity ON stock_balance(quantity)
    WHERE quantity <= 0;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE stock_balance IS 'Current stock balance per warehouse per material. Updated atomically with stock transactions.';
COMMENT ON COLUMN stock_balance.warehouse_id IS 'Reference to warehouses.id (part of primary key)';
COMMENT ON COLUMN stock_balance.material_id IS 'Reference to materials.id (part of primary key)';
COMMENT ON COLUMN stock_balance.tenant_id IS 'Tenant ID for multi-tenant isolation';
COMMENT ON COLUMN stock_balance.quantity IS 'Current available stock quantity (always >= 0)';
COMMENT ON COLUMN stock_balance.last_transaction_id IS 'Reference to the last stock_transaction that updated this balance';
COMMENT ON COLUMN stock_balance.updated_at IS 'Timestamp when the balance was last updated';
COMMENT ON COLUMN stock_balance.updated_by_id IS 'User ID who last updated the balance';

-- ============================================================================
-- NOTE: Balance Maintenance
-- ============================================================================
-- The stock_balance table is maintained by the application layer (StockService).
-- When a stock transaction is created:
-- 1. Insert/update stock_transaction record
-- 2. Atomically update stock_balance:
--    - For IN: increment target_warehouse quantity
--    - For OUT: decrement source_warehouse quantity (with validation)
--    - For TRANSFER: decrement source + increment target (atomic)
--    - For ADJUSTMENT: adjust quantity based on source/target
--
-- This ensures data consistency and provides fast balance queries without
-- aggregating all transactions.

