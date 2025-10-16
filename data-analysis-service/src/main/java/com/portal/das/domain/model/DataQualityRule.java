package com.portal.das.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Data quality validation rule
 * Configurable validation for discovering errors in datasets
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataQualityRule {
    /**
     * Column to validate
     */
    private String column;

    /**
     * Whether the column is required (no nulls allowed)
     */
    private Boolean required;

    /**
     * Expected data type
     */
    private InferredType expectedType;

    /**
     * Minimum value (for numeric columns)
     */
    private Double min;

    /**
     * Maximum value (for numeric columns)
     */
    private Double max;

    /**
     * Regex pattern to match
     */
    private String regex;

    /**
     * Allowed values (whitelist)
     */
    private List<String> allowedValues;

    /**
     * Minimum string length
     */
    private Integer minLength;

    /**
     * Maximum string length
     */
    private Integer maxLength;

    /**
     * Whether values must be unique
     */
    private Boolean unique;
}

