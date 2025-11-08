import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import SystemSectionFormModal from '../sections/SystemSectionFormModal'
import SystemSectionActionFormModal from '../actions/SystemSectionActionFormModal'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

export default function SystemDetailsPage() {
  const { systemId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('info')
  const [system, setSystem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})

  // Get permissions
  const { getSectionPermissions, isLoading: permissionsLoading } = usePermissionCheck()
  
  const systemPermissions = useMemo(() => 
    getSectionPermissions(CMS_SECTIONS.SYSTEMS, SYSTEMS.CMS) ?? {},
    [getSectionPermissions]
  )

  const sectionPermissions = useMemo(() => 
    getSectionPermissions(CMS_SECTIONS.SECTIONS, SYSTEMS.CMS) ?? {},
    [getSectionPermissions]
  )

  const actionPermissions = useMemo(() => 
    getSectionPermissions(CMS_SECTIONS.ACTIONS, SYSTEMS.CMS) ?? {},
    [getSectionPermissions]
  )

  const canUpdate = systemPermissions.canUpdate ?? false
  const canManageSections = (sectionPermissions.canCreate || sectionPermissions.canUpdate || sectionPermissions.canDelete) ?? false
  const canManageActions = (actionPermissions.canCreate || actionPermissions.canUpdate || actionPermissions.canDelete) ?? false

  // Section columns - without system column since it's fixed
  const sectionColumns = useMemo(() => [
    { id: 'code', accessorKey: 'code', header: 'Code', cell: (info) => info.getValue() },
    { 
      id: 'name', 
      accessorKey: 'name', 
      header: 'Name', 
      cell: (info) => (
        <span className="text-blue-600 font-medium">
          {info.getValue()}
        </span>
      )
    },
    { 
      id: 'description', 
      accessorKey: 'description', 
      header: 'Description', 
      cell: (info) => info.getValue() || '-' 
    },
    {
      id: 'isActive',
      accessorKey: 'isActive',
      header: 'Active',
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

  // Action columns - without system/section columns since they're fixed
  const actionColumns = useMemo(() => [
    { id: 'code', accessorKey: 'code', header: 'Code', cell: (info) => info.getValue() },
    { 
      id: 'name', 
      accessorKey: 'name', 
      header: 'Name', 
      cell: (info) => (
        <span className="text-blue-600 font-medium">
          {info.getValue()}
        </span>
      )
    },
    { 
      id: 'systemSectionName', 
      accessorKey: 'systemSectionName', 
      header: 'Section', 
      cell: (info) => info.getValue() || '-' 
    },
    {
      id: 'isActive',
      accessorKey: 'isActive',
      header: 'Active',
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

  // Fixed filters for sections
  const sectionFixedFilters = useMemo(() => 
    systemId ? [
      {
        key: 'systemId',
        operator: 'EQUAL',
        value: systemId,
        dataType: 'UUID',
      },
    ] : [],
    [systemId]
  )

  // Fixed filters for actions (through sections)
  const actionFixedFilters = useMemo(() => 
    systemId ? [
      {
        key: 'systemId',
        operator: 'EQUAL',
        value: systemId,
        dataType: 'UUID',
      },
    ] : [],
    [systemId]
  )

  // Fetch system details
  useEffect(() => {
    fetchSystem()
  }, [systemId])

  const fetchSystem = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/access/api/systems/${systemId}`)
      setSystem(data)
      setFormData(data)
    } catch (err) {
      toast.error('Failed to load system details')
      navigate('/cms/systems')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      const payload = {
        systemId: systemId,
        code: formData.code?.trim(),
        name: formData.name?.trim(),
        isActive: !!formData.isActive,
        systemIcon: formData.systemIcon?.trim() || null,
        ...(formData.rowVersion != null ? { rowVersion: formData.rowVersion } : {}),
      }
      
      console.log('💾 Updating system with payload:', payload)
      await api.put(`/access/api/systems/${systemId}`, payload)
      console.log('✅ System updated successfully')
      toast.success('System updated successfully')
      setEditing(false)
      fetchSystem()
    } catch (err) {
      console.error('❌ Failed to update system:', err.response?.data || err.message)
      toast.error(err?.response?.data?.message || 'Failed to update system')
    }
  }

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

  if (!system) {
    return (
      <div className="p-6">
        <p>System not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-4">
          <CMSBreadcrumb currentPageLabel={system?.name || t('cms.systems')} />
        </div>
        
        {/* Modern Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{system.name}</h1>
                <p className="text-blue-100 mt-2 flex items-center gap-3">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">{system.code}</span>
                  {system.systemIcon && (
                    <img 
                      src={system.systemIcon} 
                      alt={system.name}
                      className="w-6 h-6 rounded"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  )}
                </p>
              </div>
              <div className="text-6xl opacity-20">⚙️</div>
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
                📋 System Info
              </span>
              {activeTab === 'info' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              )}
            </button>
            {canManageSections && (
              <button
                onClick={() => setActiveTab('sections')}
                className={`px-8 py-4 font-bold transition-all relative ${
                  activeTab === 'sections'
                    ? 'text-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  📑 Sections
                </span>
                {activeTab === 'sections' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                )}
              </button>
            )}
            {canManageActions && (
              <button
                onClick={() => setActiveTab('actions')}
                className={`px-8 py-4 font-bold transition-all relative ${
                  activeTab === 'actions'
                    ? 'text-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  ⚡ Actions
                </span>
                {activeTab === 'actions' && (
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
                        📝 System Details
                      </legend>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            System Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.code || ''}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter system code"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            System Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter system name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">System Icon (URL)</label>
                          <input
                            type="url"
                            value={formData.systemIcon || ''}
                            onChange={(e) => setFormData({ ...formData, systemIcon: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="https://example.com/icon.svg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                          <div className="flex items-center gap-3 mt-2">
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
                      </div>
                    </fieldset>

                    <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                      <button
                        onClick={() => {
                          setEditing(false)
                          setFormData(system)
                        }}
                        className="px-6 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdate}
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
                          <div className="text-lg font-bold text-gray-900">{system.code}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name</div>
                          <div className="text-lg font-bold text-gray-900">{system.name}</div>
                        </div>
                        {system.systemIcon && (
                          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Icon</div>
                            <div className="text-sm font-semibold text-blue-600">
                              <a href={system.systemIcon} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {system.systemIcon}
                              </a>
                            </div>
                          </div>
                        )}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</div>
                          <div>
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-full ${
                              system.isActive 
                                ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
                            }`}>
                              {system.isActive ? '✅ Active' : '❌ Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created At</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {system.createdAt ? new Date(system.createdAt).toLocaleString() : '-'}
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Updated At</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {system.updatedAt ? new Date(system.updatedAt).toLocaleString() : '-'}
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
                          ✏️ Edit System
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

        {activeTab === 'sections' && canManageSections && systemId && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                    <span className="text-3xl">📑</span>
                    System Sections
                  </h2>
                  <p className="text-gray-600">
                    Manage sections for <span className="font-bold text-purple-600">{system.name}</span>
                  </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-purple-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">System Code</div>
                  <div className="text-lg font-bold text-purple-600">{system.code}</div>
                </div>
              </div>
            </div>

            {/* Sections Table */}
            <div className="bg-white rounded-xl border-2 border-gray-100 shadow-sm overflow-hidden">
              <CrudPage
                title=""
                service="access"
                resourceBase="/api/system-sections"
                idKey="systemSectionId"
                columns={sectionColumns}
                pageSize={25}
                fixedFilters={sectionFixedFilters}
                queryParams={{ systemId }}
                enableCreate={sectionPermissions.canCreate}
                enableEdit={sectionPermissions.canUpdate}
                enableDelete={sectionPermissions.canDelete}
                tableId={`system-sections-${systemId}`}
                renderCreate={({ open, onClose, onSuccess }) => (
                  <SystemSectionFormModal 
                    open={open} 
                    mode="create" 
                    onClose={onClose} 
                    onSuccess={() => {
                      onSuccess?.()
                      fetchSystem()
                    }}
                    initialSystemId={systemId}
                  />
                )}
                renderEdit={({ open, initial, onClose, onSuccess }) => (
                  <SystemSectionFormModal 
                    open={open} 
                    mode="edit" 
                    initial={initial} 
                    onClose={onClose} 
                    onSuccess={() => {
                      onSuccess?.()
                      fetchSystem()
                    }}
                  />
                )}
              />
            </div>
          </div>
        )}

        {activeTab === 'actions' && canManageActions && systemId && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                    <span className="text-3xl">⚡</span>
                    System Section Actions
                  </h2>
                  <p className="text-gray-600">
                    Manage actions for <span className="font-bold text-orange-600">{system.name}</span>
                  </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-orange-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">System Code</div>
                  <div className="text-lg font-bold text-orange-600">{system.code}</div>
                </div>
              </div>
            </div>

            {/* Actions Table */}
            <div className="bg-white rounded-xl border-2 border-gray-100 shadow-sm overflow-hidden">
              <CrudPage
                title=""
                service="access"
                resourceBase="/api/system-section-actions"
                idKey="systemSectionActionId"
                columns={actionColumns}
                pageSize={25}
                fixedFilters={actionFixedFilters}
                queryParams={{ systemId }}
                enableCreate={actionPermissions.canCreate}
                enableEdit={actionPermissions.canUpdate}
                enableDelete={actionPermissions.canDelete}
                tableId={`system-actions-${systemId}`}
                renderCreate={({ open, onClose, onSuccess }) => (
                  <SystemSectionActionFormModal 
                    open={open} 
                    mode="create" 
                    onClose={onClose} 
                    onSuccess={() => {
                      onSuccess?.()
                      fetchSystem()
                    }}
                    initialSystemId={systemId}
                  />
                )}
                renderEdit={({ open, initial, onClose, onSuccess }) => (
                  <SystemSectionActionFormModal 
                    open={open} 
                    mode="edit" 
                    initial={initial} 
                    onClose={onClose} 
                    onSuccess={() => {
                      onSuccess?.()
                      fetchSystem()
                    }}
                  />
                )}
              />
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}

