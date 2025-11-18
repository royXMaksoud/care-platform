/**
 * RTK Query API for Category Operations
 *
 * Provides all category-related API endpoints with caching and invalidation
 *
 * @author CARE Team
 */

import { baseApi } from './baseApi'
import type { Category, CategoryTreeNode, CategoryFilterOptions } from '../../types'

interface PaginatedCategoriesResponse {
  content: Category[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all categories with pagination and filters
    getCategories: builder.query<PaginatedCategoriesResponse, CategoryFilterOptions>({
      query: (params) => ({
        url: '/categories',
        method: 'GET',
        params,
      }),
      providesTags: ['Category'],
    }),

    // Get categories as tree structure
    getCategoriesTree: builder.query<CategoryTreeNode[], void>({
      query: () => ({
        url: '/categories/tree',
        method: 'GET',
      }),
      providesTags: ['Category'],
    }),

    // Get category by ID
    getCategoryById: builder.query<Category, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Category', id }],
    }),

    // Create category
    createCategory: builder.mutation<Category, Partial<Category>>({
      query: (body) => ({
        url: '/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Category'],
    }),

    // Update category
    updateCategory: builder.mutation<Category, { id: string; data: Partial<Category> }>({
      query: ({ id, data }) => ({
        url: `/categories/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Category', id },
        'Category',
      ],
    }),

    // Delete category (soft delete - cascades to children)
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Category', id },
        'Category',
      ],
    }),

    // Get subcategories by parent ID
    getSubcategories: builder.query<PaginatedCategoriesResponse, { parentId: string; params?: CategoryFilterOptions }>({
      query: ({ parentId, params }) => ({
        url: '/categories',
        method: 'GET',
        params: { ...params, parentId },
      }),
      providesTags: ['Category'],
    }),

    // Get root categories (categories without parent)
    getRootCategories: builder.query<PaginatedCategoriesResponse, CategoryFilterOptions>({
      query: (params) => ({
        url: '/categories',
        method: 'GET',
        params: { ...params, level: 0 },
      }),
      providesTags: ['Category'],
    }),
  }),
})

export const {
  useGetCategoriesQuery,
  useGetCategoriesTreeQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetSubcategoriesQuery,
  useGetRootCategoriesQuery,
} = categoryApi
