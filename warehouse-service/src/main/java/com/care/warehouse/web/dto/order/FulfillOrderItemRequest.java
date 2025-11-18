package com.care.warehouse.web.dto.order;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/**
 * Request DTO for fulfilling an order item.
 */
@Getter
@Setter
public class FulfillOrderItemRequest {

    @NotNull(message = "{fulfillOrderItem.itemId.required}")
    private UUID itemId;

    @NotNull(message = "{fulfillOrderItem.qtyFulfilled.required}")
    @Min(value = 0, message = "{fulfillOrderItem.qtyFulfilled.min}")
    private Double qtyFulfilled;
}

