package com.care.warehouse.application.common.exception;

import com.sharedlib.core.exception.NotFoundException;

/**
 * Exception thrown when a requested resource is not found.
 * Extends shared-lib NotFoundException for consistency.
 */
public class WarehouseNotFoundException extends NotFoundException {
    
    public WarehouseNotFoundException(String messageKey) {
        super(messageKey);
    }
    
    public WarehouseNotFoundException(String messageKey, Object... args) {
        super(messageKey);
    }
}

