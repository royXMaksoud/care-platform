package com.care.warehouse.web.dto.warehousematerialstock;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO returned from API when stock information is retrieved.
 */
@Getter
@Builder
public class WarehouseMaterialStockResponse {

    private UUID id;
    private UUID tenantId;
    private UUID materialId;
    private UUID warehouseId;
    private Double stockCurrent;
    private Double stockReserved;
    private Double availableStock; // Calculated: current - reserved
    private Double reorderLevel;
    private Boolean isBelowReorderLevel; // Calculated
    private Instant expiryDate;
    private String lotNumber;
    private String binLocationCode;
    
    // Audit fields
    private Boolean isActive;
    private Boolean isDeleted;
    private UUID createdById;
    private Instant createdAt;
    private UUID updatedById;
    private Instant updatedAt;
    private Long rowVersion;
}

