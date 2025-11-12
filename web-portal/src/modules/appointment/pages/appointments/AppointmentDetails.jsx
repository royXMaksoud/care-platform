import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { 
  Calendar, 
  Clock, 
  User, 
  Building, 
  FileText, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Download,
} from 'lucide-react'

export default function AppointmentDetails() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [appointment, setAppointment] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [branchesMap, setBranchesMap] = useState({})
  const [beneficiariesMap, setBeneficiariesMap] = useState({})
  const [serviceTypesMap, setServiceTypesMap] = useState({})
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  
  // Load lookups
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [branches, beneficiaries, services] = await Promise.all([
          api.get('/access/api/organization-branches/lookup'),
          api.get('/appointment-service/api/admin/beneficiaries/lookup'),
          api.get('/appointment-service/api/admin/service-types/lookup'),
        ])
        
        const brMap = {}
        branches.data.forEach((b) => {
          brMap[b.organizationBranchId] = b.name || b.branchName
        })
        setBranchesMap(brMap)

        const benMap = {}
        beneficiaries.data.forEach((b) => {
          benMap[b.beneficiaryId] = b.fullName
        })
        setBeneficiariesMap(benMap)

        const stMap = {}
        services.data.forEach((s) => {
          stMap[s.serviceTypeId] = s.name
        })
        setServiceTypesMap(stMap)
      } catch (err) {
        console.error('Failed to load lookups:', err)
      }
    }
    loadLookups()
  }, [])
  
  useEffect(() => {
    loadAppointment()
  }, [appointmentId])
  
  const loadAppointment = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/appointment-service/api/admin/appointments/${appointmentId}`)
      setAppointment(response.data)
    } catch (error) {
      console.error('Failed to load appointment:', error)
      toast.error('Failed to load appointment details')
      navigate('/appointment/appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelAppointment = async () => {
    if (!cancelReason || !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason')
      return
    }

    try {
      setCancelling(true)
      await api.post(
        `/appointment-service/api/admin/appointments/${appointmentId}/cancel`,
        {
          cancellationReason: cancelReason.trim(),
        }
      )
      toast.success('Appointment cancelled successfully')
      setShowCancelModal(false)
      setCancelReason('')
      await loadAppointment()
    } catch (error) {
      console.error('Failed to cancel appointment:', error)
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.details?.[0]?.message ||
          'Failed to cancel appointment'
      )
    } finally {
      setCancelling(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    )
  }
  
  if (!appointment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Appointment not found</p>
          <button
            onClick={() => navigate('/appointment/appointments')}
            className="mt-4 text-pink-600 hover:text-pink-800"
          >
            ← Back to list
          </button>
        </div>
      </div>
    )
  }
  
  const tabs = [
    { id: 'info', label: 'Appointment Info', icon: FileText },
    { id: 'documents', label: 'Documents', icon: Download },
    { id: 'history', label: 'History', icon: RefreshCw },
  ]
  
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/appointment/appointments')}
            className="mb-4 flex items-center gap-2 text-pink-600 hover:text-pink-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to appointments
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Appointment Details</h1>
              <p className="text-gray-600">
                {branchesMap[appointment.organizationBranchId] || 'Unknown Center'}
              </p>
            </div>
            <div className="ml-auto">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                appointment.appointmentStatus === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                appointment.appointmentStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {appointment.appointmentStatus || 'PENDING'}
              </span>
            </div>
            {appointment.appointmentStatus !== 'CANCELLED' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="ml-4 inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Cancel appointment
              </button>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-1">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-pink-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'info' && (
            <AppointmentInfoTab 
              appointment={appointment}
              branchesMap={branchesMap}
              beneficiariesMap={beneficiariesMap}
              serviceTypesMap={serviceTypesMap}
            />
          )}
          {activeTab === 'documents' && (
            <AppointmentDocumentsTab beneficiaryId={appointment.beneficiaryId} />
          )}
          {activeTab === 'history' && (
            <AppointmentHistoryTab appointmentId={appointmentId} />
          )}
        </div>
        </div>
      </div>
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Cancel Appointment</h2>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => {
                  if (!cancelling) {
                    setShowCancelModal(false)
                    setCancelReason('')
                  }
                }}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Please provide a reason for cancelling this appointment.
            </p>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-300"
              rows={4}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Cancellation reason..."
              disabled={cancelling}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
                onClick={() => {
                  if (!cancelling) {
                    setShowCancelModal(false)
                    setCancelReason('')
                  }
                }}
                disabled={cancelling}
              >
                Close
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                onClick={handleCancelAppointment}
                disabled={cancelling}
              >
                {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AppointmentInfoTab({ appointment, branchesMap, beneficiariesMap, serviceTypesMap }) {
  const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '-')
  const formatTime = (value) => {
    if (!value) return '-'
    if (typeof value === 'string' && value.length >= 5) return value.substring(0, 5)
    return value
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <h3 className="text-lg font-semibold text-gray-900 md:col-span-2">Appointment Information</h3>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="font-medium">
                {appointment.appointmentDate
                  ? new Date(appointment.appointmentDate + 'T00:00:00').toLocaleDateString()
                  : '-'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Time</p>
              <p className="font-medium">{formatTime(appointment.appointmentTime)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="font-medium">{appointment.appointmentStatus || '-'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Building className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Center</p>
              <p className="font-medium">
                {branchesMap[appointment.organizationBranchId] ||
                  appointment.branchName ||
                  '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Beneficiary & Service</h3>

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Beneficiary</p>
              <p className="font-medium">
                {beneficiariesMap[appointment.beneficiaryId] ||
                  appointment.beneficiaryName ||
                  '-'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Service</p>
              <p className="font-medium">
                {serviceTypesMap[appointment.serviceTypeId] ||
                  appointment.serviceTypeName ||
                  '-'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Slot Duration</p>
              <p className="font-medium">
                {appointment.slotDurationMinutes ? `${appointment.slotDurationMinutes} minutes` : '-'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Priority</p>
              <p className="font-medium">{appointment.priority || 'NORMAL'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Outcome & Actions</h3>

          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Action Type</p>
              <p className="font-medium">{appointment.actionTypeName || '-'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Action Notes</p>
              <p className="font-medium whitespace-pre-wrap">
                {appointment.actionNotes || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Attended At</p>
              <p className="font-medium">{formatDateTime(appointment.attendedAt)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Completed At</p>
              <p className="font-medium">{formatDateTime(appointment.completedAt)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Cancellation & Audit</h3>

          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Cancelled At</p>
              <p className="font-medium">{formatDateTime(appointment.cancelledAt)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Cancellation Reason</p>
              <p className="font-medium whitespace-pre-wrap">
                {appointment.cancellationReason || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Created By</p>
              <p className="font-medium">{appointment.createdById || '—'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDateTime(appointment.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Updated By</p>
              <p className="font-medium">{appointment.updatedById || '—'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDateTime(appointment.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
        <div className="rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
          {appointment.notes || 'No notes provided.'}
        </div>
      </div>
    </div>
  )
}

function AppointmentHistoryTab({ appointmentId }) {
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([])
  
  useEffect(() => {
    loadHistory()
  }, [appointmentId])
  
  const loadHistory = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/appointment-service/api/admin/appointments/${appointmentId}/history`)
      setHistory(response.data || [])
    } catch (error) {
      console.error('Failed to load history:', error)
      toast.error('Failed to load appointment history')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
      </div>
    )
  }
  
  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-600">No history found</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {history.map((item, index) => (
        <div
          key={index}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                item.status === 'CONFIRMED' ? 'bg-green-100' :
                item.status === 'CANCELLED' ? 'bg-red-100' :
                'bg-blue-100'
              }`}>
                {item.status === 'CONFIRMED' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                 item.status === 'CANCELLED' ? <XCircle className="w-5 h-5 text-red-600" /> :
                 <RefreshCw className="w-5 h-5 text-blue-600" />}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{item.status || '-'}</p>
                {item.changedAt && (
                  <p className="text-sm text-gray-600">
                    {new Date(item.changedAt).toLocaleString()}
                  </p>
                )}
                {item.notes && (
                  <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function AppointmentDocumentsTab({ beneficiaryId }) {
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState([])
  const [documentTypes, setDocumentTypes] = useState([])

  useEffect(() => {
    loadDocumentTypes()
  }, [])

  useEffect(() => {
    if (!beneficiaryId) {
      setDocuments([])
      setLoading(false)
      return
    }
    loadDocuments()
  }, [beneficiaryId])

  const loadDocumentTypes = async () => {
    try {
      const { data } = await api.get('/access/api/cascade-dropdowns/access.code-table-values-by-table', {
        params: { codeTableId: '947d6fff-9b01-405d-b8fb-285e4df9a419' },
      })
      setDocumentTypes(data || [])
    } catch (error) {
      console.error('Failed to load document types:', error)
      toast.error('Failed to load document types')
    }
  }

  const documentTypeMap = useMemo(() => {
    const map = {}
    documentTypes.forEach((item) => {
      if (!item?.value) return
      map[item.value] = item.label || item.name || item.code || '—'
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

  const formatSize = (size) => {
    if (!size || Number.isNaN(size)) return '—'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }

  if (!beneficiaryId) {
    return (
      <div className="text-center py-10 text-gray-500">
        No beneficiary is linked to this appointment.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No documents uploaded for this beneficiary yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => {
        const typeLabel = documentTypeMap[doc.documentTypeId] || doc.documentTypeCode || '—'
        return (
          <div
            key={doc.documentId}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
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
              {doc.downloadUrl && (
                <a
                  href={doc.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-pink-600 hover:text-pink-800"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

