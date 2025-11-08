// src/modules/cms/sections/SystemSectionFormModal.jsx
// Purpose: Single file modal to handle create/edit for System Section.
// Notes:
// - Hooks must be called unconditionally and in the same order every render.
// - We keep hooks at the top, then early-return AFTER hooks if not open.

import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/axios'

export default function SystemSectionFormModal({
  open,
  mode,            // 'create' | 'edit'
  initial,         // entity when editing
  onClose,
  onSuccess,
  initialSystemId, // Pre-selected system ID when creating from system details page
}) {
  // 1) Hooks MUST be declared at the top level, never behind a conditional return.
  const [busy, setBusy] = useState(false)
  const [values, setValues] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true,
    systemId: '',
    rowVersion: undefined,
  })
  const [systems, setSystems] = useState([])
  const [loadingSystems, setLoadingSystems] = useState(false)

  // 2) Initialize/reset values whenever "open" or "initial" changes.
  //    It's safe to put conditions INSIDE the effect (not around the hook).
  useEffect(() => {
    if (!open) return // do nothing when closed

    if (initial) {
      setValues(v => ({
        ...v,
        code: initial.code ?? '',
        name: initial.name ?? '',
        description: initial.description ?? '',
        isActive: !!initial.isActive,
        systemId: initial.systemId ?? '',
        rowVersion: initial.rowVersion,
      }))
    } else {
      setValues({
        code: '',
        name: '',
        description: '',
        isActive: true,
        systemId: initialSystemId || '', // Use initialSystemId if provided
        rowVersion: undefined,
      })
    }
  }, [open, initial, initialSystemId])

  // 3) Fetch systems when the modal opens (effect is always declared; logic is conditional).
  useEffect(() => {
    let mounted = true
    if (!open) return // only fetch when opened

    const run = async () => {
      try {
        setLoadingSystems(true)
        const { data } = await api.get('/access/api/systems', { params: { page: 0, size: 100 } })
        if (!mounted) return
        setSystems(data?.content || data || [])
      } catch {
        // noop
      } finally {
        if (mounted) setLoadingSystems(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [open])

  const change = (name, val) => setValues(v => ({ ...v, [name]: val }))
  const canSubmit = values.code?.trim() && values.name?.trim() && values.systemId

  const submitCreate = async () => {
    setBusy(true)
    try {
      await api.post('/access/api/system-sections', {
        code: values.code?.trim(),
        name: values.name?.trim(),
        systemId: values.systemId || null,
        description: values.description?.trim() || null,
        isActive: !!values.isActive,
      })
      toast.success('Created successfully')
      onSuccess?.()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Create failed')
    } finally {
      setBusy(false)
    }
  }

  const submitUpdate = async () => {
    if (!initial) return
    setBusy(true)
    try {
      await api.put(`/access/api/system-sections/${initial.systemSectionId}`, {
        code: values.code?.trim(),
        name: values.name?.trim(),
        systemId: values.systemId || null,
        description: values.description?.trim() || null,
        isActive: !!values.isActive,
        ...(values.rowVersion != null ? { rowVersion: values.rowVersion } : {}),
      })
      toast.success('Updated successfully')
      onSuccess?.()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit || busy) return
    return mode === 'edit' ? submitUpdate() : submitCreate()
  }

  // 4) Only decide what to render AFTER all hooks.
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">
            {mode === 'edit' ? 'Edit System Section' : 'Create System Section'}
          </div>
          <button className="px-2 py-1 border rounded" onClick={onClose} disabled={busy}>×</button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="block text-sm mb-1">Code *</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={values.code}
                onChange={(e) => change('code', e.target.value)}
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm mb-1">Name *</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={values.name}
                onChange={(e) => change('name', e.target.value)}
              />
            </div>

            {/* System (select) */}
            <div>
              <label className="block text-sm mb-1">System *</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={values.systemId}
                onChange={(e) => change('systemId', e.target.value)}
                disabled={loadingSystems || (mode === 'create' && initialSystemId)}
              >
                <option value="">Select...</option>
                {systems.map(s => (
                  <option key={s.systemId || s.id} value={s.systemId || s.id}>
                    {s.systemName || s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Description</label>
              <textarea
                className="w-full border rounded px-3 py-2"
                rows={3}
                value={values.description}
                onChange={(e) => change('description', e.target.value)}
              />
            </div>

            {/* Active */}
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={values.isActive}
                onChange={(e) => change('isActive', e.target.checked)}
              />
              <label htmlFor="isActive">Active</label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="border rounded px-3 py-1" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button
              type="submit"
              className="border rounded px-3 py-1 bg-blue-600 text-white disabled:opacity-50"
              disabled={!canSubmit || busy}
            >
              {mode === 'edit' ? 'Save changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
