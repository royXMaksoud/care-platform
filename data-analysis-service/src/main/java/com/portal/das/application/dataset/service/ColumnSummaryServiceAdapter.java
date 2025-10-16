package com.portal.das.application.dataset.service;

import com.portal.das.domain.model.ChartData;
import com.portal.das.domain.model.ColumnSummary;
import com.portal.das.domain.ports.in.dataset.GetColumnSummaryUseCase;
import com.portal.das.service.profile.ColumnSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Adapter service for column summary operations
 * Implements use cases by delegating to ColumnSummaryService
 */
@Service
@RequiredArgsConstructor
public class ColumnSummaryServiceAdapter implements GetColumnSummaryUseCase {

    private final ColumnSummaryService columnSummaryService;

    @Override
    public ColumnSummary getColumnSummary(UUID datasetId, String columnName) {
        return columnSummaryService.summary(datasetId, columnName);
    }

    @Override
    public ChartData getColumnChartData(UUID datasetId, String columnName) {
        return columnSummaryService.getChartData(datasetId, columnName);
    }
}

