package com.care.warehouse.web.dto.order;

import com.care.warehouse.domain.enums.OrderType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Request DTO used to create a new Order.
 */
@Getter
@Setter
public class CreateOrderRequest {

    @NotNull(message = "{order.type.required}")
    private OrderType type;

    @NotNull(message = "{order.warehouseId.required}")
    private UUID warehouseId;

    @NotNull(message = "{order.items.required}")
    @NotEmpty(message = "{order.items.notEmpty}")
    @Valid
    private List<CreateOrderItemRequest> items;

    private String notes;

    private Map<String, Object> customData;
}

