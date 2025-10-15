// Select.jsx — Simple reusable dropdown component
// Purpose: Provide a lightweight, dependency-free select with local filtering.

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export default function Select({ value, onChange, options = [], placeholder }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  // Filter options locally by label based on the search query
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return options.filter(o => String(o.label).toLowerCase().includes(q))
  }, [options, query])

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Display the current selection (read-only for simplicity) */}
      <input
        value={value?.label || ''}
        placeholder={placeholder || t('selectPlaceholder', { defaultValue: 'Select…' })}
        readOnly
        style={{ width: '100%', border: '1px solid #ddd', borderRadius: 12, padding: '8px 12px', cursor: 'text' }}
        onFocus={(e)=> e.target.select()}
      />

      {/* Search box to filter options */}
      <div style={{ marginTop: 8 }}>
        <input
          value={query}
          onChange={(e)=> setQuery(e.target.value)}
          placeholder={t('search')}
          style={{ width: '100%', border: '1px solid #eee', borderRadius: 8, padding: '6px 10px' }}
        />
      </div>

      {/* Options list */}
      <ul style={{ marginTop: 8, maxHeight: 180, overflow: 'auto', border: '1px solid #eee', borderRadius: 12 }}>
        {filtered.length === 0 && (
          <li style={{ padding: 8, color: '#777' }}>
            {t('select.noOptions')}
          </li>
        )}
        {filtered.map(o => (
          <li
            key={o.value}
            style={{ padding: 8, cursor: 'pointer' }}
            onClick={() => onChange?.(o)}
          >
            {o.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
