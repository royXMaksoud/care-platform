import { useEffect, useMemo, useState } from 'react'

/**
 * Generic dynamic form rendered in a modal.
 * - fields: [{ name, label, type, enumValues?, required? }]
 * - initialValues: values to prefill (optional)
 * - exclude: list of field names to hide (id, audit, etc.)
 */
export default function DynamicFormModal({
  open,
  title = 'Create',
  fields = [],
  initialValues = {},
  exclude = ['id','systemId','createdAt','updatedAt','isDeleted','rowVersion','createdById','updatedById'],
  onSubmit,
  onClose,
}) {
  const visibleFields = useMemo(
    () => fields.filter(f => f?.name && !exclude.includes(f.name)),
    [fields, exclude]
  )

  const [values, setValues] = useState({})
  useEffect(() => {
    const v = {}
    visibleFields.forEach(f => {
      // set sensible defaults
      if (initialValues[f.name] !== undefined) v[f.name] = initialValues[f.name]
      else if (f.type === 'boolean') v[f.name] = false
      else v[f.name] = ''
    })
    setValues(v)
  }, [open, visibleFields, initialValues])

  const setVal = (name, val) => setValues(prev => ({ ...prev, [name]: val }))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-[90vw] max-w-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="border px-3 py-1 rounded" onClick={onClose}>✕</button>
        </div>

        <div className="space-y-3">
          {visibleFields.map((f) => {
            const type = (f.type || 'string').toLowerCase()

            // select (enum)
            if (type === 'enum' && Array.isArray(f.enumValues) && f.enumValues.length) {
              return (
                <div key={f.name} className="space-y-1">
                  <label className="text-sm font-medium">{f.label || f.name}</label>
                  <select
                    className="border rounded px-3 py-2 w-full"
                    value={values[f.name] ?? ''}
                    onChange={(e)=> setVal(f.name, e.target.value)}
                  >
                    <option value="">--</option>
                    {f.enumValues.map(opt => (
                      <option key={opt.value ?? opt} value={opt.value ?? opt}>
                        {opt.label ?? opt.value ?? opt}
                      </option>
                    ))}
                  </select>
                </div>
              )
            }

            // boolean
            if (type === 'boolean') {
              return (
                <div key={f.name} className="flex items-center gap-2">
                  <input
                    id={f.name}
                    type="checkbox"
                    checked={!!values[f.name]}
                    onChange={(e)=> setVal(f.name, e.target.checked)}
                  />
                  <label htmlFor={f.name} className="text-sm font-medium">
                    {f.label || f.name}
                  </label>
                </div>
              )
            }

            // number / date / text
            const inputType =
              type === 'number' ? 'number' :
              (type === 'date' || type === 'datetime') ? 'date' :
              'text'

            return (
              <div key={f.name} className="space-y-1">
                <label className="text-sm font-medium">{f.label || f.name}</label>
                <input
                  type={inputType}
                  className="border rounded px-3 py-2 w-full"
                  value={values[f.name] ?? ''}
                  onChange={(e)=> setVal(f.name, inputType==='number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                />
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button className="border px-3 py-2 rounded" onClick={onClose}>Cancel</button>
          <button
            className="border px-3 py-2 rounded bg-blue-600 text-white"
            onClick={() => onSubmit?.(values)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
