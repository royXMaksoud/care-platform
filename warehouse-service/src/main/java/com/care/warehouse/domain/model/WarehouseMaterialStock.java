package com.care.warehouse.domain.model;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain model for WarehouseMaterialStock aggregate.
 * 
 * This represents stock levels for a material in a specific warehouse.
 * 
 * Features:
 * - Multi-tenant support (tenantId)
 * - Material and warehouse references
 * - Current stock and reserved stock tracking
 * - Reorder level threshold
 * - Optional expiry date and lot number
 * - Bin location code
 * - Soft delete and audit fields
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WarehouseMaterialStock {
    
    /** Unique identifier for the stock record */
    private UUID id;
    
    /** Tenant ID for multi-tenant isolation */
    private UUID tenantId;
    
    /**
     * Reference to the material
     */
    private UUID materialId;
    
    /**
     * Reference to the warehouse
     */
    private UUID warehouseId;
    
    /**
     * Current available stock quantity
     */
    private Double stockCurrent;
    
    /**
     * Reserved stock quantity (allocated but not yet shipped)
     */
    private Double stockReserved;
    
    /**
     * Reorder level threshold.
     * When stock_current falls below this, notification should be sent.
     */
    private Double reorderLevel;
    
    /**
     * Optional expiry date for the stock batch
     */
    private Instant expiryDate;
    
    /**
     * Optional lot/batch number
     */
    private String lotNumber;
    
    /**
     * Bin/shelf location code within the warehouse
     */
    private String binLocationCode;
    
    /** Active/Deleted flags */
    @Builder.Default
    private Boolean isActive = Boolean.TRUE;
    
    @Builder.Default
    private Boolean isDeleted = Boolean.FALSE;
    
    /** Audit fields */
    private UUID createdById;
    private Instant createdAt;
    
    private UUID updatedById;
    private Instant updatedAt;
    
    /** Optimistic locking */
    private Long rowVersion;
    
    /**
     * Calculate available stock (current - reserved)
     */
    public Double getAvailableStock() {
        if (stockCurrent == null) return 0.0;
        if (stockReserved == null) return stockCurrent;
        return Math.max(0.0, stockCurrent - stockReserved);
    }
    
    /**
     * Check if stock is below reorder level
     */
    public boolean isBelowReorderLevel() {
        if (reorderLevel == null || stockCurrent == null) {
            return false;
        }
        return stockCurrent < reorderLevel;
    }
}

