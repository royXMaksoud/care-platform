package com.care.warehouse.domain.enums;

/**
 * Enumeration for order status.
 */
public enum OrderStatus {
    /**
     * Order is pending approval
     */
    PENDING,
    
    /**
     * Order has been approved
     */
    APPROVED,
    
    /**
     * Order is partially fulfilled
     */
    PARTIALLY_FULFILLED,
    
    /**
     * Order is fully fulfilled
     */
    FULFILLED,
    
    /**
     * Order has been cancelled
     */
    CANCELLED
}

