// src/modules/codetable/CodeTableFormModal.jsx
// Self-contained modal to CREATE/UPDATE a CodeTable.

import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/axios'

export default function CodeTableFormModal({
  open,
  mode = 'create',
  initial,
  onClose,
  onSuccess,
  service = 'access',
  resourceBase = '/api/CodeTables',
}) {
  const isEdit = mode === 'edit'

  const idKey = useMemo(() => {
    if (initial?.codeTableId) return 'codeTableId'
    if (initial?.id) return 'id'
    return 'codeTableId'
  }, [initial])

  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    isActive: true,
    rowVersion: null,
  })

  useEffect(() => {
    if (!open) return
    if (isEdit && initial) {
      setForm({
        name: initial.name ?? '',
        description: initial.description ?? '',
        isActive: Boolean(initial.isActive ?? true),
        rowVersion: initial.rowVersion ?? null,
      })
    } else {
      setForm({
        name: '',
        description: '',
        isActive: true,
        rowVersion: null,
      })
    }
  }, [open, isEdit, initial])

  const full = (p) => `${service ? `/${service}` : ''}${p}`

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const validate = () => {
    if (!form.name?.trim()) {
      toast.error('Name is required')
      return false
    }
    return true
  }

  const buildCreatePayload = () => ({
    name: form.name.trim(),
    description: form.description?.trim() || null,
    isActive: !!form.isActive,
  })

  const buildUpdatePayload = () => ({
    [idKey]: initial?.[idKey],
    name: form.name.trim(),
    description: form.description?.trim() || null,
    isActive: !!form.isActive,
    ...(form.rowVersion != null ? { rowVersion: form.rowVersion } : {}),
  })

  const submit = async (e) => {
    e?.preventDefault?.()
    if (!validate()) return
    setBusy(true)
    try {
      if (isEdit) {
        const id = initial?.[idKey]
        await api.put(full(`${resourceBase}/${id}`), buildUpdatePayload())
        toast.success('CodeTable updated')
      } else {
        await api.post(full(resourceBase), buildCreatePayload())
        toast.success('CodeTable created')
      }
      onSuccess?.()
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        'Save failed'
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={() => !busy && onClose?.()} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold">
            {isEdit ? 'Edit CodeTable' : 'Create CodeTable'}
          </h2>
          <button
            type="button"
            className="rounded px-2 py-1 text-sm border"
            onClick={() => onClose?.()}
            disabled={busy}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="px-5 py-4 space-y-3">
          {/* Name */}
          <div className="grid gap-1">
            <label htmlFor="name" className="text-sm font-medium">Name *</label>
            <input
              id="name"
              name="name"
              className="border rounded px-3 py-2"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Gender"
              required
            />
          </div>

          {/* Description */}
          <div className="grid gap-1">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <textarea
              id="description"
              name="description"
              className="border rounded px-3 py-2"
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder="Optional description"
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              className="h-4 w-4"
              checked={!!form.isActive}
              onChange={handleChange}
            />
            <label htmlFor="isActive" className="text-sm">Active</label>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-end gap-2 border-t pt-4">
            <button type="button" className="border rounded px-4 py-2" onClick={() => onClose?.()} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="border rounded px-4 py-2 bg-blue-600 text-white disabled:opacity-60" disabled={busy}>
              {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
