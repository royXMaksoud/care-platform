// src/packages/datatable/FilterBar.jsx
import { useMemo, useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

// Fallback operators per type (used if meta doesn't provide operators)
const OPS = {
  string:   ['LIKE','EQUAL', 'STARTS_WITH', 'ENDS_WITH', 'IN'],
  number:   ['EQUAL', 'GT', 'GTE', 'LT', 'LTE', 'BETWEEN', 'IN'],
  date:     ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN'],
  datetime: ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN'],
  boolean:  ['EQUAL'],
  enum:     ['EQUAL', 'IN'],
}

// Normalize meta to a single shape { fields:[{name,label,type,enumValues,operators}] }
function normalizeMeta(meta) {
  if (!meta) return { fields: [] }

  // collect from meta.fields or meta.columns
  let cols = []
  if (Array.isArray(meta.fields) && meta.fields.length) cols = meta.fields
  else if (Array.isArray(meta.columns)) cols = meta.columns

  const seen = new Set()
  const fields = (cols || []).map((c, idx) => {
    // infer a base name and ensure uniqueness
    let base = c.name ?? c.field ?? c.accessorKey ?? c.key ?? c.header ?? `col_${idx}`
    base = String(base).trim() || `col_${idx}`

    let name = base
    while (seen.has(name)) name = `${base}__${idx}`
    seen.add(name)

    return {
      ...c,
      name,
      label: c.label ?? c.header ?? name,
      type: c.type ?? 'string',
      enumValues: c.enumValues ?? c.values ?? [],
      operators: c.operators, // optional
    }
  })

  return { fields }
}

export default function FilterBar({ meta, value = [], onChange, onApply, onClear }) {
  const { fields } = useMemo(() => normalizeMeta(meta), [meta])

  // Local rows with stable ids (to avoid React key warnings)
  const [local, setLocal] = useState([])

  // Sync local state whenever parent value changes
  useEffect(() => {
    const withIds = (value || []).map(r => ({ _id: r._id ?? crypto.randomUUID(), ...r }))
    setLocal(withIds)
  }, [value])

  const fieldsByName = useMemo(() => {
    const m = new Map()
    fields.forEach(f => m.set(f.name, f))
    return m
  }, [fields])

  const addRow = () => {
    if (!fields.length) return
    const first = fields[0].name
    setLocal(prev => [...prev, { _id: crypto.randomUUID(), field: first, op: 'EQUAL', value: '' }])
  }

  const removeRow = (i) => setLocal(prev => prev.filter((_, idx) => idx !== i))
  const updateRow = (i, patch) =>
    setLocal(prev => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const renderValueInput = (fmeta, row, i) => {
    const t = fmeta?.type ?? 'string'
    const op = row.op
    const common = { 
      className: 'border border-border rounded-md px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-ring bg-background' 
    }

    if (t === 'boolean') {
      return (
        <select
          {...common}
          value={String(row.value ?? '')}
          onChange={e => updateRow(i, { value: e.target.value === 'true' })}
        >
          <option value="">Select...</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      )
    }

    if (t === 'enum' && fmeta?.enumValues?.length) {
      if (op === 'IN') {
        return (
          <select
            {...common}
            multiple
            value={row.value ?? []}
            onChange={e =>
              updateRow(i, { value: [...e.target.selectedOptions].map(o => o.value) })
            }
          >
            {fmeta.enumValues.map((opt, idx) => {
              const val = opt?.value ?? opt
              const lab = opt?.label ?? val
              return (
                <option key={`${val}-${idx}`} value={val}>
                  {lab}
                </option>
              )
            })}
          </select>
        )
      }
      return (
        <select
          {...common}
          value={row.value ?? ''}
          onChange={e => updateRow(i, { value: e.target.value })}
        >
          <option value="">Select...</option>
          {fmeta.enumValues.map((opt, idx) => {
            const val = opt?.value ?? opt
            const lab = opt?.label ?? val
            return (
              <option key={`${val}-${idx}`} value={val}>
                {lab}
              </option>
            )
          })}
        </select>
      )
    }

    if (op === 'BETWEEN') {
      const typeAttr = t === 'number' ? 'number' : (t === 'date' || t === 'datetime') ? 'date' : 'text'
      return (
        <div className="flex gap-2">
          <input 
            {...common} 
            type={typeAttr} 
            placeholder="From"
            value={row.value ?? ''} 
            onChange={e => updateRow(i, { value: e.target.value })} 
          />
          <input 
            {...common} 
            type={typeAttr} 
            placeholder="To"
            value={row.value2 ?? ''} 
            onChange={e => updateRow(i, { value2: e.target.value })} 
          />
        </div>
      )
    }

    if (op === 'IN') {
      return (
        <input
          {...common}
          placeholder="Enter values separated by comma (a, b, c)"
          value={Array.isArray(row.value) ? row.value.join(',') : (row.value ?? '')}
          onChange={e =>
            updateRow(i, {
              value: e.target.value.split(',').map(v => v.trim()).filter(Boolean),
            })
          }
        />
      )
    }

    const typeAttr = t === 'number' ? 'number' : (t === 'date' || t === 'datetime') ? 'date' : 'text'
    return (
      <input
        {...common}
        type={typeAttr}
        placeholder={`Enter ${fmeta?.label?.toLowerCase() || 'value'}...`}
        value={row.value ?? ''}
        onChange={e => updateRow(i, { value: e.target.value })}
      />
    )
  }

  // Show a simple placeholder until metadata is present
  if (!fields.length) {
    return (
      <div className="rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground">
        Filters will be available once metadata loads.
      </div>
    )
  }

  // Show only "Add Filter" button when no filters exist
  if (local.length === 0) {
    return (
      <div className="flex items-center">
        <button 
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors"
          onClick={addRow}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Filter
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border bg-card p-2 space-y-2">
      {/* Filter Rows */}
      {local.map((row, i) => {
        const fmeta = fieldsByName.get(row.field) || fields[0]
        const ops =
          (fmeta?.operators?.length ? fmeta.operators : OPS[fmeta?.type ?? 'string']) || OPS.string

        return (
          <div
            key={row._id}
            className="grid grid-cols-1 sm:grid-cols-[180px_140px_1fr_32px] gap-1.5 items-center"
          >
            {/* field */}
            <select
              className="border border-border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring bg-background"
              value={row.field}
              onChange={e =>
                updateRow(i, { field: e.target.value, op: 'EQUAL', value: '', value2: undefined })
              }
            >
              {fields.map((f, idx) => (
                <option key={`${f.name}-${idx}`} value={f.name}>
                  {f.label ?? f.name}
                </option>
              ))}
            </select>

            {/* operator */}
            <div className="relative">
              <select
                className="border border-border rounded-md px-2 py-1 pr-6 text-xs w-full appearance-none focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                value={row.op}
                onChange={e => updateRow(i, { op: e.target.value })}
              >
                {ops.map(op => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* value(s) */}
            <div>{renderValueInput(fmeta, row, i)}</div>

            {/* remove */}
            <button
              type="button"
              className="flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              onClick={() => removeRow(i)}
              title="Remove filter"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )
      })}

      {/* Action Buttons - Only shown when filters exist */}
      <div className="flex items-center gap-1.5 pt-1.5 border-t border-border">
        <button 
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors"
          onClick={addRow}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add
        </button>
        <button
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
          onClick={() => {
            onChange?.(local)
            onApply?.()
          }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Apply
        </button>
        <button
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors"
          onClick={() => {
            setLocal([])
            onChange?.([])
            onClear?.()
          }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      </div>
    </div>
  )
}
