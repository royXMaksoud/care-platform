package com.care.warehouse.web.dto.reports;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Response DTO for material demand forecast.
 */
@Getter
@Builder
public class ForecastResponse {
    private UUID materialId;
    private UUID warehouseId;
    private int timeRangeMonths;
    private List<Map<String, Object>> monthlyForecasts;
    private Double averageDemand;
    private Double totalPredictedDemand;
    private Double confidenceLevel;
    private String trend; // UPWARD, DOWNWARD, STABLE
    private List<String> recommendations;
    private Boolean simulatedData;
}

