import React, { useState, useEffect } from 'react'
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
    { id: 'history', label: 'History', icon: RefreshCw },
  ]
  
  return (
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
                appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {appointment.status || 'PENDING'}
              </span>
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
            />
          )}
          {activeTab === 'history' && (
            <AppointmentHistoryTab appointmentId={appointmentId} />
          )}
        </div>
      </div>
    </div>
  )
}

function AppointmentInfoTab({ appointment, branchesMap, beneficiariesMap, serviceTypesMap }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Information</h3>
        
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="font-medium">
              {appointment.appointmentDate 
                ? new Date(appointment.appointmentDate + 'T00:00:00').toLocaleDateString()
                : '-'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Time</p>
            <p className="font-medium">{appointment.appointmentTime || '-'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p className="font-medium">{appointment.status || '-'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Building className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Center</p>
            <p className="font-medium">{branchesMap[appointment.organizationBranchId] || '-'}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient & Service</h3>
        
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Patient</p>
            <p className="font-medium">{beneficiariesMap[appointment.beneficiaryId] || '-'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Service</p>
            <p className="font-medium">{serviceTypesMap[appointment.serviceTypeId] || '-'}</p>
          </div>
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
                <p className="font-semibold text-gray-900">{item.status}</p>
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

