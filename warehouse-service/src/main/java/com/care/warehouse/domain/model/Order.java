package com.care.warehouse.domain.model;

import com.care.warehouse.domain.enums.OrderStatus;
import com.care.warehouse.domain.enums.OrderType;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Domain model for Order aggregate.
 * 
 * Represents both Consumption Orders (Internal Issue/Usage) and 
 * Replenishment Orders (Purchase Requests).
 * 
 * Features:
 * - Multi-tenant support (tenantId)
 * - Order type (CONSUMPTION or REPLENISHMENT)
 * - Status tracking (PENDING, APPROVED, PARTIALLY_FULFILLED, FULFILLED, CANCELLED)
 * - Warehouse reference
 * - Order items (one-to-many)
 * - Notes and custom data
 * - Soft delete and audit fields
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Order {
    
    /** Unique identifier for the order */
    private UUID id;
    
    /** Tenant ID for multi-tenant isolation */
    private UUID tenantId;
    
    /**
     * Order type: CONSUMPTION (reduces stock) or REPLENISHMENT (increases stock)
     */
    private OrderType type;
    
    /**
     * Reference to the warehouse
     */
    private UUID warehouseId;
    
    /**
     * Current order status
     */
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;
    
    /**
     * Order items (one-to-many relationship)
     */
    private List<OrderItem> items;
    
    /**
     * Notes or comments about the order
     */
    private String notes;
    
    /**
     * Custom data (JSONB)
     */
    private Map<String, Object> customData;
    
    /** Active/Deleted flags */
    @Builder.Default
    private Boolean isActive = Boolean.TRUE;
    
    @Builder.Default
    private Boolean isDeleted = Boolean.FALSE;
    
    /** Audit fields */
    private UUID createdById;
    private Instant createdAt;
    
    private UUID updatedById;
    private Instant updatedAt;
    
    private UUID approvedById;
    private Instant approvedAt;
    
    private UUID fulfilledById;
    private Instant fulfilledAt;
    
    /** Optimistic locking */
    private Long rowVersion;
    
    /**
     * Check if order is fully fulfilled.
     */
    public boolean isFullyFulfilled() {
        if (items == null || items.isEmpty()) {
            return false;
        }
        return items.stream()
                .allMatch(item -> item.getQtyFulfilled() != null && 
                        item.getQtyFulfilled().equals(item.getQtyApproved()));
    }
    
    /**
     * Check if order is partially fulfilled.
     */
    public boolean isPartiallyFulfilled() {
        if (items == null || items.isEmpty()) {
            return false;
        }
        boolean hasFulfilled = items.stream()
                .anyMatch(item -> item.getQtyFulfilled() != null && 
                        item.getQtyFulfilled() > 0);
        boolean hasUnfulfilled = items.stream()
                .anyMatch(item -> item.getQtyFulfilled() == null || 
                        item.getQtyFulfilled() < item.getQtyApproved());
        return hasFulfilled && hasUnfulfilled;
    }
    
    /**
     * Calculate total requested quantity across all items.
     */
    public Double getTotalQtyRequested() {
        if (items == null || items.isEmpty()) {
            return 0.0;
        }
        return items.stream()
                .mapToDouble(item -> item.getQtyRequested() != null ? item.getQtyRequested() : 0.0)
                .sum();
    }
    
    /**
     * Calculate total approved quantity across all items.
     */
    public Double getTotalQtyApproved() {
        if (items == null || items.isEmpty()) {
            return 0.0;
        }
        return items.stream()
                .mapToDouble(item -> item.getQtyApproved() != null ? item.getQtyApproved() : 0.0)
                .sum();
    }
    
    /**
     * Calculate total fulfilled quantity across all items.
     */
    public Double getTotalQtyFulfilled() {
        if (items == null || items.isEmpty()) {
            return 0.0;
        }
        return items.stream()
                .mapToDouble(item -> item.getQtyFulfilled() != null ? item.getQtyFulfilled() : 0.0)
                .sum();
    }
}

