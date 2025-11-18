package com.care.warehouse.application.common.permissions;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Declarative permission check for controller/service methods.
 *
 * Usage example:
 * {@code
 *   @RequireActionPermission(
 *       actionId = "d707da02-4127-4a86-8e5d-f619e9473b94",
 *       scopeType = "WAREHOUSE",
 *       scopeField = "warehouseId",
 *       messageKey = "error.warehouse.modify.forbidden"
 *   )
 *   public ResponseEntity<?> createWarehouse(CreateWarehouseRequest request) { ... }
 * }
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireActionPermission {

    /**
     * systemSectionActionId (UUID as string) for the action to evaluate.
     */
    String actionId();

    /**
     * Optional logical scope type, e.g. WAREHOUSE, ORGANIZATION_BRANCH.
     */
    String scopeType() default "";

    /**
     * Optional name of a field on one of the method arguments to extract a scope value
     * (e.g. "warehouseId" on a request DTO).
     */
    String scopeField() default "";

    /**
     * Message key for generic forbidden errors (no action-level permission).
     */
    String messageKey() default "error.warehouse.modify.forbidden";

    /**
     * Message key when a specific scope (e.g. warehouse) is not allowed.
     * Falls back to {@link #messageKey()} if empty.
     */
    String scopeMessageKey() default "";
}

