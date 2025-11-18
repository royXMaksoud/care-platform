/**
 * Warehouse Service API Configuration
 * All warehouse-related API endpoints
 * 
 * Follows the same pattern as appointment-service API structure
 * Base path: /warehouse-service/api/warehouse/v1
 * 
 * @author CARE Team
 */

import { api } from '@/lib/axios'

const SERVICE = 'warehouse-service'
const BASE_PATH = `/${SERVICE}/api/warehouse/v1`

// ===== Warehouses =====
export const warehousesApi = {
  /**
   * Get all warehouses with pagination and filters
   * @param params Query parameters (page, size, sort, filters)
   */
  getAll: (params?: any) => api.get(`${BASE_PATH}/warehouses`, { params }),
  
  /**
   * Get warehouse by ID
   * @param id Warehouse UUID
   */
  getById: (id: string) => api.get(`${BASE_PATH}/warehouses/${id}`),
  
  /**
   * Create a new warehouse
   * @param data Warehouse creation data
   */
  create: (data: any) => api.post(`${BASE_PATH}/warehouses`, data),
  
  /**
   * Update an existing warehouse
   * @param id Warehouse UUID
   * @param data Warehouse update data
   */
  update: (id: string, data: any) => api.put(`${BASE_PATH}/warehouses/${id}`, data),
  
  /**
   * Delete a warehouse (soft delete)
   * @param id Warehouse UUID
   */
  delete: (id: string) => api.delete(`${BASE_PATH}/warehouses/${id}`),
  
  /**
   * Search warehouses with filters
   * @param params Search parameters (parentId, level, nameSearch, isActive, page, size)
   */
  search: (params?: any) => api.get(`${BASE_PATH}/warehouses`, { params }),
}

// ===== Materials =====
export const materialsApi = {
  /**
   * Get all materials with pagination and filters
   */
  getAll: (params?: any) => api.get(`${BASE_PATH}/materials`, { params }),
  
  /**
   * Get material by ID
   */
  getById: (id: string) => api.get(`${BASE_PATH}/materials/${id}`),
  
  /**
   * Create a new material
   */
  create: (data: any) => api.post(`${BASE_PATH}/materials`, data),
  
  /**
   * Update an existing material
   */
  update: (id: string, data: any) => api.put(`${BASE_PATH}/materials/${id}`, data),
  
  /**
   * Delete a material (soft delete)
   */
  delete: (id: string) => api.delete(`${BASE_PATH}/materials/${id}`),
  
  /**
   * Search materials with filters
   */
  search: (params?: any) => api.get(`${BASE_PATH}/materials`, { params }),
  
  /**
   * Get material by determiner (barcode, serial, IMEI, etc.)
   */
  findByDeterminer: (determinerType: string, value: string) => 
    api.get(`${BASE_PATH}/materials/by-determiner`, { 
      params: { determinerType, value } 
    }),
}

// ===== Categories =====
export const categoriesApi = {
  /**
   * Get all categories as tree structure
   */
  getTree: () => api.get(`${BASE_PATH}/categories/tree`),
  
  /**
   * Get all categories with pagination
   */
  getAll: (params?: any) => api.get(`${BASE_PATH}/categories`, { params }),
  
  /**
   * Get category by ID
   */
  getById: (id: string) => api.get(`${BASE_PATH}/categories/${id}`),
  
  /**
   * Create a new category
   */
  create: (data: any) => api.post(`${BASE_PATH}/categories`, data),
  
  /**
   * Update an existing category
   */
  update: (id: string, data: any) => api.put(`${BASE_PATH}/categories/${id}`, data),
  
  /**
   * Delete a category
   */
  delete: (id: string) => api.delete(`${BASE_PATH}/categories/${id}`),
}

// ===== Brands =====
export const brandsApi = {
  /**
   * Get all brands with pagination
   */
  getAll: (params?: any) => api.get(`${BASE_PATH}/brands`, { params }),
  
  /**
   * Get brand by ID
   */
  getById: (id: string) => api.get(`${BASE_PATH}/brands/${id}`),
  
  /**
   * Create a new brand
   */
  create: (data: any) => api.post(`${BASE_PATH}/brands`, data),
  
  /**
   * Update an existing brand
   */
  update: (id: string, data: any) => api.put(`${BASE_PATH}/brands/${id}`, data),
  
  /**
   * Delete a brand
   */
  delete: (id: string) => api.delete(`${BASE_PATH}/brands/${id}`),
  
  /**
   * Search brands
   */
  search: (params?: any) => api.get(`${BASE_PATH}/brands`, { params }),
}

