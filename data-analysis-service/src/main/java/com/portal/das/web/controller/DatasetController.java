package com.portal.das.web.controller;

import com.portal.das.application.dataset.command.RegisterDatasetCommand;
import com.portal.das.domain.model.Dataset;
import com.portal.das.domain.model.profile.DatasetProfile;
import com.portal.das.domain.ports.in.dataset.GetDatasetProfileUseCase;
import com.portal.das.domain.ports.in.dataset.LoadDatasetUseCase;
import com.portal.das.domain.ports.in.dataset.RegisterDatasetUseCase;
import com.portal.das.web.dto.common.IdResponse;
import com.portal.das.web.dto.dataset.DatasetInfoResponse;
import com.portal.das.web.dto.dataset.RegisterDatasetRequest;
import com.portal.das.web.mapper.DatasetWebMapper;
import com.sharedlib.core.web.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for Dataset operations
 * Handles dataset registration and profiling
 */
@Slf4j
@RestController
@RequestMapping("/api/datasets")
@RequiredArgsConstructor
@Tag(name = "Dataset Management", description = "APIs for registering and managing datasets")
public class DatasetController {

    private final RegisterDatasetUseCase registerDatasetUseCase;
    private final LoadDatasetUseCase loadDatasetUseCase;
    private final GetDatasetProfileUseCase getDatasetProfileUseCase;
    private final DatasetWebMapper datasetWebMapper;

    /**
     * Register a dataset from an uploaded file
     * POST /api/datasets/from-file/{fileId}
     *
     * @param fileId File ID to register as dataset
     * @param request Optional name and description
     * @return Dataset ID
     */
    @PostMapping("/from-file/{fileId}")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register dataset from file", 
               description = "Create a dataset from an uploaded file. Computes profile with type inference.")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ApiResponse<IdResponse> registerDatasetFromFile(
            @PathVariable UUID fileId,
            @RequestBody(required = false) @Valid RegisterDatasetRequest request) {
        
        log.info("Registering dataset from file: {}", fileId);

        // Create command
        RegisterDatasetCommand command = RegisterDatasetCommand.builder()
                .fileId(fileId)
                .name(request != null ? request.getName() : null)
                .description(request != null ? request.getDescription() : null)
                .build();

        // Register dataset
        Dataset dataset = registerDatasetUseCase.registerDataset(command);

        // Return ID
        IdResponse response = IdResponse.of(dataset.getDatasetId(), "Dataset registered successfully");

        return new ApiResponse<>(true, response, "Dataset registered successfully");
    }

    /**
     * Get dataset metadata
     * GET /api/datasets/{id}
     *
     * @param datasetId Dataset identifier
     * @return Dataset metadata
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get dataset info", 
               description = "Retrieve dataset metadata including name, rows, columns, and headers")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ApiResponse<DatasetInfoResponse> getDatasetInfo(@PathVariable("id") UUID datasetId) {
        log.info("Fetching dataset info for: {}", datasetId);

        Dataset dataset = loadDatasetUseCase.loadDataset(datasetId);
        DatasetInfoResponse response = datasetWebMapper.toResponse(dataset);

        return ApiResponse.ok(response);
    }

    /**
     * Get dataset profile with column statistics
     * GET /api/datasets/{id}/profile
     *
     * @param datasetId Dataset identifier
     * @return Dataset profile with column-level statistics
     */
    @GetMapping("/{id}/profile")
    @Operation(summary = "Get dataset profile", 
               description = "Retrieve dataset profile with pandas-like dtype inference and column statistics")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ApiResponse<DatasetProfile> getDatasetProfile(@PathVariable("id") UUID datasetId) {
        log.info("Fetching dataset profile for: {}", datasetId);

        DatasetProfile profile = getDatasetProfileUseCase.getDatasetProfile(datasetId);

        return ApiResponse.ok(profile);
    }
}

