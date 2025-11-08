import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

export default function CountryDetailsPage() {
  const { countryId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('info')
  const [country, setCountry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [parentLocations, setParentLocations] = useState([])
  const [deleting, setDeleting] = useState(false)

  // Get permissions
  const { getSectionPermissions, isLoading: permissionsLoading } = usePermissionCheck()
  
  const permissions = useMemo(() => 
    getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS),
    [getSectionPermissions]
  )

  const canUpdate = permissions.canUpdate
  const canDelete = permissions.canDelete
  const canManageLanguages = permissions.canCreate || permissions.canUpdate || permissions.canDelete
  const canManageLocations = permissions.canCreate || permissions.canUpdate || permissions.canDelete

  const LEVEL_LABELS = {
    0: 'Governorate',
    1: 'District',
    2: 'Subdistrict',
    3: 'Community',
    4: 'Neighborhood',
  }

  const LEVEL_OPTIONS = [
    { value: 0, label: 'Governorate (root)' },
    { value: 1, label: 'District' },
    { value: 2, label: 'Subdistrict' },
    { value: 3, label: 'Community' },
    { value: 4, label: 'Neighborhood' },
  ]

  // Location columns - without country column since it's fixed
  const locationColumns = useMemo(() => [
    { 
      id: 'code', 
      accessorKey: 'code', 
      header: 'Location Code',
      cell: (info) => info.getValue() || '-'
    },
    { 
      id: 'name', 
      accessorKey: 'name', 
      header: 'Location Name',
      cell: (info) => (
        <span className="text-blue-600 font-medium">
          {info.getValue()}
        </span>
      )
    },
    { 
      id: 'level', 
      accessorKey: 'level', 
      header: 'Level', 
      cell: (info) => {
        const v = info.getValue()
        if (v === null || v === undefined || v === '') return '-'
        return LEVEL_LABELS[v] ?? `Level ${v}`
      }
    },
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
    { 
      id: 'createdAt', 
      accessorKey: 'createdAt', 
      header: 'Created At', 
      cell: (info) => info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '-',
    },
  ], [])

  // Location fields
  const locationFields = useMemo(() => [
    { type: 'text', name: 'code', label: 'Location Code', required: true },
    { type: 'text', name: 'name', label: 'Location Name', required: true },
    { 
      type: 'select', 
      name: 'level', 
      label: 'Level',
      options: [
        { value: '', label: '-- Select Level --' },
        ...LEVEL_OPTIONS
      ]
    },
    { 
      type: 'select', 
      name: 'parentLocationId', 
      label: 'Parent Location',
      options: [
        { value: '', label: '-- Select Parent Location (optional) --' },
        ...parentLocations.map(loc => ({ value: loc.locationId, label: loc.name }))
      ]
    },
    { type: 'text', name: 'lineagePath', label: 'Lineage Path', placeholder: 'Auto-generated from parent + name' },
    { type: 'number', name: 'latitude', label: 'Latitude', step: 'any' },
    { type: 'number', name: 'longitude', label: 'Longitude', step: 'any' },
  ], [parentLocations])


  // Fixed filters for locations
  const locationFixedFilters = useMemo(() => 
    countryId ? [
      {
        key: 'countryId',
        operator: 'EQUAL',
        value: countryId,
        dataType: 'UUID',
      },
    ] : [],
    [countryId]
  )

  // Fetch country details and parent locations
  useEffect(() => {
    fetchCountry()
    fetchParentLocations()
  }, [countryId])

  const fetchParentLocations = async () => {
    if (!countryId) return
    
    try {
      const { data } = await api.post('/access/api/locations/filter', {
        criteria: [
          {
            key: 'countryId',
            operator: 'EQUAL',
            value: countryId,
            dataType: 'UUID',
          },
          {
            key: 'isActive',
            operator: 'EQUAL',
            value: true,
            dataType: 'BOOLEAN',
          },
        ],
      }, { params: { page: 0, size: 1000 } })
      
      setParentLocations(data.content || [])
    } catch (err) {
      console.error('Failed to load parent locations:', err)
      setParentLocations([])
    }
  }

  const fetchCountry = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/access/api/code-countries/${countryId}`)
      setCountry(data)
      setFormData(data)
    } catch (err) {
      toast.error('Failed to load country details')
      navigate('/cms/codeCountry')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      const payload = {
        countryId: countryId,
        iso2Code: formData.iso2Code?.trim().toUpperCase(),
        name: formData.name?.trim(),
        iso3Code: formData.iso3Code?.trim().toUpperCase() || null,
        numericCode: formData.numericCode?.trim() || null,
        phoneCode: formData.phoneCode?.trim() || null,
        isActive: true, // ✅ Always TRUE - cannot be deactivated
        ...(formData.rowVersion != null ? { rowVersion: formData.rowVersion } : {}),
      }
      
      console.log('💾 Updating country with payload:', payload)
      await api.put(`/access/api/code-countries/${countryId}`, payload)
      console.log('✅ Country updated successfully')
      toast.success('Country updated successfully')
      setEditing(false)
      fetchCountry()
    } catch (err) {
      console.error('❌ Failed to update country:', err.response?.data || err.message)
      toast.error(err?.response?.data?.message || 'Failed to update country')
    }
  }

  const handleDeleteCountry = async () => {
    if (!countryId) return

    // Show confirmation prompt
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the country "${country?.name || ''}"?
This will remove the country and all related data.`
    )
    if (!confirmed) return

    try {
      setDeleting(true)
      await api.delete(`/access/api/code-countries/${countryId}`, {
        params: { hardDelete: true }
      })
      toast.success('Country deleted successfully')
      navigate('/cms/codeCountry')
    } catch (err) {
      console.error('Failed to delete country:', err)
      toast.error(err?.response?.data?.message || 'Failed to delete country')
    } finally {
      setDeleting(false)
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

  if (!country) {
    return (
      <div className="p-6">
        <p>Country not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="px-6 pt-4">
        <CMSBreadcrumb currentPageLabel={country?.name || t('cms.codeCountry')} />
      </div>
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/cms/codeCountry')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{country.name}</h1>
            <p className="text-sm text-gray-500">ISO2: {country.iso2Code} {country.iso3Code && `• ISO3: ${country.iso3Code}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canDelete && (
            <button
              onClick={handleDeleteCountry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
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
                      setFormData(country)
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
          {canManageLocations && (
            <button
              onClick={() => setActiveTab('locations')}
              className={`py-3 border-b-2 font-medium transition ${
                activeTab === 'locations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Locations
            </button>
          )}
          {canManageLanguages && (
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
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'info' && (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Country Details</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ISO2 Code</label>
                  {editing ? (
                    <input
                      type="text"
                      maxLength={2}
                      value={formData.iso2Code || ''}
                      onChange={(e) => setFormData({ ...formData, iso2Code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    />
                  ) : (
                    <p className="text-gray-900">{country.iso2Code || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{country.name || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ISO3 Code</label>
                  {editing ? (
                    <input
                      type="text"
                      maxLength={3}
                      value={formData.iso3Code || ''}
                      onChange={(e) => setFormData({ ...formData, iso3Code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    />
                  ) : (
                    <p className="text-gray-900">{country.iso3Code || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Numeric Code</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.numericCode || ''}
                      onChange={(e) => setFormData({ ...formData, numericCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{country.numericCode || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Code</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.phoneCode || ''}
                      onChange={(e) => setFormData({ ...formData, phoneCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1"
                    />
                  ) : (
                    <p className="text-gray-900">{country.phoneCode || '-'}</p>
                  )}
                </div>

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
                      country.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {country.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created At:</span>
                    <span className="ml-2 text-gray-900">
                      {country.createdAt ? new Date(country.createdAt).toLocaleString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated At:</span>
                    <span className="ml-2 text-gray-900">
                      {country.updatedAt ? new Date(country.updatedAt).toLocaleString() : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'locations' && canManageLocations && countryId && (
          <div className="p-6 space-y-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                    <span className="text-3xl">📍</span>
                    Locations
                  </h2>
                  <p className="text-gray-600">
                    Manage locations for <span className="font-bold text-green-600">{country.name}</span>
                  </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-green-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Country Code</div>
                  <div className="text-lg font-bold text-green-600">{country.iso2Code}</div>
                </div>
              </div>
            </div>

            {/* Locations Table */}
            <div className="bg-white rounded-xl border-2 border-gray-100 shadow-sm overflow-hidden">
              <CrudPage
                title=""
                service="access"
                resourceBase="/api/locations"
                idKey="locationId"
                columns={locationColumns}
                formFields={locationFields}
                pageSize={25}
                fixedFilters={locationFixedFilters}
                queryParams={{ countryId }}
                toCreatePayload={(f) => ({
                  countryId: countryId, // Always set to current country
                  code: f.code?.trim(),
                  name: f.name?.trim(),
                  level: f.level === '' || f.level === undefined || f.level === null ? null : parseInt(f.level),
                  parentLocationId: f.parentLocationId || null,
                  lineagePath: f.lineagePath?.trim() || null,
                  latitude: f.latitude ? parseFloat(f.latitude) : null,
                  longitude: f.longitude ? parseFloat(f.longitude) : null,
                  isActive: true,
                })}
                toUpdatePayload={(f, row) => ({
                  locationId: row.locationId,
                  countryId: countryId, // Always set to current country
                  code: f.code?.trim(),
                  name: f.name?.trim(),
                  level: f.level === '' || f.level === undefined || f.level === null ? null : parseInt(f.level),
                  parentLocationId: f.parentLocationId || null,
                  lineagePath: f.lineagePath?.trim() || null,
                  latitude: f.latitude ? parseFloat(f.latitude) : null,
                  longitude: f.longitude ? parseFloat(f.longitude) : null,
                  isActive: true,
                  ...(row.rowVersion != null ? { rowVersion: row.rowVersion } : {}),
                })}
                enableCreate={permissions.canCreate}
                enableEdit={permissions.canUpdate}
                enableDelete={permissions.canDelete}
                onRowClick={(location) => navigate(`/cms/location/${location.locationId}`)}
                tableId={`country-locations-${countryId}`}
              />
            </div>
          </div>
        )}

        {activeTab === 'languages' && canManageLanguages && countryId && (
          <div className="p-6">
            <CrudPage
              title="Country Languages"
              service="access"
              resourceBase="/api/code-country-languages"
              idKey="countryLanguageId"
              columns={languageColumns}
              pageSize={25}
              formFields={languageFields}
              enableCreate={canManageLanguages}
              enableEdit={canManageLanguages}
              enableDelete={canManageLanguages}
              showAddButton={canManageLanguages}
              tableId={`country-languages-${countryId}`}
              fixedFilters={[
                { key: 'countryId', operator: 'EQUAL', value: countryId }
              ]}
              queryParams={{ countryId }}
              toCreatePayload={(f) => ({
                countryId,
                language: f.language?.trim(),
                name: f.name?.trim(),
                description: f.description?.trim() || null,
                isActive: true, // ✅ Always TRUE for new records
              })}
              toUpdatePayload={(f, row) => ({
                countryLanguageId: row.countryLanguageId,
                countryId,
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

