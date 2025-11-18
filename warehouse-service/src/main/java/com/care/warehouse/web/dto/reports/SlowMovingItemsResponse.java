package com.care.warehouse.web.dto.reports;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for slow moving items report.
 */
@Getter
@Builder
public class SlowMovingItemsResponse {
    private UUID materialId;
    private UUID warehouseId;
    private double currentStock;
    private Instant lastMovementDate;
    private int daysSinceLastMovement;
}

