import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'

/**
 * Hook to fetch organization types from CodeTableValueLanguage
 * @param {string} language - Language code (default: 'en')
 * @returns {object} - { organizationTypes, loading, error }
 */
export function useOrganizationTypes(language = 'en') {
  const [organizationTypes, setOrganizationTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrganizationTypes = async () => {
      setLoading(true)
      setError(null)

      try {
        // Use the simplified endpoint that uses CodeTableValuesByTableProvider
        const { data } = await api.get('/access/api/organizations/types', {
          params: {
            language: language
          }
        })

        // Backend returns: { id: UUID, name: String }
        // Map to our expected format: { value, label }
        const types = data.map(item => ({
          value: item.id,
          label: item.name  // ✅ Backend uses "name" not "label"
        }))

        setOrganizationTypes(types)
      } catch (err) {
        console.error('Failed to fetch organization types:', err)
        setError(err.response?.data?.message || 'Failed to load organization types')
        
        // Fallback to empty array
        setOrganizationTypes([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizationTypes()
  }, [language])

  return { organizationTypes, loading, error }
}

