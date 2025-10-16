/**
 * useColumnSummary Hook
 * Custom hook for fetching column summary and chart data
 */

import { useState, useEffect } from 'react';
import { ColumnSummary, ChartData } from '../types';
import { columnsApi } from '../api/columns';

export const useColumnSummary = (datasetId: string | null, columnName: string | null) => {
  const [summary, setSummary] = useState<ColumnSummary | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!datasetId || !columnName) {
      setSummary(null);
      setChartData(null);
      return;
    }

    const fetchColumnData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [summaryResponse, chartResponse] = await Promise.all([
          columnsApi.getSummary(datasetId, columnName),
          columnsApi.getCharts(datasetId, columnName)
        ]);

        setSummary(summaryResponse.data);
        setChartData(chartResponse.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch column data');
      } finally {
        setLoading(false);
      }
    };

    fetchColumnData();
  }, [datasetId, columnName]);

  return { summary, chartData, loading, error };
};

export default useColumnSummary;

