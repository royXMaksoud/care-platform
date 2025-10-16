package com.portal.das.web.controller;

import com.portal.das.domain.model.ForecastRequest;
import com.portal.das.domain.model.ForecastResult;
import com.portal.das.service.forecast.ForecastService;
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
 * REST Controller for time series forecasting
 */
@Slf4j
@RestController
@RequestMapping("/api/datasets/{datasetId}/forecast")
@RequiredArgsConstructor
@Tag(name = "Forecast", description = "Time series forecasting APIs")
public class ForecastController {

    private final ForecastService forecastService;

    /**
     * Generate forecast preview
     * POST /api/datasets/{id}/forecast/preview
     *
     * @param datasetId Dataset identifier
     * @param request Forecast parameters
     * @return Forecast result with chart-ready data
     */
    @PostMapping("/preview")
    @Operation(summary = "Forecast preview", 
               description = "Generate lightweight time series forecast using moving average or seasonal naive")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ApiResponse<ForecastResult> forecastPreview(
            @PathVariable UUID datasetId,
            @RequestBody @Valid ForecastRequest request) {
        
        log.info("Generating forecast for dataset: {}", datasetId);

        ForecastResult result = forecastService.preview(datasetId, request);

        return ApiResponse.ok(result);
    }
}

