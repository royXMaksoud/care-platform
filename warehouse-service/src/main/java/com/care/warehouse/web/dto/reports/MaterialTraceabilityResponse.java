package com.care.warehouse.web.dto.reports;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

/**
 * Response DTO for material traceability report.
 */
@Getter
@Builder
public class MaterialTraceabilityResponse {
    private UUID materialId;
    private UUID warehouseId;
    private List<OrderHistoryItem> orderHistory;
    private List<StockMovementItem> stockMovements;
    
    @Getter
    @Builder
    public static class OrderHistoryItem {
        private UUID orderId;
        private String orderType;
        private String status;
        private Double quantity;
        private java.time.Instant date;
    }
    
    @Getter
    @Builder
    public static class StockMovementItem {
        private String movementType;
        private Double quantity;
        private java.time.Instant date;
        private String reference;
    }
}

