import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { TENANTS, ACCESS_SECTIONS } from '@/config/permissions-constants'
import { CODE_TABLE_IDS } from '@/config/codeTableIds'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

export default function TenantDetailsPage() {
  const { tenantId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('info')
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [logoUploading, setLogoUploading] = useState(false)

  // Get permissions for Tenants and Subscriptions
  // Tenants: Section "Tenants" under System "Access Management"
  // Subscriptions: Section "Tenants Subscription" under System "Access Management"
  const { getSectionPermissions, isLoading: permissionsLoading } = usePermissionCheck()
  
  const tenantsPermissions = useMemo(() => 
    getSectionPermissions(ACCESS_SECTIONS.TENANTS, TENANTS.ACCESS_MANAGEMENT),
    [getSectionPermissions]
  )
  
  const subscriptionsPermissions = useMemo(() => 
    getSectionPermissions(ACCESS_SECTIONS.SUBSCRIPTIONS, TENANTS.ACCESS_MANAGEMENT),
    [getSectionPermissions]
  )

  const canUpdateTenant = tenantsPermissions.canUpdate
  const canManageSubscriptions = subscriptionsPermissions.canCreate || subscriptionsPermissions.canUpdate || subscriptionsPermissions.canDelete

  // Debug permissions
  useEffect(() => {
    console.log('🔐 Tenant Permissions:', {
      canUpdate: canUpdateTenant,
      canCreate: tenantsPermissions.canCreate,
      canDelete: tenantsPermissions.canDelete,
      canView: tenantsPermissions.canView,
      fullPermissions: tenantsPermissions
    })
    console.log('🔐 Subscription Permissions:', {
      canCreate: subscriptionsPermissions.canCreate,
      canUpdate: subscriptionsPermissions.canUpdate,
      canDelete: subscriptionsPermissions.canDelete,
      fullPermissions: subscriptionsPermissions
    })
  }, [tenantsPermissions, canUpdateTenant, subscriptionsPermissions])

  // Fetch tenant details
  useEffect(() => {
    fetchTenant()
  }, [tenantId])

  const fetchTenant = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/access/api/v1/tenants/${tenantId}`)
      setTenant(data)
      setFormData(data)
      setLogoUploading(false)
    } catch (err) {
      toast.error('Failed to load tenant details')
      navigate('/cms/tenants')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      const payload = {
        tenantId: tenantId,
        name: formData.name,
        email: formData.email,
        // Reference-data fields (UUID IDs)
        industryTypeId: formData.industryTypeId || null,
        subscriptionPlanId: formData.subscriptionPlanId || null,
        billingCurrencyId: formData.billingCurrencyId || null,
        billingCycleId: formData.billingCycleId || null,
        countryId: formData.countryId || null,
        // Free-text fields
        focalPointName: formData.focalPointName || null,
        focalPointPhone: formData.focalPointPhone || null,
        address: formData.address || null,
        comment: formData.comment || null,
        sessionTimeoutMinutes: Number(formData.sessionTimeoutMinutes) || 30,
        tenantLogo: formData.tenantLogo || null,
        isActive: true, // ✅ Always TRUE - cannot be deactivated
        rowVersion: formData.rowVersion,
      }
      
      console.log('💾 Updating tenant with payload:', payload)
      await api.put(`/access/api/v1/tenants/${tenantId}`, payload)
      console.log('✅ Tenant updated successfully')
      toast.success('Tenant updated successfully')
      setEditing(false)
      fetchTenant()
    } catch (err) {
      console.error('❌ Failed to update tenant:', err.response?.data || err.message)
      toast.error(err?.response?.data?.message || 'Failed to update tenant')
    }
  }

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 800 * 1024) {
      toast.error('Logo should be smaller than 800KB')
      return
    }
    setLogoUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result
        setFormData((prev) => ({ ...prev, tenantLogo: base64 }))
        setLogoUploading(false)
      }
      reader.onerror = () => {
        setLogoUploading(false)
        toast.error('Failed to read logo file')
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setLogoUploading(false)
      toast.error('Failed to load logo file')
    }
  }

  const handleLogoRemove = () => {
    setFormData((prev) => ({ ...prev, tenantLogo: null }))
    setLogoUploading(false)
  }

  const subscriptionColumns = [
    { id: 'systemCode', accessorKey: 'systemCode', header: 'System', cell: (info) => info.getValue() },
    { 
      id: 'startDate', 
      accessorKey: 'startDate', 
      header: 'Start Date', 
      cell: (info) => info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '-',
      meta: { type: 'date' }
    },
    { 
      id: 'endDate', 
      accessorKey: 'endDate', 
      header: 'End Date', 
      cell: (info) => info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '-',
      meta: { type: 'date' }
    },
    { 
      id: 'price', 
      accessorKey: 'price', 
      header: 'Price', 
      cell: (info) => info.getValue() ? `$${info.getValue()}` : '-',
      meta: { type: 'number' }
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
  ]

  const subscriptionFields = [
    { type: 'text', name: 'systemCode', label: 'System Code', required: true, placeholder: 'e.g., HR, CRM' },
    { type: 'date', name: 'startDate', label: 'Start Date', required: true },
    { type: 'date', name: 'endDate', label: 'End Date', required: true },
    { type: 'number', name: 'price', label: 'Price', placeholder: '0.00', step: '0.01' },
    { type: 'textarea', name: 'notes', label: 'Notes', rows: 3 },
    { type: 'checkbox', name: 'isActive', label: 'Active' },
  ]

  if (loading || permissionsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading tenant details...</p>
        </div>
      </div>
    )
  }

  if (!tenant) return null

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="px-6 pt-4">
        <CMSBreadcrumb currentPageLabel={tenant?.name || t('cms.tenants')} />
      </div>
      {/* Header */}
      <div className="flex-none bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/cms/tenants')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {tenant.tenantLogo && (
                <div className="h-12 w-12 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-center">
                  <img
                    src={tenant.tenantLogo}
                    alt={`${tenant.name} logo`}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{tenant.name}</h1>
                <p className="text-sm text-gray-500">{tenant.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                tenant.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {tenant.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex gap-1 border-b">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                activeTab === 'info'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tenant Information
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                activeTab === 'subscriptions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Subscriptions
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'info' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">Tenant Details</h2>
                  {/* Temporarily show Edit button always for testing */}
                  {!editing && (
                    <button
                      onClick={() => {
                        console.log('🖊️ Edit button clicked')
                        setEditing(true)
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      title={!canUpdateTenant ? 'Edit (permissions may be limited)' : 'Edit tenant'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                      {!canUpdateTenant && <span className="text-xs opacity-75">(⚠️)</span>}
                    </button>
                  )}
                  {editing && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          console.log('❌ Cancel clicked - reverting changes')
                          setEditing(false)
                          setFormData(tenant)
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdate}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                      >
                        <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoField 
                    label="Tenant Name" 
                    value={tenant.name}
                    editing={editing}
                    onChange={(val) => setFormData({...formData, name: val})}
                    editValue={formData.name}
                  />
                  <InfoField 
                    label="Email" 
                    value={tenant.email}
                    editing={editing}
                    onChange={(val) => setFormData({...formData, email: val})}
                    editValue={formData.email}
                    type="email"
                  />
                  <SelectField 
                    label="Industry Type" 
                    value={tenant.industryTypeName}
                    editing={editing}
                    onChange={(val) => setFormData({...formData, industryTypeId: val})}
                    editValue={formData.industryTypeId}
                    codeTableId={CODE_TABLE_IDS.INDUSTRY_TYPE}
                  />
                  
                  <SelectField 
                    label="Subscription Plan" 
                    value={tenant.subscriptionPlanName}
                    editing={editing}
                    onChange={(val) => setFormData({...formData, subscriptionPlanId: val})}
                    editValue={formData.subscriptionPlanId}
                    codeTableId={CODE_TABLE_IDS.SUBSCRIPTION_PLAN}
                  />
                  
                  <SelectField 
                    label="Billing Currency" 
                    value={tenant.billingCurrencyName}
                    editing={editing}
                    onChange={(val) => setFormData({...formData, billingCurrencyId: val})}
                    editValue={formData.billingCurrencyId}
                    codeTableId={CODE_TABLE_IDS.CURRENCY}
                  />
                  
                  <SelectField 
                    label="Billing Cycle" 
                    value={tenant.billingCycleName}
                    editing={editing}
                    onChange={(val) => setFormData({...formData, billingCycleId: val})}
                    editValue={formData.billingCycleId}
                    codeTableId={CODE_TABLE_IDS.BILLING_CYCLE}
                  />
                  
                  <SelectField 
                    label="Country" 
                    value={tenant.countryName}
                    editing={editing}
                    onChange={(val) => setFormData({...formData, countryId: val})}
                    editValue={formData.countryId}
                    codeTableId={CODE_TABLE_IDS.COUNTRY}
                  />
                  <InfoField
                    label="Session Timeout (minutes)"
                    value={tenant.sessionTimeoutMinutes ? `${tenant.sessionTimeoutMinutes} min` : '-'}
                    editing={editing}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        sessionTimeoutMinutes: val === '' ? '' : Number(val),
                      })
                    }
                    editValue={formData.sessionTimeoutMinutes ?? ''}
                    type="number"
                  />
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Tenant Logo</label>
                    {editing ? (
                      <div className="flex flex-wrap items-center gap-4">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml"
                          onChange={handleLogoUpload}
                          className="text-sm text-gray-600"
                        />
                        {logoUploading && <span className="text-xs text-gray-500">Loading preview…</span>}
                        {formData.tenantLogo && (
                          <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <img
                              src={formData.tenantLogo}
                              alt="Tenant logo preview"
                              className="h-full w-full object-contain"
                            />
                            <button
                              type="button"
                              onClick={handleLogoRemove}
                              className="absolute top-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-gray-600 shadow hover:bg-red-50 hover:text-red-600"
                              title="Remove logo"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    ) : formData.tenantLogo ? (
                      <div className="h-16 w-16 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <img
                          src={formData.tenantLogo}
                          alt={`${tenant.name} logo`}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No logo uploaded.</p>
                    )}
                  </div>
                  <InfoField 
                    label="Focal Point Name" 
                    value={tenant.focalPointName}
                    editing={editing}
                    onChange={(val) => setFormData({...formData, focalPointName: val})}
                    editValue={formData.focalPointName}
                  />
                  <InfoField 
                    label="Focal Point Phone" 
                    value={tenant.focalPointPhone}
                    editing={editing}
                    onChange={(val) => setFormData({...formData, focalPointPhone: val})}
                    editValue={formData.focalPointPhone}
                  />
                  <InfoField 
                    label="Address" 
                    value={tenant.address}
                    editing={editing}
                    onChange={(val) => setFormData({...formData, address: val})}
                    editValue={formData.address}
                    fullWidth
                    textarea
                  />
                  <InfoField 
                    label="Comments" 
                    value={tenant.comment}
                    editing={editing}
                    onChange={(val) => setFormData({...formData, comment: val})}
                    editValue={formData.comment}
                    fullWidth
                    textarea
                  />
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Created At</p>
                      <p className="font-medium text-gray-800">
                        {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Updated At</p>
                      <p className="font-medium text-gray-800">
                        {tenant.updatedAt ? new Date(tenant.updatedAt).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="h-full flex flex-col overflow-hidden">
            <CrudPage
              title={`Subscriptions for ${tenant.name}`}
              service="access"
              resourceBase="/api/tenant-subscriptions"
              idKey="id"
              columns={subscriptionColumns}
              pageSize={10}
              formFields={subscriptionFields}
              enableCreate={true}
              enableEdit={true}
              enableDelete={true}
              fixedFilters={[
                {
                  key: 'tenantId',
                  operation: 'EQUAL',
                  value: tenantId,
                  dataType: 'UUID'
                }
              ]}
              toCreatePayload={(f) => {
                const payload = {
                  tenantId: tenantId,
                  systemCode: f.systemCode?.trim(),
                  startDate: f.startDate,
                  endDate: f.endDate,
                  price: f.price ? parseFloat(f.price) : null,
                  notes: f.notes?.trim() || null,
                  isActive: true, // Always set to true when creating
                }
                console.log('📦 Creating subscription with payload:', payload)
                return payload
              }}
              toUpdatePayload={(f, row) => ({
                id: row.id, // Use 'id' field from response
                tenantId: tenantId,
                systemCode: f.systemCode?.trim(),
                startDate: f.startDate,
                endDate: f.endDate,
                price: f.price ? parseFloat(f.price) : null,
                notes: f.notes?.trim() || null,
                isActive: true, // Always set to true when updating
              })}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Helper component for info fields
function InfoField({ label, value, editing, onChange, editValue, fullWidth, textarea, type = 'text' }) {
  return (
    <div className={fullWidth ? 'md:col-span-2' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {editing ? (
        textarea ? (
          <textarea
            value={editValue || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <input
            type={type}
            value={editValue || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )
      ) : (
        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
          {value || '-'}
        </p>
      )}
    </div>
  )
}

// Helper component for select fields with API data using cascade dropdowns
function SelectField({ label, value, editing, onChange, editValue, codeTableId }) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch options when component mounts or when switching to edit mode
  useEffect(() => {
    if (codeTableId) {
      fetchOptions()
    }
  }, [codeTableId])

  const fetchOptions = async () => {
    setLoading(true)
    try {
      console.log(`🔍 Fetching options for ${label} (codeTableId: ${codeTableId})`)
      const { data } = await api.get('/access/api/cascade-dropdowns/access.code-table-values-by-table', {
        params: { codeTableId }
      })
      console.log(`✅ Received ${data?.length || 0} options for ${label}`)
      setOptions(data || [])
    } catch (err) {
      console.error(`❌ Failed to fetch options for ${label}:`, err.response?.data?.message || err.message)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {editing ? (
        loading ? (
          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 animate-pulse">
            Loading options...
          </div>
        ) : (
          <select
            value={editValue || ''}
            onChange={(e) => {
              const selectedValue = e.target.value || null
              console.log(`📝 ${label} changed to:`, selectedValue)
              onChange(selectedValue)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">-- Select {label} --</option>
            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        )
      ) : (
        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
          {value || '-'}
        </p>
      )}
    </div>
  )
}

