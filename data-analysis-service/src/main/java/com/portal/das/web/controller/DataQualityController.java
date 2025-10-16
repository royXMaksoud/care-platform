package com.portal.das.web.controller;

import com.portal.das.domain.model.DataQualityReport;
import com.portal.das.service.quality.DataQualityService;
import com.portal.das.web.dto.quality.ValidateDatasetRequest;
import com.sharedlib.core.web.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for data quality validation
 */
@Slf4j
@RestController
@RequestMapping("/api/datasets")
@RequiredArgsConstructor
@Tag(name = "Data Quality", description = "APIs for data quality validation and error discovery")
public class DataQualityController {

    private final DataQualityService dataQualityService;

    /**
     * Validate dataset with quality rules
     * POST /api/datasets/{id}/validate
     *
     * @param datasetId Dataset identifier
     * @param request Validation rules
     * @return Data quality report
     */
    @PostMapping("/{id}/validate")
    @Operation(summary = "Validate dataset", 
               description = "Validate dataset using configurable quality rules. Returns violation counts and samples.")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ApiResponse<DataQualityReport> validateDataset(
            @PathVariable("id") UUID datasetId,
            @RequestBody @Valid ValidateDatasetRequest request) {
        
        log.info("Validating dataset: {} with {} rules", datasetId, request.getRules().size());

        DataQualityReport report = dataQualityService.validate(
                datasetId, 
                request.getRules(), 
                request.getMaxViolationsPerRule());

        return ApiResponse.ok(report);
    }
}

