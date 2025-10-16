/**
 * useJoin Hook
 * Custom hook for joining datasets
 */

import { useState } from 'react';
import { JoinRequest, JoinResult } from '../types';
import { joinApi } from '../api/join';

export const useJoin = () => {
  const [result, setResult] = useState<JoinResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async (request: JoinRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await joinApi.join(request);
      setResult(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Join failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, join };
};

export default useJoin;

