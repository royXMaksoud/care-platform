package com.care.warehouse.domain.ports.in.order;

import com.care.warehouse.domain.model.Order;

import java.util.UUID;

/**
 * Use case interface for approving an order.
 */
public interface ApproveOrderUseCase {
    
    /**
     * Approve an order and update item quantities.
     * 
     * @param orderId Order ID
     * @return Approved order
     */
    Order approveOrder(UUID orderId);
}

