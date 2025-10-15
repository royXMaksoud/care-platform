// src/modules/cms/sections/SystemSectionEditPage.jsx
// Purpose: Full-page create/edit with a Back button that returns and refreshes the list.

import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@/lib/axios'
import { toast } from 'sonner'

export default function SystemSectionEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

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

  // Load entity on edit
  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!isEdit) return
      const { data } = await api.get(`/access/api/system-sections/${id}`)
      if (mounted && data) {
        setValues({
          code: data.code ?? '',
          name: data.name ?? '',
          description: data.description ?? '',
          isActive: !!data.isActive,
          systemId: data.systemId ?? '',
          rowVersion: data.rowVersion,
        })
      }
    }
    run()
    return () => { mounted = false }
  }, [id, isEdit])

  // Fetch systems for select
  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoadingSystems(true)
        const { data } = await api.get('/access/api/systems', { params: { page: 0, size: 100 } })
        if (!mounted) return
        setSystems(data?.content || data || [])
      } finally {
        setLoadingSystems(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [])

  const change = (name, val) => setValues(v => ({ ...v, [name]: val }))
  const canSubmit = values.code?.trim() && values.name?.trim() && values.systemId

  const goBack = (withRefresh = false) => {
    if (withRefresh) {
      // Return to list and trigger a refresh
      navigate('/cms/sections', { state: { refresh: true } })
    } else {
      navigate(-1)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!canSubmit || busy) return
    setBusy(true)
    try {
      if (isEdit) {
        await api.put(`/access/api/system-sections/${id}`, {
          code: values.code?.trim(),
          name: values.name?.trim(),
          systemId: values.systemId || null,
          description: values.description?.trim() || null,
          isActive: !!values.isActive,
          ...(values.rowVersion != null ? { rowVersion: values.rowVersion } : {}),
        })
        toast.success('Saved')
      } else {
        await api.post(`/access/api/system-sections`, {
          code: values.code?.trim(),
          name: values.name?.trim(),
          systemId: values.systemId || null,
          description: values.description?.trim() || null,
          isActive: !!values.isActive,
        })
        toast.success('Created')
      }
      // Go back and refresh the list
      goBack(true)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Operation failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-4">
      <div className="rounded-2xl border shadow-sm bg-white p-4">
        {/* Header with Back */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-xl font-semibold">{isEdit ? 'Edit System Section' : 'Create System Section'}</div>
          <div className="flex items-center gap-2">
            <button className="border rounded px-3 py-1" onClick={() => goBack(false)} disabled={busy}>
              Back
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="block text-sm mb-1">Code *</label>
              <input className="w-full border rounded px-3 py-2" value={values.code} onChange={(e) => change('code', e.target.value)} />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm mb-1">Name *</label>
              <input className="w-full border rounded px-3 py-2" value={values.name} onChange={(e) => change('name', e.target.value)} />
            </div>

            {/* System */}
            <div>
              <label className="block text-sm mb-1">System *</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={values.systemId}
                onChange={(e) => change('systemId', e.target.value)}
                disabled={loadingSystems}
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
              <input id="isActive" type="checkbox" checked={values.isActive} onChange={(e) => change('isActive', e.target.checked)} />
              <label htmlFor="isActive">Active</label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="border rounded px-3 py-1" onClick={() => goBack(false)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="border rounded px-3 py-1 bg-blue-600 text-white disabled:opacity-50" disabled={!canSubmit || busy}>
              {isEdit ? 'Save changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
