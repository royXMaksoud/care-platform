/**
 * useDatasets Hook
 * Custom hook for dataset management
 */

import { useState, useEffect } from 'react';
import { Dataset, PageResponse, FilterRequest } from '../types';
import { datasetsApi } from '../api/datasets';

export const useDatasets = (page: number = 0, size: number = 10, filter?: FilterRequest) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await datasetsApi.getAll(page, size, filter);
      setDatasets(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch datasets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [page, size, filter]);

  return {
    datasets,
    loading,
    error,
    totalPages,
    totalElements,
    refetch: fetchDatasets
  };
};

export default useDatasets;

