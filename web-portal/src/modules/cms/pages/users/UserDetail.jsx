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
  
  const getInitials = (value) => {
    if (!value) return 'U'
    const parts = value.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  
  const Avatar = ({ size = 'lg', src, name }) => {
    const dimension = size === 'lg' ? 'w-32 h-32' : 'w-16 h-16'
    const initials = getInitials(name)
    if (src) {
      return (
        <img
          src={src}
          alt={name}
          className={`${dimension} rounded-full object-cover border-4 border-white shadow-lg`}
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.style.display = 'none'
          }}
        />
      )
    }
    return (
      <div
        className={`${dimension} rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-semibold shadow-lg`}
      >
        {initials}
      </div>
    )
  }
  
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

  const displayName = form.fullName || u.fullName || form.emailAddress || u.emailAddress || 'Unnamed User'
  const emailValue = form.emailAddress || u.emailAddress || ''
  const avatarSource = form.profileImageUrl || u.profileImageUrl || ''
  const tenantName =
    tenants.find((tenant) => String(tenant.id) === String(form.tenantId))?.name || null
  const organizationName =
    organizations.find((org) => String(org.id) === String(form.organizationId))?.name || null
  const branchName =
    branches.find((branch) => String(branch.id) === String(form.organizationBranchId))?.name || null

  const formatDisplayDateTime = (value) => {
    if (!value) return null
    try {
      return new Date(value).toLocaleString()
    } catch {
      return value
    }
  }

  const formatDisplayDate = (value) => {
    if (!value) return null
    try {
      return new Date(value).toLocaleDateString()
    } catch {
      return value
    }
  }

  const statusBadges = [
    {
      id: 'enabled',
      label: form.enabled ? 'Active Account' : 'Inactive Account',
      tone: form.enabled ? 'success' : 'muted',
    },
    form.isEmailVerified
      ? { id: 'email', label: 'Email Verified', tone: 'info' }
      : { id: 'email', label: 'Email Not Verified', tone: 'warning' },
    form.mustChangePassword
      ? { id: 'password', label: 'Must Change Password', tone: 'warning' }
      : null,
  ].filter(Boolean)

  const contactItems = [
    emailValue
      ? {
          id: 'email',
          label: 'Email',
          value: emailValue,
          href: `mailto:${emailValue}`,
        }
      : null,
    form.language
      ? {
          id: 'language',
          label: 'Language',
          value: form.language.toUpperCase(),
        }
      : null,
    tenantName
      ? { id: 'tenant', label: 'Tenant', value: tenantName }
      : null,
  ].filter(Boolean)

  const organizationItems = [
    organizationName
      ? { id: 'organization', label: 'Organization', value: organizationName }
      : null,
    branchName
      ? { id: 'branch', label: 'Branch', value: branchName }
      : null,
    form.accountKind
      ? { id: 'accountKind', label: 'Account Type', value: form.accountKind }
      : null,
    form.type
      ? { id: 'userType', label: 'User Role', value: form.type }
      : null,
    form.authMethod
      ? { id: 'authMethod', label: 'Auth Method', value: form.authMethod || 'LOCAL' }
      : null,
  ].filter(Boolean)

  const timingItems = [
    form.validFrom ? { id: 'validFrom', label: 'Valid From', value: formatDisplayDateTime(form.validFrom) } : null,
    form.validTo ? { id: 'validTo', label: 'Valid To', value: formatDisplayDateTime(form.validTo) } : null,
    form.mustRenewAt ? { id: 'mustRenew', label: 'Must Renew', value: formatDisplayDateTime(form.mustRenewAt) } : null,
    form.passwordExpiresAt
      ? { id: 'passwordExpiresAt', label: 'Password Expires', value: formatDisplayDateTime(form.passwordExpiresAt) }
      : null,
    form.employmentStartDate
      ? { id: 'employmentStart', label: 'Employment Start', value: formatDisplayDate(form.employmentStartDate) }
      : null,
    form.employmentEndDate
      ? { id: 'employmentEnd', label: 'Employment End', value: formatDisplayDate(form.employmentEndDate) }
      : null,
  ].filter(Boolean)

  const ProfileField = ({ label, value }) => (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="mt-2 block text-sm font-semibold text-slate-900 break-words">
        {value || '—'}
      </span>
    </div>
  )

  const SummaryItem = ({ label, value }) => (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 break-words">{value || '—'}</p>
    </div>
  )
  
  const tabOptions = [
    { id: 'info', label: 'User Info' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'roles', label: 'System Roles' },
  ]
  
  const badgeToneClass = (tone) => {
    switch (tone) {
      case 'success':
        return 'bg-emerald-50 text-emerald-600 ring-emerald-100'
      case 'info':
        return 'bg-sky-50 text-sky-600 ring-sky-100'
      case 'warning':
        return 'bg-amber-50 text-amber-600 ring-amber-100'
      default:
        return 'bg-slate-100 text-slate-600 ring-slate-200'
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4">
          <CMSBreadcrumb currentPageLabel={u?.fullName || t('cms.users')} />
        </div>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-100"
        >
          ← Back
        </button>

        <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-100">
          <div className="bg-gradient-to-br from-white via-slate-50 to-white px-6 py-8 lg:px-10">
            <div className="flex flex-col gap-8 lg:flex-row">
              <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
                <Avatar size="lg" src={avatarSource} name={displayName} />
                <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                  {statusBadges.map((badge) => (
                    <span
                      key={badge.id}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeToneClass(badge.tone)}`}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-1 space-y-5">
                <div>
                  <h1 className="text-3xl font-semibold text-slate-900">{displayName}</h1>
                  <p className="text-sm text-slate-500">
                    {emailValue || 'No email information provided'}
                  </p>
                </div>
                {contactItems.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {contactItems.map((item) => (
                      <ProfileField key={item.id} label={item.label} value={item.value} />
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full space-y-4 lg:w-72">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 shadow-inner">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Account Overview
                  </p>
                  <div className="mt-4 space-y-3">
                    {organizationItems.length > 0 ? (
                      organizationItems.map((item) => (
                        <SummaryItem key={item.id} label={item.label} value={item.value} />
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No organization data available.</p>
                    )}
                  </div>
                </div>
                {timingItems.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Timeline
                    </p>
                    <div className="mt-4 space-y-3">
                      {timingItems.map((item) => (
                        <div key={item.id} className="rounded-xl bg-slate-100/70 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/70 px-6 lg:px-10">
            <nav className="flex flex-wrap gap-2 py-3">
              {tabOptions.map((option) => {
                const isActive = tab === option.id
                return (
                  <button
                    key={option.id}
                    onClick={() => setTab(option.id)}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-sm shadow-sky-200'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </nav>
          </div>

      {/* Tab Content */}
          <div className="bg-white px-6 py-8 lg:px-10">
        {tab === 'info' && (
              <form onSubmit={save} className="space-y-6">
                <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6">
                  <legend className="px-2 text-base font-semibold text-slate-800">
                    Personal Information
                  </legend>
                  <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        First Name <span className="text-rose-500">*</span>
                </label>
                <input 
                        type="text"
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  value={form.firstName}
                  onChange={(e)=>setForm(f=>({...f, firstName:e.target.value}))}
                        placeholder="Enter first name"
                />
              </div>
              <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Father Name
                </label>
                <input 
                        type="text"
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  value={form.fatherName}
                  onChange={(e)=>setForm(f=>({...f, fatherName:e.target.value}))}
                        placeholder="Enter father name"
                />
              </div>
              <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Surname
                </label>
                <input 
                        type="text"
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  value={form.surName}
                  onChange={(e)=>setForm(f=>({...f, surName:e.target.value}))}
                        placeholder="Enter surname"
                />
              </div>
              <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Full Name <span className="text-rose-500">*</span>
                </label>
                <input 
                        type="text"
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  value={form.fullName}
                  onChange={(e)=>setForm(f=>({...f, fullName:e.target.value}))}
                        placeholder="Enter full name"
                />
              </div>
              <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Email Address <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="email"
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  value={form.emailAddress}
                  onChange={(e)=>setForm(f=>({...f, emailAddress:e.target.value}))}
                        placeholder="user@example.com"
                />
              </div>
              <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Language
                </label>
                <select 
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
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

                <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6">
                  <legend className="px-2 text-base font-semibold text-slate-800">
                    Account Settings
                  </legend>
                  <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Account Kind
                </label>
                <select 
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  value={form.accountKind}
                  onChange={(e)=>setForm(f=>({...f, accountKind:e.target.value}))}
                >
                  <option value="GENERAL">General User</option>
                  <option value="OPERATOR">Operator</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Login Method
                </label>
                <input 
                        type="text"
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-600"
                  value={form.authMethod || 'LOCAL'}
                  readOnly
                  disabled
                />
              </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Status
                      </label>
                      <div className="mt-2 flex items-center gap-3">
                <input 
                          type="checkbox"
                  id="enabled" 
                          className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  checked={!!form.enabled}
                  onChange={(e)=>setForm(f=>({...f, enabled:e.target.checked}))}
                />
                        <label htmlFor="enabled" className="text-sm font-semibold text-slate-700">
                          Account Enabled
                </label>
              </div>
            </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Email Verification
                      </label>
                      <div className="mt-2 flex items-center gap-3">
                <input 
                          type="checkbox"
                  id="isEmailVerified" 
                          className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  checked={!!form.isEmailVerified}
                  onChange={(e)=>setForm(f=>({...f, isEmailVerified:e.target.checked}))}
                />
                        <label htmlFor="isEmailVerified" className="text-sm font-semibold text-slate-700">
                  Email Verified
                </label>
              </div>
            </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Must Change Password
                      </label>
                      <div className="mt-2 flex items-center gap-3">
                        <input 
                          type="checkbox"
                          id="mustChangePassword"
                          className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          checked={!!form.mustChangePassword}
                          onChange={(e)=>setForm(f=>({...f, mustChangePassword:e.target.checked}))}
                        />
                        <label htmlFor="mustChangePassword" className="text-sm font-semibold text-slate-700">
                          Must Change Password
                        </label>
                      </div>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6">
                  <legend className="px-2 text-base font-semibold text-slate-800">
                    Organization & Assignment
                  </legend>
                  <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Tenant
                      </label>
                      <select
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Organization
                      </label>
                      <select
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Branch
                      </label>
                      <select
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                        <p className="mt-1.5 text-xs text-amber-600">No branches available for this organization</p>
                      )}
                    </div>
                  </div>
                </fieldset>

                <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6">
                  <legend className="px-2 text-base font-semibold text-slate-800">
                    Validity & Employment
                  </legend>
                  <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Valid From
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        value={form.validFrom}
                        onChange={(e)=>setForm(f=>({...f, validFrom:e.target.value}))}
                      />
                      <p className="mt-1.5 text-xs text-slate-500">Account active from this date</p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Valid To
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        value={form.validTo}
                        onChange={(e)=>setForm(f=>({...f, validTo:e.target.value}))}
                      />
                      <p className="mt-1.5 text-xs text-slate-500">Account expires on this date (optional)</p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Must Renew At
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        value={form.mustRenewAt}
                        onChange={(e)=>setForm(f=>({...f, mustRenewAt:e.target.value}))}
                      />
                      <p className="mt-1.5 text-xs text-slate-500">Require account renewal (optional)</p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Password Expires At
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        value={form.passwordExpiresAt}
                        onChange={(e)=>setForm(f=>({...f, passwordExpiresAt:e.target.value}))}
                        disabled={form.authMethod !== 'LOCAL'}
                      />
                      <p className="mt-1.5 text-xs text-slate-500">
                        {form.authMethod === 'LOCAL'
                          ? 'Password expiry date for LOCAL users'
                          : 'Not applicable for OAuth/AD users'}
                      </p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Employment Start Date
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        value={form.employmentStartDate}
                        onChange={(e)=>setForm(f=>({...f, employmentStartDate:e.target.value}))}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Employment End Date
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        value={form.employmentEndDate}
                        onChange={(e)=>setForm(f=>({...f, employmentEndDate:e.target.value}))}
                      />
                    </div>
                  </div>
                </fieldset>

                <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6">
                  <legend className="px-2 text-base font-semibold text-slate-800">
                    Profile Image
                  </legend>
                  <div className="mt-4 space-y-3">
                    <label className="block text-sm font-semibold text-slate-700">
                      Profile Image URL
              </label>
              <input 
                      type="url"
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                value={form.profileImageUrl}
                onChange={(e)=>setForm(f=>({...f, profileImageUrl:e.target.value}))}
                      placeholder="https://example.com/profile.jpg"
                    />
                    {form.profileImageUrl && (
                      <div className="mt-3 flex items-center gap-3">
                        <img 
                          src={form.profileImageUrl} 
                          alt="Profile preview"
                          className="h-20 w-20 rounded-full border-2 border-slate-200 object-cover shadow-sm"
                          onError={(e) => { e.target.style.display = 'none' }}
              />
            <span className="text-sm text-slate-500">Preview</span>
            </div>
                    )}
                  </div>
                </fieldset>

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button 
                type="button" 
                    className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                    className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy}
              >
                    {busy ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {tab === 'permissions' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6">
                  <h2 className="text-xl font-semibold text-slate-900">User Permissions</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Manage permission sets assigned to{' '}
                    <span className="font-semibold text-slate-800">{u.fullName || u.emailAddress}</span>.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <UserPermissionsTab userId={userId} tenantId={u?.tenantId || null} />
                </div>
              </div>
            )}

            {tab === 'roles' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6">
                  <h2 className="text-xl font-semibold text-slate-900">System Roles</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Control system roles for{' '}
                    <span className="font-semibold text-slate-800">{u.fullName || u.emailAddress}</span>.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
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
