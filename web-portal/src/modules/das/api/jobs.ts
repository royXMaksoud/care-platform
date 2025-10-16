/**
 * Jobs API
 * API calls for asynchronous job management
 */

import { api } from '@/lib/axios';
import { ApiResponse, Job } from '../types';

const BASE_URL = '/api/jobs';
const API_GATEWAY = import.meta.env.VITE_API_URL ?? 'http://localhost:6060';

export const jobsApi = {
  /**
   * Get job status by ID
   */
  getById: async (jobId: string) => {
    const response = await api.get(`/das${BASE_URL}/${jobId}`);
    return response.data;
  },

  /**
   * Subscribe to job events (Server-Sent Events)
   */
  subscribeToEvents: (jobId: string, onMessage: (job: Job) => void, onError?: (error: any) => void) => {
    const eventSource = new EventSource(`${API_GATEWAY}/das${BASE_URL}/${jobId}/events`);
    
    eventSource.onmessage = (event) => {
      const job = JSON.parse(event.data);
      onMessage(job);
    };

    eventSource.onerror = (error) => {
      if (onError) {
        onError(error);
      }
      eventSource.close();
    };

    return eventSource;
  }
};

export default jobsApi;

