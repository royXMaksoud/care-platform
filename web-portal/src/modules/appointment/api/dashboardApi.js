import { api } from '@/lib/axios'

const BASE_URL = '/appointment/api/admin/appointments/dashboard'
const REPORTS_URL = '/appointment/api/admin/appointments/reports'

/**
 * Dashboard API service for appointment analytics and reporting
 */
export const dashboardApi = {
  /**
   * Get comprehensive dashboard metrics with filters
   * @param {Object} filterRequest - Filter criteria (dateFrom, dateTo, serviceTypeIds, etc.)
   * @returns {Promise<DashboardMetricsResponse>}
   */
  getMetrics: async (filterRequest) => {
    try {
      const response = await api.post(`${BASE_URL}/metrics`, filterRequest)
      return response.data
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
      throw error
    }
  },

  /**
   * Get KPI summary cards (quick metrics)
   * @param {Object} filterRequest - Optional filter criteria
   * @returns {Promise<KPISummary>}
   */
  getKPIs: async (filterRequest) => {
    try {
      const response = await api.post(`${BASE_URL}/kpis`, filterRequest)
      return response.data
    } catch (error) {
      console.error('Error fetching KPIs:', error)
      throw error
    }
  },

  /**
   * Get preset dashboard metrics (quick date filters)
   * @param {string} preset - Preset period (TODAY, THIS_WEEK, THIS_MONTH, THIS_YEAR, LAST_30_DAYS, LAST_90_DAYS)
   * @param {Object} additionalFilters - Additional filters to merge with preset
   * @returns {Promise<DashboardMetricsResponse>}
   */
  getPresetMetrics: async (preset, additionalFilters) => {
    try {
      const response = await api.post(
        `${BASE_URL}/metrics/preset/${preset}`,
        additionalFilters
      )
      return response.data
    } catch (error) {
      console.error(`Error fetching preset metrics (${preset}):`, error)
      throw error
    }
  },
}

/**
 * Excel Reports API service for generating various appointment reports
 */
export const excelReportsApi = {
  /**
   * Generate detailed appointment report
   * @param {Object} filterRequest - Filter criteria
   * @returns {Promise<Blob>} - Excel file
   */
  generateDetailedReport: async (filterRequest) => {
    try {
      const response = await api.post(`${REPORTS_URL}/detailed`, filterRequest, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      console.error('Error generating detailed report:', error)
      throw error
    }
  },

  /**
   * Generate statistical report
   * @param {Object} filterRequest - Filter criteria
   * @returns {Promise<Blob>} - Excel file
   */
  generateStatisticalReport: async (filterRequest) => {
    try {
      const response = await api.post(`${REPORTS_URL}/statistical`, filterRequest, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      console.error('Error generating statistical report:', error)
      throw error
    }
  },

  /**
   * Generate center performance report
   * @param {Object} filterRequest - Filter criteria
   * @returns {Promise<Blob>} - Excel file
   */
  generateCenterReport: async (filterRequest) => {
    try {
      const response = await api.post(`${REPORTS_URL}/center`, filterRequest, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      console.error('Error generating center report:', error)
      throw error
    }
  },

  /**
   * Generate organization performance report
   * @param {Object} filterRequest - Filter criteria
   * @returns {Promise<Blob>} - Excel file
   */
  generateOrganizationReport: async (filterRequest) => {
    try {
      const response = await api.post(`${REPORTS_URL}/organization`, filterRequest, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      console.error('Error generating organization report:', error)
      throw error
    }
  },

  /**
   * Generate priority distribution report
   * @param {Object} filterRequest - Filter criteria
   * @returns {Promise<Blob>} - Excel file
   */
  generatePriorityReport: async (filterRequest) => {
    try {
      const response = await api.post(`${REPORTS_URL}/priority`, filterRequest, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      console.error('Error generating priority report:', error)
      throw error
    }
  },
}

export default dashboardApi
