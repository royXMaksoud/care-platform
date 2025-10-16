/**
 * useValidation Hook
 * Custom hook for data quality validation
 */

import { useState } from 'react';
import { DataQualityRule, DataQualityReport } from '../types';
import { validateApi } from '../api/validate';

export const useValidation = () => {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = async (datasetId: string, rules: DataQualityRule[], maxViolations?: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await validateApi.validate(datasetId, rules, maxViolations);
      setReport(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Validation failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { report, loading, error, validate };
};

export default useValidation;

