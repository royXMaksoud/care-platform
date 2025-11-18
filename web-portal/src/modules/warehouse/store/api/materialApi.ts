/**
 * RTK Query API for Material Operations
 *
 * Provides all material-related API endpoints with caching and invalidation
 *
 * @author CARE Team
 */

import { baseApi } from './baseApi'
import type { Material, MaterialFilterOptions } from '../../types'

interface PaginatedMaterialsResponse {
  content: Material[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

export const materialApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all materials with pagination and filters
    getMaterials: builder.query<PaginatedMaterialsResponse, MaterialFilterOptions>({
      query: (params) => ({
        url: '/materials',
        method: 'GET',
        params,
      }),
      providesTags: ['Material'],
    }),

    // Get material by ID
    getMaterialById: builder.query<Material, string>({
      query: (id) => ({
        url: `/materials/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Material', id }],
    }),

    // Create material
    createMaterial: builder.mutation<Material, Partial<Material>>({
      query: (body) => ({
        url: '/materials',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Material'],
    }),

    // Update material
    updateMaterial: builder.mutation<Material, { id: string; data: Partial<Material> }>({
      query: ({ id, data }) => ({
        url: `/materials/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Material', id },
        'Material',
      ],
    }),

    // Delete material (soft delete)
    deleteMaterial: builder.mutation<void, string>({
      query: (id) => ({
        url: `/materials/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Material', id },
        'Material',
      ],
    }),

    // Get materials by category
    getMaterialsByCategory: builder.query<PaginatedMaterialsResponse, { categoryId: string; params?: MaterialFilterOptions }>({
      query: ({ categoryId, params }) => ({
        url: '/materials',
        method: 'GET',
        params: { ...params, categoryId },
      }),
      providesTags: ['Material'],
    }),

    // Get materials by brand
    getMaterialsByBrand: builder.query<PaginatedMaterialsResponse, { brandId: string; params?: MaterialFilterOptions }>({
      query: ({ brandId, params }) => ({
        url: '/materials',
        method: 'GET',
        params: { ...params, brandId },
      }),
      providesTags: ['Material'],
    }),

    // Get low stock materials
    getLowStockMaterials: builder.query<PaginatedMaterialsResponse, MaterialFilterOptions>({
      query: (params) => ({
        url: '/materials',
        method: 'GET',
        params: { ...params, isActive: true },
      }),
      providesTags: ['Material'],
    }),

    // Save custom fields for material
    saveMaterialCustomFields: builder.mutation<any, { id: string; customFields: Record<string, any> }>({
      query: ({ id, customFields }) => ({
        url: `/materials/${id}/custom-fields`,
        method: 'POST',
        body: { customFields },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Material', id }],
    }),

    // Get custom fields for material
    getMaterialCustomFields: builder.query<{ customFields: Record<string, any> }, string>({
      query: (id) => ({
        url: `/materials/${id}/custom-fields`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Material', id }],
    }),
  }),
})

export const {
  useGetMaterialsQuery,
  useGetMaterialByIdQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
  useGetMaterialsByCategoryQuery,
  useGetMaterialsByBrandQuery,
  useGetLowStockMaterialsQuery,
  useSaveMaterialCustomFieldsMutation,
  useGetMaterialCustomFieldsQuery,
} = materialApi
