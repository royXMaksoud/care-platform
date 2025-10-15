// src/packages/pivot/PivotModal.jsx
import { useEffect, useState } from 'react'
import PivotTableUI from 'react-pivottable/PivotTableUI'
import 'react-pivottable/pivottable.css'

export default function PivotModal({ rows, open, onClose }) {
  const [ui, setUi] = useState({ data: rows })

  useEffect(() => {
    setUi((s) => ({ ...s, data: rows }))
  }, [rows, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white p-4 rounded w-[80vw] h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Pivot</h3>
          <button className="border px-3 py-1 rounded" onClick={onClose}>Close</button>
        </div>
        <PivotTableUI {...ui} onChange={setUi} />
      </div>
    </div>
  )
}
