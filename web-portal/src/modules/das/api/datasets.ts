/**
 * Datasets API
 * API calls for dataset management
 */

import { api } from '@/lib/axios';
import { ApiResponse, Dataset, DatasetProfile, PageResponse, FilterRequest } from '../types';

const SERVICE = 'das';
const BASE_URL = '/api/datasets';

export const datasetsApi = {
  /**
   * Register a new dataset from an uploaded file
   */
  registerFromFile: async (fileId: string, name: string, description?: string) => {
    const response = await api.post(`/das${BASE_URL}/from-file/${fileId}`, {
      name,
      description
    });
    return response.data;
  },

  /**
   * Get dataset by ID
   */
  getById: async (datasetId: string) => {
    const response = await api.get(`/das${BASE_URL}/${datasetId}`);
    return response.data;
  },

  /**
   * Get dataset profile
   */
  getProfile: async (datasetId: string) => {
    const response = await api.get(`/das${BASE_URL}/${datasetId}/profile`);
    return response.data;
  },

  /**
   * Get all datasets with pagination and filtering
   */
  getAll: async (
    page: number = 0,
    size: number = 10,
    filter?: FilterRequest
  ) => {
    const response = await api.get(`/das${BASE_URL}`, {
      params: { page, size },
      data: filter
    });
    return response.data;
  },

  /**
   * Delete dataset
   */
  delete: async (datasetId: string) => {
    const response = await api.delete(`/das${BASE_URL}/${datasetId}`);
    return response.data;
  },

  /**
   * Download dataset as CSV
   */
  download: async (datasetId: string) => {
    const response = await api.get(`/das${BASE_URL}/${datasetId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default datasetsApi;

