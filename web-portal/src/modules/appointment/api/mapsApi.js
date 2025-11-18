import { api } from '@/lib/axios'

const BASE_URL = '/appointment-service/api/admin/appointments/maps'

/**
 * Maps API service for fetching appointment map data as GeoJSON
 */
export const mapsApi = {
  /**
   * Get map data as GeoJSON FeatureCollection
   * @param {Object} mapDataRequest - Filter criteria for map data
   * @returns {Promise<MapDataResponse>}
   */
  getMapData: async (mapDataRequest) => {
    try {
      const response = await api.post(`${BASE_URL}/map-data`, mapDataRequest)
      return response.data
    } catch (error) {
      console.error('Error fetching map data:', error)
      throw error
    }
  },

  /**
   * Get map data using GET request (simpler filters)
   * @param {Object} params - Query parameters
   * @returns {Promise<MapDataResponse>}
   */
  getMapDataGet: async (params = {}) => {
    try {
      const response = await api.get(`${BASE_URL}/map-data`, { params })
      return response.data
    } catch (error) {
      console.error('Error fetching map data (GET):', error)
      throw error
    }
  },
}

export default mapsApi

