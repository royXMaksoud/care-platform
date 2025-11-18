package com.care.warehouse.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Bin Domain Model
 * Represents a storage bin/shelf unit within a zone
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bin {

    // ==================== Identifiers ====================
    private UUID id;
    private UUID tenantId;
    private UUID zoneId;

    // ==================== Basic Info ====================
    private String code;          // A-01-01 (Aisle-Shelf-Level)
    private String name;
    private BinType binType;

    // ==================== Status & Configuration ====================
    private BinStatus status;

    // ==================== Capacity Management ====================
    private BigDecimal maxWeightKg;
    private BigDecimal currentWeightKg;
    private BigDecimal capacityCubicMeters;
    private BigDecimal currentOccupancyCubicMeters;

    // ==================== Location ====================
    private Integer aisleNumber;
    private Integer shelfNumber;
    private Integer levelNumber;
    private String barcode;

    // ==================== Audit ====================
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isDeleted;
    private Integer rowVersion;

    // ==================== Business Methods ====================

    /**
     * Check if bin can accommodate items
     */
    public boolean canAccommodate(BigDecimal requiredCapacity, BigDecimal requiredWeight) {
        boolean spaceAvailable = getAvailableCapacity().compareTo(requiredCapacity) >= 0;
        boolean weightAvailable = maxWeightKg == null || 
                                 getAvailableWeight().compareTo(requiredWeight) >= 0;
        return spaceAvailable && weightAvailable && status == BinStatus.AVAILABLE;
    }

    /**
     * Add content to bin
     */
    public void addContent(BigDecimal volume, BigDecimal weight) {
        if (!canAccommodate(volume, weight)) {
            throw new IllegalStateException("Bin cannot accommodate the required items");
        }
        currentOccupancyCubicMeters = currentOccupancyCubicMeters.add(volume);
        if (maxWeightKg != null) {
            currentWeightKg = currentWeightKg.add(weight);
        }
    }

    /**
     * Remove content from bin
     */
    public void removeContent(BigDecimal volume, BigDecimal weight) {
        currentOccupancyCubicMeters = currentOccupancyCubicMeters.subtract(volume);
        if (maxWeightKg != null) {
            currentWeightKg = currentWeightKg.subtract(weight);
        }
        if (currentOccupancyCubicMeters.compareTo(BigDecimal.ZERO) <= 0) {
            status = BinStatus.AVAILABLE;
        }
    }

    /**
     * Get available capacity
     */
    public BigDecimal getAvailableCapacity() {
        return capacityCubicMeters.subtract(currentOccupancyCubicMeters);
    }

    /**
     * Get available weight capacity
     */
    public BigDecimal getAvailableWeight() {
        if (maxWeightKg == null) {
            return new BigDecimal(Double.MAX_VALUE);
        }
        return maxWeightKg.subtract(currentWeightKg);
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
     * Get location string representation
     */
    public String getLocationString() {
        return String.format("A%d-S%d-L%d", aisleNumber, shelfNumber, levelNumber);
    }

    /**
     * Bin Type Enum
     */
    public enum BinType {
        PALLET,      // منصة
        SHELF,       // رف
        RACK,        // رف معدني
        CAGE,        // قفص
        DRAWER       // درج
    }

    /**
     * Bin Status Enum
     */
    public enum BinStatus {
        AVAILABLE,    // متاح
        OCCUPIED,     // مشغول
        RESERVED,     // محجوز
        MAINTENANCE   // صيانة
    }
}
