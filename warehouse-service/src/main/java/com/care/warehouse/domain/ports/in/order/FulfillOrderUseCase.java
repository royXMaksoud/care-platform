package com.care.warehouse.domain.ports.in.order;

import com.care.warehouse.application.order.command.FulfillOrderCommand;
import com.care.warehouse.domain.model.Order;

/**
 * Use case interface for fulfilling an order.
 */
public interface FulfillOrderUseCase {
    
    /**
     * Fulfill an order (partially or fully).
     * Adjusts stock levels based on order type.
     * 
     * @param command Fulfill order command
     * @return Fulfilled order
     */
    Order fulfillOrder(FulfillOrderCommand command);
}

