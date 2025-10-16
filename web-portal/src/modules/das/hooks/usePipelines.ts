/**
 * usePipelines Hook
 * Custom hook for pipeline execution
 */

import { useState, useEffect } from 'react';
import { Pipeline, PipelineTemplate, PipelineResult } from '../types';
import { pipelinesApi } from '../api/pipelines';

export const usePipelines = () => {
  const [templates, setTemplates] = useState<PipelineTemplate[]>([]);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await pipelinesApi.getTemplates();
      setTemplates(response.data);
    } catch (err: any) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const runPipeline = async (pipeline: Pipeline, async: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await pipelinesApi.run(pipeline, async);
      setResult(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Pipeline execution failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { templates, result, loading, error, runPipeline };
};

export default usePipelines;

