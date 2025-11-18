package com.care.warehouse.domain.ports.ai;

import java.util.Map;
import java.util.UUID;

/**
 * Port interface for AI-powered inventory forecasting.
 * 
 * This port abstracts the underlying ML/AI model for demand forecasting.
 * Implementations can integrate with external ML services or use in-house models.
 */
public interface InventoryForecastingPort {
    
    /**
     * Forecast material demand for a given time range.
     * 
     * @param materialId Material ID to forecast
     * @param warehouseId Warehouse ID (optional, null for aggregate forecast)
     * @param timeRangeMonths Number of months to forecast (e.g., 3, 6, 12)
     * @return Forecast data including:
     *         - predictedDemand: Predicted demand per month
     *         - confidenceLevel: Confidence score (0.0 to 1.0)
     *         - trend: UPWARD, DOWNWARD, STABLE
     *         - recommendations: List of recommendations
     */
    Map<String, Object> forecastMaterialDemand(UUID materialId, UUID warehouseId, int timeRangeMonths);
    
    /**
     * Forecast demand for multiple materials (batch forecasting).
     * 
     * @param materialIds List of material IDs
     * @param warehouseId Warehouse ID (optional)
     * @param timeRangeMonths Number of months to forecast
     * @return Map of materialId -> forecast data
     */
    Map<UUID, Map<String, Object>> forecastBatchDemand(
            java.util.List<UUID> materialIds, 
            UUID warehouseId, 
            int timeRangeMonths);
}

