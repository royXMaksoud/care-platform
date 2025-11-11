// src/components/CrudFormModal.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { api } from '@/lib/axios'
import SearchableSelect from '@/components/SearchableSelect'
import MapPickerModal from '@/components/MapPickerModal'

export default function CrudFormModal({
  open,
  mode = 'create',
  title,
  fields = [],
  initial,
  onClose,
  onSubmit,
  busy = false,
}) {
  const initialState = useMemo(() => {
    const base = {}
    fields.forEach((f) => {
      if (Object.prototype.hasOwnProperty.call(f, 'defaultValue')) {
        base[f.name] = f.defaultValue
      } else if (f.type === 'checkbox') {
        base[f.name] = false
      } else {
        base[f.name] = ''
      }
    })
    return base
  }, [fields])

  const [form, setForm] = useState(initialState)
  const [selectOptions, setSelectOptions] = useState({}) // Store options for each select field
  const [loadingFields, setLoadingFields] = useState({}) // Track loading state per field
  const [mapOpen, setMapOpen] = useState(false)
  const [mapConfig, setMapConfig] = useState(null) // { latName, lngName, label }
  const firstFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setForm({ ...initialState, ...(initial || {}) })
  }, [open, initial, initialState])

  // Fetch options for select fields with apiUrl
  useEffect(() => {
    if (!open) return

    const fetchFieldOptions = async (field) => {
      try {
        if (typeof field.skipFetchWhen === 'function' && field.skipFetchWhen(form)) {
          setSelectOptions(prev => ({ ...prev, [field.name]: [] }))
          return
        }
        const method = (field.apiMethod || 'get').toLowerCase()
        const params = typeof field.apiParams === 'function' ? field.apiParams(form) : (field.apiParams || {})
        const body = typeof field.apiBody === 'function' ? field.apiBody(form) : (field.apiBody || {})
        let response
        if (method === 'post') {
          response = await api.post(field.apiUrl, body, { params })
        } else {
          response = await api.get(field.apiUrl, { params })
        }
        const data = response.data
        const items = data?.content || data || []
        const options = (field.optionMapper
          ? items.map(field.optionMapper)
          : items.map(item => ({
              value: item[field.valueKey || 'id'] || item.id,
              label: item[field.labelKey || 'name'] || item.name
            }))
        )
        setSelectOptions(prev => ({ ...prev, [field.name]: options }))
      } catch (err) {
        console.error(`❌ Failed to fetch options for ${field.name}:`, err.response?.data?.message || err.message)
        setSelectOptions(prev => ({ ...prev, [field.name]: [] }))
      } finally {
        setLoadingFields(prev => ({ ...prev, [field.name]: false }))
      }
    }

    const selectFields = fields.filter(f => f.type === 'select' && f.apiUrl && !f.options)
    if (selectFields.length === 0) return

    // Initial load for all
    const loadingState = {}
    selectFields.forEach(f => { loadingState[f.name] = true })
    setLoadingFields(loadingState)
    selectFields.forEach(f => fetchFieldOptions(f))

    // Set up dependency-based reloads
    const reloadDependencies = selectFields.filter(f => Array.isArray(f.reloadOn) && f.reloadOn.length > 0)
    if (reloadDependencies.length > 0) {
      // Watch form state; on any dependency change, refetch that field
      const unsubs = reloadDependencies.map(f => {
        let prev = {}
        f.reloadOn.forEach(dep => { prev[dep] = form[dep] })
        return setInterval(() => {
          const changed = f.reloadOn.some(dep => prev[dep] !== form[dep])
          if (changed) {
            f.reloadOn.forEach(dep => { prev[dep] = form[dep] })
            setLoadingFields(prevL => ({ ...prevL, [f.name]: true }))
            fetchFieldOptions(f)
            // reset value if current selection no longer valid
            setForm(cur => ({ ...cur, [f.name]: '' }))
          }
        }, 300)
      })
      return () => unsubs.forEach(id => clearInterval(id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form])

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = prevOverflow }
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => firstFocusRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onClose])

  if (!open) return null

  const update = (name, value) => setForm((f) => ({ ...f, [name]: value }))

  const submit = async (e) => {
    e.preventDefault()
    try {
      await onSubmit?.(form)  // parent will call API + refresh
      onClose?.()             // <-- close after successful save
      // optional: reset local form
      setForm(initialState)
    } catch (err) {
      // let parent toast the error; we just keep modal open
      console.error(err)
    }
  }

  const mapField = fields.find((f) => f.type === 'map')

  const mapButtonLabel = mapField?.buttonLabel || mapField?.label || 'Pick on map'

  const formatCoordinate = (value) => {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return ''
    return Number(numeric.toFixed(6))
  }

  return ReactDOM.createPortal(
    <>
      <div
        className="fixed inset-0 z-[1000] bg-black/30 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        className="fixed left-1/2 top-1/2 z-[1001] -translate-x-1/2 -translate-y-1/2
                   w-[min(96vw,720px)] rounded-2xl border bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">
            {mode === 'edit' ? `Edit ${title}` : `Create ${title}`}
          </h3>
          <button className="rounded-lg px-2 py-1 hover:bg-gray-100" onClick={onClose} disabled={busy} aria-label="Close">✕</button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {fields.map((f, idx) => {
            const inputId = `crud-field-${f.name}`
            if (f.type === 'hidden') {
              return <input key={f.name} type="hidden" id={inputId} value={form[f.name] ?? ''} readOnly />
            }
            return (
              <div className="grid gap-2" key={f.name}>
                {f.label && <label htmlFor={inputId} className="text-sm font-medium">{f.label}</label>}
                {(!f.type || f.type === 'text') && (
                  <input id={inputId} type="text" className="border rounded-xl px-3 py-2"
                         value={form[f.name] ?? ''} onChange={(e) => update(f.name, e.target.value)}
                         placeholder={f.placeholder} required={f.required} ref={idx === 0 ? firstFocusRef : undefined}/>
                )}
                {f.type === 'email' && (
                  <input id={inputId} type="email" className="border rounded-xl px-3 py-2"
                         value={form[f.name] ?? ''} onChange={(e) => update(f.name, e.target.value)}
                         placeholder={f.placeholder} required={f.required} ref={idx === 0 ? firstFocusRef : undefined}/>
                )}
                {f.type === 'date' && (
                  <input id={inputId} type="date" className="border rounded-xl px-3 py-2"
                         value={form[f.name] ?? ''} onChange={(e) => update(f.name, e.target.value)}
                         required={f.required}/>
                )}
                {f.type === 'number' && (
                  <input id={inputId} type="number" className="border rounded-xl px-3 py-2"
                         value={form[f.name] ?? ''} onChange={(e) => update(f.name, e.target.value === '' ? '' : Number(e.target.value))}
                         placeholder={f.placeholder} required={f.required}/>
                )}
                {f.type === 'textarea' && (
                  <textarea id={inputId} className="border rounded-xl px-3 py-2" rows={f.rows || 4}
                            value={form[f.name] ?? ''} onChange={(e) => update(f.name, e.target.value)}
                            placeholder={f.placeholder} required={f.required}/>
                )}
                {f.type === 'checkbox' && (
                  <div className="flex items-center gap-2">
                    <input id={inputId} type="checkbox" className="h-4 w-4"
                           checked={!!form[f.name]} onChange={(e) => update(f.name, e.target.checked)}/>
                    {f.inlineLabel && <span className="text-sm">{f.inlineLabel}</span>}
                  </div>
                )}
                {f.type === 'select' && (
                  <SearchableSelect
                    options={selectOptions[f.name] || f.options || []}
                    value={form[f.name] ?? ''}
                    onChange={(value) => update(f.name, value)}
                    placeholder={loadingFields[f.name] ? 'Loading...' : (f.placeholder || 'Select…')}
                    isLoading={loadingFields[f.name]}
                    isDisabled={(typeof f.disabledWhen === 'function' ? f.disabledWhen(form) : f.disabled) || loadingFields[f.name]}
                    isClearable={!f.required}
                    isSearchable={true}
                  />
                )}
                {f.type === 'button' && (
                  <button type="button" className="rounded-xl border px-3 py-2 hover:bg-gray-50"
                          onClick={() => f.onClick?.({ form, setForm: update })}>
                    {f.label}
                  </button>
                )}
              </div>
            )
          })}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="rounded-xl border px-3 py-1 hover:bg-gray-50" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="rounded-xl bg-blue-600 px-3 py-1 text-white disabled:opacity-60" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
        {/* Map Picker field: rendered as a dedicated control when present */}
        {mapField && (
          <div className="px-4 pb-4">
            <button
              type="button"
              className="rounded-xl border px-3 py-2 hover:bg-gray-50"
              onClick={() => {
                if (!mapField?.latName || !mapField?.lngName) return
                setMapConfig({
                  latName: mapField.latName,
                  lngName: mapField.lngName,
                  label: mapButtonLabel,
                })
                setMapOpen(true)
              }}
            >
              {mapButtonLabel}
            </button>
          </div>
        )}
      </div>
      <MapPickerModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        initialLat={form[mapConfig?.latName]}
        initialLng={form[mapConfig?.lngName]}
        onPick={({ latitude, longitude }) => {
          if (!mapConfig) return
          setForm((f) => ({
            ...f,
            [mapConfig.latName]: formatCoordinate(latitude),
            [mapConfig.lngName]: formatCoordinate(longitude),
          }))
        }}
      />
    </>,
    document.body
  )
}
