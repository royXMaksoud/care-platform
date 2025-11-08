import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@/lib/axios'
import UserPermissionsTab from './UserPermissionsTab'
import UserRolesTab from './UserRolesTab'

export default function UserDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('info')
  const [busy, setBusy] = useState(false)
  const [u, setU] = useState(null)
  const [form, setForm] = useState({
    firstName: '', fatherName: '', surName: '', fullName: '',
    emailAddress: '', language: 'en', accountKind: 'GENERAL', type: 'USER', 
    enabled: true, profileImageUrl: '', authMethod: '', isEmailVerified: false
  })

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
      await api.put(`/auth/api/users/${userId}`, {
        firstName: form.firstName?.trim() || null,
        fatherName: form.fatherName?.trim() || null,
        surName: form.surName?.trim() || null,
        fullName: form.fullName?.trim() || null,
        emailAddress: form.emailAddress?.trim() || null,
        language: form.language || null,
        accountKind: form.accountKind || null,
        type: form.type || null,
        enabled: !!form.enabled,
        profileImageUrl: form.profileImageUrl || null,
        isEmailVerified: form.isEmailVerified,
      })
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (!u) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-40"></div>
          <div className="h-4 bg-slate-200 rounded w-60"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Modern Header with Organization Info */}
      <div className="flex-none bg-white border-b border-slate-200 shadow-sm">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <button
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => navigate(-1)}
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {u.fullName || u.emailAddress}
              </h1>
              <p className="text-sm text-slate-500">{u.emailAddress}</p>
            </div>
          </div>

          {/* Account Status Badge */}
          <div className="flex items-center gap-2">
            {u.enabled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                <div className="w-2 h-2 rounded-full bg-green-600"></div>
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                <div className="w-2 h-2 rounded-full bg-red-600"></div>
                Inactive
              </span>
            )}
          </div>
        </div>

        {/* Organization Info Cards - Modern Grid */}
        {(u.organization || u.tenant || u.organizationBranch) && (
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {u.organization && (
                <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-400 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Organization</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{u.organization.name || u.organization.id}</p>
                    </div>
                  </div>
                </div>
              )}

              {u.tenant && (
                <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-purple-400 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Tenant</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{u.tenant.name || u.tenant.id}</p>
                    </div>
                  </div>
                </div>
              )}

              {u.organizationBranch && (
                <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-amber-400 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Branch</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{u.organizationBranch.name || u.organizationBranch.id}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modern Tabs with Icons */}
        <div className="flex gap-0 px-6 border-t border-slate-100 bg-white">
          <button
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              tab==='info'
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
            }`}
            onClick={() => setTab('info')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            User Info
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              tab==='roles'
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
            }`}
            onClick={() => setTab('roles')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-2a6 6 0 0112 0v2zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Roles
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              tab==='permissions'
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
            }`}
            onClick={() => setTab('permissions')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Permissions
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'info' && (
          <form onSubmit={save} className="p-8 space-y-6 max-w-5xl">
            {/* Form Section with Card Style */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  First name
                </label>
                <input 
                  className="w-full px-2 py-1.5 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                  value={form.firstName}
                  onChange={(e)=>setForm(f=>({...f, firstName:e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Father name
                </label>
                <input 
                  className="w-full px-2 py-1.5 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                  value={form.fatherName}
                  onChange={(e)=>setForm(f=>({...f, fatherName:e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Surname
                </label>
                <input 
                  className="w-full px-2 py-1.5 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                  value={form.surName}
                  onChange={(e)=>setForm(f=>({...f, surName:e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Full name
                </label>
                <input 
                  className="w-full px-2 py-1.5 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                  value={form.fullName}
                  onChange={(e)=>setForm(f=>({...f, fullName:e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Email
                </label>
                <input 
                  type="email"
                  className="w-full px-2 py-1.5 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                  value={form.emailAddress}
                  onChange={(e)=>setForm(f=>({...f, emailAddress:e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Language
                </label>
                <select 
                  className="w-full px-2 py-1.5 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                  value={form.language}
                  onChange={(e)=>setForm(f=>({...f, language:e.target.value}))}
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="fr">Français</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Account Kind
                </label>
                <select 
                  className="w-full px-2 py-1.5 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                  value={form.accountKind}
                  onChange={(e)=>setForm(f=>({...f, accountKind:e.target.value}))}
                >
                  <option value="GENERAL">General User</option>
                  <option value="OPERATOR">Operator</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Login Method
                </label>
                <input 
                  className="w-full px-2 py-1.5 text-sm border border-input rounded-md bg-gray-50"
                  value={form.authMethod || 'LOCAL'}
                  readOnly
                  disabled
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input 
                  id="enabled" 
                  type="checkbox" 
                  className="w-3.5 h-3.5 text-primary border-input rounded focus:ring-ring"
                  checked={!!form.enabled}
                  onChange={(e)=>setForm(f=>({...f, enabled:e.target.checked}))}
                />
                <label htmlFor="enabled" className="text-xs font-medium text-foreground">
                  Enabled
                </label>
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input 
                  id="isEmailVerified" 
                  type="checkbox" 
                  className="w-3.5 h-3.5 text-primary border-input rounded focus:ring-ring"
                  checked={!!form.isEmailVerified}
                  onChange={(e)=>setForm(f=>({...f, isEmailVerified:e.target.checked}))}
                />
                <label htmlFor="isEmailVerified" className="text-xs font-medium text-foreground">
                  Email Verified
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Profile image URL
              </label>
              <input 
                className="w-full px-2 py-1.5 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                value={form.profileImageUrl}
                onChange={(e)=>setForm(f=>({...f, profileImageUrl:e.target.value}))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button 
                type="button" 
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={busy}
              >
                {busy ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}

        {tab === 'permissions' && (
          <div className="h-full">
            <UserPermissionsTab userId={userId} />
          </div>
        )}

        {tab === 'roles' && (
          <div className="p-6">
            <UserRolesTab userId={userId} />
          </div>
        )}
      </div>
    </div>
  )
}
