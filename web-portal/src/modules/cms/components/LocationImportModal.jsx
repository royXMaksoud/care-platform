// src/modules/cms/components/LocationImportModal.jsx
import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import * as XLSX from 'xlsx'
import {
  parseExcelFile,
  normalizeRowKeys,
  validateLocationRow,
  processImportRows,
  rowToApiPayload,
} from '../utils/locationHelpers'
import { Upload, X, CheckCircle2, AlertCircle, Download, FileSpreadsheet } from 'lucide-react'

export default function LocationImportModal({ open, onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [rows, setRows] = useState([])
  const [errors, setErrors] = useState([])
  const [warnings, setWarnings] = useState([])
  const [countries, setCountries] = useState([])
  const [existingLocations, setExistingLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [step, setStep] = useState('upload') // 'upload' | 'preview' | 'importing' | 'done'
  const fileInputRef = useRef(null)

  // Fetch countries and existing locations on mount
  useEffect(() => {
    if (!open) return

    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch countries
        const countriesRes = await api.post('/access/api/code-countries/filter', {
          criteria: [{ key: 'isActive', operator: 'EQUAL', value: true, dataType: 'BOOLEAN' }]
        }, { params: { page: 0, size: 1000 } })
        setCountries(countriesRes.data.content || [])

        // Fetch existing locations
        const locationsRes = await api.post('/access/api/locations/filter', {
          criteria: [{ key: 'isActive', operator: 'EQUAL', value: true, dataType: 'BOOLEAN' }]
        }, { params: { page: 0, size: 10000 } })
        setExistingLocations(locationsRes.data.content || [])
      } catch (err) {
        console.error('Failed to fetch data:', err)
        toast.error('Failed to load countries and locations')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [open])

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setFile(null)
      setRows([])
      setErrors([])
      setWarnings([])
      setStep('upload')
    }
  }, [open])

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const validExtensions = ['.xlsx', '.xls']
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
    
    if (!validExtensions.includes(ext)) {
      toast.error('Please select an Excel file (.xlsx or .xls)')
      return
    }

    setFile(selectedFile)
    setLoading(true)
    setErrors([])
    setWarnings([])

    try {
      // Parse Excel file
      const rawRows = await parseExcelFile(selectedFile)
      
      if (rawRows.length === 0) {
        toast.error('Excel file is empty or has no data')
        setFile(null)
        return
      }

      // Normalize rows
      const normalizedRows = rawRows.map(normalizeRowKeys)

      // Process and validate
      const result = processImportRows(normalizedRows, existingLocations, countries)
      
      setRows(result.validRows)
      setErrors(result.errors)
      setWarnings(result.warnings)

      if (result.errors.length > 0) {
        toast.error(`Found ${result.errors.length} error(s) in the file. Please fix them before importing.`)
        setStep('preview')
      } else if (result.validRows.length === 0) {
        toast.error('No valid rows found in the file')
        setFile(null)
      } else {
        toast.success(`Parsed ${result.validRows.length} valid row(s)`)
        setStep('preview')
      }
    } catch (error) {
      console.error('Error parsing file:', error)
      toast.error(`Failed to parse file: ${error.message}`)
      setFile(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = () => {
    const template = [
      {
        'Country Code': 'SY',
        'Code': 'LOC001',
        'Name': 'اللاذقية',
        'Parent Code': '',
        'Level': '1',
        'Latitude': '35.5241',
        'Longitude': '35.7924',
        'Lineage Path': ''
      },
      {
        'Country Code': 'SY',
        'Code': 'LOC002',
        'Name': 'كسب',
        'Parent Code': 'LOC001',
        'Level': '2',
        'Latitude': '',
        'Longitude': '',
        'Lineage Path': ''
      }
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Locations')
    XLSX.writeFile(wb, 'location_import_template.xlsx')
    toast.success('Template downloaded')
  }

  const handleImport = async () => {
    if (rows.length === 0) {
      toast.error('No rows to import')
      return
    }

    if (errors.length > 0) {
      toast.error('Please fix all errors before importing')
      return
    }

    setImporting(true)
    setStep('importing')

    try {
      let successCount = 0
      let errorCount = 0
      const errors = []

      // Build map of imported locations (code -> locationId) for parent resolution
      const importedMap = new Map()

      // Import rows sequentially to maintain order and handle parent dependencies
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        try {
          const payload = rowToApiPayload(row)
          
          // Resolve parentLocationId if it's based on parentCode
          if (row.parentCode && !payload.parentLocationId) {
            // First check in existing locations
            const existingParent = existingLocations.find(loc => 
              loc.code?.toUpperCase() === String(row.parentCode).trim().toUpperCase() &&
              loc.countryId === payload.countryId
            )
            
            if (existingParent) {
              payload.parentLocationId = existingParent.locationId
            } else {
              // Check in already imported rows (by code)
              const importedCode = Array.from(importedMap.keys()).find(code => 
                code.toUpperCase() === String(row.parentCode).trim().toUpperCase()
              )
              
              if (importedCode) {
                payload.parentLocationId = importedMap.get(importedCode)
              } else {
                // Parent not found - try to fetch from API (might have been created in another transaction)
                try {
                  const parentRes = await api.post('/access/api/locations/filter', {
                    criteria: [
                      { key: 'code', operator: 'EQUAL', value: String(row.parentCode).trim(), dataType: 'STRING' },
                      { key: 'countryId', operator: 'EQUAL', value: payload.countryId, dataType: 'UUID' }
                    ]
                  }, { params: { page: 0, size: 1 } })
                  
                  if (parentRes.data.content && parentRes.data.content.length > 0) {
                    payload.parentLocationId = parentRes.data.content[0].locationId
                    importedMap.set(parentRes.data.content[0].code, parentRes.data.content[0].locationId)
                  } else {
                    // Parent doesn't exist - set to null (will create without parent)
                    payload.parentLocationId = null
                    errors.push(`Row ${i + 2}: Parent Code "${row.parentCode}" not found - importing without parent`)
                  }
                } catch (fetchErr) {
                  // If fetch fails, continue without parent
                  payload.parentLocationId = null
                  errors.push(`Row ${i + 2}: Could not resolve parent "${row.parentCode}" - importing without parent`)
                }
              }
            }
          }

          const response = await api.post('/access/api/locations', payload)
          const createdLocation = response.data
          
          // Store in map for future parent lookups
          if (createdLocation && createdLocation.code) {
            importedMap.set(createdLocation.code, createdLocation.locationId)
          }
          
          successCount++
        } catch (err) {
          errorCount++
          const errorMsg = err.response?.data?.message || err.message || 'Unknown error'
          errors.push(`Row ${i + 2}: ${errorMsg}`)
          console.error(`Failed to import row ${i + 2}:`, err)
        }
      }

      if (errorCount > 0) {
        toast.warning(`Imported ${successCount} location(s), ${errorCount} failed. Check errors below.`)
        setErrors(errors)
        setStep('preview')
      } else {
        toast.success(`Successfully imported ${successCount} location(s)`)
        setStep('done')
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1500)
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error(`Import failed: ${error.message}`)
      setStep('preview')
    } finally {
      setImporting(false)
    }
  }

  if (!open) return null

  return ReactDOM.createPortal(
    <>
      <div
        className="fixed inset-0 z-[1000] bg-black/30 backdrop-blur-sm"
        onClick={importing ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        className="fixed left-1/2 top-1/2 z-[1001] -translate-x-1/2 -translate-y-1/2
                   w-[min(96vw,900px)] max-h-[90vh] rounded-2xl border bg-white shadow-xl
                   flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Import Locations from Excel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Locations from Excel
          </h3>
          <button
            className="rounded-lg px-2 py-1 hover:bg-gray-100 transition"
            onClick={onClose}
            disabled={importing}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-700 mb-2">
                  Click to select or drag and drop an Excel file
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supported formats: .xlsx, .xls
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Select File'}
                </button>
              </div>

              <div className="border-t pt-4">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Download className="h-4 w-4" />
                  Download Excel Template
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Use the template to ensure your data is in the correct format.
                  Required columns: Country Code, Code, Name. Optional: Parent Code, Level, Latitude, Longitude, Lineage Path.
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && rows.length > 0 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">
                      {rows.length} location(s) ready to import
                    </p>
                    {warnings.length > 0 && (
                      <p className="text-sm text-blue-700 mt-1">
                        {warnings.length} warning(s)
                      </p>
                    )}
                  </div>
                  {errors.length === 0 && (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  )}
                </div>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="font-medium text-red-900">
                      {errors.length} error(s) found
                    </p>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="font-medium text-yellow-900">
                      {warnings.length} warning(s)
                    </p>
                  </div>
                  <ul className="text-sm text-yellow-700 space-y-1 max-h-32 overflow-y-auto">
                    {warnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium border-b">Row</th>
                        <th className="px-3 py-2 text-left font-medium border-b">Country</th>
                        <th className="px-3 py-2 text-left font-medium border-b">Code</th>
                        <th className="px-3 py-2 text-left font-medium border-b">Name</th>
                        <th className="px-3 py-2 text-left font-medium border-b">Parent</th>
                        <th className="px-3 py-2 text-left font-medium border-b">Level</th>
                        <th className="px-3 py-2 text-left font-medium border-b">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2">{idx + 2}</td>
                          <td className="px-3 py-2">{row.countryCode || '-'}</td>
                          <td className="px-3 py-2 font-mono">{row.code || '-'}</td>
                          <td className="px-3 py-2">{row.name || '-'}</td>
                          <td className="px-3 py-2">{row.parentCode || '-'}</td>
                          <td className="px-3 py-2">{row.level ?? '-'}</td>
                          <td className="px-3 py-2">
                            <span className="text-green-600">✓</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-700">Importing locations...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait</p>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
              <p className="text-lg font-medium text-gray-900">Import completed successfully!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'done' && (
          <div className="flex items-center justify-between border-t p-4">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <Download className="h-4 w-4" />
              Download Template
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={importing}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                {step === 'upload' ? 'Cancel' : 'Back'}
              </button>
              {step === 'preview' && errors.length === 0 && (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing || rows.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {importing ? 'Importing...' : `Import ${rows.length} Location(s)`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  )
}

