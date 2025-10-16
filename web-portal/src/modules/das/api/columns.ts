/**
 * Columns API
 * API calls for column analysis and summary statistics
 */

import { api } from '@/lib/axios';
import { ApiResponse, ColumnSummary, ChartData } from '../types';

const BASE_URL = '/api/datasets';

export const columnsApi = {
  /**
   * Get column summary statistics
   */
  getSummary: async (datasetId: string, columnName: string) => {
    const response = await api.get(`/das${BASE_URL}/${datasetId}/columns/${columnName}/summary`);
    return response.data;
  },

  /**
   * Get chart data for column
   */
  getCharts: async (datasetId: string, columnName: string) => {
    const response = await api.get(`/das${BASE_URL}/${datasetId}/columns/${columnName}/charts`);
    return response.data;
  }
};

export default columnsApi;

