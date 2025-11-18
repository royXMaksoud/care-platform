package com.care.warehouse.domain.enums;

/**
 * Enumeration for order types.
 */
public enum OrderType {
    /**
     * Consumption order - Internal issue/usage (reduces stock)
     */
    CONSUMPTION,
    
    /**
     * Replenishment order - Purchase request (increases stock)
     */
    REPLENISHMENT
}

