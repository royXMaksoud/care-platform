// src/modules/cms/sections/SystemSectionActionFormModal.jsx
// Purpose: Create/Edit System Section Action + define ordered scope levels.

import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/axios'

export default function SystemSectionActionFormModal({
  open,
  mode,            // 'create' | 'edit'
  initial,         // entity when editing
  onClose,
  onSuccess,
  initialSystemId, // Pre-selected system ID when creating from system details page
}) {
  const [busy, setBusy] = useState(false)

  const [values, setValues] = useState({
    systemId: '',
    systemSectionId: '',
    code: '',
    name: '',
    isActive: true,
    rowVersion: undefined,
  })

  const [systems, setSystems] = useState([])
  const [sections, setSections] = useState([])
  const [loadingSystems, setLoadingSystems] = useState(false)
  const [loadingSections, setLoadingSections] = useState(false)

  // Scope Levels state
  const [availableLevels, setAvailableLevels] = useState([])
  const [selectedLevels, setSelectedLevels] = useState([])
  const [loadingLevels, setLoadingLevels] = useState(false)
  const [savingLevels, setSavingLevels] = useState(false)
  const [levelToAdd, setLevelToAdd] = useState('')

  const selectedLevelIds = useMemo(
    () => new Set(selectedLevels.map(l => String(l.id))),
    [selectedLevels]
  )

  // Helpers
  const getApiMessage = (e, fallback) =>
    e?.response?.data?.message || e?.message || fallback

  const change = (name, val) => setValues(v => ({ ...v, [name]: val }))

  const onSystemChange = (e) => {
    const newSystemId = e.target.value
    setValues(v => ({ ...v, systemId: newSystemId, systemSectionId: '' }))
    setSections([])
  }

  const addLevel = () => {
    if (!levelToAdd) return
    if (selectedLevelIds.has(String(levelToAdd))) return
    const found = availableLevels.find(x => String(x.id) === String(levelToAdd))
    if (!found) return
    setSelectedLevels(prev => [
      ...prev,
      { id: found.id, name: found.name ?? found.code ?? String(found.id) }
    ])
    setLevelToAdd('')
  }

  const removeLevel = (id) => {
    setSelectedLevels(prev => prev.filter(x => String(x.id) !== String(id)))
  }

  const moveLevel = (idx, dir) => {
    setSelectedLevels(prev => {
      const next = [...prev]
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= next.length) return prev
      const tmp = next[idx]
      next[idx] = next[newIdx]
      next[newIdx] = tmp
      return next
    })
  }

  const canSubmit =
    values.systemId &&
    values.systemSectionId &&
    values.code?.trim() &&
    values.name?.trim()

  // Init values
  useEffect(() => {
    if (!open) return
    if (initial) {
      setValues(v => ({
        ...v,
        systemId: initial.systemId ?? '',
        systemSectionId: initial.systemSectionId ?? '',
        code: initial.code ?? '',
        name: initial.name ?? '',
        isActive: !!initial.isActive,
        rowVersion: initial.rowVersion,
      }))
    } else {
      setValues({
        systemId: initialSystemId || '', // Use initialSystemId if provided
        systemSectionId: '',
        code: '',
        name: '',
        isActive: true,
        rowVersion: undefined,
      })
      setSelectedLevels([])
    }
    setLevelToAdd('')
  }, [open, initial, initialSystemId])

  // Resolve systemId from section when editing if needed
  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!open) return
      if (initial && !initial?.systemId && initial?.systemSectionId) {
        try {
          const { data } = await api.get(`/access/api/system-sections/${initial.systemSectionId}`)
          if (!mounted) return
          if (data?.systemId) setValues(v => ({ ...v, systemId: String(data.systemId) }))
        } catch { /* no-op */ }
      }
    }
    run()
    return () => { mounted = false }
  }, [open, initial])

  // Load systems
  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!open) return
      try {
        setLoadingSystems(true)
        const { data } = await api.get('/access/api/dropdowns/systems')
        if (!mounted) return
        setSystems(Array.isArray(data) ? data : [])
      } catch (err) {
        if (mounted) toast.error(getApiMessage(err, 'Failed to load systems'))
      } finally {
        if (mounted) setLoadingSystems(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [open])

  // Load sections by system
  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!open) return
      if (!values.systemId) { setSections([]); return }
      try {
        setLoadingSections(true)
        const { data } = await api.get(
          '/access/api/cascade-dropdowns/access.system-sections-by-system',
          { params: { systemId: values.systemId, lang: 'ar' } }
        )
        if (!mounted) return
        setSections(Array.isArray(data) ? data : [])
      } catch (err) {
        if (mounted) { setSections([]); toast.error(getApiMessage(err, 'Failed to load sections')) }
      } finally {
        if (mounted) setLoadingSections(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [open, values.systemId])

  // Load available scope levels + defined levels (when editing)
  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!open) return
      setLoadingLevels(true)
      try {
        // 1) load available levels
        const { data: avail } = await api.get(
          '/access/api/action-scope-hierarchies/available-levels',
          { params: { activeOnly: false } }
        )
        if (!mounted) return
        const availList = Array.isArray(avail) ? avail : []
        setAvailableLevels(availList)

        // Build quick lookup for labels by id
        const availById = new Map(availList.map(a => [String(a.id), a]))

        // 2) load defined levels for this action in edit mode
        if (mode === 'edit' && initial?.systemSectionActionId) {
          const { data: defined } = await api.get(
            `/access/api/action-scope-hierarchies/${initial.systemSectionActionId}/levels`
          )
          if (!mounted) return

          const mapped = (Array.isArray(defined) ? defined : [])
            .map(r => {
              const id = r.scopeTableId ?? r.id ?? r.scopeTable?.id
              if (!id) return null
              const a = availById.get(String(id))
              const label =
                a?.name ?? a?.code ??
                r.scopeTableName ?? r.name ?? r.scopeTable?.name ?? r.code ??
                `#${String(id).slice(0, 8)}`
              return { id, name: label }
            })
            .filter(Boolean)

          setSelectedLevels(mapped)
        } else {
          setSelectedLevels([])
        }
      } catch (err) {
        if (mounted) toast.error(getApiMessage(err, 'Failed to load scope levels'))
      } finally {
        if (mounted) setLoadingLevels(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [open, mode, initial?.systemSectionActionId])

  // Save scope levels
  const saveLevels = async (actionId) => {
    const payload = {
      items: selectedLevels.map((lvl, i) => ({
        scopeTableId: lvl.id,
        orderIndex: i + 1,
        isActive: true,
      })),
    }
    setSavingLevels(true)
    try {
      await api.put(`/access/api/action-scope-hierarchies/${actionId}/levels`, payload)
    } finally {
      setSavingLevels(false)
    }
  }

  const submitCreate = async () => {
    setBusy(true)
    try {
      const { data: created } = await api.post('/access/api/system-section-actions', {
        systemId: values.systemId,
        systemSectionId: values.systemSectionId,
        code: values.code?.trim(),
        name: values.name?.trim(),
        isActive: !!values.isActive,
      })
      const actionId = created?.systemSectionActionId || created?.id
      if (actionId) {
        await saveLevels(actionId)
      }
      toast.success('Created successfully')
      onSuccess?.()
    } catch (e) {
      toast.error(getApiMessage(e, 'Create failed'))
    } finally {
      setBusy(false)
    }
  }

  const submitUpdate = async () => {
    if (!initial) return
    setBusy(true)
    try {
      await api.put(`/access/api/system-section-actions/${initial.systemSectionActionId}`, {
        systemId: values.systemId,
        systemSectionId: values.systemSectionId,
        code: values.code?.trim(),
        name: values.name?.trim(),
        isActive: !!values.isActive,
        ...(values.rowVersion != null ? { rowVersion: values.rowVersion } : {}),
      })
      await saveLevels(initial.systemSectionActionId)
      toast.success('Updated successfully')
      onSuccess?.()
    } catch (e) {
      toast.error(getApiMessage(e, 'Update failed'))
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit || busy) return
    return mode === 'edit' ? submitUpdate() : submitCreate()
  }

  if (!open) return null

  // UI helpers to show current labels even if not loaded into options yet
  const findById = (arr, id) => arr.find(x => String(x.id) === String(id))
  const currentSystemLabel =
    findById(systems, values.systemId)?.name ||
    initial?.systemName ||
    (values.systemId ? String(values.systemId) : '')

  const currentSectionLabel =
    findById(sections, values.systemSectionId)?.name ||
    initial?.systemSectionName ||
    (values.systemSectionId ? String(values.systemSectionId) : '')

  const needGhostSystemOption =
    !!values.systemId && !findById(systems, values.systemId)

  const needGhostSectionOption =
    !!values.systemSectionId && !findById(sections, values.systemSectionId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">
            {mode === 'edit' ? 'Edit Action' : 'Create Action'}
          </div>
          <button
            className="px-2 py-1 border rounded"
            onClick={onClose}
            disabled={busy || savingLevels}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* System */}
            <div>
              <label className="block text-sm mb-1">System *</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={values.systemId}
                onChange={onSystemChange}
                disabled={loadingSystems || (mode === 'create' && initialSystemId)}
              >
                <option value="">Select...</option>
                {needGhostSystemOption && (
                  <option value={String(values.systemId)}>
                    {currentSystemLabel || 'Current value'}
                  </option>
                )}
                {systems.map(s => (
                  <option key={String(s.id)} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
              {needGhostSystemOption && (
                <div className="text-xs text-gray-500 mt-1">
                  Current: {currentSystemLabel}
                </div>
              )}
            </div>

            {/* System Section */}
            <div>
              <label className="block text-sm mb-1">System Section *</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={values.systemSectionId}
                onChange={(e) => change('systemSectionId', e.target.value)}
                disabled={!values.systemId || loadingSections}
              >
                <option value="">
                  {values.systemId ? (loadingSections ? 'Loading...' : 'Select...') : 'Select system first'}
                </option>
                {needGhostSectionOption && (
                  <option value={String(values.systemSectionId)}>
                    {currentSectionLabel || 'Current value'}
                  </option>
                )}
                {sections.map(s => (
                  <option key={String(s.id)} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
              {needGhostSectionOption && (
                <div className="text-xs text-gray-500 mt-1">
                  Current: {currentSectionLabel}
                </div>
              )}
            </div>

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

          {/* Scope Levels */}
          <div className="rounded-xl border p-4">
            <div className="font-medium mb-2">Scope Levels (top → bottom)</div>

            <div className="flex gap-2 items-center mb-3">
              <select
                className="border rounded px-3 py-2 min-w-[220px]"
                value={levelToAdd}
                onChange={(e) => setLevelToAdd(e.target.value)}
                disabled={loadingLevels || (availableLevels?.length ?? 0) === 0}
                title={(availableLevels?.length ?? 0) === 0 ? 'No available scope levels' : undefined}
              >
                <option value="">
                  {loadingLevels ? 'Loading levels...' : ((availableLevels?.length ?? 0) === 0 ? 'No levels available' : 'Select level to add')}
                </option>
                {availableLevels
                  .filter(l => !selectedLevelIds.has(String(l.id)))
                  .map(l => (
                    <option key={String(l.id)} value={String(l.id)}>
                      {l.name ?? l.code ?? String(l.id)}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                className="border rounded px-3 py-2"
                onClick={addLevel}
                disabled={!levelToAdd || loadingLevels}
              >
                Add
              </button>
            </div>

            <div className="space-y-2">
              {selectedLevels.length === 0 && (
                <div className="text-sm text-gray-500">No levels selected yet.</div>
              )}
              {selectedLevels.map((l, idx) => (
                <div key={String(l.id)} className="flex items-center justify-between border rounded px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-6 text-center">{idx + 1}</span>
                    <span>{l.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="border rounded px-2 py-1" onClick={() => moveLevel(idx, -1)} disabled={idx === 0}>↑</button>
                    <button type="button" className="border rounded px-2 py-1" onClick={() => moveLevel(idx, +1)} disabled={idx === selectedLevels.length - 1}>↓</button>
                    <button type="button" className="border rounded px-2 py-1" onClick={() => removeLevel(l.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="border rounded px-3 py-1" onClick={onClose} disabled={busy || savingLevels}>
              Cancel
            </button>
            <button
              type="submit"
              className="border rounded px-3 py-1 bg-blue-600 text-white disabled:opacity-50"
              disabled={!canSubmit || busy || savingLevels}
            >
              {mode === 'edit' ? 'Save changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
