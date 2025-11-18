package com.care.warehouse.web.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Request DTO used to fulfill an order.
 */
@Getter
@Setter
public class FulfillOrderRequest {

    @NotNull(message = "{fulfillOrder.items.required}")
    @NotEmpty(message = "{fulfillOrder.items.notEmpty}")
    @Valid
    private List<FulfillOrderItemRequest> items;

    private Map<String, Object> fulfillmentData;
}

