package com.care.warehouse.domain.ports.in.warehousematerialstock;

import com.care.warehouse.domain.model.WarehouseMaterialStock;

import java.util.List;
import java.util.UUID;

/**
 * Use case interface for checking stock thresholds.
 */
public interface CheckThresholdUseCase {
    
    /**
     * Check if stock is below reorder level and send notification if needed.
     * 
     * @param stockId Stock record ID
     * @return true if notification was sent, false otherwise
     */
    boolean checkThreshold(UUID stockId);
    
    /**
     * Check all stocks below reorder level for a tenant and send notifications.
     * 
     * @param tenantId Tenant ID
     * @return List of stock records below reorder level
     */
    List<WarehouseMaterialStock> checkAllThresholds(UUID tenantId);
}

