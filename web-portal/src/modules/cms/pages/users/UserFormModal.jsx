// src/modules/users/UserFormModal.jsx
import { useEffect, useState } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'

export default function UserFormModal({ open, mode = 'create', initial, onClose, onSuccess }) {
  const isEdit = mode === 'edit'
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    fatherName: '',
    surName: '',
    emailAddress: '',
    password: '',
    language: 'en',
    type: 'USER',
    enabled: true,
    profileImageUrl: '',
    rowVersion: undefined,
  })

  useEffect(() => {
    if (!open) return
    if (isEdit && initial) {
      setForm({
        firstName: initial.firstName ?? '',
        fatherName: initial.fatherName ?? '',
        surName: initial.surName ?? '',
        emailAddress: initial.emailAddress ?? '',
        password: '',
        language: initial.language ?? 'en',
        type: initial.type ?? 'USER',
        enabled: !!initial.enabled,
        profileImageUrl: initial.profileImageUrl ?? '',
        rowVersion: initial.rowVersion,
      })
    } else {
      setForm({
        firstName: '',
        fatherName: '',
        surName: '',
        emailAddress: '',
        password: '',
        language: 'en',
        type: 'USER',
        enabled: true,
        profileImageUrl: '',
        rowVersion: undefined,
      })
    }
  }, [open, isEdit, initial])

  if (!open) return null

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

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)

      const basePayload = {
        firstName: form.firstName?.trim() || null,
        fatherName: form.fatherName?.trim() || null,
        surName: form.surName?.trim() || null,
        emailAddress: form.emailAddress?.trim() || null,
        language: form.language || 'en',
        type: form.type || 'USER',
        enabled: !!form.enabled,
        profileImageUrl: form.profileImageUrl?.trim() || null,
        ...(form.rowVersion != null ? { rowVersion: form.rowVersion } : {}),
      }

      if (isEdit) {
        if (!initial?.id) {
          toast.error('Missing user id')
          return
        }
        await api.put(`/auth/api/users/${initial.id}`, basePayload)
        toast.success('User updated successfully')
      } else {
        const payload = {
          ...basePayload,
          password: form.password, // required on create
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
    (isEdit ? true : form.password?.trim())

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <form onSubmit={submit} className="bg-white rounded-2xl p-5 w-full max-w-3xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">{isEdit ? 'Edit User' : 'Create User'}</div>
          <button type="button" className="px-2 py-1 border rounded" onClick={onClose} disabled={saving} aria-label="Close">
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">First name *</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Father name</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.fatherName}
              onChange={(e) => onChange('fatherName', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Surname</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.surName}
              onChange={(e) => onChange('surName', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Email *</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2"
              value={form.emailAddress}
              onChange={(e) => onChange('emailAddress', e.target.value)}
              required
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm mb-1">Password *</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={form.password}
                onChange={(e) => onChange('password', e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm mb-1">Language</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.language}
              onChange={(e) => onChange('language', e.target.value)}
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Type</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.type}
              onChange={(e) => onChange('type', e.target.value)}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="enabled"
              type="checkbox"
              checked={!!form.enabled}
              onChange={(e) => onChange('enabled', e.target.checked)}
            />
            <label htmlFor="enabled">Enabled</label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Profile image URL</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.profileImageUrl}
              onChange={(e) => onChange('profileImageUrl', e.target.value)}
              placeholder="https://example.com/avatar.png"
            />
          </div>
        </div>

        {form.rowVersion != null && <input type="hidden" value={form.rowVersion} readOnly />}

        <div className="flex justify-end gap-2">
          <button type="button" className="border rounded px-3 py-1" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="submit"
            className="border rounded px-3 py-1 bg-blue-600 text-white disabled:opacity-50"
            disabled={!canSubmit || saving}
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
