/**
 * RTK Query API for Zone Operations
 *
 * Provides all zone-related API endpoints with caching and invalidation
 *
 * @author CARE Team
 */

import { baseApi } from './baseApi'
import type { Zone } from '../../types'

interface PaginatedZonesResponse {
  content: Zone[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

interface ZoneSearchParams {
  page?: number
  size?: number
  sort?: string
  warehouseId?: string
  zoneType?: string
  status?: string
  temperatureControlled?: boolean
}

export const zoneApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all zones with pagination
    getZones: builder.query<PaginatedZonesResponse, ZoneSearchParams>({
      query: (params) => ({
        url: '/zones',
        method: 'GET',
        params,
      }),
      providesTags: ['Zone'],
    }),

    // Get zone by ID
    getZoneById: builder.query<Zone, string>({
      query: (id) => ({
        url: `/zones/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Zone', id }],
    }),

    // Get zones by warehouse
    getZonesByWarehouse: builder.query<PaginatedZonesResponse, { warehouseId: string; params?: ZoneSearchParams }>({
      query: ({ warehouseId, params }) => ({
        url: '/zones',
        method: 'GET',
        params: { ...params, warehouseId },
      }),
      providesTags: ['Zone'],
    }),

    // Create zone
    createZone: builder.mutation<Zone, Partial<Zone>>({
      query: (body) => ({
        url: '/zones',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Zone'],
    }),

    // Update zone
    updateZone: builder.mutation<Zone, { id: string; data: Partial<Zone> }>({
      query: ({ id, data }) => ({
        url: `/zones/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Zone', id },
        'Zone',
      ],
    }),

    // Delete zone (soft delete)
    deleteZone: builder.mutation<void, string>({
      query: (id) => ({
        url: `/zones/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Zone', id },
        'Zone',
      ],
    }),
  }),
})

export const {
  useGetZonesQuery,
  useGetZoneByIdQuery,
  useGetZonesByWarehouseQuery,
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useDeleteZoneMutation,
} = zoneApi

