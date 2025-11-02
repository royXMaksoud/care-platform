import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import { useBranchTypes } from '@/hooks/useBranchTypes'

// Static columns and fields - defined outside component
const languageColumns = [
  { id: 'language', accessorKey: 'language', header: 'Language', cell: (info) => info.getValue() },
  { id: 'name', accessorKey: 'name', header: 'Name', cell: (info) => info.getValue() },
  { id: 'description', accessorKey: 'description', header: 'Description', cell: (info) => info.getValue() || '-' },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Status',
    cell: (info) => (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        Active
      </span>
    ),
    meta: { type: 'boolean' },
  },
]

const languageFields = [
  { type: 'text', name: 'language', label: 'Language Code', required: true, placeholder: 'e.g., en, ar, fr' },
  { type: 'text', name: 'name', label: 'Name', required: true },
  { type: 'textarea', name: 'description', label: 'Description', rows: 3 },
]

export default function OrganizationBranchDetailsPage() {
  const { organizationBranchId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('info')
  const [branch, setBranch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [dropdownData, setDropdownData] = useState({
    organizations: [],
    countries: [],
    locations: []
  })

  // Get permissions (using CODE_COUNTRY permissions)
  const { getSectionPermissions, isLoading: permissionsLoading } = usePermissionCheck()
  
  // Get branch types for dropdown
  const { branchTypes, loading: typesLoading } = useBranchTypes('en')
  
  const permissions = useMemo(() => 
    getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS),
    [getSectionPermissions]
  )

  const canUpdate = permissions.canUpdate
  const canManageLanguages = permissions.canCreate || permissions.canUpdate || permissions.canDelete
  
  // Fixed filters for organization branch languages - MUST be before any return statements
  const languageFixedFilters = useMemo(() => 
    organizationBranchId ? [
      {
        key: 'organizationBranchId',
        operator: 'EQUAL',
        value: organizationBranchId,
        dataType: 'UUID',
      },
    ] : [],
    [organizationBranchId]
  )
  
  // Find branch type name
  const branchTypeName = useMemo(() => {
    if (!branch?.branchTypeId || !branchTypes.length) return null
    const type = branchTypes.find(t => t.value === branch.branchTypeId)
    return type?.label || null
  }, [branch?.branchTypeId, branchTypes])

  // Fetch branch details and dropdown data
  useEffect(() => {
    fetchBranch()
    fetchDropdownData()
  }, [organizationBranchId])

  const fetchBranch = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/access/api/organization-branches/${organizationBranchId}`)
      setBranch(data)
      setFormData(data)
    } catch (err) {
      toast.error('Failed to load organization branch details')
      navigate('/cms/organization-branches')
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    let isMounted = true // ✅ Cleanup flag to prevent double calls in StrictMode
    
    try {
      const userLanguage = localStorage.getItem('userLanguage') || 'en'
      
      const [orgRes, countryRes, locRes] = await Promise.all([
        // Fetch real Organizations (not code table)
        api.post('/access/api/organizations/filter', {
          criteria: []
        }, { params: { page: 0, size: 1000 } }),
        // Fetch real Countries (not code table)
        api.post('/access/api/code-countries/filter', {
          criteria: []
        }, { params: { page: 0, size: 1000 } }),
        // Fetch real Locations
        api.post('/access/api/locations/filter', {
          criteria: []
        }, { params: { page: 0, size: 1000 } })
      ])

      // ✅ Only update state if component is still mounted
      if (isMounted) {
        setDropdownData({
          organizations: (orgRes.data.content || []).filter(i => i.isActive !== false),
          countries: (countryRes.data.content || []).filter(i => i.isActive !== false),
          locations: (locRes.data.content || []).filter(i => i.isActive !== false)
        })
      }
    } catch (err) {
      if (isMounted) {
        console.error('Failed to load dropdown data:', err)
      }
    }
  }

  const handleUpdate = async () => {
    try {
      const payload = {
        organizationId: formData.organizationId || null,
        countryId: formData.countryId || null,
        locationId: formData.locationId || null,
        branchTypeId: formData.branchTypeId || null,
        code: formData.code?.trim(),
        name: formData.name?.trim(),
        address: formData.address?.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        isHeadquarter: formData.isHeadquarter || false,
        isActive: true, // ✅ Always TRUE
        rowVersion: formData.rowVersion,
      }
      
      await api.put(`/access/api/organization-branches/${organizationBranchId}`, payload)
      toast.success('Organization branch updated successfully')
      setEditing(false)
      fetchBranch()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update organization branch')
    }
  }

  if (loading || permissionsLoading || typesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-3"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!branch) {
    return <div className="p-6"><p>Organization branch not found</p></div>
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/cms/organization-branches')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{branch.name}</h1>
            <p className="text-sm text-gray-500">Code: {branch.code} {branch.isHeadquarter && '• Headquarter'}</p>
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
                      setFormData(branch)
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
              <h2 className="text-lg font-semibold mb-4">Branch Details</h2>
              <div className="grid grid-cols-2 gap-6">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Code</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{branch.code || '-'}</p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{branch.name || '-'}</p>
                  )}
                </div>

                {/* Organization */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                  {editing ? (
                    <select
                      value={formData.organizationId || ''}
                      onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Organization...</option>
                      {dropdownData.organizations.map(org => (
                        <option key={org.organizationId} value={org.organizationId}>{org.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {dropdownData.organizations.find(o => o.organizationId === branch.organizationId)?.name || '-'}
                    </p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  {editing ? (
                    <select
                      value={formData.countryId || ''}
                      onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Country...</option>
                      {dropdownData.countries.map(c => (
                        <option key={c.countryId} value={c.countryId}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {dropdownData.countries.find(c => c.countryId === branch.countryId)?.name || '-'}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  {editing ? (
                    <select
                      value={formData.locationId || ''}
                      onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Location...</option>
                      {dropdownData.locations.map(l => (
                        <option key={l.locationId} value={l.locationId}>{l.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {dropdownData.locations.find(l => l.locationId === branch.locationId)?.name || '-'}
                    </p>
                  )}
                </div>

                {/* Branch Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Type</label>
                  {editing ? (
                    <select
                      value={formData.branchTypeId || ''}
                      onChange={(e) => setFormData({ ...formData, branchTypeId: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Branch Type...</option>
                      {branchTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">{branchTypeName || '-'}</p>
                  )}
                </div>

                {/* Is Headquarter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Headquarter</label>
                  {editing ? (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isHeadquarter || false}
                        onChange={(e) => setFormData({ ...formData, isHeadquarter: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">Is Headquarter</span>
                    </label>
                  ) : (
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      branch.isHeadquarter 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {branch.isHeadquarter ? 'Yes' : 'No'}
                    </span>
                  )}
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  {editing ? (
                    <textarea
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{branch.address || '-'}</p>
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
                    <p className="text-gray-900">{branch.latitude ?? '-'}</p>
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
                    <p className="text-gray-900">{branch.longitude ?? '-'}</p>
                  )}
                </div>

                {/* Status - Always Active */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created At:</span>
                    <span className="ml-2 text-gray-900">
                      {branch.createdAt ? new Date(branch.createdAt).toLocaleString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated At:</span>
                    <span className="ml-2 text-gray-900">
                      {branch.updatedAt ? new Date(branch.updatedAt).toLocaleString() : '-'}
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
              title="Branch Languages"
              service="access"
              resourceBase="/api/organization-branch-languages"
              idKey="organizationBranchLanguageId"
              columns={languageColumns}
              pageSize={25}
              formFields={languageFields}
              enableCreate={canManageLanguages}
              enableEdit={canManageLanguages}
              enableDelete={canManageLanguages}
              showAddButton={canManageLanguages}
              tableId={`organization-branch-languages-${organizationBranchId}`}
              fixedFilters={languageFixedFilters}
              queryParams={{ organizationBranchId }}
              toCreatePayload={(f) => ({
                organizationBranchId,
                language: f.language?.trim(),
                name: f.name?.trim(),
                description: f.description?.trim() || null,
                isActive: true, // ✅ Always TRUE
              })}
              toUpdatePayload={(f, row) => ({
                organizationBranchLanguageId: row.organizationBranchLanguageId,
                organizationBranchId,
                language: f.language?.trim(),
                name: f.name?.trim(),
                description: f.description?.trim() || null,
                isActive: true, // ✅ Always TRUE
                rowVersion: row.rowVersion,
              })}
            />
          </div>
        )}
      </div>
    </div>
  )
}

