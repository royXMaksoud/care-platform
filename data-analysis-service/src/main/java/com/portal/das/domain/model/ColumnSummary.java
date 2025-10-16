package com.portal.das.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Summary statistics for a column (similar to pandas describe())
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ColumnSummary {
    /**
     * Column name
     */
    private String columnName;

    /**
     * Total count of values (including nulls)
     */
    private Long count;

    /**
     * Number of null values
     */
    private Long nullCount;

    /**
     * Number of unique values
     */
    private Long uniqueCount;

    /**
     * Dominant data type
     */
    private String dominantType;

    /**
     * Numeric statistics (null if non-numeric column)
     */
    private NumericStats numericStats;

    /**
     * String statistics (null if non-string column)
     */
    private StringStats stringStats;

    /**
     * Top value counts (top 20)
     */
    private List<ValueCount> topValues;

    /**
     * Sample of distinct values
     */
    private List<String> sampleDistincts;

    /**
     * Numeric statistics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NumericStats {
        private Double min;
        private Double max;
        private Double mean;
        private Double std;
        private Double q25;  // 25th percentile
        private Double q50;  // Median
        private Double q75;  // 75th percentile
    }

    /**
     * String statistics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StringStats {
        private Integer minLength;
        private Integer maxLength;
        private Double avgLength;
    }

    /**
     * Value count entry
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValueCount {
        private String value;
        private Long count;
        private Double percentage;
    }
}

