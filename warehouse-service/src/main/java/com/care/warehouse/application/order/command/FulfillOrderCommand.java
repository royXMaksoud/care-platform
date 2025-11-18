package com.care.warehouse.application.order.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Command object used to fulfill an order.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FulfillOrderCommand {
    
    private UUID orderId;
    private List<FulfillOrderItemCommand> items;
    private Map<String, Object> fulfillmentData;
}

