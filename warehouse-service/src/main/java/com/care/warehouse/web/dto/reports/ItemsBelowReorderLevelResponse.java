package com.care.warehouse.web.dto.reports;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

/**
 * Response DTO for items below reorder level report.
 */
@Getter
@Builder
public class ItemsBelowReorderLevelResponse {
    private UUID materialId;
    private UUID warehouseId;
    private Double currentStock;
    private Double reorderLevel;
    private Double shortage;
}

