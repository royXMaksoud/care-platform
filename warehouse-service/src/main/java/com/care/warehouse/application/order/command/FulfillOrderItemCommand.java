package com.care.warehouse.application.order.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Command object for fulfilling an order item.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FulfillOrderItemCommand {
    
    private UUID itemId;
    private Double qtyFulfilled;
}

