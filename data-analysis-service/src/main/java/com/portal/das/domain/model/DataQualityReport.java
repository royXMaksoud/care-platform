package com.portal.das.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Data quality validation report
 * Contains violation counts and samples
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataQualityReport {
    /**
     * Dataset that was validated
     */
    private java.util.UUID datasetId;

    /**
     * Total rows checked
     */
    private Long totalRows;

    /**
     * Total violations found
     */
    private Long totalViolations;

    /**
     * Per-rule violations
     */
    private List<RuleViolation> ruleViolations;

    /**
     * Path to violations CSV file (if generated)
     */
    private String violationsCsvPath;

    /**
     * Violation for a specific rule
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RuleViolation {
        /**
         * Column being validated
         */
        private String column;

        /**
         * Rule type
         */
        private String ruleType;

        /**
         * Number of violations
         */
        private Long violationCount;

        /**
         * Sample row indexes with violations (limited)
         */
        private List<Integer> sampleRowIndexes;

        /**
         * Sample invalid values
         */
        private List<String> sampleValues;
    }
}

