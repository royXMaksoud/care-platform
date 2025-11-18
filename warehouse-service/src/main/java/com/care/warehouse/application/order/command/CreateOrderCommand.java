package com.care.warehouse.application.order.command;

import com.care.warehouse.domain.enums.OrderType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Command object used to create a new Order.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderCommand {
    
    private OrderType type;
    private UUID warehouseId;
    private List<CreateOrderItemCommand> items;
    private String notes;
    private Map<String, Object> customData;
}

