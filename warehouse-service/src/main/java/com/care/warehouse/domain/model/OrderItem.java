package com.care.warehouse.domain.model;

import lombok.*;

import java.util.Map;
import java.util.UUID;

/**
 * Domain model for OrderItem (value object within Order aggregate).
 * 
 * Represents a single line item in an order.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderItem {
    
    /** Unique identifier for the order item */
    private UUID id;
    
    /**
     * Reference to the parent order
     */
    private UUID orderId;
    
    /**
     * Reference to the material
     */
    private UUID materialId;
    
    /**
     * Requested quantity
     */
    private Double qtyRequested;
    
    /**
     * Approved quantity (may be less than requested)
     */
    private Double qtyApproved;
    
    /**
     * Fulfilled quantity (may be less than approved)
     */
    private Double qtyFulfilled;
    
    /**
     * Custom data for this item (JSONB)
     */
    private Map<String, Object> customData;
    
    /**
     * Check if item is fully fulfilled.
     */
    public boolean isFullyFulfilled() {
        if (qtyApproved == null || qtyApproved == 0) {
            return false;
        }
        return qtyFulfilled != null && qtyFulfilled.equals(qtyApproved);
    }
    
    /**
     * Check if item is partially fulfilled.
     */
    public boolean isPartiallyFulfilled() {
        if (qtyApproved == null || qtyApproved == 0) {
            return false;
        }
        return qtyFulfilled != null && qtyFulfilled > 0 && qtyFulfilled < qtyApproved;
    }
    
    /**
     * Get remaining quantity to fulfill.
     */
    public Double getRemainingQty() {
        if (qtyApproved == null) {
            return qtyRequested != null ? qtyRequested : 0.0;
        }
        double fulfilled = qtyFulfilled != null ? qtyFulfilled : 0.0;
        return Math.max(0.0, qtyApproved - fulfilled);
    }
}

