/**
 * RTK Query API for Warehouse Operations
 * 
 * Provides all warehouse-related API endpoints with caching and invalidation
 * 
 * @author CARE Team
 */

import { baseApi } from './baseApi'
import type { Warehouse } from '../../types'

interface PaginatedWarehousesResponse {
  content: Warehouse[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

interface WarehouseSearchParams {
  page?: number
  size?: number
  sort?: string
  warehouseType?: string
  isActive?: boolean
  city?: string
  nameSearch?: string
}

export const warehouseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all warehouses with pagination
    getWarehouses: builder.query<PaginatedWarehousesResponse, WarehouseSearchParams>({
      query: (params) => ({
        url: '/warehouses',
        method: 'GET',
        params,
      }),
      providesTags: ['Warehouse'],
    }),

    // Get warehouse by ID
    getWarehouseById: builder.query<Warehouse, string>({
      query: (id) => ({
        url: `/warehouses/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Warehouse', id }],
    }),

    // Create warehouse
    createWarehouse: builder.mutation<Warehouse, Partial<Warehouse>>({
      query: (body) => ({
        url: '/warehouses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Warehouse'],
    }),

    // Update warehouse
    updateWarehouse: builder.mutation<Warehouse, { id: string; data: Partial<Warehouse> }>({
      query: ({ id, data }) => ({
        url: `/warehouses/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Warehouse', id },
        'Warehouse',
      ],
    }),

    // Delete warehouse (soft delete)
    deleteWarehouse: builder.mutation<void, string>({
      query: (id) => ({
        url: `/warehouses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Warehouse', id },
        'Warehouse',
      ],
    }),

    // Restore warehouse (if soft delete is supported)
    restoreWarehouse: builder.mutation<Warehouse, string>({
      query: (id) => ({
        url: `/warehouses/${id}/restore`,
        method: 'POST',
      }),
      invalidatesTags: ['Warehouse'],
    }),
  }),
})

export const {
  useGetWarehousesQuery,
  useGetWarehouseByIdQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
  useRestoreWarehouseMutation,
} = warehouseApi

