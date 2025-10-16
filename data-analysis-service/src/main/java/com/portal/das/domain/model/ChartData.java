package com.portal.das.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Chart-ready data for visualization
 * Contains histogram, categories, and timeseries data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChartData {
    /**
     * Column name
     */
    private String columnName;

    /**
     * Data type
     */
    private String dataType;

    /**
     * Histogram data for numeric columns
     */
    private HistogramData histogram;

    /**
     * Category data for categorical columns
     */
    private CategoryData categories;

    /**
     * Timeseries data for datetime columns
     */
    private TimeseriesData timeseries;

    /**
     * Histogram data with bins
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistogramData {
        private List<Bin> bins;
        private Integer totalBins;

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Bin {
            private Double binStart;
            private Double binEnd;
            private Long frequency;
        }
    }

    /**
     * Category data for bar charts
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryData {
        private List<CategoryEntry> categories;
        private Integer totalCategories;

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class CategoryEntry {
            private String label;
            private Long value;
            private Double percentage;
        }
    }

    /**
     * Timeseries data for line charts
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeseriesData {
        private List<TimeseriesPoint> points;
        private String aggregation;  // "daily", "weekly", "monthly"

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class TimeseriesPoint {
            private String time;
            private Long count;
        }
    }
}

