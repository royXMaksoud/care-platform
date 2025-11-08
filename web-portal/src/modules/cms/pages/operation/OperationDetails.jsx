import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

export default function OperationDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [operation, setOperation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Dropdown data
  const [organizations, setOrganizations] = useState([])
  const [countries, setCountries] = useState([])
  const [locations, setLocations] = useState([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(true)
  
  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })),
    [countries]
  )

  const { getSectionPermissions } = usePermissionCheck()
  const permissions = useMemo(() => 
    getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS), 
    [getSectionPermissions]
  )
  const canEdit = permissions.canUpdate

  useEffect(() => {
    fetchOperation()
    fetchDropdownData()
  }, [id])

  const fetchOperation = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/access/api/operations/${id}`)
      setOperation(response.data)
    } catch (error) {
      console.error('Failed to fetch operation:', error)
      toast.error('Failed to load operation details')
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    let isMounted = true // ✅ Cleanup flag to prevent double calls in StrictMode
    
    try {
      setLoadingDropdowns(true)
      
      // Get user's language or default to 'en'
      const userLanguage = localStorage.getItem('userLanguage') || 'en'
      
      // ✅ Use Promise.all to fetch all data in parallel (faster!)
      const [orgResponse, countryResponse, locationResponse] = await Promise.all([
        api.post('/access/api/organization-languages/filter', {
          criteria: [{ field: 'language', operator: 'EQUAL', value: userLanguage }]
        }, { params: { page: 0, size: 1000 } }),
        
        api.post('/access/api/code-country-languages/filter', {
          criteria: [{ field: 'language', operator: 'EQUAL', value: userLanguage }]
        }, { params: { page: 0, size: 1000 } }),
        
        api.post('/access/api/location-languages/filter', {
          criteria: [{ field: 'language', operator: 'EQUAL', value: userLanguage }]
        }, { params: { page: 0, size: 1000 } })
      ])
      
      // ✅ Only update state if component is still mounted
      if (isMounted) {
        // Filter only active items on client-side
        const activeOrgs = (orgResponse.data.content || []).filter(item => item.isActive !== false)
        const activeCountries = (countryResponse.data.content || []).filter(item => item.isActive !== false)
        const activeLocations = (locationResponse.data.content || []).filter(item => item.isActive !== false)
        
        setOrganizations(activeOrgs)
        setCountries(activeCountries)
        setLocations(activeLocations)
      }
    } catch (error) {
      if (isMounted) {
        console.error('Failed to fetch dropdown data:', error)
        toast.error('Failed to load dropdown options')
      }
    } finally {
      if (isMounted) {
        setLoadingDropdowns(false)
      }
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!canEdit) {
      toast.error('You do not have permission to edit operations')
      return
    }

    try {
      setSaving(true)
      
      // Prepare payload with proper UUID handling
      const payload = {
        ...operation,
        organizationId: operation.organizationId || null,
        countryId: operation.countryId || null,
        locationId: operation.locationId || null,
        statusId: operation.statusId || null,
        isActive: true, // ✅ Always TRUE - cannot be deactivated
      }
      
      await api.put(`/access/api/operations/${id}`, payload)
      toast.success('Operation updated successfully')
      fetchOperation()
    } catch (error) {
      console.error('Failed to update operation:', error)
      toast.error('Failed to update operation')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading operation details...</p>
        </div>
      </div>
    )
  }

  if (!operation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Operation Not Found</h2>
          <button
            onClick={() => navigate('/cms/operations')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Operations
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <CMSBreadcrumb currentPageLabel={operation?.name || t('cms.operations')} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {operation.name}
        </h1>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code *
              </label>
              <input
                type="text"
                value={operation.code || ''}
                onChange={(e) => setOperation({ ...operation, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={operation.name || ''}
                onChange={(e) => setOperation({ ...operation, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization
              </label>
              <select
                value={operation.organizationId || ''}
                onChange={(e) => setOperation({ ...operation, organizationId: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canEdit || loadingDropdowns}
              >
                <option value="">-- Select Organization --</option>
                {organizations.map(org => (
                  <option key={org.organizationId} value={org.organizationId}>
                    {org.name}
                  </option>
                ))}
              </select>
              {loadingDropdowns && (
                <p className="text-xs text-gray-500 mt-1">Loading organizations...</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                value={operation.countryId || ''}
                onChange={(e) => setOperation({ ...operation, countryId: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canEdit || loadingDropdowns}
              >
                <option value="">-- Select Country --</option>
                {sortedCountries.map(country => (
                  <option key={country.countryId} value={country.countryId}>
                    {country.name}
                  </option>
                ))}
              </select>
              {loadingDropdowns && (
                <p className="text-xs text-gray-500 mt-1">Loading countries...</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={operation.locationId || ''}
                onChange={(e) => setOperation({ ...operation, locationId: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canEdit || loadingDropdowns}
              >
                <option value="">-- Select Location --</option>
                {locations.map(location => (
                  <option key={location.locationId} value={location.locationId}>
                    {location.name}
                  </option>
                ))}
              </select>
              {loadingDropdowns && (
                <p className="text-xs text-gray-500 mt-1">Loading locations...</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={operation.description || ''}
                onChange={(e) => setOperation({ ...operation, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={operation.startDate || ''}
                onChange={(e) => setOperation({ ...operation, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={operation.endDate || ''}
                onChange={(e) => setOperation({ ...operation, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canEdit}
              />
            </div>

            {/* ✅ isActive removed - always TRUE by default */}
          </div>

          {canEdit && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/cms/operations')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

