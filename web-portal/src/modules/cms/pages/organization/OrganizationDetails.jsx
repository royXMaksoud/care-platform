import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import { useOrganizationTypes } from '@/hooks/useOrganizationTypes'

// Static columns and fields - defined outside component
const languageColumns = [
  { id: 'language', accessorKey: 'language', header: 'Language' },
  { id: 'name', accessorKey: 'name', header: 'Translated Name' },
  { id: 'description', accessorKey: 'description', header: 'Description', cell: (info) => info.getValue() || '-' },
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
  { type: 'text', name: 'language', label: 'Language Code', required: true, placeholder: 'e.g., en, ar, fr' },
  { type: 'text', name: 'name', label: 'Translated Name', required: true },
  { type: 'textarea', name: 'description', label: 'Description', rows: 3 },
  { type: 'checkbox', name: 'isActive', label: 'Active', defaultValue: true },
]

export default function OrganizationDetailsPage() {
  const { organizationId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('info')
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})

  // Get permissions
  const { getSectionPermissions, isLoading: permissionsLoading } = usePermissionCheck()
  
  // Get organization types for dropdown
  const { organizationTypes, loading: typesLoading } = useOrganizationTypes('en')
  
  const permissions = useMemo(() => 
    getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS),
    [getSectionPermissions]
  )

  const canUpdate = permissions.canUpdate
  const canManageLanguages = permissions.canCreate || permissions.canUpdate || permissions.canDelete
  
  // Fixed filters for organization languages - MUST be before any return statements
  const languageFixedFilters = useMemo(() => 
    organizationId ? [
      {
        key: 'organizationId',
        operator: 'EQUAL',
        value: organizationId,
        dataType: 'UUID',
      },
    ] : [],
    [organizationId]
  )

  // Find organization type name
  const organizationTypeName = useMemo(() => {
    if (!organization?.organizationTypeId || !organizationTypes.length) return null
    const type = organizationTypes.find(t => t.value === organization.organizationTypeId)
    return type?.label || null
  }, [organization?.organizationTypeId, organizationTypes])

  // Fetch organization details
  useEffect(() => {
    fetchOrganization()
  }, [organizationId])

  const fetchOrganization = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/access/api/organizations/${organizationId}`)
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
        code: formData.code,
        name: formData.name,
        organizationTypeId: formData.organizationTypeId || null,
        websiteUrl: formData.websiteUrl || null,
        email: formData.email || null,
        phone: formData.phone || null,
        description: formData.description || null,
        isActive: formData.isActive !== false,
        rowVersion: formData.rowVersion,
      }
      
      await api.put(`/access/api/organizations/${organizationId}`, payload)
      toast.success('Organization updated successfully')
      setEditing(false)
      fetchOrganization()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update organization')
    }
  }

  if (loading || permissionsLoading || typesLoading) {
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
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">{organization.code}</span>
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
                            Organization Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.code || ''}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter organization code"
                            required
                          />
                        </div>
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
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Organization Type</label>
                          <select
                            value={formData.organizationTypeId || ''}
                            onChange={(e) => setFormData({ ...formData, organizationTypeId: e.target.value || null })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          >
                            <option value="">Select type...</option>
                            {organizationTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Website</label>
                          <input
                            type="url"
                            value={formData.websiteUrl || ''}
                            onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="https://example.org"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                          <input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="contact@example.org"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                          <input
                            type="tel"
                            value={formData.phone || ''}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="+1234567890"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                          <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            rows="3"
                            placeholder="Organization description"
                          />
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className="mt-5">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={formData.isActive !== false}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <label className="text-sm font-semibold text-gray-700">
                            Active
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
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Code</div>
                          <div className="text-lg font-bold text-gray-900">{organization.code}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name</div>
                          <div className="text-lg font-bold text-gray-900">{organization.name}</div>
                        </div>
                        {organizationTypeName && (
                          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Type</div>
                            <div className="text-lg font-bold text-gray-900">{organizationTypeName}</div>
                          </div>
                        )}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Website</div>
                          <div className="text-sm font-semibold text-blue-600">
                            {organization.websiteUrl ? (
                              <a href={organization.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {organization.websiteUrl}
                              </a>
                            ) : '-'}
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</div>
                          <div className="text-sm font-semibold text-gray-900">{organization.email || '-'}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</div>
                          <div className="text-sm font-semibold text-gray-900">{organization.phone || '-'}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 md:col-span-2">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</div>
                          <div className="text-sm font-semibold text-gray-900">{organization.description || '-'}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</div>
                          <div>
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-full ${
                              organization.isActive 
                                ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
                            }`}>
                              {organization.isActive ? '✅ Active' : '❌ Inactive'}
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

            {activeTab === 'languages' && canManageLanguages && organizationId && (
              <CrudPage
                title="Organization Languages"
                service="access"
                resourceBase="/api/organization-languages"
                idKey="organizationLanguageId"
                columns={languageColumns}
                formFields={languageFields}
                pageSize={10}
                fixedFilters={languageFixedFilters}
                queryParams={{ organizationId }}
                toCreatePayload={(f) => ({
                  organizationId: organizationId,
                  language: f.language,
                  name: f.name,
                  description: f.description || null,
                  isActive: f.isActive !== false,
                })}
                toUpdatePayload={(f) => ({
                  organizationLanguageId: f.organizationLanguageId,
                  organizationId: organizationId,
                  language: f.language,
                  name: f.name,
                  description: f.description || null,
                  isActive: f.isActive !== false,
                  rowVersion: f.rowVersion,
                })}
                enableCreate={permissions.canCreate}
                enableEdit={permissions.canUpdate}
                enableDelete={permissions.canDelete}
                tableId={`organization-languages-${organizationId}`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

