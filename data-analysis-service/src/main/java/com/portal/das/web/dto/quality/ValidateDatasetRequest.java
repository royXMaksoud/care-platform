package com.portal.das.web.dto.quality;

import com.portal.das.domain.model.DataQualityRule;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request for dataset validation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidateDatasetRequest {
    /**
     * Validation rules to apply
     */
    @Valid
    private List<DataQualityRule> rules;

    /**
     * Maximum violations to track per rule
     */
    @Builder.Default
    private Integer maxViolationsPerRule = 100;
}

