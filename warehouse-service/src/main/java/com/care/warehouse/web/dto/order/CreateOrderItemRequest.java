package com.care.warehouse.web.dto.order;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;
import java.util.UUID;

/**
 * Request DTO for creating an order item.
 */
@Getter
@Setter
public class CreateOrderItemRequest {

    @NotNull(message = "{orderItem.materialId.required}")
    private UUID materialId;

    @NotNull(message = "{orderItem.qtyRequested.required}")
    @Min(value = 0, message = "{orderItem.qtyRequested.min}")
    private Double qtyRequested;

    private Map<String, Object> customData;
}

