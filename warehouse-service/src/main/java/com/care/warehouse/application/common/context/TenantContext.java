package com.care.warehouse.application.common.context;

import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

/**
 * ThreadLocal context holder for the current tenant.
 * 
 * This class provides a thread-safe way to store and retrieve the current tenant ID
 * throughout the request lifecycle. The context is automatically cleaned up after
 * each request to prevent memory leaks.
 * 
 * Usage:
 * - Set tenant context: TenantContext.set(tenantId)
 * - Get tenant context: UUID tenantId = TenantContext.get()
 * - Clear context: TenantContext.clear()
 * 
 * @author CARE Team
 */
@Slf4j
public class TenantContext {
    
    private static final ThreadLocal<UUID> currentTenant = new ThreadLocal<>();

    private TenantContext() {
        // Private constructor to prevent instantiation
    }

    /**
     * Sets the current tenant ID in the ThreadLocal context.
     * 
     * @param tenantId The current tenant ID to set
     */
    public static void set(UUID tenantId) {
        if (tenantId == null) {
            log.warn("Attempting to set null tenantId in TenantContext");
            return;
        }
        currentTenant.set(tenantId);
        log.debug("Tenant context set for tenant: {}", tenantId);
    }

    /**
     * Gets the current tenant ID from the ThreadLocal context.
     * 
     * @return The current tenant ID or null if not set
     */
    public static UUID get() {
        UUID tenantId = currentTenant.get();
        if (tenantId == null) {
            log.debug("No tenant ID found in context");
        }
        return tenantId;
    }

    /**
     * Checks if there is a current tenant in the context.
     * 
     * @return true if a tenant is set, false otherwise
     */
    public static boolean hasTenant() {
        return get() != null;
    }

    /**
     * Clears the current tenant from the ThreadLocal context.
     * This should be called after each request to prevent memory leaks.
     */
    public static void clear() {
        UUID tenantId = currentTenant.get();
        if (tenantId != null) {
            log.debug("Clearing tenant context for tenant: {}", tenantId);
        }
        currentTenant.remove();
    }
}

