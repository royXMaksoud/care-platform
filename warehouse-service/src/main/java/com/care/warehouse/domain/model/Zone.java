package com.care.warehouse.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Zone Domain Model
 * Represents a zone/section within a warehouse
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Zone {

    // ==================== Identifiers ====================
    private UUID id;
    private UUID tenantId;
    private UUID warehouseId;

    // ==================== Basic Info ====================
    private String code;          // RECV-01, STOR-02
    private String name;
    private ZoneType zoneType;

    // ==================== Status & Configuration ====================
    private ZoneStatus status;
    private Boolean temperatureControlled;
    private BigDecimal temperatureMin;
    private BigDecimal temperatureMax;

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
     * Get available capacity
     */
    public BigDecimal getAvailableCapacity() {
        return capacityCubicMeters.subtract(currentOccupancyCubicMeters);
    }

    /**
     * Check if zone has available capacity
     */
    public boolean hasCapacity(BigDecimal requiredSpace) {
        return getAvailableCapacity().compareTo(requiredSpace) >= 0;
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
     * Check if zone is ready for operations
     */
    public boolean isReady() {
        return status == ZoneStatus.ACTIVE;
    }

    /**
     * Update zone occupancy
     */
    public void updateOccupancy(BigDecimal change) {
        BigDecimal newOccupancy = currentOccupancyCubicMeters.add(change);
        if (newOccupancy.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException("Zone occupancy cannot be negative");
        }
        if (newOccupancy.compareTo(capacityCubicMeters) > 0) {
            throw new IllegalStateException("Zone occupancy exceeds capacity");
        }
        this.currentOccupancyCubicMeters = newOccupancy;
    }

    /**
     * Check if temperature control is properly configured
     */
    public boolean isTemperatureConfigurationValid() {
        if (!temperatureControlled) {
            return true;
        }
        return temperatureMin != null && temperatureMax != null && 
               temperatureMin.compareTo(temperatureMax) < 0;
    }

    /**
     * Zone Type Enum
     */
    public enum ZoneType {
        RECEIVING,    // منطقة الاستقبال
        STORAGE,      // منطقة التخزين
        PICKING,      // منطقة الانتقاء
        PACKING,      // منطقة التعبئة
        SHIPPING      // منطقة الشحن
    }

    /**
     * Zone Status Enum
     */
    public enum ZoneStatus {
        ACTIVE,       // نشطة
        INACTIVE,     // غير نشطة
        MAINTENANCE   // تحت الصيانة
    }
}
