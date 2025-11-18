package com.care.warehouse.domain.ports.in.order;

import com.care.warehouse.application.order.command.CreateOrderCommand;
import com.care.warehouse.domain.model.Order;

/**
 * Use case interface for creating a new order.
 */
public interface CreateOrderUseCase {
    
    /**
     * Create a new order (consumption or replenishment).
     * 
     * @param command Create order command
     * @return Created order
     */
    Order createOrder(CreateOrderCommand command);
}

