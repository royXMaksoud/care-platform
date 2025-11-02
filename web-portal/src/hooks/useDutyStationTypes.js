import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'

export const useDutyStationTypes = (language = 'en') => {
  const [dutyStationTypes, setDutyStationTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDutyStationTypes = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get(`/access/api/duty-stations/types?language=${language}`)
        const types = data.map(item => ({
          value: item.id,
          label: item.name
        }))
        setDutyStationTypes(types)
      } catch (err) {
        console.error('Failed to fetch duty station types:', err)
        setError(err)
        toast.error('Failed to load duty station types.')
      } finally {
        setLoading(false)
      }
    }

    fetchDutyStationTypes()
  }, [language])

  return { dutyStationTypes, loading, error }
}

