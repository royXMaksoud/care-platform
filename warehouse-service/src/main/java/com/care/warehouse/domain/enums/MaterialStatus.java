package com.care.warehouse.domain.enums;

/**
 * Enumeration for material status.
 */
public enum MaterialStatus {
    /**
     * Material is active and available
     */
    ACTIVE,
    
    /**
     * Material is inactive (temporarily unavailable)
     */
    INACTIVE,
    
    /**
     * Material is discontinued (no longer produced/available)
     */
    DISCONTINUED,
    
    /**
     * Material is pending approval
     */
    PENDING_APPROVAL
}

