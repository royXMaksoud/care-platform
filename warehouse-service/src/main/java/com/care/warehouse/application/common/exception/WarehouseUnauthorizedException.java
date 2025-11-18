package com.care.warehouse.application.common.exception;

import com.sharedlib.core.exception.UnauthorizedException;

/**
 * Exception thrown when a user is not authorized to perform an action.
 * Extends shared-lib UnauthorizedException for consistency.
 */
public class WarehouseUnauthorizedException extends UnauthorizedException {
    
    public WarehouseUnauthorizedException(String messageKey) {
        super(messageKey);
    }
    
    public WarehouseUnauthorizedException(String messageKey, Object... args) {
        super(messageKey);
    }
}

