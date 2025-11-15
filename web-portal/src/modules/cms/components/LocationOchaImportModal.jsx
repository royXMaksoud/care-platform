import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { Upload, X, Loader2, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/axios'

export default function LocationOchaImportModal({ open, onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!open) {
      setFile(null)
      setResult(null)
      setUploading(false)
    }
  }, [open])

  if (!open) return null

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0]
    setFile(selected || null)
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Please choose an Excel file first')
      return
    }
    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)
    try {
      const { data } = await api.post('/access/api/location-ocha/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
      toast.success(`Processed ${data.successCount} row(s)`)
      onSuccess?.()
    } catch (error) {
      console.error('Import failed', error)
      toast.error(error?.response?.data?.message || 'Import failed')
    } finally {
      setUploading(false)
    }
  }

  return ReactDOM.createPortal(
    <>
      <div className="fixed inset-0 z-[1100] bg-black/30 backdrop-blur-sm" onClick={uploading ? undefined : onClose} />
      <div
        className="fixed left-1/2 top-1/2 z-[1101] w-[min(95vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Import Location Syria OCHA"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Import Location Syria OCHA</h3>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
            onClick={onClose}
            disabled={uploading}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <Upload className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="text-gray-700">
              {file ? `Selected: ${file.name}` : 'Drag & drop or click to upload an Excel file'}
            </p>
            <p className="text-sm text-gray-500">Supported formats: .xlsx, .xls</p>
            <button
              type="button"
              className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Choose File
            </button>
          </div>

          <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Use the official template to ensure the header names match exactly. Columns must be in the same order as
            provided (ID, admin0Name_en, admin0Name_ar, ... Latitude_y, Longitude_x).
          </div>

          {result && (
            <div className="space-y-2 rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
                <span>Import Summary</span>
                <span>
                  {result.successCount} succeeded / {result.failureCount} failed
                </span>
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    Errors
                  </div>
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((err, index) => (
                      <li key={index}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            onClick={handleImport}
            disabled={uploading || !file}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import
              </>
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}

