import { useEffect, useState } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'

export default function SystemFormModal({ open, mode = 'create', initial, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: '',
    name: '',
    isActive: true,
    systemIcon: '',
    rowVersion: undefined,
  })

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) {
      setForm({
        code: initial.code ?? '',
        name: initial.name ?? '',
        isActive: !!initial.isActive,
        systemIcon: initial.systemIcon ?? '',
        rowVersion: initial.rowVersion, 
      })
    } else {
      setForm({ code: '', name: '', isActive: true, systemIcon: '', rowVersion: undefined })
    }
  }, [open, mode, initial])

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

  const submit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)

      const payload = {
        code: form.code?.trim(),
        name: form.name?.trim(),
        isActive: !!form.isActive,
        systemIcon: form.systemIcon?.trim() || null,
        ...(form.rowVersion != null ? { rowVersion: form.rowVersion } : {}),
      }

      if (mode === 'edit' && initial?.systemId) {
        await api.put(`/access/api/systems/${initial.systemId}`, {
          systemId: initial.systemId,   // <-- مهم
          ...payload,
        })
        toast.success('System updated successfully')
      } else {
        await api.post('/access/api/systems', payload)
        toast.success('System created successfully')
      }

      onSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <form onSubmit={submit} className="bg-white rounded-lg p-4 w-[520px] space-y-3">
        <div className="text-lg font-semibold">
          {mode === 'edit' ? 'Edit System' : 'Create System'}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Code</label>
          <input
            className="border rounded px-3 py-2"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            required
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Name</label>
          <input
            className="border rounded px-3 py-2"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">System Icon (URL)</label>
          <input
            className="border rounded px-3 py-2"
            value={form.systemIcon}
            onChange={(e) => setForm((f) => ({ ...f, systemIcon: e.target.value }))}
            placeholder="https://example.com/icons/hr.svg"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            checked={!!form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
          <label htmlFor="isActive" className="text-sm">Active</label>
        </div>

        {form.rowVersion != null && (
          <input type="hidden" value={form.rowVersion} readOnly />
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className="border rounded px-3 py-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="border rounded px-3 py-1 bg-blue-600 text-white" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
