package com.portal.das.web.controller;

import com.portal.das.domain.model.Dataset;
import com.portal.das.domain.model.JoinRequest;
import com.portal.das.service.join.JoinService;
import com.sharedlib.core.web.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for dataset join operations
 */
@Slf4j
@RestController
@RequestMapping("/api/datasets")
@RequiredArgsConstructor
@Tag(name = "Dataset Join", description = "APIs for joining datasets (pandas merge style)")
public class JoinController {

    private final JoinService joinService;

    /**
     * Join two datasets
     * POST /api/datasets/join
     *
     * @param request Join parameters
     * @return New dataset ID containing join result
     */
    @PostMapping("/join")
    @Operation(summary = "Join datasets", 
               description = "Join two datasets using pandas merge style. Returns new dataset ID.")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ApiResponse<JoinResultResponse> joinDatasets(@RequestBody @Valid JoinRequest request) {
        log.info("Joining datasets: {} and {}", request.getLeftDatasetId(), request.getRightDatasetId());

        Dataset joinedDataset = joinService.join(request);

        JoinResultResponse response = JoinResultResponse.builder()
                .datasetId(joinedDataset.getDatasetId())
                .rows(joinedDataset.getRowCount())
                .columns(joinedDataset.getColumnCount())
                .build();

        return ApiResponse.ok(response);
    }

    /**
     * Join result response
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class JoinResultResponse {
        private java.util.UUID datasetId;
        private Integer rows;
        private Integer columns;
    }
}

