/**
 * useDatasetProfile Hook
 * Custom hook for fetching dataset profile
 */

import { useState, useEffect } from 'react';
import { DatasetProfile } from '../types';
import { datasetsApi } from '../api/datasets';

export const useDatasetProfile = (datasetId: string | null) => {
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!datasetId) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await datasetsApi.getProfile(datasetId);
        setProfile(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [datasetId]);

  return { profile, loading, error };
};

export default useDatasetProfile;

