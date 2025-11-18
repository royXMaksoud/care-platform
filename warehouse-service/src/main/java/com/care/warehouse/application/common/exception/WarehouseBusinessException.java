package com.care.warehouse.application.common.exception;

/**
 * Exception thrown when a business rule is violated.
 * Used for domain-level validation errors and business logic violations.
 */
public class WarehouseBusinessException extends RuntimeException {
    
    public WarehouseBusinessException(String message) {
        super(message);
    }
    
    public WarehouseBusinessException(String message, Throwable cause) {
        super(message, cause);
    }
}

