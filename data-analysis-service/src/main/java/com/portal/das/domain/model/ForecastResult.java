package com.portal.das.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Forecast result with actual and predicted values
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForecastResult {
    /**
     * Actual historical data (tail)
     */
    private List<DataPoint> actualTail;

    /**
     * Forecasted values
     */
    private List<DataPoint> forecast;

    /**
     * Combined chart-ready data
     */
    private List<ChartPoint> chartData;

    /**
     * Data point
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataPoint {
        private String time;
        private Double value;
    }

    /**
     * Chart point with type indicator
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChartPoint {
        private String time;
        private Double value;
        private String type; // "actual" or "forecast"
    }
}

