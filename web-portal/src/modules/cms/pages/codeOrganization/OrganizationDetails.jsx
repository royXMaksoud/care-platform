import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'

// Static columns and fields - defined outside component to avoid re-creation
const languageColumns = [
  { id: 'languageCode', accessorKey: 'languageCode', header: 'Language Code' },
  { id: 'name', accessorKey: 'name', header: 'Name' },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Status',
    cell: (info) => (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
        info.getValue() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {info.getValue() ? 'Active' : 'Inactive'}
      </span>
    ),
  },
]

const languageFields = [
  { type: 'text', name: 'languageCode', label: 'Language Code', required: true, placeholder: 'e.g., en, ar' },
  { type: 'text', name: 'name', label: 'Translated Name', required: true },
  { type: 'checkbox', name: 'isActive', label: 'Active', defaultValue: true },
]

// Separate component for Languages tab to avoid hooks order issues
function OrganizationLanguagesTab({ organizationId }) {
  return (
    <CrudPage
      key={`org-lang-${organizationId}`}
      title="Organization Languages"
      service="access"
      resourceBase="/api/code-organization-languages"
      idKey="organizationLanguageId"
      columns={languageColumns}
      formFields={languageFields}
      pageSize={10}
      fixedFilters={[
        {
          field: 'organizationId',
          operator: 'EQUAL',
          value: organizationId,
          dataType: 'UUID',
        },
      ]}
      toCreatePayload={(f) => ({
        organizationId: organizationId,
        languageCode: f.languageCode,
        name: f.name,
        isActive: true,
      })}
      toUpdatePayload={(f) => ({
        organizationId: organizationId,
        languageCode: f.languageCode,
        name: f.name,
        isActive: true,
      })}
      tableId={`organization-languages-${organizationId}`}
    />
  )
}

export default function OrganizationDetailsPage() {
  const { organizationId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('info')
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})

  // Get permissions (using CODE_COUNTRY permissions)
  const { getSectionPermissions, isLoading: permissionsLoading } = usePermissionCheck()
  
  const permissions = useMemo(() => 
    getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS),
    [getSectionPermissions]
  )

  const canUpdate = permissions.canUpdate
  const canManageLanguages = permissions.canCreate || permissions.canUpdate || permissions.canDelete

  // Fetch organization details
  useEffect(() => {
    fetchOrganization()
  }, [organizationId])

  const fetchOrganization = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/access/api/code-organizations/${organizationId}`)
      setOrganization(data)
      setFormData(data)
    } catch (err) {
      toast.error('Failed to load organization details')
      navigate('/cms/organizations')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const payload = {
        organizationId: organizationId,
        iso2: formData.iso2 || null,
        iso3: formData.iso3 || null,
        name: formData.name,
        shortCode: formData.shortCode || null,
        numericCode: formData.numericCode || null,
        phoneCode: formData.phoneCode || null,
        isActive: true, // ✅ Always TRUE - cannot be deactivated
        rowVersion: formData.rowVersion,
      }
      
      await api.put(`/access/api/code-organizations/${organizationId}`, payload)
      toast.success('Organization updated successfully')
      setEditing(false)
      fetchOrganization()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update organization')
    }
  }

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Organization not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Modern Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/cms/organizations')}
            className="group flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-all"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-semibold">Back to Organizations</span>
          </button>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{organization.name}</h1>
                <p className="text-blue-100 mt-2 flex items-center gap-3">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">{organization.iso2 || 'N/A'}</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">{organization.iso3 || 'N/A'}</span>
                </p>
              </div>
              <div className="text-6xl opacity-20">🏢</div>
            </div>
          </div>
        </div>

        {/* Modern Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
          <div className="flex border-b-2 border-gray-100 bg-gray-50">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-8 py-4 font-bold transition-all relative ${
                activeTab === 'info'
                  ? 'text-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                📋 Organization Info
              </span>
              {activeTab === 'info' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              )}
            </button>
            {canManageLanguages && (
              <button
                onClick={() => setActiveTab('languages')}
                className={`px-8 py-4 font-bold transition-all relative ${
                  activeTab === 'languages'
                    ? 'text-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  🌐 Languages
                </span>
                {activeTab === 'languages' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                )}
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'info' && (
              <div>
                {editing ? (
                  <div className="space-y-6">
                    <fieldset className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50/30">
                      <legend className="text-base font-bold text-blue-800 px-3 bg-white rounded-md shadow-sm">
                        📝 Organization Details
                      </legend>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Organization Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter organization name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">ISO2 Code</label>
                          <input
                            type="text"
                            value={formData.iso2 || ''}
                            onChange={(e) => setFormData({ ...formData, iso2: e.target.value.toUpperCase() })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="e.g., UN"
                            maxLength={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">ISO3 Code</label>
                          <input
                            type="text"
                            value={formData.iso3 || ''}
                            onChange={(e) => setFormData({ ...formData, iso3: e.target.value.toUpperCase() })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="e.g., UNH"
                            maxLength={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Short Code</label>
                          <input
                            type="text"
                            value={formData.shortCode || ''}
                            onChange={(e) => setFormData({ ...formData, shortCode: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Short identifier"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Numeric Code</label>
                          <input
                            type="text"
                            value={formData.numericCode || ''}
                            onChange={(e) => setFormData({ ...formData, numericCode: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Numeric code"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Code</label>
                          <input
                            type="text"
                            value={formData.phoneCode || ''}
                            onChange={(e) => setFormData({ ...formData, phoneCode: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="+XXX"
                          />
                        </div>
                      </div>
                      
                      {/* Status - Always Active */}
                      <div className="mt-5 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={true}
                            disabled
                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                          />
                          <label className="text-sm font-semibold text-green-700">
                            ✅ Active (Organizations are always active)
                          </label>
                        </div>
                      </div>
                    </fieldset>

                    <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                      <button
                        onClick={() => {
                          setEditing(false)
                          setFormData(organization)
                        }}
                        className="px-6 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all transform hover:scale-105"
                      >
                        💾 Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Organization Name</div>
                          <div className="text-lg font-bold text-gray-900">{organization.name}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">ISO2 Code</div>
                          <div className="text-lg font-bold text-gray-900">{organization.iso2 || '-'}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">ISO3 Code</div>
                          <div className="text-lg font-bold text-gray-900">{organization.iso3 || '-'}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Short Code</div>
                          <div className="text-lg font-bold text-gray-900">{organization.shortCode || '-'}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Numeric Code</div>
                          <div className="text-lg font-bold text-gray-900">{organization.numericCode || '-'}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone Code</div>
                          <div className="text-lg font-bold text-gray-900">{organization.phoneCode || '-'}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</div>
                          <div>
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-full bg-green-100 text-green-800 border-2 border-green-300">
                              ✅ Active
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {canUpdate && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => setEditing(true)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
                        >
                          ✏️ Edit Organization
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {canManageLanguages && organizationId && (
              <div style={{ display: activeTab === 'languages' ? 'block' : 'none' }}>
                <OrganizationLanguagesTab organizationId={organizationId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