// ===== Stock =====
export const stockApi = {
  /**
   * Get stock levels for a warehouse
   */
  getByWarehouse: (warehouseId: string, params?: any) => 
    api.get(`${BASE_PATH}/stock/warehouse/${warehouseId}`, { params }),
  
  /**
   * Get stock for a material across all warehouses
   */
  getByMaterial: (materialId: string) => 
    api.get(`${BASE_PATH}/stock/material/${materialId}`),
  
  /**
   * Update stock level
   */
  updateStock: (data: any) => api.put(`${BASE_PATH}/stock`, data),
  
  /**
   * Reserve stock
   */
  reserveStock: (data: any) => api.post(`${BASE_PATH}/stock/reserve`, data),
  
  /**
   * Release reserved stock
   */
  releaseStock: (data: any) => api.post(`${BASE_PATH}/stock/release`, data),
  
  /**
   * Check stock thresholds
   */
  checkThresholds: (warehouseId?: string) => 
    api.post(`${BASE_PATH}/stock/check-thresholds/all`, { warehouseId }),
}

// ===== Orders =====
export const ordersApi = {
  /**
   * Get all orders with pagination
   */
  getAll: (params?: any) => api.get(`${BASE_PATH}/orders`, { params }),
  
  /**
   * Get order by ID
   */
  getById: (id: string) => api.get(`${BASE_PATH}/orders/${id}`),
  
  /**
   * Create a new order
   */
  create: (data: any) => api.post(`${BASE_PATH}/orders`, data),
  
  /**
   * Approve an order
   */
  approve: (id: string) => api.post(`${BASE_PATH}/orders/${id}/approve`),
  
  /**
   * Fulfill an order
   */
  fulfill: (id: string, data: any) => api.post(`${BASE_PATH}/orders/${id}/fulfill`, data),
  
  /**
   * Cancel an order
   */
  cancel: (id: string) => api.post(`${BASE_PATH}/orders/${id}/cancel`),
}

// ===== Reports =====
export const reportsApi = {
  /**
   * Get stock summary for a warehouse
   */
  stockSummary: (warehouseId: string) => 
    api.get(`${BASE_PATH}/reports/stock-summary/${warehouseId}`),
  
  /**
   * Get slow moving items report
   */
  slowMovingItems: (params?: any) => 
    api.get(`${BASE_PATH}/reports/slow-moving-items`, { params }),
  
  /**
   * Get items below reorder level
   */
  itemsBelowReorderLevel: (warehouseId?: string) => 
    api.get(`${BASE_PATH}/reports/items-below-reorder-level`, { 
      params: { warehouseId } 
    }),
  
  /**
   * Get material traceability report
   */
  materialTraceability: (materialId: string, warehouseId?: string) => 
    api.get(`${BASE_PATH}/reports/material-traceability/${materialId}`, { 
      params: { warehouseId } 
    }),
  
  /**
   * Get category-wise value report
   */
  categoryValue: (warehouseId?: string) => 
    api.get(`${BASE_PATH}/reports/category-value`, { 
      params: { warehouseId } 
    }),
  
  /**
   * Get AI forecast for material demand
   */
  forecast: (materialId: string, months: number = 6, warehouseId?: string) => 
    api.get(`${BASE_PATH}/reports/forecast/${materialId}`, { 
      params: { months, warehouseId } 
    }),
}

// ===== Custom Field Definitions =====
export const customFieldDefinitionsApi = {
  /**
   * Get all custom field definitions
   * @param params Query parameters (entityType, isActive, search)
   */
  getAll: (params?: any) => api.get(`${BASE_PATH}/custom-field-definitions`, { params }),
  
  /**
   * Get custom field definition by ID
   */
  getById: (id: string) => api.get(`${BASE_PATH}/custom-field-definitions/${id}`),
  
  /**
   * Get field definitions for an entity type
   */
  getByEntityType: (entityType: string) => 
    api.get(`${BASE_PATH}/custom-field-definitions`, { 
      params: { entityType, isActive: true } 
    }),
  
  /**
   * Create a new custom field definition
   */
  create: (data: any) => api.post(`${BASE_PATH}/custom-field-definitions`, data),
  
  /**
   * Update an existing custom field definition
   */
  update: (id: string, data: any) => api.put(`${BASE_PATH}/custom-field-definitions/${id}`, data),
  
  /**
   * Delete a custom field definition
   */
  delete: (id: string) => api.delete(`${BASE_PATH}/custom-field-definitions/${id}`),
}

// ===== Custom Field Values =====
export const customFieldValuesApi = {
  /**
   * Get custom field values for an entity record
   */
  getByEntity: (entityType: string, entityRecordId: string) => 
    api.get(`${BASE_PATH}/custom-field-values/${entityType}/${entityRecordId}`),
  
  /**
   * Set custom field values for an entity record
   */
  setValues: (entityType: string, entityRecordId: string, data: any) => 
    api.post(`${BASE_PATH}/custom-field-values`, {
      entityType,
      entityRecordId,
      values: data,
    }),
  
  /**
   * Update custom field values
   */
  updateValues: (entityType: string, entityRecordId: string, data: any) => 
    api.put(`${BASE_PATH}/custom-field-values/${entityType}/${entityRecordId}`, data),
}

// Export all APIs
export default {
  warehouses: warehousesApi,
  materials: materialsApi,
  categories: categoriesApi,
  brands: brandsApi,
  stock: stockApi,
  orders: ordersApi,
  reports: reportsApi,
  customFieldDefinitions: customFieldDefinitionsApi,
  customFieldValues: customFieldValuesApi,
}

