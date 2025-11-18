-- Flyway migration: Create orders_master table
-- Version: 1.8
-- Description: Creates orders_master table for consumption and replenishment orders

-- ============================================================================
-- TABLE: orders_master
-- ============================================================================
CREATE TABLE orders_master (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant isolation
    tenant_id UUID NOT NULL,
    
    -- Order Type
    type VARCHAR(20) NOT NULL CHECK (type IN ('CONSUMPTION', 'REPLENISHMENT')),
    
    -- References
    warehouse_id UUID NOT NULL,
    
    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'APPROVED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED')),
    
    -- Order Details
    notes TEXT,
    custom_data JSONB,
    
    -- Soft Delete & Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Fields
    created_by_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_id UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by_id UUID,
    approved_at TIMESTAMP,
    fulfilled_by_id UUID,
    fulfilled_at TIMESTAMP,
    
    -- Optimistic Locking
    row_version BIGINT NOT NULL DEFAULT 0
);

-- ============================================================================
-- INDEXES: orders_master
-- ============================================================================

-- Index for tenant isolation and soft delete filtering
CREATE INDEX ix_orders_master_tenant_deleted ON orders_master(tenant_id, is_deleted) 
    WHERE is_deleted = false;

-- Index for warehouse lookup
CREATE INDEX ix_orders_master_warehouse ON orders_master(warehouse_id) 
    WHERE is_deleted = false;

-- Index for status filtering
CREATE INDEX ix_orders_master_status ON orders_master(status) 
    WHERE is_deleted = false;

-- Composite index for tenant + type + status queries
CREATE INDEX ix_orders_master_tenant_type_status ON orders_master(tenant_id, type, status) 
    WHERE is_deleted = false;

-- Index for date range queries
CREATE INDEX ix_orders_master_created_at ON orders_master(created_at) 
    WHERE is_deleted = false;

-- GIN index for JSONB custom_data queries
CREATE INDEX ix_orders_master_custom_data ON orders_master USING GIN (custom_data) 
    WHERE custom_data IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE orders_master IS 'Master table for consumption and replenishment orders';
COMMENT ON COLUMN orders_master.tenant_id IS 'Tenant ID for multi-tenant isolation';
COMMENT ON COLUMN orders_master.type IS 'Order type: CONSUMPTION (reduces stock) or REPLENISHMENT (increases stock)';
COMMENT ON COLUMN orders_master.warehouse_id IS 'Reference to warehouses.id';
COMMENT ON COLUMN orders_master.status IS 'Order status: PENDING, APPROVED, PARTIALLY_FULFILLED, FULFILLED, CANCELLED';
COMMENT ON COLUMN orders_master.notes IS 'Notes or comments about the order';
COMMENT ON COLUMN orders_master.custom_data IS 'JSONB field for custom order data';

