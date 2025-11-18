package com.care.warehouse.web.dto.order;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;
import java.util.UUID;

/**
 * Response DTO for an order item.
 */
@Getter
@Builder
public class OrderItemResponse {

    private UUID id;
    private UUID orderId;
    private UUID materialId;
    private Double qtyRequested;
    private Double qtyApproved;
    private Double qtyFulfilled;
    private Double remainingQty;
    private Map<String, Object> customData;
}

