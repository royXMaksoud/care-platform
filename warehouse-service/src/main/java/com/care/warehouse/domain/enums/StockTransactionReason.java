package com.care.warehouse.domain.enums;

/**
 * Enumeration for stock transaction reasons/classifications.
 * 
 * Provides detailed classification of why a stock transaction occurred.
 * This enables better reporting, analytics, and audit trail.
 * 
 * Reasons are grouped by transaction type:
 * - IN reasons: PURCHASE, DONATION, RETURN, PRODUCTION
 * - OUT reasons: SALE, CONSUMPTION, DISPOSAL, LENDING
 * - TRANSFER reasons: TRANSFER
 * - ADJUSTMENT reasons: CORRECTION, DAMAGE, LOSS, FOUND
 * 
 * @author CARE Team
 */
public enum StockTransactionReason {
    
    // ========================================================================
    // Stock-IN Reasons
    // ========================================================================
    
    /**
     * Purchase from supplier/vendor.
     * Used when stock is received from a purchase order.
     */
    PURCHASE,
    
    /**
     * Donation received.
     * Used when stock is received as a donation.
     */
    DONATION,
    
    /**
     * Return from customer.
     * Used when previously sold stock is returned.
     */
    RETURN,
    
    /**
     * Production output.
     * Used when stock is produced internally (manufacturing).
     */
    PRODUCTION,
    
    // ========================================================================
    // Stock-OUT Reasons
    // ========================================================================
    
    /**
     * Sale to customer.
     * Used when stock is sold to an external customer.
     */
    SALE,
    
    /**
     * Internal consumption.
     * Used when stock is consumed internally (e.g., office supplies, maintenance).
     */
    CONSUMPTION,
    
    /**
     * Disposal/waste.
     * Used when stock is disposed of (expired, damaged beyond repair, etc.).
     */
    DISPOSAL,
    
    /**
     * Lending to another entity.
     * Used when stock is temporarily lent to another organization/warehouse.
     */
    LENDING,
    
    // ========================================================================
    // Stock-Transfer Reasons
    // ========================================================================
    
    /**
     * Transfer between warehouses.
     * Used for standard warehouse-to-warehouse transfers.
     */
    TRANSFER,
    
    // ========================================================================
    // Stock-Adjustment Reasons
    // ========================================================================
    
    /**
     * Inventory correction.
     * Used for general inventory count corrections (physical count adjustments).
     */
    CORRECTION,
    
    /**
     * Damage adjustment.
     * Used when stock is adjusted due to damage discovered during inventory.
     */
    DAMAGE,
    
    /**
     * Loss adjustment.
     * Used when stock is adjusted due to loss (theft, spoilage, etc.).
     */
    LOSS,
    
    /**
     * Found stock.
     * Used when previously unaccounted stock is found during inventory.
     */
    FOUND
}

