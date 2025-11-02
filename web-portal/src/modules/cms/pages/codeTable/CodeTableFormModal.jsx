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
  const [codeTablesList, setCodeTablesList] = useState([])
  const [loadingCodeTables, setLoadingCodeTables] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    parentId: '',
    isReferenceTable: false,
    hasScope: false,
    entityName: '',
    isActive: true,
    rowVersion: null,
  })

  // Load CodeTables list for dropdown
  useEffect(() => {
    if (!open) return
    
    const loadCodeTables = async () => {
      setLoadingCodeTables(true)
      try {
        const response = await api.get(full(`${resourceBase}/lookup`))
        setCodeTablesList(response.data || [])
      } catch (err) {
        console.error('Failed to load code tables:', err)
        toast.error('Failed to load code tables list')
      } finally {
        setLoadingCodeTables(false)
      }
    }
    
    loadCodeTables()
  }, [open])

  useEffect(() => {
    if (!open) return
    if (isEdit && initial) {
      setForm({
        name: initial.name ?? '',
        description: initial.description ?? '',
        parentId: initial.parentId ?? '',
        isReferenceTable: Boolean(initial.isReferenceTable ?? false),
        hasScope: Boolean(initial.hasScope ?? false),
        entityName: initial.entityName ?? '',
        isActive: Boolean(initial.isActive ?? true),
        rowVersion: initial.rowVersion ?? null,
      })
    } else {
      setForm({
        name: '',
        description: '',
        parentId: '',
        isReferenceTable: false,
        hasScope: false,
        entityName: '',
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

  const buildCreatePayload = () => {
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      parentId: form.parentId || null,
      isReferenceTable: !!form.isReferenceTable,
      hasScope: !!form.hasScope,
      entityName: form.entityName?.trim() || null,
      isActive: !!form.isActive,
    }
    console.log('Create Payload:', payload)
    return payload
  }

  const buildUpdatePayload = () => {
    const payload = {
      [idKey]: initial?.[idKey],
      name: form.name.trim(),
      description: form.description?.trim() || null,
      parentId: form.parentId || null,
      isReferenceTable: !!form.isReferenceTable,
      hasScope: !!form.hasScope,
      entityName: form.entityName?.trim() || null,
      isActive: !!form.isActive,
      ...(form.rowVersion != null ? { rowVersion: form.rowVersion } : {}),
    }
    console.log('Update Payload:', payload)
    return payload
  }

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

          {/* Parent CodeTable */}
          <div className="grid gap-1">
            <label htmlFor="parentId" className="text-sm font-medium">Parent Code Table</label>
            <select
              id="parentId"
              name="parentId"
              className="border rounded px-3 py-2"
              value={form.parentId || ''}
              onChange={handleChange}
              disabled={loadingCodeTables}
            >
              <option value="">-- None (Root) --</option>
              {codeTablesList
                .filter(ct => isEdit ? ct.codeTableId !== initial?.[idKey] : true)
                .map((ct) => (
                  <option key={ct.codeTableId} value={ct.codeTableId}>
                    {ct.name}
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500">Optional: Select a parent table to create hierarchy</p>
          </div>

          {/* Reference Table */}
          <div className="grid gap-1">
            <label htmlFor="isReferenceTable" className="text-sm font-medium">Is Reference Table</label>
            <select
              id="isReferenceTable"
              name="isReferenceTable"
              className="border rounded px-3 py-2"
              value={String(form.isReferenceTable)}
              onChange={(e) => {
                const newValue = e.target.value === 'true'
                console.log('isReferenceTable changed to:', newValue)
                setForm((f) => ({ ...f, isReferenceTable: newValue }))
              }}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>

          {/* Has Scope */}
          <div className="grid gap-1">
            <label htmlFor="hasScope" className="text-sm font-medium">Has Scope</label>
            <select
              id="hasScope"
              name="hasScope"
              className="border rounded px-3 py-2"
              value={String(form.hasScope)}
              onChange={(e) => {
                const newValue = e.target.value === 'true'
                console.log('hasScope changed to:', newValue)
                setForm((f) => ({ ...f, hasScope: newValue }))
              }}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>

          {/* Entity Name - Only show if isReferenceTable is true */}
          {form.isReferenceTable && (
            <div className="grid gap-1">
              <label htmlFor="entityName" className="text-sm font-medium">Entity Name</label>
              <input
                id="entityName"
                name="entityName"
                className="border rounded px-3 py-2"
                value={form.entityName}
                onChange={handleChange}
                placeholder="e.g. CountryEntity"
              />
              <p className="text-xs text-gray-500">Enter the entity class name for this reference table</p>
            </div>
          )}

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
