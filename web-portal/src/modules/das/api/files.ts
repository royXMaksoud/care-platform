/**
 * Files API
 * API calls for file upload and management
 */

import { api } from '@/lib/axios';
import { ApiResponse, UploadedFile, PageResponse, FilterRequest } from '../types';

const BASE_URL = '/api/files';

export const filesApi = {
  /**
   * Upload one or more files
   */
  upload: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post(`/das${BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Get file by ID
   */
  getById: async (fileId: string) => {
    const response = await api.get(`/das${BASE_URL}/${fileId}`);
    return response.data;
  },

  /**
   * Get all files with pagination and filtering
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
   * Delete file
   */
  delete: async (fileId: string) => {
    const response = await api.delete(`/das${BASE_URL}/${fileId}`);
    return response.data;
  }
};

export default filesApi;

