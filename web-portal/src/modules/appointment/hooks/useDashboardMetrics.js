import { useQuery } from '@tanstack/react-query'
import dashboardApi from '@/modules/appointment/api/dashboardApi'

/**
 * Custom hook for fetching dashboard metrics with React Query
 * Handles caching, refetching, and error states
 */
export function useDashboardMetrics(filterRequest, options = {}) {
  const queryKey = ['dashboardMetrics', filterRequest]

  const query = useQuery({
    queryKey,
    queryFn: () => dashboardApi.getMetrics(filterRequest),
    enabled: Boolean(filterRequest?.dateFrom && filterRequest?.dateTo),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
    ...options,
  })

  return {
    metrics: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  }
}

/**
 * Custom hook for preset dashboard metrics
 */
export function usePresetDashboardMetrics(preset, additionalFilters = null) {
  const queryKey = ['dashboardMetrics', 'preset', preset, additionalFilters]

  const query = useQuery({
    queryKey,
    queryFn: () => dashboardApi.getPresetMetrics(preset, additionalFilters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 1,
  })

  return {
    metrics: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

/**
 * Custom hook for KPI summary
 */
export function useDashboardKPIs(filterRequest) {
  const queryKey = ['dashboardKPIs', filterRequest]

  const query = useQuery({
    queryKey,
    queryFn: () => dashboardApi.getKPIs(filterRequest),
    enabled: Boolean(filterRequest?.dateFrom && filterRequest?.dateTo),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  })

  return {
    kpis: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
