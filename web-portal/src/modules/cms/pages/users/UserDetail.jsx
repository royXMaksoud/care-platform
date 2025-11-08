import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@/lib/axios'
import UserPermissionsTab from './UserPermissionsTab'
import UserRolesTab from '../roles/UserRolesTab'

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
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-muted rounded w-32"></div>
          <div className="h-3 bg-muted rounded w-48"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      {/* Clean Header */}
      <div className="flex-none bg-white border-b border-slate-200">
        <div className="flex items-center gap-3 px-6 py-3">
          <button 
            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
            onClick={() => navigate(-1)}
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-slate-800 truncate">
              {u.fullName || u.emailAddress}
            </h1>
            <p className="text-xs text-slate-500 truncate">{u.emailAddress}</p>
          </div>
        </div>

        {/* Clean Tabs */}
        <div className="flex gap-4 px-6 border-t border-slate-100">
          <button
            className={`px-3 py-2 text-xs font-medium transition-all relative ${
              tab==='info'
                ? 'text-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            onClick={() => setTab('info')}
          >
            User Info
            {tab==='info' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            className={`px-3 py-2 text-xs font-medium transition-all relative ${
              tab==='roles'
                ? 'text-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            onClick={() => setTab('roles')}
          >
            Roles
            {tab==='roles' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            className={`px-3 py-2 text-xs font-medium transition-all relative ${
              tab==='permissions'
                ? 'text-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            onClick={() => setTab('permissions')}
          >
            Permissions
            {tab==='permissions' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'info' && (
          <form onSubmit={save} className="p-6 space-y-4 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

        {tab === 'roles' && (
          <div className="h-full">
            <UserRolesTab userId={userId} />
          </div>
        )}

        {tab === 'permissions' && (
          <div className="h-full">
            <UserPermissionsTab userId={userId} />
          </div>
        )}
      </div>
    </div>
  )
}
