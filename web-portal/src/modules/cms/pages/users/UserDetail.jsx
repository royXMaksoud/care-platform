import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import UserPermissionsTab from './UserPermissionsTab'
import UserRolesTab from './UserRolesTab'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

export default function UserDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [tab, setTab] = useState('info')
  const [busy, setBusy] = useState(false)
  const [u, setU] = useState(null)
  
  // Dropdown data
  const [tenants, setTenants] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [branches, setBranches] = useState([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)
  
  const [form, setForm] = useState({
    firstName: '', fatherName: '', surName: '', fullName: '',
    emailAddress: '', language: 'en', accountKind: 'GENERAL', type: 'USER', 
    enabled: true, profileImageUrl: '', authMethod: '', isEmailVerified: false,
    tenantId: '', organizationId: '', organizationBranchId: '',
    validFrom: '', validTo: '', mustRenewAt: '',
    employmentStartDate: '', employmentEndDate: '',
    passwordExpiresAt: '', mustChangePassword: false,
    rowVersion: undefined
  })
  
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
  
  // Load dropdown data
  useEffect(() => {
    loadDropdownData()
  }, [])
  
  const loadDropdownData = async () => {
    try {
      setLoadingDropdowns(true)
      
      // Use filter endpoints as fallback since dropdown endpoints may not be available
      const [tenantsRes, orgsRes] = await Promise.allSettled([
        // Try dropdown first, fallback to filter
        api.get('/access/api/tenants/dropdown')
          .catch(() => api.post('/access/api/tenants/filter', {
            criteria: []
          }, { params: { page: 0, size: 1000 } }))
          .catch(() => ({ data: { content: [] } })),
        
        // Try dropdown first, fallback to filter
        api.get('/access/api/dropdowns/organizations', {
          params: { lang: localStorage.getItem('userLanguage') || 'en' }
        })
          .catch(() => api.post('/access/api/organizations/filter', {
            criteria: []
          }, { params: { page: 0, size: 1000 } }))
          .catch(() => ({ data: { content: [] } })),
      ])
      
      if (tenantsRes.status === 'fulfilled') {
        const response = tenantsRes.value
        // Handle both dropdown format (array) and filter format (content array)
        const tenantsData = response?.data?.content || response?.data || []
        const activeTenants = Array.isArray(tenantsData) 
          ? tenantsData
              .filter(t => t.isActive !== false && !t.isDeleted)
              .map(t => ({
                id: t.tenantId || t.id,
                name: t.name || t.label || 'Unknown'
              }))
          : []
        setTenants(activeTenants)
      }
      
      if (orgsRes.status === 'fulfilled') {
        const response = orgsRes.value
        // Handle both dropdown format (array) and filter format (content array)
        const orgsData = response?.data?.content || response?.data || []
        const activeOrgs = Array.isArray(orgsData)
          ? orgsData
              .filter(o => o.isActive !== false && !o.isDeleted)
              .map(o => ({
                id: o.organizationId || o.id,
                name: o.name || o.label || 'Unknown'
              }))
          : []
        setOrganizations(activeOrgs)
      }
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
    
    const userLanguage = localStorage.getItem('userLanguage') || 'en'
    
    // Try cascade dropdown first, fallback to filter
    api.get('/access/api/cascade-dropdowns/access.organization-branches-by-organization', {
      params: {
        organizationId: form.organizationId,
        lang: userLanguage
      }
    })
      .catch(() => api.post('/access/api/organization-branches/filter', {
        criteria: [
          { field: 'organizationId', operator: 'EQUAL', value: form.organizationId, dataType: 'UUID' }
        ]
      }, { params: { page: 0, size: 1000 } }))
      .then(res => {
        const response = res.data
        // Handle both dropdown format (array) and filter format (content array)
        const branchesData = response?.content || response || []
        const activeBranches = Array.isArray(branchesData)
          ? branchesData
              .filter(b => b.isActive !== false && !b.isDeleted)
              .map(b => ({
                id: b.organizationBranchId || b.id,
                name: b.name || b.label || 'Unknown'
              }))
          : []
        setBranches(activeBranches)
      })
      .catch(() => setBranches([]))
  }, [form.organizationId])

  const load = async () => {
    setBusy(true)
    try {
      const { data } = await api.get(`/auth/api/users/${userId}`)
      setU(data)
      setForm({
        firstName: data.firstName ?? '',
        fatherName: data.fatherName ?? '',
        surName: data.surName ?? '',
        fullName: data.fullName ?? '',
        emailAddress: data.emailAddress ?? '',
        language: data.language ?? 'en',
        accountKind: data.accountKind ?? 'GENERAL',
        type: data.type ?? 'USER',
        enabled: !!data.enabled,
        profileImageUrl: data.profileImageUrl ?? '',
        authMethod: data.authMethod ?? '',
        isEmailVerified: !!data.isEmailVerified,
        tenantId: data.tenantId ? String(data.tenantId) : '',
        organizationId: data.organizationId ? String(data.organizationId) : '',
        organizationBranchId: data.organizationBranchId ? String(data.organizationBranchId) : '',
        validFrom: formatDatetimeLocal(data.validFrom),
        validTo: formatDatetimeLocal(data.validTo),
        mustRenewAt: formatDatetimeLocal(data.mustRenewAt),
        employmentStartDate: formatDateLocal(data.employmentStartDate),
        employmentEndDate: formatDateLocal(data.employmentEndDate),
        passwordExpiresAt: formatDatetimeLocal(data.passwordExpiresAt),
        mustChangePassword: !!data.mustChangePassword,
        rowVersion: data.rowVersion ?? null,
      })
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { load() }, [userId])

  const save = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      // Reload dropdowns to ensure we have the latest data
      await loadDropdownData()
      // Validate tenantId exists in loaded data
      if (form.tenantId && form.tenantId.trim() !== '') {
        const tenantExists = tenants.some(t => String(t.id) === String(form.tenantId))
        if (!tenantExists) {
          // If we have loaded tenants but this one is not in the list, it might not exist
          if (tenants.length > 0) {
            const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
            if (currentLang === 'ar') {
              toast.error(`العميل المحدد (${form.tenantId}) غير موجود في القائمة المحملة`)
            } else {
              toast.error(`Selected tenant (${form.tenantId}) does not exist in loaded list`)
            }
            setBusy(false)
            return
          }
          // If tenants list is empty, we can't validate, but warn the user
          console.warn('Tenant validation skipped: tenants list is empty')
        }
      }
      
      // Validate organizationId exists in loaded data
      if (form.organizationId && form.organizationId.trim() !== '') {
        const orgExists = organizations.some(o => String(o.id) === String(form.organizationId))
        if (!orgExists) {
          // If we have loaded organizations but this one is not in the list, it might not exist
          if (organizations.length > 0) {
            const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
            if (currentLang === 'ar') {
              toast.error(`المنظمة المحددة (${form.organizationId}) غير موجودة في القائمة المحملة`)
            } else {
              toast.error(`Selected organization (${form.organizationId}) does not exist in loaded list`)
            }
            setBusy(false)
            return
          }
          // If organizations list is empty, we can't validate, but warn the user
          console.warn('Organization validation skipped: organizations list is empty')
        }
      }
      
      // Validate organizationBranchId belongs to organizationId
      if (form.organizationBranchId && form.organizationBranchId.trim() !== '') {
        if (!form.organizationId || form.organizationId.trim() === '') {
          const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
          if (currentLang === 'ar') {
            toast.error('يجب تحديد المنظمة أولاً قبل تحديد الفرع')
          } else {
            toast.error('Organization must be selected before selecting a branch')
          }
          setBusy(false)
          return
        }
        
        // Check if branch belongs to the selected organization
        const branchExists = branches.some(b => 
          String(b.id) === String(form.organizationBranchId)
        )
        if (!branchExists) {
          if (branches.length > 0) {
            const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
            if (currentLang === 'ar') {
              toast.error(`الفرع المحدد (${form.organizationBranchId}) غير موجود في القائمة المحملة`)
            } else {
              toast.error(`Selected branch (${form.organizationBranchId}) does not exist in loaded list`)
            }
            setBusy(false)
            return
          } else {
            console.warn('Branch validation skipped: branches list is empty for organization:', form.organizationId)
          }
        }
      }
      
      const payload = {
        firstName: form.firstName?.trim() || null,
        fatherName: form.fatherName?.trim() || null,
        surName: form.surName?.trim() || null,
        fullName: form.fullName?.trim() || null,
        emailAddress: form.emailAddress?.trim() || null,
        language: form.language || null,
        accountKind: form.accountKind || null,
        type: form.type || null,
        enabled: !!form.enabled,
        profileImageUrl: form.profileImageUrl?.trim() || null,
        isEmailVerified: form.isEmailVerified,
        tenantId: form.tenantId && form.tenantId.trim() !== '' ? form.tenantId : null,
        organizationId: form.organizationId && form.organizationId.trim() !== '' ? form.organizationId : null,
        organizationBranchId: form.organizationBranchId && form.organizationBranchId.trim() !== '' ? form.organizationBranchId : null,
        validFrom: toISOInstant(form.validFrom),
        validTo: toISOInstant(form.validTo),
        mustRenewAt: toISOInstant(form.mustRenewAt),
        employmentStartDate: toISODate(form.employmentStartDate),
        employmentEndDate: toISODate(form.employmentEndDate),
        passwordExpiresAt: toISOInstant(form.passwordExpiresAt),
        mustChangePassword: !!form.mustChangePassword,
      }
      
      // Add rowVersion (REQUIRED for optimistic locking)
      // ALWAYS reload fresh user data to get the latest rowVersion
      let finalRowVersion = null
      
      try {
        const { data: freshUser } = await api.get(`/auth/api/users/${userId}`)
        
        if (freshUser?.rowVersion != null && freshUser?.rowVersion !== undefined) {
          finalRowVersion = freshUser.rowVersion
        } else {
          // Try from form or current user data
          if (form.rowVersion != null && form.rowVersion !== undefined) {
            finalRowVersion = form.rowVersion
          } else if (u?.rowVersion != null && u?.rowVersion !== undefined) {
            finalRowVersion = u.rowVersion
          } else {
            finalRowVersion = 0
          }
        }
      } catch (reloadErr) {
        console.error('Failed to reload user data for rowVersion:', reloadErr)
        // Fallback to existing data
        if (form.rowVersion != null && form.rowVersion !== undefined) {
          finalRowVersion = form.rowVersion
        } else if (u?.rowVersion != null && u?.rowVersion !== undefined) {
          finalRowVersion = u.rowVersion
        } else {
          finalRowVersion = 0
        }
      }
      
      // ALWAYS include rowVersion in payload (required for JPA @Version)
      payload.rowVersion = finalRowVersion
      
      await api.put(`/auth/api/users/${userId}`, payload)
      
      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
      if (currentLang === 'ar') {
        toast.success('تم تحديث المستخدم بنجاح')
      } else {
        toast.success('User updated successfully')
      }
      
      await load()
    } catch (err) {
      console.error('Failed to update user:', err)
      console.error('Error response:', err?.response?.data)
      
      const errorCode = err?.response?.data?.code
      const errorMessage = err?.response?.data?.message || err?.response?.data?.error || 'Failed to update user'
      const errorDetails = err?.response?.data?.details
      
      let fullErrorMessage = errorMessage
      
      if (errorCode === 'error.data.integrity') {
        const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
        if (currentLang === 'ar') {
          fullErrorMessage = 'انتهاك تكامل البيانات. قد يكون بسبب:\n' +
            '• المنظمة أو العميل المحدد غير موجود في قاعدة البيانات\n' +
            '• تعديل متزامن (يرجى تحديث الصفحة والمحاولة مرة أخرى)\n' +
            '• انتهاك قيد في قاعدة البيانات'
        } else {
          fullErrorMessage = 'Data integrity violation. This may be due to:\n' +
            '• Selected organization or tenant does not exist in database\n' +
            '• Concurrent modification (please refresh and try again)\n' +
            '• Constraint violation in database'
        }
        
      }
      
      if (errorDetails && Array.isArray(errorDetails) && errorDetails.length > 0) {
        const detailsText = errorDetails.map(d => d?.message || d).join('\n')
        fullErrorMessage += '\n' + detailsText
      }
      
      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
      if (currentLang === 'ar') {
        toast.error(fullErrorMessage || 'فشل تحديث المستخدم')
      } else {
        toast.error(fullErrorMessage)
      }
    } finally {
      setBusy(false)
    }
  }

  if (!u) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-gray-600">Loading user...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-4">
        <CMSBreadcrumb currentPageLabel={u?.fullName || t('cms.users')} />
      </div>

        {/* Modern Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={() => navigate(-1)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition text-white font-bold"
                    aria-label="Back"
                    title="Back"
          >
                    ←
          </button>
                  <h1 className="text-3xl font-bold">
              {u.fullName || u.emailAddress}
            </h1>
                </div>
                <p className="text-blue-100 mt-2 flex items-center gap-3 flex-wrap">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                    {u.emailAddress}
                  </span>
                  {u.profileImageUrl && (
                    <img 
                      src={u.profileImageUrl} 
                      alt={u.fullName}
                      className="w-8 h-8 rounded-full border-2 border-white/30"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    u.enabled 
                      ? 'bg-green-500/80 text-white' 
                      : 'bg-gray-500/80 text-white'
                  }`}>
                    {u.enabled ? '✅ Active' : '❌ Inactive'}
                  </span>
                  {u.isEmailVerified && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/80 text-white">
                      ✓ Email Verified
                    </span>
                  )}
                </p>
              </div>
              <div className="text-6xl opacity-20">👤</div>
            </div>
          </div>
        </div>

        {/* Modern Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
          <div className="flex border-b-2 border-gray-100 bg-gray-50">
            <button
              onClick={() => setTab('info')}
              className={`px-8 py-4 font-bold transition-all relative ${
                tab === 'info'
                  ? 'text-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                📋 User Info
              </span>
              {tab === 'info' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              )}
            </button>
          <button
              onClick={() => setTab('permissions')}
              className={`px-8 py-4 font-bold transition-all relative ${
                tab === 'permissions'
                  ? 'text-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                🔐 Permissions
              </span>
              {tab === 'permissions' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            )}
          </button>
          <button
              onClick={() => setTab('roles')}
              className={`px-8 py-4 font-bold transition-all relative ${
                tab === 'roles'
                  ? 'text-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                👥 System Roles
              </span>
              {tab === 'roles' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            )}
          </button>
      </div>

      {/* Tab Content */}
          <div className="p-8">
        {tab === 'info' && (
              <form onSubmit={save} className="space-y-6">
                <fieldset className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50/30">
                  <legend className="text-base font-bold text-blue-800 px-3 bg-white rounded-md shadow-sm">
                    👤 Personal Information
                  </legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
              <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        First Name <span className="text-red-500">*</span>
                </label>
                <input 
                        type="text"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={form.firstName}
                  onChange={(e)=>setForm(f=>({...f, firstName:e.target.value}))}
                        placeholder="Enter first name"
                />
              </div>
              <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Father Name
                </label>
                <input 
                        type="text"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={form.fatherName}
                  onChange={(e)=>setForm(f=>({...f, fatherName:e.target.value}))}
                        placeholder="Enter father name"
                />
              </div>
              <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Surname
                </label>
                <input 
                        type="text"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={form.surName}
                  onChange={(e)=>setForm(f=>({...f, surName:e.target.value}))}
                        placeholder="Enter surname"
                />
              </div>
              <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                </label>
                <input 
                        type="text"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={form.fullName}
                  onChange={(e)=>setForm(f=>({...f, fullName:e.target.value}))}
                        placeholder="Enter full name"
                />
              </div>
              <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={form.emailAddress}
                  onChange={(e)=>setForm(f=>({...f, emailAddress:e.target.value}))}
                        placeholder="user@example.com"
                />
              </div>
              <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Language
                </label>
                <select 
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={form.language}
                  onChange={(e)=>setForm(f=>({...f, language:e.target.value}))}
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="fr">Français</option>
                </select>
              </div>
                  </div>
                </fieldset>

                <fieldset className="border-2 border-indigo-200 rounded-xl p-6 bg-indigo-50/30">
                  <legend className="text-base font-bold text-indigo-800 px-3 bg-white rounded-md shadow-sm">
                    ⚙️ Account Settings
                  </legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
              <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Account Kind
                </label>
                <select 
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={form.accountKind}
                  onChange={(e)=>setForm(f=>({...f, accountKind:e.target.value}))}
                >
                  <option value="GENERAL">General User</option>
                  <option value="OPERATOR">Operator</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Login Method
                </label>
                <input 
                        type="text"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 bg-gray-100 text-gray-600 cursor-not-allowed"
                  value={form.authMethod || 'LOCAL'}
                  readOnly
                  disabled
                />
              </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Status
                      </label>
                      <div className="flex items-center gap-3 mt-2">
                <input 
                          type="checkbox"
                  id="enabled" 
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  checked={!!form.enabled}
                  onChange={(e)=>setForm(f=>({...f, enabled:e.target.checked}))}
                />
                        <label htmlFor="enabled" className="text-sm font-semibold text-gray-700">
                          Account Enabled
                </label>
              </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email Verification
                      </label>
                      <div className="flex items-center gap-3 mt-2">
                <input 
                          type="checkbox"
                  id="isEmailVerified" 
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  checked={!!form.isEmailVerified}
                  onChange={(e)=>setForm(f=>({...f, isEmailVerified:e.target.checked}))}
                />
                        <label htmlFor="isEmailVerified" className="text-sm font-semibold text-gray-700">
                  Email Verified
                </label>
              </div>
            </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Must Change Password
                      </label>
                      <div className="flex items-center gap-3 mt-2">
                        <input 
                          type="checkbox"
                          id="mustChangePassword"
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          checked={!!form.mustChangePassword}
                          onChange={(e)=>setForm(f=>({...f, mustChangePassword:e.target.checked}))}
                        />
                        <label htmlFor="mustChangePassword" className="text-sm font-semibold text-gray-700">
                          Must Change Password
                        </label>
                      </div>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50/50">
                  <legend className="text-base font-bold text-gray-800 px-3 bg-white rounded-md shadow-sm">
                    🏢 Organization & Classification
                  </legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Tenant
                      </label>
                      <select
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        value={form.tenantId}
                        onChange={(e)=>setForm(f=>({...f, tenantId:e.target.value}))}
                        disabled={loadingDropdowns}
                      >
                        <option value="">-- Select Tenant (Optional) --</option>
                        {tenants.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Organization
                      </label>
                      <select
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        value={form.organizationId}
                        onChange={(e)=>setForm(f=>({...f, organizationId:e.target.value, organizationBranchId:''}))}
                        disabled={loadingDropdowns}
                      >
                        <option value="">-- Select Organization (Optional) --</option>
                        {organizations.map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Branch
                      </label>
                      <select
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        value={form.organizationBranchId}
                        onChange={(e)=>setForm(f=>({...f, organizationBranchId:e.target.value}))}
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

                <fieldset className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50/50">
                  <legend className="text-base font-bold text-gray-800 px-3 bg-white rounded-md shadow-sm">
                    📅 Validity & Employment
                  </legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Valid From
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={form.validFrom}
                        onChange={(e)=>setForm(f=>({...f, validFrom:e.target.value}))}
                      />
                      <p className="text-xs text-gray-500 mt-1.5">📌 Account active from this date</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Valid To
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={form.validTo}
                        onChange={(e)=>setForm(f=>({...f, validTo:e.target.value}))}
                      />
                      <p className="text-xs text-gray-500 mt-1.5">⏰ Account expires on this date (optional)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Must Renew At
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={form.mustRenewAt}
                        onChange={(e)=>setForm(f=>({...f, mustRenewAt:e.target.value}))}
                      />
                      <p className="text-xs text-gray-500 mt-1.5">🔄 Require account renewal (optional)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Password Expires At
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                        value={form.passwordExpiresAt}
                        onChange={(e)=>setForm(f=>({...f, passwordExpiresAt:e.target.value}))}
                        disabled={form.authMethod !== 'LOCAL'}
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        {form.authMethod === 'LOCAL' 
                          ? '🔑 Password expiry date for LOCAL users' 
                          : '🌐 Not applicable for OAuth/AD users'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Employment Start Date
                      </label>
                      <input
                        type="date"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={form.employmentStartDate}
                        onChange={(e)=>setForm(f=>({...f, employmentStartDate:e.target.value}))}
                      />
                    </div>
            <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Employment End Date
                      </label>
                      <input
                        type="date"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={form.employmentEndDate}
                        onChange={(e)=>setForm(f=>({...f, employmentEndDate:e.target.value}))}
                      />
                    </div>
                  </div>
                </fieldset>

                <fieldset className="border-2 border-purple-200 rounded-xl p-6 bg-purple-50/30">
                  <legend className="text-base font-bold text-purple-800 px-3 bg-white rounded-md shadow-sm">
                    🖼️ Profile Image
                  </legend>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Profile Image URL
              </label>
              <input 
                      type="url"
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={form.profileImageUrl}
                onChange={(e)=>setForm(f=>({...f, profileImageUrl:e.target.value}))}
                      placeholder="https://example.com/profile.jpg"
                    />
                    {form.profileImageUrl && (
                      <div className="mt-3">
                        <img 
                          src={form.profileImageUrl} 
                          alt="Profile preview"
                          className="w-20 h-20 rounded-full border-2 border-gray-300 object-cover"
                          onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
                    )}
                  </div>
                </fieldset>

                <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
              <button 
                type="button" 
                    className="px-6 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={busy}
              >
                    {busy ? '💾 Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        )}

        {tab === 'permissions' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                        <span className="text-3xl">🔐</span>
                        User Permissions
                      </h2>
                      <p className="text-gray-600">
                        Manage permissions for <span className="font-bold text-blue-600">{u.fullName || u.emailAddress}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border-2 border-gray-100 shadow-sm overflow-hidden">
                  <UserPermissionsTab userId={userId} tenantId={u?.tenantId || null} />
                </div>
              </div>
            )}

            {tab === 'roles' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                        <span className="text-3xl">👥</span>
                        System Roles
                      </h2>
                      <p className="text-gray-600">
                        Manage system roles assigned to <span className="font-bold text-purple-600">{u.fullName || u.emailAddress}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border-2 border-gray-100 shadow-sm overflow-hidden">
                  <UserRolesTab userId={userId} tenantId={null} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
