package com.portal.das.domain.model.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Dataset profiling information
 * Contains column-level statistics and metadata
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatasetProfile {
    /**
     * Total number of rows
     */
    private Integer totalRows;

    /**
     * Total number of columns
     */
    private Integer totalColumns;

    /**
     * List of column profiles
     */
    private List<ColumnProfile> columns;

    /**
     * Profile for a single column
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ColumnProfile {
        /**
         * Column name (from header)
         */
        private String columnName;

        /**
         * Column index (0-based)
         */
        private Integer columnIndex;

        /**
         * Inferred data type
         */
        private String dominantType;

        /**
         * Confidence in the inferred type (0.0 to 1.0)
         */
        private Double confidence;

        /**
         * Number of null/empty values
         */
        private Integer nullCount;

        /**
         * Number of non-null values
         */
        private Integer nonNullCount;

        /**
         * Number of values that don't match the dominant type
         */
        private Integer invalidTypeCount;

        /**
         * Sample values from the column
         */
        private List<String> examples;
    }
}


