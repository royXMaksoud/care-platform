/**
 * Pipelines API
 * API calls for pipeline execution and templates
 */

import { api } from '@/lib/axios';
import { ApiResponse, Pipeline, PipelineTemplate, PipelineResult } from '../types';

const BASE_URL = '/api/pipelines';

export const pipelinesApi = {
  /**
   * Run a pipeline
   */
  run: async (pipeline: Pipeline, async: boolean = false) => {
    const response = await api.post(`/das${BASE_URL}/run`, pipeline, {
      params: { async }
    });
    return response.data;
  },

  /**
   * Get available pipeline templates
   */
  getTemplates: async () => {
    const response = await api.get(`/das${BASE_URL}/templates`);
    return response.data;
  }
};

export default pipelinesApi;

