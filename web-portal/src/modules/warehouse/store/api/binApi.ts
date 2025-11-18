/**
 * RTK Query API for Bin Operations
 *
 * Provides all bin-related API endpoints with caching and invalidation
 *
 * @author CARE Team
 */

import { baseApi } from './baseApi'
import type { Bin } from '../../types'

interface PaginatedBinsResponse {
  content: Bin[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

interface BinSearchParams {
  page?: number
  size?: number
  sort?: string
  zoneId?: string
  binType?: string
  status?: string
  barcode?: string
}

export const binApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all bins with pagination
    getBins: builder.query<PaginatedBinsResponse, BinSearchParams>({
      query: (params) => ({
        url: '/bins',
        method: 'GET',
        params,
      }),
      providesTags: ['Bin'],
    }),

    // Get bin by ID
    getBinById: builder.query<Bin, string>({
      query: (id) => ({
        url: `/bins/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Bin', id }],
    }),

    // Get bins by zone
    getBinsByZone: builder.query<PaginatedBinsResponse, { zoneId: string; params?: BinSearchParams }>({
      query: ({ zoneId, params }) => ({
        url: '/bins',
        method: 'GET',
        params: { ...params, zoneId },
      }),
      providesTags: ['Bin'],
    }),

    // Create bin
    createBin: builder.mutation<Bin, Partial<Bin>>({
      query: (body) => ({
        url: '/bins',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Bin'],
    }),

    // Update bin
    updateBin: builder.mutation<Bin, { id: string; data: Partial<Bin> }>({
      query: ({ id, data }) => ({
        url: `/bins/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Bin', id },
        'Bin',
      ],
    }),

    // Delete bin (soft delete)
    deleteBin: builder.mutation<void, string>({
      query: (id) => ({
        url: `/bins/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Bin', id },
        'Bin',
      ],
    }),
  }),
})

export const {
  useGetBinsQuery,
  useGetBinByIdQuery,
  useGetBinsByZoneQuery,
  useCreateBinMutation,
  useUpdateBinMutation,
  useDeleteBinMutation,
} = binApi

