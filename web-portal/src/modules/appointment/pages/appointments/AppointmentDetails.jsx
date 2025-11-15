import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  GitBranch,
  ClipboardList,
  Hammer,
} from 'lucide-react'
import authStorage from '@/auth/authStorage'
import CrudPage from '@/features/crud/CrudPage'

const PROCESS_FORM_DEFAULTS = {
  actionTypeId: '',
  actionNotes: '',
  referralType: 'REFERRAL',
  referredToServiceTypeId: '',
  referredToAppointmentId: '',
  referralReason: '',
  clinicalNotes: '',
  status: 'PENDING',
  referredAppointmentDate: '',
  isUrgent: false,
  rejectionReason: '',
}
import AppointmentBreadcrumb from '@/modules/appointment/components/AppointmentBreadcrumb'

export default function AppointmentDetails() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [appointment, setAppointment] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [branchesMap, setBranchesMap] = useState({})
  const [beneficiariesMap, setBeneficiariesMap] = useState({})
  const [serviceTypesMap, setServiceTypesMap] = useState({})
  const [serviceTypeOptions, setServiceTypeOptions] = useState([])
  const [statusOptions, setStatusOptions] = useState([])
  const statusMap = useMemo(() => {
    const map = {}
    statusOptions.forEach((opt) => {
      const key = opt.value ?? opt.appointmentStatusId
      if (key) {
        map[key] = opt.label || opt.name || opt.code || String(key)
      }
    })
    return map
  }, [statusOptions])

  const statusCodeMap = useMemo(() => {
    const map = {}
    statusOptions.forEach((opt) => {
      const key = opt.value ?? opt.appointmentStatusId
      if (key) {
        const raw = opt.code || opt.label || String(key)
        map[key] = raw ? String(raw).toUpperCase() : String(key)
      }
    })
    return map
  }, [statusOptions])
  const [actionTypeOptions, setActionTypeOptions] = useState([])
  const actionTypeMap = useMemo(() => {
    const map = {}
    actionTypeOptions.forEach((opt) => {
      const key = opt.value ?? opt.actionTypeId
      if (key) {
        map[key] = opt
      }
    })
    return map
  }, [actionTypeOptions])
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [processMode, setProcessMode] = useState('COMPLETE')
  const [processForm, setProcessForm] = useState({
    actionTypeId: '',
    actionNotes: '',
    referralType: 'REFERRAL',
    referredToServiceTypeId: '',
    referralReason: '',
    clinicalNotes: '',
    status: 'PENDING',
    referredAppointmentDate: '',
    isUrgent: false,
    rejectionReason: '',
  })
  const [processing, setProcessing] = useState(false)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [referralsRefreshKey, setReferralsRefreshKey] = useState(0)
  const [currentUserId, setCurrentUserId] = useState(() => authStorage.getUserId())

  const breadcrumbLabel = useMemo(() => {
    return (
      appointment?.referenceNumber ||
      appointment?.externalReference ||
      appointment?.appointmentCode ||
      appointment?.appointmentNumber ||
      'Appointment Details'
    )
  }, [appointment])
  
  // Load lookups
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const results = await Promise.allSettled([
          api.get('/access/api/organization-branches/lookup'),
          api.get('/appointment-service/api/admin/beneficiaries/lookup'),
          api.get('/appointment-service/api/admin/service-types/lookup'),
          api.get('/appointment-service/api/admin/appointment-statuses/lookup'),
          api.get('/appointment-service/api/admin/action-types/lookup'),
        ])

        const pick = (idx) =>
          results[idx]?.status === 'fulfilled' ? results[idx].value : null

        const branchesRes = pick(0)
        const beneficiariesRes = pick(1)
        const servicesRes = pick(2)
        const statusesRes = pick(3)
        const actionTypesRes = pick(4)

        const brMap = {}
        ;(branchesRes?.data || []).forEach((b) => {
          brMap[b.organizationBranchId] = b.name || b.branchName
        })
        setBranchesMap(brMap)

        const benMap = {}
        ;(beneficiariesRes?.data || []).forEach((b) => {
          benMap[b.beneficiaryId] = b.fullName
        })
        setBeneficiariesMap(benMap)

        const stMap = {}
        const serviceOptions = Array.isArray(servicesRes?.data) ? servicesRes.data : []
        const serviceSelectOptions = serviceOptions.map((s) => {
          if (s.serviceTypeId) {
            stMap[s.serviceTypeId] = s.name || s.label || s.code || 'Service'
          }
          return {
            value: s.serviceTypeId,
            label: s.name || s.label || s.code || 'Service',
          }
        })
        setServiceTypesMap(stMap)
        setServiceTypeOptions(serviceSelectOptions)

        const statusData = Array.isArray(statusesRes?.data) ? statusesRes.data : []
        const normalizedStatusOptions = statusData.map((item) => ({
          value: item.value ?? item.appointmentStatusId,
          label: item.label || item.name || item.code || 'Status',
          code: item.code,
        }))
        setStatusOptions(normalizedStatusOptions)

        const actionData = Array.isArray(actionTypesRes?.data) ? actionTypesRes.data : []
        const normalizedActionOptions = actionData.map((item) => ({
          value: item.actionTypeId ?? item.id ?? item.value,
          label: item.name || item.label || item.code || 'Action Type',
          code: item.code,
          requiresTransfer: item.requiresTransfer,
          completesAppointment: item.completesAppointment,
        }))
        setActionTypeOptions(normalizedActionOptions)
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

  const handleDeleteAppointment = async () => {
    try {
      setDeleting(true)
      await api.delete(`/appointment-service/api/admin/appointments/${appointmentId}`)
      toast.success('Appointment deleted successfully')
      setShowDeleteModal(false)
      navigate('/appointment/appointments')
    } catch (error) {
      console.error('Failed to delete appointment:', error)
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.details?.[0]?.message ||
          'Failed to delete appointment'
      )
    } finally {
      setDeleting(false)
    }
  }

  const handleProcessFieldChange = (field, value) => {
    setProcessForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const ensureCurrentUserId = useCallback(() => {
    const fromStorage = authStorage.getUserId()
    if (fromStorage) {
      setCurrentUserId(fromStorage)
      return fromStorage
    }

    const maybeUser = authStorage.getUser()
    const fromUser =
      maybeUser?.userId ||
      maybeUser?.id ||
      maybeUser?.user?.id ||
      maybeUser?.profile?.id ||
      null

    if (fromUser) {
      authStorage.setUserId(fromUser)
      setCurrentUserId(fromUser)
      return fromUser
    }

    return null
  }, [])

  const closeProcessModal = () => {
    if (processing) return
    setShowProcessModal(false)
    setProcessForm({ ...PROCESS_FORM_DEFAULTS })
    setProcessMode('COMPLETE')
  }

  const handleProcessSubmit = async (event) => {
    event.preventDefault()
    const resolvedUserId = ensureCurrentUserId()
    if (!resolvedUserId) {
      toast.error('Missing current user information. Please re-login.')
      return
    }

    try {
      setProcessing(true)
      if (processMode === 'COMPLETE') {
        const payload = {
          actionTypeId: processForm.actionTypeId ? processForm.actionTypeId.trim() || null : null,
          actionNotes: processForm.actionNotes?.trim() || null,
          completedByUserId: resolvedUserId,
        }
        await api.post(
          `/appointment-service/api/admin/appointments/${appointmentId}/complete`,
          payload
        )
        toast.success('Appointment marked as completed')
        setHistoryRefreshKey((prev) => prev + 1)
        await loadAppointment()
      } else if (processMode === 'REFERRAL') {
        if (!processForm.referredToServiceTypeId) {
          toast.error('Please select the service type to refer to')
          return
        }
        const payload = {
          appointmentId,
          beneficiaryId: appointment?.beneficiaryId,
          referredToAppointmentId: processForm.referredToAppointmentId
            ? processForm.referredToAppointmentId.trim()
            : null,
          referredToServiceTypeId: processForm.referredToServiceTypeId,
          referralType: processForm.referralType || 'REFERRAL',
          reason: processForm.referralReason?.trim() || null,
          clinicalNotes: processForm.clinicalNotes?.trim() || null,
          status: processForm.status || 'PENDING',
          referralDate: new Date().toISOString(),
          referredAppointmentDate: processForm.referredAppointmentDate
            ? new Date(processForm.referredAppointmentDate).toISOString()
            : null,
          isUrgent: Boolean(processForm.isUrgent),
          rejectionReason: processForm.rejectionReason?.trim() || null,
          createdById: resolvedUserId,
        }
        await api.post('/appointment-service/api/admin/appointments/referrals', payload)
        toast.success('Referral created successfully')
        setReferralsRefreshKey((prev) => prev + 1)
        await loadAppointment()
      }
      setHistoryRefreshKey((prev) => prev + 1)
      closeProcessModal()
    } catch (error) {
      console.error('Failed to process appointment:', error)
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.details?.[0]?.message ||
          'Failed to process appointment'
      )
    } finally {
      setProcessing(false)
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
    { id: 'history', label: 'Status History', icon: ClipboardList },
    { id: 'referrals', label: 'Referrals', icon: GitBranch },
    { id: 'documents', label: 'Documents', icon: Download },
  ]

  const currentStatusId = appointment.appointmentStatusId
  const currentStatusCode = (statusCodeMap[currentStatusId] || appointment.appointmentStatus || 'PENDING').toUpperCase()
  const currentStatusLabel = statusMap[currentStatusId] || appointment.appointmentStatus || 'PENDING'
  const statusBadgeClass =
    currentStatusCode === 'CONFIRMED'
      ? 'bg-green-100 text-green-800'
      : currentStatusCode === 'CANCELLED'
      ? 'bg-red-100 text-red-800'
      : currentStatusCode === 'COMPLETED'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-gray-100 text-gray-800'
  
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="container mx-auto px-4 py-8">
        <AppointmentBreadcrumb currentPageLabel={breadcrumbLabel} />
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
            <div className="ml-auto flex items-center gap-2">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadgeClass}`}
              >
                {currentStatusLabel}
              </span>
              <button
                onClick={() => setShowProcessModal(true)}
                className="inline-flex items-center gap-2 rounded-md border border-pink-200 px-4 py-2 text-sm font-medium text-pink-700 hover:bg-pink-50 transition-colors"
              >
                <Hammer className="w-4 h-4" />
                Process appointment
              </button>
              {appointment.appointmentStatus !== 'CANCELLED' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel appointment
                </button>
              )}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete appointment
              </button>
            </div>
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
              statusLabel={currentStatusLabel}
            />
          )}
          {activeTab === 'history' && (
            <AppointmentStatusHistoryTab
              key={historyRefreshKey}
              appointmentId={appointmentId}
              statusOptions={statusOptions}
              statusMap={statusMap}
              currentUserId={currentUserId}
            />
          )}
          {activeTab === 'referrals' && (
            <AppointmentReferralsTab
              key={referralsRefreshKey}
              appointmentId={appointmentId}
              beneficiaryId={appointment.beneficiaryId}
              serviceTypeOptions={serviceTypeOptions}
              serviceTypesMap={serviceTypesMap}
              currentUserId={currentUserId}
            />
          )}
          {activeTab === 'documents' && (
            <AppointmentDocumentsTab beneficiaryId={appointment.beneficiaryId} />
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
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Delete Appointment</h2>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => !deleting && setShowDeleteModal(false)}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              This action will permanently delete this appointment and related records (status history,
              referrals, transfers). Are you sure you want to continue?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
                onClick={() => !deleting && setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                onClick={handleDeleteAppointment}
                disabled={deleting}
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
      {showProcessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={handleProcessSubmit}
            className="w-full max-w-2xl rounded-xl bg-white shadow-xl border border-pink-100 space-y-4 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Process Appointment</h2>
                <p className="text-sm text-gray-500">
                  Choose how you want to process this appointment.
                </p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={closeProcessModal}
                disabled={processing}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setProcessMode('COMPLETE')
                  setProcessForm((prev) => ({
                    ...PROCESS_FORM_DEFAULTS,
                    actionTypeId: prev.actionTypeId,
                    actionNotes: prev.actionNotes,
                  }))
                }}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  processMode === 'COMPLETE'
                    ? 'border-pink-500 bg-pink-500 text-white'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Mark as Completed
              </button>
              <button
                type="button"
                onClick={() => {
                  setProcessMode('REFERRAL')
                  setProcessForm((prev) => ({
                    ...PROCESS_FORM_DEFAULTS,
                    referralType: prev.referralType || 'REFERRAL',
                    status: prev.status || 'PENDING',
                    referredToServiceTypeId: prev.referredToServiceTypeId,
                  }))
                }}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  processMode === 'REFERRAL'
                    ? 'border-pink-500 bg-pink-500 text-white'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Refer to another service
              </button>
            </div>

            {processMode === 'COMPLETE' ? (
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Action Type</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-100"
                    value={processForm.actionTypeId}
                    onChange={(e) => handleProcessFieldChange('actionTypeId', e.target.value)}
                  >
                    <option value="">Select action type (optional)</option>
                    {actionTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                        {opt.code ? ` (${opt.code})` : ''}
                      </option>
                    ))}
                  </select>
                  {processForm.actionTypeId && actionTypeMap[processForm.actionTypeId] && (
                    <p className="text-xs text-gray-500">
                      {actionTypeMap[processForm.actionTypeId].completesAppointment
                        ? 'This action type marks the appointment as completed.'
                        : 'This action type does not automatically complete the appointment.'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    className="min-h-[120px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-100"
                    value={processForm.actionNotes}
                    onChange={(e) => handleProcessFieldChange('actionNotes', e.target.value)}
                    placeholder="Add completion notes..."
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Referred Service Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-100"
                    value={processForm.referredToServiceTypeId}
                    onChange={(e) => handleProcessFieldChange('referredToServiceTypeId', e.target.value)}
                    required
                  >
                    <option value="">Select service type</option>
                    {serviceTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Referral Type</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-100"
                    value={processForm.referralType}
                    onChange={(e) => handleProcessFieldChange('referralType', e.target.value)}
                  >
                    <option value="REFERRAL">Referral</option>
                    <option value="TRANSFER">Transfer</option>
                    <option value="FOLLOW_UP">Follow Up</option>
                    <option value="SECOND_OPINION">Second Opinion</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-100"
                    value={processForm.status}
                    onChange={(e) => handleProcessFieldChange('status', e.target.value)}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Referred Appointment ID</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-100"
                    value={processForm.referredToAppointmentId}
                    onChange={(e) => handleProcessFieldChange('referredToAppointmentId', e.target.value)}
                    placeholder="Optional appointment reference ID"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Referred Appointment Date</label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-100"
                    value={processForm.referredAppointmentDate}
                    onChange={(e) => handleProcessFieldChange('referredAppointmentDate', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="process-urgent"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-400"
                    checked={Boolean(processForm.isUrgent)}
                    onChange={(e) => handleProcessFieldChange('isUrgent', e.target.checked)}
                  />
                  <label htmlFor="process-urgent" className="text-sm font-medium text-gray-700">
                    Mark as urgent
                  </label>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Reason</label>
                  <textarea
                    className="min-h-[100px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-100"
                    value={processForm.referralReason}
                    onChange={(e) => handleProcessFieldChange('referralReason', e.target.value)}
                    placeholder="Why is this referral being made?"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Clinical Notes</label>
                  <textarea
                    className="min-h-[100px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-100"
                    value={processForm.clinicalNotes}
                    onChange={(e) => handleProcessFieldChange('clinicalNotes', e.target.value)}
                    placeholder="Add any clinical notes..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Rejection Reason</label>
                  <textarea
                    className="min-h-[80px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:ring-pink-100"
                    value={processForm.rejectionReason}
                    onChange={(e) => handleProcessFieldChange('rejectionReason', e.target.value)}
                    placeholder="If status is rejected, provide the reason here"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
              <button
                type="button"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                onClick={closeProcessModal}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60"
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : processMode === 'COMPLETE' ? (
                  'Mark as completed'
                ) : (
                  'Create referral'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

function AppointmentInfoTab({ appointment, branchesMap, beneficiariesMap, serviceTypesMap, statusLabel }) {
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
              <p className="font-medium">{statusLabel || appointment.appointmentStatus || '-'}</p>
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
              <p className="font-medium">
                {appointment.createdByName || appointment.createdById || '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDateTime(appointment.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Updated By</p>
              <p className="font-medium">
                {appointment.updatedByName || appointment.updatedById || '—'}
              </p>
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

function AppointmentStatusHistoryTab({ appointmentId, statusOptions, statusMap, currentUserId }) {
  const formatDateTime = useCallback((value) => {
    if (!value) return '—'
    try {
      return new Date(value).toLocaleString()
    } catch {
      return value
    }
  }, [])

  const statusFieldOptions = useMemo(
    () =>
      (statusOptions || [])
        .map((opt) => ({
          value: opt.value ?? opt.appointmentStatusId ?? opt.id,
          label: opt.label || opt.name || opt.code || String(opt.value ?? opt.appointmentStatusId ?? opt.id),
        }))
        .filter((opt) => opt.value),
    [statusOptions]
  )

  const columns = useMemo(
    () => [
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'appointmentStatusId',
        cell: ({ row }) => (
          <span className="font-semibold text-gray-900">
            {statusMap?.[row.original.appointmentStatusId] || row.original.appointmentStatusName || '—'}
          </span>
        ),
        meta: { filterKey: 'appointmentStatusId', type: 'select' },
      },
      {
        id: 'changedAt',
        header: 'Changed At',
        accessorKey: 'changedAt',
        cell: ({ row }) => formatDateTime(row.original.changedAt),
        meta: { filterKey: 'changedAt', type: 'datetime', operators: ['BETWEEN', 'AFTER', 'BEFORE'] },
      },
      {
        id: 'changedByUserId',
        header: 'Changed By',
        accessorKey: 'changedByUserId',
        cell: ({ row }) => row.original.changedByName || row.original.changedByUserId || '—',
        meta: { filterKey: 'changedByUserId' },
      },
      {
        id: 'reason',
        header: 'Reason / Notes',
        accessorKey: 'reason',
        cell: ({ row }) => row.original.reason || '—',
        meta: { filterKey: 'reason', operators: ['LIKE'] },
      },
    ],
    [statusMap, formatDateTime]
  )

  const formFields = useMemo(
    () => [
      {
        type: 'select',
        name: 'appointmentStatusId',
        label: 'Status',
        required: true,
        options: statusFieldOptions,
        placeholder: 'Select status',
      },
      {
        type: 'text',
        name: 'changedByUserId',
        label: 'Changed By (User ID)',
        placeholder: 'Optional user ID',
        defaultValue: currentUserId || '',
      },
      {
        type: 'textarea',
        name: 'reason',
        label: 'Reason / Notes',
        rows: 3,
        maxLength: 1000,
      },
    ],
    [statusFieldOptions, currentUserId]
  )

  const toCreatePayload = (form) => ({
    appointmentId,
    appointmentStatusId: form.appointmentStatusId,
    changedByUserId: form.changedByUserId ? form.changedByUserId.trim() || null : null,
    reason: form.reason?.trim() || null,
  })

  const toUpdatePayload = (form) => ({
    appointmentStatusId: form.appointmentStatusId,
    changedByUserId: form.changedByUserId ? form.changedByUserId.trim() || null : null,
    reason: form.reason?.trim() || null,
  })

  const defaultSorting = useMemo(() => [{ id: 'changedAt', desc: true }], [])

  return (
    <CrudPage
      title="Status History"
      service="appointment-service"
      resourceBase="/api/admin/appointments/status-history"
      idKey="historyId"
      columns={columns}
      formFields={formFields}
      toCreatePayload={toCreatePayload}
      toUpdatePayload={toUpdatePayload}
      pageSize={10}
      enableCreate
      enableEdit
      enableDelete
      showAddButton
      tableId={`appointment-status-history-${appointmentId}`}
      fixedFilters={[
        {
          key: 'appointmentId',
          operator: 'EQUAL',
          value: appointmentId,
          dataType: 'UUID',
        },
      ]}
      defaultSorting={defaultSorting}
    />
  )
}

function AppointmentReferralsTab({
  appointmentId,
  beneficiaryId,
  serviceTypeOptions,
  serviceTypesMap,
  currentUserId,
}) {
  const formatDateTime = useCallback((value) => {
    if (!value) return '—'
    try {
      return new Date(value).toLocaleString()
    } catch {
      return value
    }
  }, [])

  const referralStatusOptions = useMemo(
    () => [
      { value: 'PENDING', label: 'Pending' },
      { value: 'ACCEPTED', label: 'Accepted' },
      { value: 'COMPLETED', label: 'Completed' },
      { value: 'CANCELLED', label: 'Cancelled' },
      { value: 'REJECTED', label: 'Rejected' },
    ],
    []
  )

  const referralTypeOptions = useMemo(
    () => [
      { value: 'REFERRAL', label: 'Referral' },
      { value: 'TRANSFER', label: 'Transfer' },
      { value: 'FOLLOW_UP', label: 'Follow Up' },
      { value: 'SECOND_OPINION', label: 'Second Opinion' },
    ],
    []
  )

  const serviceTypeFieldOptions = useMemo(
    () => (serviceTypeOptions || []).map((opt) => ({ value: opt.value, label: opt.label })),
    [serviceTypeOptions]
  )

  const columns = useMemo(
    () => [
      {
        id: 'serviceType',
        header: 'Service Type',
        accessorKey: 'referredToServiceTypeId',
        cell: ({ row }) =>
          serviceTypesMap?.[row.original.referredToServiceTypeId] ||
          row.original.referredToServiceTypeName ||
          '—',
        meta: { filterKey: 'referredToServiceTypeId', type: 'select' },
      },
      {
        id: 'referralType',
        header: 'Referral Type',
        accessorKey: 'referralType',
        cell: ({ row }) => row.original.referralType || '—',
        meta: {
          filterKey: 'referralType',
          type: 'select',
          enumValues: referralTypeOptions.map((opt) => opt.value),
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const status = row.original.status || 'PENDING'
          const color =
            status === 'COMPLETED'
              ? 'bg-green-100 text-green-700'
              : status === 'CANCELLED' || status === 'REJECTED'
              ? 'bg-red-100 text-red-700'
              : status === 'ACCEPTED'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-amber-100 text-amber-700'
          return (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
              {status}
            </span>
          )
        },
        meta: {
          filterKey: 'status',
          type: 'select',
          enumValues: referralStatusOptions.map((opt) => opt.value),
        },
      },
      {
        id: 'referralDate',
        header: 'Referral Date',
        accessorKey: 'referralDate',
        cell: ({ row }) => formatDateTime(row.original.referralDate),
        meta: { filterKey: 'referralDate', type: 'datetime', operators: ['BETWEEN', 'AFTER', 'BEFORE'] },
      },
      {
        id: 'isUrgent',
        header: 'Urgent',
        accessorKey: 'isUrgent',
        cell: ({ row }) =>
          row.original.isUrgent ? (
            <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              Yes
            </span>
          ) : (
            <span className="text-xs text-gray-500">No</span>
          ),
        meta: { filterKey: 'isUrgent', type: 'boolean' },
      },
      {
        id: 'createdById',
        header: 'Created By',
        accessorKey: 'createdById',
        cell: ({ row }) => row.original.createdByName || row.original.createdById || '—',
        meta: { filterKey: 'createdById' },
      },
      {
        id: 'updatedById',
        header: 'Updated By',
        accessorKey: 'updatedById',
        cell: ({ row }) => row.original.updatedByName || row.original.updatedById || '—',
        meta: { filterKey: 'updatedById' },
      },
    ],
    [serviceTypesMap, referralStatusOptions, referralTypeOptions, formatDateTime]
  )

  const formFields = useMemo(
    () => [
      {
        type: 'select',
        name: 'referredToServiceTypeId',
        label: 'Service Type',
        required: true,
        options: serviceTypeFieldOptions,
      },
      {
        type: 'select',
        name: 'referralType',
        label: 'Referral Type',
        required: true,
        defaultValue: 'REFERRAL',
        options: referralTypeOptions,
      },
      {
        type: 'select',
        name: 'status',
        label: 'Status',
        defaultValue: 'PENDING',
        options: referralStatusOptions,
      },
      {
        type: 'text',
        name: 'referredToAppointmentId',
        label: 'Referred Appointment ID',
        placeholder: 'Optional appointment reference',
      },
      {
        type: 'text',
        name: 'referralDate',
        label: 'Referral Date (ISO or YYYY-MM-DD)',
        defaultValue: new Date().toISOString().slice(0, 19),
      },
      {
        type: 'text',
        name: 'referredAppointmentDate',
        label: 'Target Appointment Date (optional)',
        placeholder: 'YYYY-MM-DD or ISO string',
      },
      {
        type: 'checkbox',
        name: 'isUrgent',
        label: 'Mark as urgent',
        inlineLabel: 'Urgent referral',
        defaultValue: false,
      },
      {
        type: 'textarea',
        name: 'reason',
        label: 'Reason',
        rows: 3,
        maxLength: 500,
      },
      {
        type: 'textarea',
        name: 'clinicalNotes',
        label: 'Clinical Notes',
        rows: 3,
        maxLength: 1000,
      },
      {
        type: 'textarea',
        name: 'rejectionReason',
        label: 'Rejection Reason',
        rows: 2,
        maxLength: 500,
      },
    ],
    [serviceTypeFieldOptions, referralTypeOptions, referralStatusOptions]
  )

  const toCreatePayload = (form) => ({
    appointmentId,
    beneficiaryId,
    referredToAppointmentId: form.referredToAppointmentId?.trim() || null,
    referredToServiceTypeId: form.referredToServiceTypeId,
    referralType: form.referralType || 'REFERRAL',
    reason: form.reason?.trim() || null,
    clinicalNotes: form.clinicalNotes?.trim() || null,
    status: form.status || 'PENDING',
    referralDate: form.referralDate ? new Date(form.referralDate).toISOString() : new Date().toISOString(),
    referredAppointmentDate: form.referredAppointmentDate
      ? new Date(form.referredAppointmentDate).toISOString()
      : null,
    isUrgent: form.isUrgent === true,
    rejectionReason: form.rejectionReason?.trim() || null,
    createdById: currentUserId || authStorage.getUserId() || null,
  })

  const toUpdatePayload = (form) => ({
    referredToAppointmentId: form.referredToAppointmentId?.trim() || null,
    referredToServiceTypeId: form.referredToServiceTypeId,
    referralType: form.referralType || 'REFERRAL',
    reason: form.reason?.trim() || null,
    clinicalNotes: form.clinicalNotes?.trim() || null,
    status: form.status || 'PENDING',
    referralDate: form.referralDate ? new Date(form.referralDate).toISOString() : null,
    referredAppointmentDate: form.referredAppointmentDate
      ? new Date(form.referredAppointmentDate).toISOString()
      : null,
    isUrgent: form.isUrgent === true,
    rejectionReason: form.rejectionReason?.trim() || null,
    updatedById: currentUserId || authStorage.getUserId() || null,
  })

  const defaultSorting = useMemo(() => [{ id: 'referralDate', desc: true }], [])

  return (
    <CrudPage
      title="Appointment Referrals"
      service="appointment-service"
      resourceBase="/api/admin/appointments/referrals"
      idKey="referralId"
      columns={columns}
      formFields={formFields}
      toCreatePayload={toCreatePayload}
      toUpdatePayload={toUpdatePayload}
      pageSize={10}
      enableCreate
      enableEdit
      enableDelete
      showAddButton
      tableId={`appointment-referrals-${appointmentId}`}
      fixedFilters={[
        {
          key: 'appointmentId',
          operator: 'EQUAL',
          value: appointmentId,
          dataType: 'UUID',
        },
      ]}
      defaultSorting={defaultSorting}
    />
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

