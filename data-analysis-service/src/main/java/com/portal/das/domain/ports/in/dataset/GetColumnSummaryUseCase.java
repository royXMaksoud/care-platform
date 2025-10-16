package com.portal.das.domain.ports.in.dataset;

import com.portal.das.domain.model.ChartData;
import com.portal.das.domain.model.ColumnSummary;

import java.util.UUID;

/**
 * Use case for getting column summary and chart data
 */
public interface GetColumnSummaryUseCase {
    /**
     * Get summary statistics for a column
     *
     * @param datasetId Dataset identifier
     * @param columnName Column name
     * @return Column summary
     */
    ColumnSummary getColumnSummary(UUID datasetId, String columnName);

    /**
     * Get chart-ready data for a column
     *
     * @param datasetId Dataset identifier
     * @param columnName Column name
     * @return Chart data
     */
    ChartData getColumnChartData(UUID datasetId, String columnName);
}

