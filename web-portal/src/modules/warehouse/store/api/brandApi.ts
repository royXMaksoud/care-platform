/**
 * RTK Query API for Brand Operations
 *
 * Provides all brand-related API endpoints with caching and invalidation
 *
 * @author CARE Team
 */

import { baseApi } from './baseApi'
import type { Brand, BrandFilterOptions } from '../../types'

interface PaginatedBrandsResponse {
  content: Brand[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

export const brandApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all brands with pagination and filters
    getBrands: builder.query<PaginatedBrandsResponse, BrandFilterOptions>({
      query: (params) => ({
        url: '/brands',
        method: 'GET',
        params,
      }),
      providesTags: ['Brand'],
    }),

    // Get brand by ID
    getBrandById: builder.query<Brand, string>({
      query: (id) => ({
        url: `/brands/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Brand', id }],
    }),

    // Create brand
    createBrand: builder.mutation<Brand, Partial<Brand>>({
      query: (body) => ({
        url: '/brands',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Brand'],
    }),

    // Update brand
    updateBrand: builder.mutation<Brand, { id: string; data: Partial<Brand> }>({
      query: ({ id, data }) => ({
        url: `/brands/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Brand', id },
        'Brand',
      ],
    }),

    // Delete brand (soft delete)
    deleteBrand: builder.mutation<void, string>({
      query: (id) => ({
        url: `/brands/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Brand', id },
        'Brand',
      ],
    }),

    // Get brands with material count
    getBrandsWithCounts: builder.query<PaginatedBrandsResponse, BrandFilterOptions>({
      query: (params) => ({
        url: '/brands',
        method: 'GET',
        params,
      }),
      providesTags: ['Brand'],
    }),
  }),
})

export const {
  useGetBrandsQuery,
  useGetBrandByIdQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
  useGetBrandsWithCountsQuery,
} = brandApi
