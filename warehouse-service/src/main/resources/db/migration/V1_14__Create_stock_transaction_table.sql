-- Flyway migration: Create stock_transaction table
-- Version: 1.14
-- Description: Creates stock_transaction table for complete audit trail of all stock movements
--              Supports: Stock-IN, Stock-OUT, Stock-Transfer, Stock-Adjustment

-- ============================================================================
-- TABLE: stock_transaction
-- ============================================================================
CREATE TABLE stock_transaction (
    -- Primary Key
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL,
    
    -- References
    material_id UUID NOT NULL,
    
    -- Transaction Type
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')),
    
    -- Warehouse References
    source_warehouse_id UUID,  -- For OUT, TRANSFER, ADJUSTMENT (decrease)
    target_warehouse_id UUID,  -- For IN, TRANSFER, ADJUSTMENT (increase)
    
    -- Transaction Details
    quantity DECIMAL(18, 4) NOT NULL CHECK (quantity > 0),
    
    -- Reason/Classification
    reason VARCHAR(50),  -- e.g., 'PURCHASE', 'SALE', 'CONSUMPTION', 'DONATION', 'RETURN', 'PRODUCTION', 'DISPOSAL', 'LENDING', 'CORRECTION'
    
    -- Reference Information
    reference_document VARCHAR(255),  -- Optional: PO number, invoice, order ID, etc.
    notes TEXT,  -- Optional: Additional notes about the transaction
    
    -- Audit Fields
    created_by_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_stock_transaction_warehouse_logic CHECK (
        -- For IN: only target_warehouse_id required
        (transaction_type = 'IN' AND target_warehouse_id IS NOT NULL AND source_warehouse_id IS NULL) OR
        -- For OUT: only source_warehouse_id required
        (transaction_type = 'OUT' AND source_warehouse_id IS NOT NULL AND target_warehouse_id IS NULL) OR
        -- For TRANSFER: both required
        (transaction_type = 'TRANSFER' AND source_warehouse_id IS NOT NULL AND target_warehouse_id IS NOT NULL AND source_warehouse_id != target_warehouse_id) OR
        -- For ADJUSTMENT: at least one required
        (transaction_type = 'ADJUSTMENT' AND (source_warehouse_id IS NOT NULL OR target_warehouse_id IS NOT NULL))
    )
);

-- ============================================================================
-- INDEXES: stock_transaction
-- ============================================================================

-- Index for tenant isolation (most common query pattern)
CREATE INDEX ix_stock_transaction_tenant ON stock_transaction(tenant_id);

-- Index for material lookup
CREATE INDEX ix_stock_transaction_material ON stock_transaction(material_id);

-- Index for transaction type filtering
CREATE INDEX ix_stock_transaction_type ON stock_transaction(transaction_type);

-- Index for warehouse queries (source)
CREATE INDEX ix_stock_transaction_source_warehouse ON stock_transaction(source_warehouse_id)
    WHERE source_warehouse_id IS NOT NULL;

-- Index for warehouse queries (target)
CREATE INDEX ix_stock_transaction_target_warehouse ON stock_transaction(target_warehouse_id)
    WHERE target_warehouse_id IS NOT NULL;

-- Composite index for material + warehouse queries
CREATE INDEX ix_stock_transaction_material_source ON stock_transaction(material_id, source_warehouse_id)
    WHERE source_warehouse_id IS NOT NULL;

CREATE INDEX ix_stock_transaction_material_target ON stock_transaction(material_id, target_warehouse_id)
    WHERE target_warehouse_id IS NOT NULL;

-- Index for date range queries
CREATE INDEX ix_stock_transaction_created_at ON stock_transaction(created_at DESC);

-- Composite index for tenant + date queries
CREATE INDEX ix_stock_transaction_tenant_date ON stock_transaction(tenant_id, created_at DESC);

-- Index for reference document lookup
CREATE INDEX ix_stock_transaction_reference ON stock_transaction(reference_document)
    WHERE reference_document IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE stock_transaction IS 'Complete audit trail of all stock movements. Every stock change is recorded here.';
COMMENT ON COLUMN stock_transaction.transaction_id IS 'Unique identifier for the transaction';
COMMENT ON COLUMN stock_transaction.tenant_id IS 'Tenant ID for multi-tenant isolation';
COMMENT ON COLUMN stock_transaction.material_id IS 'Reference to materials.id';
COMMENT ON COLUMN stock_transaction.transaction_type IS 'Type of transaction: IN (stock increase), OUT (stock decrease), TRANSFER (warehouse to warehouse), ADJUSTMENT (inventory correction)';
COMMENT ON COLUMN stock_transaction.source_warehouse_id IS 'Source warehouse for OUT, TRANSFER, or ADJUSTMENT (decrease) operations';
COMMENT ON COLUMN stock_transaction.target_warehouse_id IS 'Target warehouse for IN, TRANSFER, or ADJUSTMENT (increase) operations';
COMMENT ON COLUMN stock_transaction.quantity IS 'Quantity involved in the transaction (always positive)';
COMMENT ON COLUMN stock_transaction.reason IS 'Reason/classification for the transaction (e.g., PURCHASE, SALE, CONSUMPTION, DONATION, RETURN, PRODUCTION, DISPOSAL, LENDING, CORRECTION)';
COMMENT ON COLUMN stock_transaction.reference_document IS 'Optional reference to external document (PO number, invoice, order ID, etc.)';
COMMENT ON COLUMN stock_transaction.notes IS 'Optional additional notes about the transaction';
COMMENT ON COLUMN stock_transaction.created_by_id IS 'User ID who created the transaction';
COMMENT ON COLUMN stock_transaction.created_at IS 'Timestamp when the transaction was created';

-- ============================================================================
-- EXAMPLE DATA STRUCTURE
-- ============================================================================
-- Stock-IN (Purchase):
--   transaction_type: 'IN'
--   target_warehouse_id: <warehouse-uuid>
--   quantity: 100.0
--   reason: 'PURCHASE'
--   reference_document: 'PO-2025-001'
--
-- Stock-OUT (Sale):
--   transaction_type: 'OUT'
--   source_warehouse_id: <warehouse-uuid>
--   quantity: 50.0
--   reason: 'SALE'
--   reference_document: 'INV-2025-001'
--
-- Stock-Transfer:
--   transaction_type: 'TRANSFER'
--   source_warehouse_id: <warehouse-a-uuid>
--   target_warehouse_id: <warehouse-b-uuid>
--   quantity: 25.0
--   reason: 'TRANSFER'
--
-- Stock-Adjustment:
--   transaction_type: 'ADJUSTMENT'
--   source_warehouse_id: <warehouse-uuid>  (if decrease)
--   target_warehouse_id: <warehouse-uuid>  (if increase)
--   quantity: 5.0
--   reason: 'CORRECTION'

