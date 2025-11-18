package com.care.warehouse.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Warehouse Domain Model
 * Represents a warehouse/storage facility
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Warehouse {

    // ==================== Identifiers ====================
    private UUID id;
    private UUID tenantId;

    // ==================== Basic Info ====================
    private String code;                     // WH001, WH002
    private String name;
    private String description;

    // ==================== Status & Configuration ====================
    private WarehouseStatus status;
    private Boolean isPrimary;
    private Map<String, Object> metadata;    // Custom fields

    // ==================== Capacity Management ====================
    private BigDecimal capacityCubicMeters;
    private BigDecimal currentOccupancyCubicMeters;

    // ==================== Audit ====================
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isDeleted;
    private Integer rowVersion;

    // ==================== Business Methods ====================

    /**
     * Check if warehouse has available capacity
     */
    public boolean hasCapacity(BigDecimal requiredSpace) {
        BigDecimal availableSpace = getAvailableCapacity();
        return availableSpace.compareTo(requiredSpace) >= 0;
    }

    /**
     * Get available capacity
     */
    public BigDecimal getAvailableCapacity() {
        return capacityCubicMeters.subtract(currentOccupancyCubicMeters);
    }

    /**
     * Get utilization percentage
     */
    public BigDecimal getUtilizationPercentage() {
        if (capacityCubicMeters.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return currentOccupancyCubicMeters
            .divide(capacityCubicMeters, 2, java.math.RoundingMode.HALF_UP)
            .multiply(new BigDecimal(100));
    }

    /**
     * Update occupancy when items are added/removed
     */
    public void updateOccupancy(BigDecimal change) {
        BigDecimal newOccupancy = currentOccupancyCubicMeters.add(change);
        if (newOccupancy.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException("Occupancy cannot be negative");
        }
        if (newOccupancy.compareTo(capacityCubicMeters) > 0) {
            throw new IllegalStateException("Occupancy exceeds warehouse capacity");
        }
        this.currentOccupancyCubicMeters = newOccupancy;
    }

    /**
     * Check if warehouse is operational
     */
    public boolean isOperational() {
        return status == WarehouseStatus.ACTIVE;
    }

    /**
     * Check if warehouse is near capacity (>80%)
     */
    public boolean isNearCapacity() {
        BigDecimal threshold = capacityCubicMeters.multiply(new BigDecimal("0.8"));
        return currentOccupancyCubicMeters.compareTo(threshold) >= 0;
    }

    /**
     * Warehouse Status Enum
     */
    public enum WarehouseStatus {
        ACTIVE,        // المستودع نشط
        INACTIVE,      // المستودع غير نشط
        MAINTENANCE    // المستودع تحت الصيانة
    }
}
