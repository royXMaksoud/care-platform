import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'

export default function LocationDetailsPage() {
  const { locationId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('info')
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [countries, setCountries] = useState([])
  const [loadingCountries, setLoadingCountries] = useState(true)

  // Get permissions
  const { getSectionPermissions, isLoading: permissionsLoading } = usePermissionCheck()
  
  const permissions = useMemo(() => 
    // Use CODE_COUNTRY permissions for Location (same permissions)
    getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS),
    [getSectionPermissions]
  )

  const canUpdate = permissions.canUpdate
  const canManageLanguages = permissions.canCreate || permissions.canUpdate || permissions.canDelete

  // Fetch location details
  useEffect(() => {
    fetchLocation()
    fetchCountries()
  }, [locationId])

  const fetchLocation = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/access/api/locations/${locationId}`)
      setLocation(data)
      setFormData(data)
    } catch (err) {
      toast.error('Failed to load location details')
      navigate('/cms/location')
    } finally {
      setLoading(false)
    }
  }

  const fetchCountries = async () => {
    setLoadingCountries(true)
    try {
      const { data } = await api.post('/access/api/code-countries/filter', {
        criteria: [{ 
          key: 'isActive', 
          operator: 'EQUAL', 
          value: true,
          dataType: 'BOOLEAN' // ✅ Specify data type for correct comparison
        }]
      }, {
        params: { page: 0, size: 1000 }
      })
      setCountries(data.content || [])
    } catch (err) {
      console.error('Failed to load countries:', err)
    } finally {
      setLoadingCountries(false)
    }
  }

  const handleUpdate = async () => {
    try {
      const payload = {
        locationId: locationId,
        countryId: formData.countryId,
        code: formData.code?.trim(),
        name: formData.name?.trim(),
        level: formData.level ? parseInt(formData.level) : null,
        parentLocationId: formData.parentLocationId?.trim() || null,
        lineagePath: formData.lineagePath?.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        isActive: true, // ✅ Always TRUE - cannot be deactivated
        ...(formData.rowVersion != null ? { rowVersion: formData.rowVersion } : {}),
      }
      
      console.log('💾 Updating location with payload:', payload)
      await api.put(`/access/api/locations/${locationId}`, payload)
      console.log('✅ Location updated successfully')
      toast.success('Location updated successfully')
      setEditing(false)
      fetchLocation()
    } catch (err) {
      console.error('❌ Failed to update location:', err.response?.data || err.message)
      toast.error(err?.response?.data?.message || 'Failed to update location')
    }
  }

  const languageColumns = [
    { id: 'language', accessorKey: 'language', header: 'Language', cell: (info) => info.getValue() },
    { id: 'name', accessorKey: 'name', header: 'Name', cell: (info) => info.getValue() },
    { id: 'description', accessorKey: 'description', header: 'Description', cell: (info) => info.getValue() || '-' },
    {
      id: 'isActive',
      accessorKey: 'isActive',
      header: 'Status',
      cell: (info) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          info.getValue() 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {info.getValue() ? 'Active' : 'Inactive'}
        </span>
      ),
      meta: { type: 'boolean' },
    },
  ]

  const languageFields = [
    { type: 'text', name: 'language', label: 'Language Code', required: true, placeholder: 'e.g., en, ar, fr' },
    { type: 'text', name: 'name', label: 'Name', required: true },
    { type: 'textarea', name: 'description', label: 'Description', rows: 3 },
    { type: 'checkbox', name: 'isActive', label: 'Active', defaultValue: true },
  ]

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-3"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!location) {
    return (
      <div className="p-6">
        <p>Location not found</p>
      </div>
    )
  }

  const countryName = countries.find(c => c.countryId === location.countryId)?.name || location.countryId

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/cms/location')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
            <p className="text-sm text-gray-500">Code: {location.code} • Level: {location.level ?? 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'info' && canUpdate && (
            <>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setFormData(location)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Save Changes
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 border-b-2 font-medium transition ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Information
          </button>
          <button
            onClick={() => setActiveTab('languages')}
            className={`py-3 border-b-2 font-medium transition ${
              activeTab === 'languages'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Languages
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'info' && (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Location Details</h2>
              <div className="grid grid-cols-2 gap-6">
                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  {editing ? (
                    <select
                      value={formData.countryId || ''}
                      onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loadingCountries}
                    >
                      <option value="">Select Country...</option>
                      {countries.map(c => (
                        <option key={c.countryId} value={c.countryId}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">{countryName}</p>
                  )}
                </div>

                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location Code</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{location.code || '-'}</p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{location.name || '-'}</p>
                  )}
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  {editing ? (
                    <input
                      type="number"
                      value={formData.level ?? ''}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{location.level ?? '-'}</p>
                  )}
                </div>

                {/* Lineage Path */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lineage Path</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.lineagePath || ''}
                      onChange={(e) => setFormData({ ...formData, lineagePath: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="/country/province/city"
                    />
                  ) : (
                    <p className="text-gray-900">{location.lineagePath || '-'}</p>
                  )}
                </div>

                {/* Latitude */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                  {editing ? (
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude ?? ''}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{location.latitude ?? '-'}</p>
                  )}
                </div>

                {/* Longitude */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                  {editing ? (
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude ?? ''}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{location.longitude ?? '-'}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  {editing ? (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive || false}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                  ) : (
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      location.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created At:</span>
                    <span className="ml-2 text-gray-900">
                      {location.createdAt ? new Date(location.createdAt).toLocaleString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated At:</span>
                    <span className="ml-2 text-gray-900">
                      {location.updatedAt ? new Date(location.updatedAt).toLocaleString() : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'languages' && (
          <div className="p-6">
            <CrudPage
              title="Location Languages"
              service="access"
              resourceBase="/api/location-languages"
              idKey="locationLanguageId"
              columns={languageColumns}
              pageSize={25}
              formFields={languageFields}
              enableCreate={canManageLanguages}
              enableEdit={canManageLanguages}
              enableDelete={canManageLanguages}
              showAddButton={canManageLanguages}
              tableId={`location-languages-${locationId}`}
              fixedFilters={[
                { key: 'locationId', operator: 'EQUAL', value: locationId }
              ]}
              queryParams={{ locationId }}
              toCreatePayload={(f) => ({
                locationId,
                language: f.language?.trim(),
                name: f.name?.trim(),
                description: f.description?.trim() || null,
                isActive: true, // ✅ Always TRUE for new records
              })}
              toUpdatePayload={(f, row) => ({
                locationLanguageId: row.locationLanguageId,
                locationId,
                language: f.language?.trim(),
                name: f.name?.trim(),
                description: f.description?.trim() || null,
                isActive: true, // ✅ Always TRUE - cannot be deactivated
                ...(row.rowVersion != null ? { rowVersion: row.rowVersion } : {}),
              })}
            />
          </div>
        )}
      </div>
    </div>
  )
}

