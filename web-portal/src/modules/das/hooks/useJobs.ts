/**
 * useJobs Hook
 * Custom hook for job monitoring
 */

import { useState, useEffect } from 'react';
import { Job } from '../types';
import { jobsApi } from '../api/jobs';

export const useJobs = (jobId: string | null, autoSubscribe: boolean = false) => {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    if (autoSubscribe) {
      // Subscribe to job events via SSE
      const eventSource = jobsApi.subscribeToEvents(
        jobId,
        (updatedJob) => {
          setJob(updatedJob);
          // Close connection when job is complete
          if (updatedJob.status === 'SUCCEEDED' || updatedJob.status === 'FAILED') {
            eventSource.close();
          }
        },
        (err) => {
          setError('Failed to subscribe to job updates');
          console.error(err);
        }
      );

      return () => {
        eventSource.close();
      };
    } else {
      // Fetch job status once
      fetchJob();
    }
  }, [jobId, autoSubscribe]);

  const fetchJob = async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await jobsApi.getById(jobId);
      setJob(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch job');
    } finally {
      setLoading(false);
    }
  };

  return { job, loading, error, refetch: fetchJob };
};

export default useJobs;

