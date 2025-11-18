import { useQuery } from '@tanstack/react-query'
import mapsApi from '@/modules/appointment/api/mapsApi'

/**
 * Custom hook for fetching appointment map data with React Query
 * Handles caching, refetching, and error states
 * 
 * @param {Object} mapDataRequest - Map data request with filters
 * @param {Object} options - React Query options
 * @returns {Object} Query result with map data, loading, error states
 */
export function useAppointmentsMap(mapDataRequest, options = {}) {
  const queryKey = ['appointmentsMap', mapDataRequest]

  const query = useQuery({
    queryKey,
    queryFn: () => mapsApi.getMapData(mapDataRequest),
    enabled: Boolean(mapDataRequest),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    ...options,
  })

  return {
    mapData: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  }
}

/**
 * Custom hook for map data with default date range (last 30 days)
 */
export function useAppointmentsMapDefault(options = {}) {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const defaultRequest = {
    dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
    dateTo: today.toISOString().split('T')[0],
    includeStatistics: true,
  }

  return useAppointmentsMap(defaultRequest, options)
}

