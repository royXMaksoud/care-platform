import React, { useEffect, useState } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export default function SystemRoleFormModal({ open, mode, initial, onClose, onSuccess }) {
  const { t, i18n } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [systems, setSystems] = useState([])
  const [form, setForm] = useState({
    systemId: '',
    code: '',
    name: '',
    description: '',
    roleType: 'CUSTOM',
    isActive: true,
  })

  useEffect(() => {
    if (open) {
      loadSystems()
      if (initial) {
        setForm({
          systemId: initial.systemId || '',
          code: initial.code || '',
          name: initial.name || '',
          description: initial.description || '',
          roleType: initial.roleType || 'CUSTOM',
          isActive: initial.isActive !== undefined ? initial.isActive : true,
        })
      } else {
        setForm({
          systemId: '',
          code: '',
          name: '',
          description: '',
          roleType: 'CUSTOM',
          isActive: true,
        })
      }
    }
  }, [open, initial])

  const loadSystems = async () => {
    try {
      const { data } = await api.get('/access/api/dropdowns/systems')
      if (Array.isArray(data)) {
        setSystems(data.map(x => ({ id: String(x.id), name: x.name })))
      } else {
        const { data: fullData } = await api.get('/access/api/systems', { params: { page: 0, size: 500 } })
        const list = fullData?.content ?? fullData ?? []
        setSystems(list.map(x => ({ id: String(x.systemId ?? x.id), name: x.name })))
      }
    } catch (err) {
      console.error('Failed to load systems:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return

    setBusy(true)
    try {
      if (mode === 'create') {
        await api.post('/access/api/system-roles', {
          systemId: form.systemId,
          code: form.code?.trim(),
          name: form.name?.trim(),
          description: form.description?.trim() || null,
          roleType: form.roleType,
          isActive: !!form.isActive,
        })
        const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
        if (currentLang === 'ar') {
          toast.success('تم إنشاء Role بنجاح')
        } else {
          toast.success('Role created successfully')
        }
      } else {
        await api.put(`/access/api/system-roles/${initial.systemRoleId}`, {
          code: form.code?.trim(),
          name: form.name?.trim(),
          description: form.description?.trim() || null,
          roleType: form.roleType,
          isActive: !!form.isActive,
        })
        const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
        if (currentLang === 'ar') {
          toast.success('تم تحديث Role بنجاح')
        } else {
          toast.success('Role updated successfully')
        }
      }
      onSuccess?.()
    } catch (err) {
      console.error('Failed to save role:', err)
      const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
      if (currentLang === 'ar') {
        toast.error('فشل حفظ Role')
      } else {
        toast.error('Failed to save role')
      }
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <h3 className="text-lg font-bold text-white">
            {mode === 'create' ? 'Create System Role' : 'Edit System Role'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.systemId}
                onChange={(e) => setForm(f => ({ ...f, systemId: e.target.value }))}
              >
                <option value="">-- Select a system --</option>
                {systems.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.code}
              onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
              placeholder="e.g., ADMIN_ROLE"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Administrator Role"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Role description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.roleType}
              onChange={(e) => setForm(f => ({ ...f, roleType: e.target.value }))}
            >
              <option value="CUSTOM">Custom</option>
              <option value="BUILTIN">Built-in</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              checked={form.isActive}
              onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

