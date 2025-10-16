package com.portal.das.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request for time series forecast
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForecastRequest {
    /**
     * Column containing date/datetime values
     */
    private String dateColumn;

    /**
     * Column containing numeric values to forecast
     */
    private String valueColumn;

    /**
     * Number of periods to forecast
     */
    @Builder.Default
    private Integer horizon = 10;

    /**
     * Forecast method
     */
    @Builder.Default
    private ForecastMethod method = ForecastMethod.MOVING_AVERAGE;

    public enum ForecastMethod {
        MOVING_AVERAGE,
        SEASONAL_NAIVE
    }
}

