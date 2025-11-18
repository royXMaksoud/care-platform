package com.care.warehouse.infrastructure.ai;

import com.care.warehouse.domain.ports.ai.InventoryForecastingPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * A No-Operation (NoOp) stub implementation of the InventoryForecastingPort.
 * 
 * This adapter simulates AI/ML forecasting by returning dummy data.
 * It serves as a placeholder until a real ML model integration is developed.
 */
@Component
@Slf4j
public class NoOpInventoryForecastingAdapter implements InventoryForecastingPort {

    @Override
    public Map<String, Object> forecastMaterialDemand(UUID materialId, UUID warehouseId, int timeRangeMonths) {
        log.info("NoOpInventoryForecastingAdapter: Forecasting demand for materialId={}, warehouseId={}, months={}",
                materialId, warehouseId, timeRangeMonths);
        
        // Generate dummy forecast data
        Map<String, Object> forecast = new HashMap<>();
        
        // Predicted demand per month (dummy values)
        List<Map<String, Object>> monthlyForecasts = new ArrayList<>();
        Random random = new Random();
        double baseDemand = 100.0 + random.nextDouble() * 200.0;
        
        for (int i = 1; i <= timeRangeMonths; i++) {
            Map<String, Object> monthForecast = new HashMap<>();
            monthForecast.put("month", i);
            monthForecast.put("predictedDemand", baseDemand + (random.nextDouble() - 0.5) * 50.0);
            monthForecast.put("confidence", 0.7 + random.nextDouble() * 0.2); // 0.7-0.9
            monthlyForecasts.add(monthForecast);
        }
        
        forecast.put("materialId", materialId);
        forecast.put("warehouseId", warehouseId);
        forecast.put("timeRangeMonths", timeRangeMonths);
        forecast.put("monthlyForecasts", monthlyForecasts);
        forecast.put("averageDemand", baseDemand);
        forecast.put("totalPredictedDemand", baseDemand * timeRangeMonths);
        forecast.put("confidenceLevel", 0.75 + random.nextDouble() * 0.15); // 0.75-0.9
        forecast.put("trend", random.nextBoolean() ? "STABLE" : (random.nextBoolean() ? "UPWARD" : "DOWNWARD"));
        
        // Dummy recommendations
        List<String> recommendations = new ArrayList<>();
        recommendations.add("Consider increasing reorder level by 10%");
        recommendations.add("Monitor demand patterns in next quarter");
        recommendations.add("Review supplier lead times");
        forecast.put("recommendations", recommendations);
        
        forecast.put("simulatedData", true);
        forecast.put("timestamp", java.time.Instant.now().toString());
        
        return forecast;
    }

    @Override
    public Map<UUID, Map<String, Object>> forecastBatchDemand(
            List<UUID> materialIds, UUID warehouseId, int timeRangeMonths) {
        log.info("NoOpInventoryForecastingAdapter: Batch forecasting for {} materials, warehouseId={}, months={}",
                materialIds.size(), warehouseId, timeRangeMonths);
        
        Map<UUID, Map<String, Object>> batchForecasts = new HashMap<>();
        for (UUID materialId : materialIds) {
            batchForecasts.put(materialId, forecastMaterialDemand(materialId, warehouseId, timeRangeMonths));
        }
        
        return batchForecasts;
    }
}

