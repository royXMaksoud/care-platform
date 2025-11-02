// Appointment Service API Configuration
// All appointment-related API endpoints

import { api } from '@/lib/axios'

const SERVICE = 'appointment-service'

// ===== ServiceTypes =====
export const serviceTypesApi = {
  getAll: (params) => api.get(`/${SERVICE}/api/admin/service-types`, { params }),
  getById: (id) => api.get(`/${SERVICE}/api/admin/service-types/${id}`),
  create: (data) => api.post(`/${SERVICE}/api/admin/service-types`, data),
  update: (id, data) => api.put(`/${SERVICE}/api/admin/service-types/${id}`, data),
  delete: (id) => api.delete(`/${SERVICE}/api/admin/service-types/${id}`),
  filter: (filterData, params) => api.post(`/${SERVICE}/api/admin/service-types/filter`, filterData, { params }),
  getMeta: () => api.get(`/${SERVICE}/api/admin/service-types/meta`),
  getLookup: () => api.get(`/${SERVICE}/api/admin/service-types/lookup`),
}

// ===== ActionTypes =====
export const actionTypesApi = {
  getAll: (params) => api.get(`/${SERVICE}/api/admin/action-types`, { params }),
  getById: (id) => api.get(`/${SERVICE}/api/admin/action-types/${id}`),
  create: (data) => api.post(`/${SERVICE}/api/admin/action-types`, data),
  update: (id, data) => api.put(`/${SERVICE}/api/admin/action-types/${id}`, data),
  delete: (id) => api.delete(`/${SERVICE}/api/admin/action-types/${id}`),
  filter: (filterData, params) => api.post(`/${SERVICE}/api/admin/action-types/filter`, filterData, { params }),
  getMeta: () => api.get(`/${SERVICE}/api/admin/action-types/meta`),
  getLookup: () => api.get(`/${SERVICE}/api/admin/action-types/lookup`),
}

// ===== Schedules =====
export const schedulesApi = {
  getAll: (params) => api.get(`/${SERVICE}/api/admin/schedules`, { params }),
  getById: (id) => api.get(`/${SERVICE}/api/admin/schedules/${id}`),
  create: (data) => api.post(`/${SERVICE}/api/admin/schedules`, data),
  update: (id, data) => api.put(`/${SERVICE}/api/admin/schedules/${id}`, data),
  delete: (id) => api.delete(`/${SERVICE}/api/admin/schedules/${id}`),
  filter: (filterData, params) => api.post(`/${SERVICE}/api/admin/schedules/filter`, filterData, { params }),
  getMeta: () => api.get(`/${SERVICE}/api/admin/schedules/meta`),
  getLookup: () => api.get(`/${SERVICE}/api/admin/schedules/lookup`),
}

// ===== Holidays =====
export const holidaysApi = {
  getAll: (params) => api.get(`/${SERVICE}/api/admin/holidays`, { params }),
  getById: (id) => api.get(`/${SERVICE}/api/admin/holidays/${id}`),
  create: (data) => api.post(`/${SERVICE}/api/admin/holidays`, data),
  update: (id, data) => api.put(`/${SERVICE}/api/admin/holidays/${id}`, data),
  delete: (id) => api.delete(`/${SERVICE}/api/admin/holidays/${id}`),
  filter: (filterData, params) => api.post(`/${SERVICE}/api/admin/holidays/filter`, filterData, { params }),
  getMeta: () => api.get(`/${SERVICE}/api/admin/holidays/meta`),
  getLookup: () => api.get(`/${SERVICE}/api/admin/holidays/lookup`),
}

// ===== Beneficiaries =====
export const beneficiariesApi = {
  getAll: (params) => api.get(`/${SERVICE}/api/admin/beneficiaries`, { params }),
  getById: (id) => api.get(`/${SERVICE}/api/admin/beneficiaries/${id}`),
  create: (data) => api.post(`/${SERVICE}/api/admin/beneficiaries`, data),
  update: (id, data) => api.put(`/${SERVICE}/api/admin/beneficiaries/${id}`, data),
  delete: (id) => api.delete(`/${SERVICE}/api/admin/beneficiaries/${id}`),
  filter: (filterData, params) => api.post(`/${SERVICE}/api/admin/beneficiaries/filter`, filterData, { params }),
  getMeta: () => api.get(`/${SERVICE}/api/admin/beneficiaries/meta`),
  getLookup: () => api.get(`/${SERVICE}/api/admin/beneficiaries/lookup`),
}

// ===== Appointments =====
export const appointmentsApi = {
  getAll: (params) => api.get(`/${SERVICE}/api/admin/appointments`, { params }),
  getById: (id) => api.get(`/${SERVICE}/api/admin/appointments/${id}`),
  filter: (filterData, params) => api.post(`/${SERVICE}/api/admin/appointments/filter`, filterData, { params }),
  getMeta: () => api.get(`/${SERVICE}/api/admin/appointments/meta`),
  updateStatus: (id, data) => api.put(`/${SERVICE}/api/admin/appointments/${id}/status`, data),
  cancel: (id, data) => api.post(`/${SERVICE}/api/admin/appointments/${id}/cancel`, data),
  transfer: (id, data) => api.post(`/${SERVICE}/api/admin/appointments/${id}/transfer`, data),
  getHistory: (id) => api.get(`/${SERVICE}/api/admin/appointments/${id}/history`),
}

// Export all
export default {
  serviceTypes: serviceTypesApi,
  actionTypes: actionTypesApi,
  schedules: schedulesApi,
  holidays: holidaysApi,
  beneficiaries: beneficiariesApi,
  appointments: appointmentsApi,
}

