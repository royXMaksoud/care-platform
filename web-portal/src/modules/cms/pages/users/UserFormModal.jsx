// src/modules/users/UserFormModal.jsx
import { useEffect, useState } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'

/**
 * User Form Modal - supports creating and editing users
 * Features:
 * - Organization hierarchy (tenant -> organization -> branch)
 * - Account kind classification (GENERAL, OPERATOR, ADMIN)
 * - Login method badge (LOCAL vs OAUTH, inferred from password field)
 * - Account validity dates
 * - Employment dates
 * - Password expiry configuration
 */
export default function UserFormModal({ open, mode = 'create', initial, onClose, onSuccess }) {
  // Add animations CSS
  if (typeof document !== 'undefined' && !document.getElementById('user-modal-animations')) {
    const style = document.createElement('style')
    style.id = 'user-modal-animations'
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to { 
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .animate-fadeIn {
        animation: fadeIn 0.2s ease-out;
      }
      .animate-slideUp {
        animation: slideUp 0.3s ease-out;
      }
    `
    document.head.appendChild(style)
  }

  const isEdit = mode === 'edit'
  const [saving, setSaving] = useState(false)

  // Dropdown data
  const [tenants, setTenants] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [branches, setBranches] = useState([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)

  const [form, setForm] = useState({
    // Basic info
    firstName: '',
    fatherName: '',
    surName: '',
    emailAddress: '',
    password: '',
    
    // Authentication method
    authMethod: 'LOCAL', // LOCAL, OAUTH, FEDERATED_AD
    
    // Organization & Tenant
    tenantId: '',
    organizationId: '',
    organizationBranchId: '',
    
    // Account classification
    accountKind: 'GENERAL',
    
    // Legacy type (for backward compatibility)
    type: 'USER',
    
    // Status
    enabled: true,
    
    // Account validity
    validFrom: '',
    validTo: '',
    mustRenewAt: '',
    
    // Employment dates
    employmentStartDate: '',
    employmentEndDate: '',
    
    // Password policy
    passwordExpiresAt: '',
    mustChangePassword: false,
    
    // Preferences
    language: 'en',
    profileImageUrl: '',
    
    // Optimistic locking
    rowVersion: undefined,
  })

  // Load dropdown data
  useEffect(() => {
    if (!open) return
    loadDropdownData()
  }, [open])

  const loadDropdownData = async () => {
    try {
      setLoadingDropdowns(true)
      // Note: These endpoints need to exist in AMS
      // If they don't exist yet, the UI will show empty dropdowns
      const [tenantsRes, orgsRes] = await Promise.allSettled([
        api.get('/ams/api/tenants/dropdown').catch(() => ({ data: [] })),
        api.get('/ams/api/organizations/dropdown').catch(() => ({ data: [] })),
      ])
      
      if (tenantsRes.status === 'fulfilled') setTenants(tenantsRes.value?.data || [])
      if (orgsRes.status === 'fulfilled') setOrganizations(orgsRes.value?.data || [])
    } catch (err) {
      console.error('Failed to load dropdown data:', err)
    } finally {
      setLoadingDropdowns(false)
    }
  }

  // Load branches when organization changes
  useEffect(() => {
    if (!form.organizationId) {
      setBranches([])
      return
    }
    
    api.get(`/ams/api/organization-branches/dropdown?organizationId=${form.organizationId}`)
      .then(res => setBranches(res.data || []))
      .catch(() => setBranches([]))
  }, [form.organizationId])

  // Helper to format ISO instant to datetime-local input
  const formatDatetimeLocal = (isoString) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      const offset = date.getTimezoneOffset()
      const localDate = new Date(date.getTime() - offset * 60 * 1000)
      return localDate.toISOString().slice(0, 16)
    } catch {
      return ''
    }
  }

  // Helper to format ISO date to date input
  const formatDateLocal = (isoDate) => {
    if (!isoDate) return ''
    try {
      return isoDate.split('T')[0]
    } catch {
      return ''
    }
  }

  useEffect(() => {
    if (!open) return
    if (isEdit && initial) {
      setForm({
        firstName: initial.firstName ?? '',
        fatherName: initial.fatherName ?? '',
        surName: initial.surName ?? '',
        emailAddress: initial.emailAddress ?? '',
        password: '',
        authMethod: initial.authMethod ?? 'LOCAL',
        tenantId: initial.tenantId ?? '',
        organizationId: initial.organizationId ?? '',
        organizationBranchId: initial.organizationBranchId ?? '',
        accountKind: initial.accountKind ?? 'GENERAL',
        type: initial.type ?? 'USER',
        enabled: !!initial.enabled,
        validFrom: formatDatetimeLocal(initial.validFrom),
        validTo: formatDatetimeLocal(initial.validTo),
        mustRenewAt: formatDatetimeLocal(initial.mustRenewAt),
        employmentStartDate: formatDateLocal(initial.employmentStartDate),
        employmentEndDate: formatDateLocal(initial.employmentEndDate),
        passwordExpiresAt: formatDatetimeLocal(initial.passwordExpiresAt),
        mustChangePassword: !!initial.mustChangePassword,
        language: initial.language ?? 'en',
        profileImageUrl: initial.profileImageUrl ?? '',
        rowVersion: initial.rowVersion,
      })
    } else {
      // Create mode - set defaults
      const now = new Date()
      const nowLocal = formatDatetimeLocal(now.toISOString())
      
      setForm({
        firstName: '',
        fatherName: '',
        surName: '',
        emailAddress: '',
        password: '',
        authMethod: 'LOCAL',
        tenantId: '',
        organizationId: '',
        organizationBranchId: '',
        accountKind: 'GENERAL',
        type: 'USER',
        enabled: true,
        validFrom: nowLocal, // Default to now
        validTo: '',
        mustRenewAt: '',
        employmentStartDate: '',
        employmentEndDate: '',
        passwordExpiresAt: '',
        mustChangePassword: false,
        language: 'en',
        profileImageUrl: '',
        rowVersion: undefined,
      })
    }
  }, [open, isEdit, initial])

  if (!open) return null

  // Helper to convert datetime-local to ISO instant
  const toISOInstant = (datetimeLocal) => {
    if (!datetimeLocal) return null
    try {
      return new Date(datetimeLocal).toISOString()
    } catch {
      return null
    }
  }

  // Helper to convert date input to ISO date
  const toISODate = (dateLocal) => {
    if (!dateLocal) return null
    try {
      return dateLocal // Already in YYYY-MM-DD format
    } catch {
      return null
    }
  }

  const extractErrorMessage = (err) => {
    const data = err?.response?.data
    const status = err?.response?.status
    if (Array.isArray(data?.details) && data.details.length) {
      const msgs = data.details.map((d) => d?.message).filter(Boolean)
      if (msgs.length) return msgs.join('\n')
    }
    if (data?.message) return data.message
    if (status === 403) return data?.message || 'You are not allowed to perform this action'
    if (status === 409) return 'Conflict: duplicate or invalid state'
    return 'Operation failed'
  }

  const onChange = (k, v) => {
    setForm((s) => {
      const updated = { ...s, [k]: v }
      
      // If changing organization, clear branch
      if (k === 'organizationId') {
        updated.organizationBranchId = ''
      }
      
      return updated
    })
  }

  const submit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)

      const basePayload = {
        firstName: form.firstName?.trim() || null,
        fatherName: form.fatherName?.trim() || null,
        surName: form.surName?.trim() || null,
        emailAddress: form.emailAddress?.trim() || null,
        
        // Authentication method
        authMethod: form.authMethod,
        
        // Organization & Tenant (send as UUID strings or null)
        tenantId: form.tenantId || null,
        organizationId: form.organizationId || null,
        organizationBranchId: form.organizationBranchId || null,
        
        // Account classification
        accountKind: form.accountKind,
        
        // Status
        enabled: !!form.enabled,
        
        // Account validity
        validFrom: toISOInstant(form.validFrom),
        validTo: toISOInstant(form.validTo),
        mustRenewAt: toISOInstant(form.mustRenewAt),
        
        // Employment dates
        employmentStartDate: toISODate(form.employmentStartDate),
        employmentEndDate: toISODate(form.employmentEndDate),
        
        // Password policy
        passwordExpiresAt: toISOInstant(form.passwordExpiresAt),
        mustChangePassword: !!form.mustChangePassword,
        
        // Preferences
        language: form.language || 'en',
        type: form.type || 'USER',
        profileImageUrl: form.profileImageUrl?.trim() || null,
        
        ...(form.rowVersion != null ? { rowVersion: form.rowVersion } : {}),
      }

      if (isEdit) {
        if (!initial?.id) {
          toast.error('Missing user id')
          return
        }
        
        // For edit, only send password if user wants to change it
        if (form.password?.trim()) {
          basePayload.password = form.password.trim()
        }
        
        await api.put(`/auth/api/users/${initial.id}`, basePayload)
        toast.success('User updated successfully')
      } else {
        // For create, password is optional now (for OAuth users)
        const payload = {
          ...basePayload,
          password: form.password?.trim() || null,
        }
        await api.post('/auth/api/users', payload)
        toast.success('User created successfully')
      }

      onSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const canSubmit =
    form.firstName?.trim() &&
    form.emailAddress?.trim() &&
    form.accountKind && // accountKind is required
    form.authMethod // authMethod is required

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden animate-slideUp">
        <form onSubmit={submit} className="bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header - Fixed */}
          <div className="flex-none bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {isEdit ? (
                    <><span className="text-2xl">✏️</span> Edit User</>
                  ) : (
                    <><span className="text-2xl">➕</span> Create New User</>
                  )}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {isEdit ? 'Update user information and settings' : 'Add a new user to the system'}
                </p>
              </div>
              <button 
                type="button" 
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors" 
                onClick={onClose} 
                disabled={saving}
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
               style={{ maxHeight: 'calc(90vh - 180px)' }}>

            {/* Authentication Method Section */}
            <fieldset className="border-2 border-indigo-200 rounded-xl p-5 bg-gradient-to-r from-indigo-50/50 to-blue-50/50">
              <legend className="text-base font-bold text-indigo-800 px-3 bg-white rounded-md shadow-sm">
                🔐 Authentication Method
              </legend>
              <div className="mt-3">
                <label className="block text-sm mb-1.5 font-semibold text-gray-700">
                  Login Method <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border-2 border-indigo-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white font-medium"
                  value={form.authMethod}
                  onChange={(e) => onChange('authMethod', e.target.value)}
                  required
                >
                  <option value="LOCAL">🔐 Local Authentication (Password)</option>
                  <option value="OAUTH">🌐 OAuth (Google/Microsoft)</option>
                  <option value="FEDERATED_AD">🏢 Federated Active Directory</option>
                </select>
                <div className="mt-2 p-3 bg-white rounded-lg border border-indigo-200">
                  {form.authMethod === 'LOCAL' && (
                    <p className="text-xs text-gray-600">
                      ℹ️ User will login with email and password. Password field is <strong>required</strong> for LOCAL users.
                    </p>
                  )}
                  {form.authMethod === 'OAUTH' && (
                    <p className="text-xs text-gray-600">
                      ℹ️ User will login via OAuth providers (Google, Microsoft). Password field is <strong>optional</strong>.
                    </p>
                  )}
                  {form.authMethod === 'FEDERATED_AD' && (
                    <p className="text-xs text-gray-600">
                      ℹ️ User will login via Federated Active Directory. Password is managed externally.
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Basic Information */}
            <fieldset className="border-2 border-gray-200 rounded-xl p-5 bg-gray-50/50">
              <legend className="text-base font-bold text-gray-800 px-3 bg-white rounded-md shadow-sm">
                📋 Basic Information
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={form.firstName}
                    onChange={(e) => onChange('firstName', e.target.value)}
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">Father Name</label>
                  <input
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={form.fatherName}
                    onChange={(e) => onChange('fatherName', e.target.value)}
                    placeholder="Enter father name"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">Surname</label>
                  <input
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={form.surName}
                    onChange={(e) => onChange('surName', e.target.value)}
                    placeholder="Enter surname"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={form.emailAddress}
                    onChange={(e) => onChange('emailAddress', e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">
                    Password {form.authMethod === 'LOCAL' && <span className="text-red-500">*</span>}
                    {form.authMethod !== 'LOCAL' && <span className="text-gray-500 font-normal">(Optional)</span>}
                  </label>
                  <input
                    type="password"
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={form.password}
                    onChange={(e) => onChange('password', e.target.value)}
                    placeholder={isEdit ? 'Leave empty to keep current' : (form.authMethod === 'LOCAL' ? 'Enter password' : 'Optional for OAuth/AD')}
                    required={!isEdit && form.authMethod === 'LOCAL'}
                  />
                  {!isEdit && form.authMethod === 'LOCAL' && (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>Password is <strong>required</strong> for LOCAL authentication</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">Language</label>
                  <select
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    value={form.language}
                    onChange={(e) => onChange('language', e.target.value)}
                  >
                    <option value="en">🇬🇧 English</option>
                    <option value="ar">🇸🇦 العربية</option>
                    <option value="fr">🇫🇷 Français</option>
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Organization & Classification */}
            <fieldset className="border-2 border-gray-200 rounded-xl p-5 bg-gray-50/50">
              <legend className="text-base font-bold text-gray-800 px-3 bg-white rounded-md shadow-sm">
                🏢 Organization & Classification
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">
                    Account Kind <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    value={form.accountKind}
                    onChange={(e) => onChange('accountKind', e.target.value)}
                    required
                  >
                    <option value="GENERAL">👤 General User</option>
                    <option value="OPERATOR">⚙️ Operator</option>
                    <option value="ADMIN">👑 Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">Tenant</label>
                  <select
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={form.tenantId}
                    onChange={(e) => onChange('tenantId', e.target.value)}
                    disabled={loadingDropdowns}
                  >
                    <option value="">-- Select Tenant (Optional) --</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">Organization</label>
                  <select
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={form.organizationId}
                    onChange={(e) => onChange('organizationId', e.target.value)}
                    disabled={loadingDropdowns}
                  >
                    <option value="">-- Select Organization (Optional) --</option>
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">Branch</label>
                  <select
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={form.organizationBranchId}
                    onChange={(e) => onChange('organizationBranchId', e.target.value)}
                    disabled={!form.organizationId || branches.length === 0}
                  >
                    <option value="">-- Select Branch (Optional) --</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  {form.organizationId && branches.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1.5">⚠️ No branches available for this organization</p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Account Validity & Employment */}
            <fieldset className="border-2 border-gray-200 rounded-xl p-5 bg-gray-50/50">
              <legend className="text-base font-bold text-gray-800 px-3 bg-white rounded-md shadow-sm">
                📅 Validity & Employment
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">Valid From</label>
                  <input
                    type="datetime-local"
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={form.validFrom}
                    onChange={(e) => onChange('validFrom', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">📌 Account active from this date (defaults to now)</p>
                </div>

                <div>
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">Valid To</label>
                  <input
                    type="datetime-local"
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={form.validTo}
                    onChange={(e) => onChange('validTo', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">⏰ Account expires on this date (optional)</p>
                </div>

                <div>
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">Employment Start</label>
                  <input
                    type="date"
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={form.employmentStartDate}
                    onChange={(e) => onChange('employmentStartDate', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">Employment End</label>
                  <input
                    type="date"
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={form.employmentEndDate}
                    onChange={(e) => onChange('employmentEndDate', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">Must Renew At</label>
                  <input
                    type="datetime-local"
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={form.mustRenewAt}
                    onChange={(e) => onChange('mustRenewAt', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">🔄 Require account renewal (optional)</p>
                </div>

                <div>
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">Password Expires At</label>
                  <input
                    type="datetime-local"
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={form.passwordExpiresAt}
                    onChange={(e) => onChange('passwordExpiresAt', e.target.value)}
                    disabled={form.authMethod !== 'LOCAL'}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    {form.authMethod === 'LOCAL' 
                      ? '🔑 Defaults to 60 days for LOCAL users' 
                      : '🌐 Not applicable for OAuth/AD users'}
                  </p>
                </div>
              </div>
            </fieldset>

            {/* Status & Preferences */}
            <fieldset className="border-2 border-gray-200 rounded-xl p-5 bg-gray-50/50">
              <legend className="text-base font-bold text-gray-800 px-3 bg-white rounded-md shadow-sm">
                ⚙️ Status & Preferences
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200">
                  <input
                    id="enabled"
                    type="checkbox"
                    checked={!!form.enabled}
                    onChange={(e) => onChange('enabled', e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="enabled" className="text-sm font-semibold text-gray-700 cursor-pointer">
                    ✅ Account Enabled
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200">
                  <input
                    id="mustChangePassword"
                    type="checkbox"
                    checked={!!form.mustChangePassword}
                    onChange={(e) => onChange('mustChangePassword', e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="mustChangePassword" className="text-sm font-semibold text-gray-700 cursor-pointer">
                    🔐 Must Change Password
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-1.5 font-semibold text-gray-700">Profile Image URL</label>
                  <input
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={form.profileImageUrl}
                    onChange={(e) => onChange('profileImageUrl', e.target.value)}
                    placeholder="https://example.com/avatar.png"
                  />
                </div>
              </div>
            </fieldset>
          </div>

          {form.rowVersion != null && <input type="hidden" value={form.rowVersion} readOnly />}

          {/* Footer Actions - Fixed */}
          <div className="flex-none bg-gray-50 px-6 py-4 border-t-2 border-gray-200 rounded-b-xl">
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={onClose} 
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all transform hover:scale-105"
                disabled={!canSubmit || saving}
              >
                {saving ? '⏳ Saving…' : isEdit ? '💾 Save Changes' : '✨ Create User'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
