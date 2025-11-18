package com.care.warehouse.web.dto.order;

import com.care.warehouse.domain.enums.OrderStatus;
import com.care.warehouse.domain.enums.OrderType;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Response DTO returned from API when an Order is retrieved.
 */
@Getter
@Builder
public class OrderResponse {

    private UUID id;
    private UUID tenantId;
    private OrderType type;
    private UUID warehouseId;
    private OrderStatus status;
    private List<OrderItemResponse> items;
    private String notes;
    private Map<String, Object> customData;
    
    // Calculated fields
    private Double totalQtyRequested;
    private Double totalQtyApproved;
    private Double totalQtyFulfilled;
    
    // Audit fields
    private Boolean isActive;
    private Boolean isDeleted;
    private UUID createdById;
    private Instant createdAt;
    private UUID updatedById;
    private Instant updatedAt;
    private UUID approvedById;
    private Instant approvedAt;
    private UUID fulfilledById;
    private Instant fulfilledAt;
    private Long rowVersion;
}

