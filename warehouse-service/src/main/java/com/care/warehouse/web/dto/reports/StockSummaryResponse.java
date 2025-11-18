package com.care.warehouse.web.dto.reports;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

/**
 * Response DTO for stock summary report.
 */
@Getter
@Builder
public class StockSummaryResponse {
    private UUID warehouseId;
    private int totalItems;
    private double totalValue;
    private int itemsBelowReorderLevel;
}

