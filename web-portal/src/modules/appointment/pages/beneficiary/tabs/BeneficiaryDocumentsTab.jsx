import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { FileText, Download, Loader2 } from 'lucide-react'
import { api } from '@/lib/axios'

function DocumentForm({ beneficiaryId, documentTypes, loadingTypes, onCancel, onSuccess }) {
  const [form, setForm] = useState({
    documentName: '',
    documentTypeId: '',
    documentDescription: '',
    file: null,
  })
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.documentTypeId) {
      toast.error('Please select a document type')
      return
    }
    if (!form.file) {
      toast.error('Please choose a file to upload')
      return
    }

    const selectedType = documentTypes.find((item) => item?.id === form.documentTypeId)
    const documentName = form.documentName?.trim() || selectedType?.label || form.file.name

    const payload = new FormData()
    payload.append('beneficiaryId', beneficiaryId)
    payload.append('documentTypeId', form.documentTypeId)
    if (selectedType?.code) {
      payload.append('documentTypeCode', selectedType.code)
    }
    payload.append('documentName', documentName)
    if (form.documentDescription?.trim()) {
      payload.append('documentDescription', form.documentDescription.trim())
    }
    payload.append('file', form.file)

    setBusy(true)
    try {
      await api.post('/appointment-service/api/beneficiary-documents', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Document uploaded successfully')
      setForm({
        documentName: '',
        documentTypeId: '',
        documentDescription: '',
        file: null,
      })
      onSuccess()
    } catch (error) {
      console.error('Failed to upload document:', error)
      toast.error(error.response?.data?.message || 'Failed to upload document')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
      <h4 className="font-semibold text-gray-900 mb-4">Upload Document</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document Type *</label>
            <select
              required
              disabled={loadingTypes}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={form.documentTypeId}
              onChange={(e) => setForm({ ...form, documentTypeId: e.target.value })}
            >
              <option key="placeholder" value="">
                Select
              </option>
              {documentTypes.map((type, idx) => {
                const optionValue = type?.id ?? ''
                const optionKey = optionValue || `option-${idx}`
                return (
                  <option key={optionKey} value={optionValue}>
                    {type.label || type.name || type.code}
                  </option>
                )
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.documentName}
              onChange={(e) => setForm({ ...form, documentName: e.target.value })}
              placeholder="Leave empty to use the file name"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.documentDescription}
              onChange={(e) => setForm({ ...form, documentDescription: e.target.value })}
              placeholder="Optional notes about this document"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">File *</label>
            <input
              type="file"
              required
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              className="w-full text-sm"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
            />
            <p className="mt-1 text-xs text-gray-500">Accepted: JPG, PNG, PDF, DOC, DOCX — up to 10MB.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {busy ? 'Uploading...' : 'Upload Document'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

const formatSize = (size) => {
  if (!size || Number.isNaN(size)) return '—'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

export default function BeneficiaryDocumentsTab({ beneficiaryId }) {
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [documentTypes, setDocumentTypes] = useState([])
  const [loadingTypes, setLoadingTypes] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [beneficiaryId])

  useEffect(() => {
    loadDocumentTypes()
  }, [])

  const loadDocumentTypes = async () => {
    try {
      setLoadingTypes(true)
      const { data } = await api.get('/access/api/cascade-dropdowns/access.code-table-values-by-table', {
        params: { codeTableId: '947d6fff-9b01-405d-b8fb-285e4df9a419' },
      })
      const unique = []
      const seenIds = new Set()
      const seenLabels = new Set()
      ;(data || []).forEach((item) => {
        const typeId = item?.value ?? item?.id ?? item?.code
        const label = (item?.label || item?.name || item?.code || item?.description || '—').trim()
        const labelKey = label.toLocaleLowerCase()
        if (!typeId || seenIds.has(typeId) || seenLabels.has(labelKey)) return
        seenIds.add(typeId)
        seenLabels.add(labelKey)
        unique.push({ ...item, id: typeId, label })
      })
      setDocumentTypes(unique)
    } catch (error) {
      console.error('Failed to load document types:', error)
      toast.error('Failed to load document types')
    } finally {
      setLoadingTypes(false)
    }
  }

  const documentTypeMap = useMemo(() => {
    const map = {}
    documentTypes.forEach((item) => {
      if (!item?.id) return
      map[item.id] = {
        label: item.label || item.name || item.code || '—',
        code: item.code,
      }
    })
    return map
  }, [documentTypes])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await api.get(
        `/appointment-service/api/beneficiary-documents/beneficiary/${beneficiaryId}`
      )
      setDocuments(response.data || [])
    } catch (error) {
      console.error('Failed to load documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await api.delete(`/appointment-service/api/beneficiary-documents/${documentId}`)
      toast.success('Document deleted successfully')
      loadDocuments()
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.error(error.response?.data?.message || 'Failed to delete document')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Documents ({documents.length})
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {showAddForm && (
        <DocumentForm
          beneficiaryId={beneficiaryId}
          documentTypes={documentTypes}
          loadingTypes={loadingTypes}
          onCancel={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false)
            loadDocuments()
          }}
        />
      )}

      {documents.length === 0 && !showAddForm && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">No documents found</p>
        </div>
      )}

      {documents.map((doc) => {
        const typeMeta = documentTypeMap[doc.documentTypeId]
        const typeLabel = typeMeta?.label || doc.documentTypeCode || '—'

        return (
          <div
            key={doc.documentId}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{doc.documentName}</h4>
                  <p className="text-sm text-gray-600">{typeLabel}</p>
                  {doc.documentDescription && (
                    <p className="text-sm text-gray-500 mt-1">{doc.documentDescription}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {doc.fileName} • {formatSize(doc.fileSizeBytes)} • {doc.mimeType || 'unknown'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Uploaded by: <span className="font-mono">{doc.createdById || '—'}</span>
                    {doc.createdAt && ` • ${new Date(doc.createdAt).toLocaleString()}`}
                  </p>
                  {doc.updatedAt && (
                    <p className="text-xs text-gray-400">
                      Updated by: <span className="font-mono">{doc.updatedById || '—'}</span> •{' '}
                      {new Date(doc.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    doc.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {doc.isActive ? 'Active' : 'Inactive'}
                </span>
                {doc.downloadUrl && (
                  <a
                    href={doc.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </a>
                )}
                <button
                  onClick={() => handleDelete(doc.documentId)}
                  className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
