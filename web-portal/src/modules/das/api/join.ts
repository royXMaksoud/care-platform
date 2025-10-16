/**
 * Join API
 * API calls for joining datasets
 */

import { api } from '@/lib/axios';
import { ApiResponse, JoinRequest, JoinResult } from '../types';

const BASE_URL = '/api/datasets';

export const joinApi = {
  /**
   * Join two datasets
   */
  join: async (request: JoinRequest) => {
    const response = await api.post(`/das${BASE_URL}/join`, request);
    return response.data;
  }
};

export default joinApi;

