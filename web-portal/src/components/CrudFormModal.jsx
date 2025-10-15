// src/components/CrudFormModal.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { api } from '@/lib/axios'

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
      if (f.type === 'checkbox') base[f.name] = false
      else base[f.name] = ''
    })
    return base
  }, [fields])

  const [form, setForm] = useState(initialState)
  const [selectOptions, setSelectOptions] = useState({}) // Store options for each select field
  const [loadingFields, setLoadingFields] = useState({}) // Track loading state per field
  const firstFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setForm({ ...initialState, ...(initial || {}) })
  }, [open, initial, initialState])

  // Fetch options for select fields with apiUrl
  useEffect(() => {
    if (!open) return
    
    const fetchSelectOptions = async () => {
      const selectFields = fields.filter(f => f.type === 'select' && f.apiUrl && !f.options)
      
      if (selectFields.length === 0) return
      
      // Set loading state for all select fields
      const loadingState = {}
      selectFields.forEach(f => { loadingState[f.name] = true })
      setLoadingFields(loadingState)
      
      // Fetch all options in parallel
      const promises = selectFields.map(async (field) => {
        try {
          console.log(`🔍 Fetching options for ${field.name} from ${field.apiUrl}`)
          
          const { data } = await api.get(field.apiUrl, {
            params: field.apiParams || {}
          })
          
          // Handle different response formats
          const items = data?.content || data || []
          
          console.log(`✅ Received ${items.length} options for ${field.name}`)
          
          // Map to options format
          const options = items.map(item => ({
            value: item[field.valueKey || 'id'] || item.id,
            label: item[field.labelKey || 'name'] || item.name
          }))
          
          return { field: field.name, options }
        } catch (err) {
          console.error(`❌ Failed to fetch options for ${field.name}:`, err.response?.data?.message || err.message)
          return { field: field.name, options: [] }
        }
      })
      
      const results = await Promise.all(promises)
      
      // Update options state
      const optionsState = {}
      results.forEach(result => {
        optionsState[result.field] = result.options
      })
      setSelectOptions(optionsState)
      
      // Clear loading state
      setLoadingFields({})
    }
    
    fetchSelectOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]) // Only depend on 'open' to prevent multiple calls

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
                  <select 
                    id={inputId} 
                    className="border rounded-xl px-3 py-2"
                    value={form[f.name] ?? ''} 
                    onChange={(e) => update(f.name, e.target.value)}
                    required={f.required}
                    disabled={loadingFields[f.name]}
                  >
                    <option value="">
                      {loadingFields[f.name] ? 'Loading...' : (f.placeholder || 'Select…')}
                    </option>
                    {/* Use API options if available, otherwise use static options */}
                    {(selectOptions[f.name] || f.options || []).map((o) => (
                      <option key={String(o.value)} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
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
      </div>
    </>,
    document.body
  )
}
