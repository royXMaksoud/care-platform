/**
 * Base RTK Query API Configuration
 * 
 * Provides base API configuration with authentication and error handling
 * 
 * @author CARE Team
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { api } from '@/lib/axios'

const BASE_URL = '/warehouse-service/api/warehouse/v1'

/**
 * Custom base query that uses axios instance for consistency
 */
const baseQuery = async (args: any, _api: any, _extraOptions: any) => {
  try {
    const { url, method = 'GET', body, params } = args
    
    // Use existing axios instance for consistency with interceptors
    let response
    switch (method) {
      case 'GET':
        response = await api.get(`${BASE_URL}${url}`, { params })
        break
      case 'POST':
        response = await api.post(`${BASE_URL}${url}`, body)
        break
      case 'PUT':
        response = await api.put(`${BASE_URL}${url}`, body)
        break
      case 'DELETE':
        response = await api.delete(`${BASE_URL}${url}`)
        break
      default:
        throw new Error(`Unsupported method: ${method}`)
    }
    
    return { data: response.data }
  } catch (error: any) {
    return {
      error: {
        status: error.response?.status,
        data: error.response?.data || error.message,
      },
    }
  }
}

export const baseApi = createApi({
  reducerPath: 'warehouseBaseApi',
  baseQuery,
  tagTypes: [
    'Warehouse',
    'Zone',
    'Bin',
    'Material',
    'Category',
    'Brand',
    'Stock',
    'StockTransaction',
    'StockBalance',
    'Order',
    'CustomFieldDefinition',
    'CustomFieldValue',
    'Report',
  ],
  endpoints: () => ({}),
})

