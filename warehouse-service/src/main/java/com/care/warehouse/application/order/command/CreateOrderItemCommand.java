package com.care.warehouse.application.order.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

/**
 * Command object for creating an order item.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderItemCommand {
    
    private UUID materialId;
    private Double qtyRequested;
    private Map<String, Object> customData;
}

