/**
 * Validation API
 * API calls for data quality validation
 */

import { api } from '@/lib/axios';
import { ApiResponse, DataQualityRule, DataQualityReport } from '../types';

const BASE_URL = '/api/datasets';

export const validateApi = {
  /**
   * Validate dataset with quality rules
   */
  validate: async (
    datasetId: string,
    rules: DataQualityRule[],
    maxViolationsPerRule?: number
  ) => {
    const response = await api.post(`/das${BASE_URL}/${datasetId}/validate`, rules, {
      params: { maxViolationsPerRule }
    });
    return response.data;
  }
};

export default validateApi;

