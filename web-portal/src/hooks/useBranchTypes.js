import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'

/**
 * Custom hook to fetch organization branch types from backend
 * Uses code_table_id = "8e5259c3-ca50-4f68-aeb9-d358bb2c8b59"
 */
export const useBranchTypes = (language = 'en') => {
  const [branchTypes, setBranchTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBranchTypes = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch from the backend endpoint
        const { data } = await api.get(`/access/api/organization-branches/types?language=${language}`)

        // Backend returns: { id: UUID, name: String }
        // Map to our expected format: { value, label }
        const types = data.map(item => ({
          value: item.id,
          label: item.name
        }))
        setBranchTypes(types)
      } catch (err) {
        console.error('Failed to fetch branch types:', err)
        setError(err)
        toast.error('Failed to load branch types.')
      } finally {
        setLoading(false)
      }
    }

    fetchBranchTypes()
  }, [language])

  return { branchTypes, loading, error }
}

