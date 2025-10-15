import { useEffect, useState } from 'react'
import { api } from '@/lib/axios'

/**
 * Simple dropdown fetcher: GET /access/api/simple-dropdowns/{key}
 * - params: optional query params (e.g., { lang: 'ar' })
 */
export function useSimpleDropdown(key, params = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        setLoading(true)
        setError(null)
        const res = await api.get(`/access/api/simple-dropdowns/${key}`, { params })
        if (!cancelled) setItems(Array.isArray(res.data) ? res.data : [])
      } catch (e) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [key, JSON.stringify(params)])

  return { items, loading, error }
}
    