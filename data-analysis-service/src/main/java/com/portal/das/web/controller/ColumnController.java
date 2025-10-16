package com.portal.das.web.controller;

import com.portal.das.domain.model.ChartData;
import com.portal.das.domain.model.ColumnSummary;
import com.portal.das.domain.ports.in.dataset.GetColumnSummaryUseCase;
import com.sharedlib.core.web.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for column-level operations
 * Provides summary statistics and chart-ready data
 */
@Slf4j
@RestController
@RequestMapping("/api/datasets/{datasetId}/columns")
@RequiredArgsConstructor
@Tag(name = "Column Analysis", description = "APIs for column-level analysis and visualization")
public class ColumnController {

    private final GetColumnSummaryUseCase getColumnSummaryUseCase;

    /**
     * Get column summary statistics (pandas describe() style)
     * GET /api/datasets/{id}/columns/{name}/summary
     *
     * @param datasetId Dataset identifier
     * @param columnName Column name
     * @return Column summary with statistics
     */
    @GetMapping("/{columnName}/summary")
    @Operation(summary = "Get column summary", 
               description = "Get pandas-like describe() statistics for a column including count, nulls, unique values, and type-specific stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ApiResponse<ColumnSummary> getColumnSummary(
            @PathVariable UUID datasetId,
            @PathVariable String columnName) {
        
        log.info("Getting summary for column {} in dataset {}", columnName, datasetId);

        ColumnSummary summary = getColumnSummaryUseCase.getColumnSummary(datasetId, columnName);

        return ApiResponse.ok(summary);
    }

    /**
     * Get chart-ready data for a column
     * GET /api/datasets/{id}/columns/{name}/charts
     *
     * @param datasetId Dataset identifier
     * @param columnName Column name
     * @return Chart data (histogram, categories, or timeseries)
     */
    @GetMapping("/{columnName}/charts")
    @Operation(summary = "Get chart data", 
               description = "Get chart-ready data for visualization. Returns histogram for numeric, categories for string, timeseries for datetime")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ApiResponse<ChartData> getColumnChartData(
            @PathVariable UUID datasetId,
            @PathVariable String columnName) {
        
        log.info("Getting chart data for column {} in dataset {}", columnName, datasetId);

        ChartData chartData = getColumnSummaryUseCase.getColumnChartData(datasetId, columnName);

        return ApiResponse.ok(chartData);
    }
}

