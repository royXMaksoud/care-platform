-- ============================================================================
-- Warehouse Service - Core Schema
-- Created: 2025-11-18
-- Phase 1: Warehouse, Zone, Bin Management
-- ============================================================================

-- ============================================================================
-- WAREHOUSES TABLE
-- ============================================================================
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, MAINTENANCE
    capacity_cubic_meters NUMERIC(10, 2) NOT NULL,
    current_occupancy_cubic_meters NUMERIC(10, 2) DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    row_version INTEGER DEFAULT 0,

    CONSTRAINT chk_warehouse_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
    CONSTRAINT chk_warehouse_capacity CHECK (capacity_cubic_meters > 0),
    CONSTRAINT chk_warehouse_occupancy CHECK (current_occupancy_cubic_meters >= 0)
);

CREATE INDEX idx_warehouse_tenant_code ON warehouses(tenant_id, code) WHERE is_deleted = FALSE;
CREATE INDEX idx_warehouse_tenant_status ON warehouses(tenant_id, status) WHERE is_deleted = FALSE;
CREATE INDEX idx_warehouse_is_primary ON warehouses(tenant_id, is_primary) WHERE is_deleted = FALSE;

-- ============================================================================
-- ZONES TABLE
-- ============================================================================
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(20) NOT NULL, -- RECEIVING, STORAGE, PICKING, PACKING, SHIPPING
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, MAINTENANCE
    capacity_cubic_meters NUMERIC(10, 2) NOT NULL,
    current_occupancy_cubic_meters NUMERIC(10, 2) DEFAULT 0,
    temperature_controlled BOOLEAN DEFAULT FALSE,
    temperature_min NUMERIC(5, 2),
    temperature_max NUMERIC(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    row_version INTEGER DEFAULT 0,

    CONSTRAINT chk_zone_type CHECK (zone_type IN ('RECEIVING', 'STORAGE', 'PICKING', 'PACKING', 'SHIPPING')),
    CONSTRAINT chk_zone_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
    CONSTRAINT chk_zone_capacity CHECK (capacity_cubic_meters > 0),
    CONSTRAINT chk_zone_occupancy CHECK (current_occupancy_cubic_meters >= 0),
    CONSTRAINT chk_zone_temperature CHECK (temperature_controlled = FALSE OR (temperature_min IS NOT NULL AND temperature_max IS NOT NULL)),
    UNIQUE(warehouse_id, code)
);

CREATE INDEX idx_zone_warehouse_code ON zones(warehouse_id, code) WHERE is_deleted = FALSE;
CREATE INDEX idx_zone_warehouse_type ON zones(warehouse_id, zone_type) WHERE is_deleted = FALSE;
CREATE INDEX idx_zone_warehouse_status ON zones(warehouse_id, status) WHERE is_deleted = FALSE;

-- ============================================================================
-- BINS TABLE
-- ============================================================================
CREATE TABLE bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    bin_type VARCHAR(20) NOT NULL, -- PALLET, SHELF, RACK, CAGE, DRAWER
    status VARCHAR(20) DEFAULT 'AVAILABLE', -- AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE
    max_weight_kg NUMERIC(10, 2),
    current_weight_kg NUMERIC(10, 2) DEFAULT 0,
    capacity_cubic_meters NUMERIC(10, 2) NOT NULL,
    current_occupancy_cubic_meters NUMERIC(10, 2) DEFAULT 0,
    aisle_number INTEGER,
    shelf_number INTEGER,
    level_number INTEGER,
    barcode VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    row_version INTEGER DEFAULT 0,

    CONSTRAINT chk_bin_type CHECK (bin_type IN ('PALLET', 'SHELF', 'RACK', 'CAGE', 'DRAWER')),
    CONSTRAINT chk_bin_status CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE')),
    CONSTRAINT chk_bin_capacity CHECK (capacity_cubic_meters > 0),
    CONSTRAINT chk_bin_occupancy CHECK (current_occupancy_cubic_meters >= 0),
    CONSTRAINT chk_bin_weight CHECK (max_weight_kg IS NULL OR max_weight_kg > 0),
    UNIQUE(zone_id, code),
    UNIQUE(barcode)
);

CREATE INDEX idx_bin_zone_code ON bins(zone_id, code) WHERE is_deleted = FALSE;
CREATE INDEX idx_bin_zone_status ON bins(zone_id, status) WHERE is_deleted = FALSE;
CREATE INDEX idx_bin_barcode ON bins(barcode) WHERE is_deleted = FALSE;
CREATE INDEX idx_bin_location ON bins(aisle_number, shelf_number, level_number) WHERE is_deleted = FALSE;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE warehouses IS 'المستودعات - تخزين بيانات المستودعات الرئيسية';
COMMENT ON TABLE zones IS 'المناطق - تقسيمات المستودع (استقبال، تخزين، إلخ)';
COMMENT ON TABLE bins IS 'الأرفف/الحاويات - وحدات التخزين الفردية';

COMMENT ON COLUMN zones.zone_type IS 'نوع المنطقة: RECEIVING (استقبال)، STORAGE (تخزين)، PICKING (انتقاء)، PACKING (تعبئة)، SHIPPING (شحن)';
COMMENT ON COLUMN bins.bin_type IS 'نوع الرف: PALLET (منصة)، SHELF (رف)، RACK (رف معدني)، CAGE (قفص)، DRAWER (درج)';
