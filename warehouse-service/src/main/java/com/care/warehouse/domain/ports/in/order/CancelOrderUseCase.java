package com.care.warehouse.domain.ports.in.order;

import com.care.warehouse.domain.model.Order;

import java.util.UUID;

/**
 * Use case interface for cancelling an order.
 */
public interface CancelOrderUseCase {
    
    /**
     * Cancel an order.
     * 
     * @param orderId Order ID
     * @return Cancelled order
     */
    Order cancelOrder(UUID orderId);
}

