import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { 
  User, 
  Users as UsersIcon, 
  FileText, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin,
  ArrowLeft,
  Loader2,
  Download,
  ExternalLink,
  History,
  RotateCw,
  ImagePlus,
  Trash2,
} from 'lucide-react'

export default function BeneficiaryDetails() {
  const { beneficiaryId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [beneficiary, setBeneficiary] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileInputRef = useRef(null)

  const resolvedProfilePhotoUrl = useMemo(() => {
    const url = beneficiary?.profilePhotoUrl
    if (!url) return null
    if (/^https?:\/\//i.test(url) || url.startsWith('data:')) {
      return url
    }
    const baseUrl = api.defaults?.baseURL ?? ''
    const normalized = url.startsWith('/')
      ? url
      : `/appointment-service/api/admin/beneficiaries/${beneficiaryId}/profile-photo`
    return `${baseUrl}${normalized}`
  }, [beneficiary?.profilePhotoUrl, beneficiaryId])
  
  useEffect(() => {
    loadBeneficiary()
  }, [beneficiaryId])
  
  const loadBeneficiary = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/appointment-service/api/admin/beneficiaries/${beneficiaryId}`)
      setBeneficiary(response.data)
    } catch (error) {
      console.error('Failed to load beneficiary:', error)
      toast.error('Failed to load beneficiary details')
    } finally {
      setLoading(false)
    }
  }

  const triggerProfilePhotoInput = useCallback(() => {
    if (!photoUploading) {
      fileInputRef.current?.click()
    }
  }, [photoUploading])

  const handleProfilePhotoUpload = useCallback(
    async (event) => {
      const file = event.target.files?.[0]
      if (!file) return

      const formData = new FormData()
      formData.append('file', file)

      try {
        setPhotoUploading(true)
        const { data } = await api.post(
          `/appointment-service/api/admin/beneficiaries/${beneficiaryId}/profile-photo`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        )
        if (data) {
          setBeneficiary((prev) => (prev ? { ...prev, ...data } : data))
          toast.success('Profile photo updated')
        } else {
          await loadBeneficiary()
        }
      } catch (error) {
        console.error('Failed to upload profile photo:', error)
        toast.error(error.response?.data?.message || 'Failed to upload profile photo')
      } finally {
        setPhotoUploading(false)
        event.target.value = ''
      }
    },
    [beneficiaryId, photoUploading]
  )

  const handleRemoveProfilePhoto = useCallback(async () => {
    if (!beneficiary?.profilePhotoUrl || photoUploading) return
    try {
      setPhotoUploading(true)
      const response = await api.delete(
        `/appointment-service/api/admin/beneficiaries/${beneficiaryId}/profile-photo`
      )
      const data = response?.data
      if (data) {
        setBeneficiary((prev) => (prev ? { ...prev, ...data } : data))
      } else {
        setBeneficiary((prev) => (prev ? { ...prev, profilePhotoUrl: null } : prev))
      }
      toast.success('Profile photo removed')
    } catch (error) {
      console.error('Failed to remove profile photo:', error)
      toast.error(error.response?.data?.message || 'Failed to remove profile photo')
    } finally {
      setPhotoUploading(false)
    }
  }, [beneficiary?.profilePhotoUrl, beneficiaryId, photoUploading])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }
  
  if (!beneficiary) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Beneficiary not found</p>
          <button
            onClick={() => navigate('/appointment/beneficiaries')}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            ← Back to list
          </button>
        </div>
      </div>
    )
  }
  
  const Avatar = ({ size = 'md', photoUrl }) => {
    const sizeClasses = size === 'lg' ? 'w-28 h-28' : 'w-20 h-20'
    const iconSize = size === 'lg' ? 'w-14 h-14' : 'w-10 h-10'
    const [imageError, setImageError] = useState(false)
    
    if (photoUrl && !imageError) {
      return (
        <img
          src={photoUrl}
          alt={beneficiary.fullName}
          className={`${sizeClasses} rounded-full object-cover border-4 border-white shadow-lg`}
          onError={() => setImageError(true)}
        />
      )
    }
    
    return (
      <div
        className={`${sizeClasses} rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg`}
      >
        <User className={`${iconSize} text-white`} />
      </div>
    )
  }
  
  const tabs = [
    { id: 'info', label: 'Personal Info', icon: User },
    { id: 'family', label: 'Family Members', icon: UsersIcon },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'appointments', label: 'Appointments', icon: History },
  ]
  
  const hasGeoLocation =
    beneficiary.latitude !== null &&
    beneficiary.latitude !== undefined &&
    beneficiary.latitude !== '' &&
    beneficiary.longitude !== null &&
    beneficiary.longitude !== undefined &&
    beneficiary.longitude !== ''

  const beneficiaryLocationLink = hasGeoLocation
    ? `https://www.google.com/maps?q=${beneficiary.latitude},${beneficiary.longitude}`
    : null

  const formatDate = (value, options) => {
    if (!value) return '—'
    try {
      return new Date(value).toLocaleDateString(undefined, options)
    } catch (error) {
      return value
    }
  }

  const formatDateTime = (value) => {
    if (!value) return '—'
    try {
      return new Date(value).toLocaleString()
    } catch (error) {
      return value
    }
  }

  const heroFields = [
    { id: 'gender', label: 'Gender', value: beneficiary.genderCodeValueId || '—' },
    {
      id: 'birth',
      label: 'Date of Birth',
      value: formatDate(beneficiary.dateOfBirth),
    },
    {
      id: 'nationalId',
      label: 'National ID',
      value: beneficiary.nationalId || '—',
      mono: true,
    },
    {
      id: 'mobile',
      label: 'Mobile Number',
      value: beneficiary.mobileNumber || '—',
      mono: true,
    },
    {
      id: 'email',
      label: 'Email Address',
      value: beneficiary.email || '—',
    },
    {
      id: 'language',
      label: 'Preferred Language',
      value: beneficiary.preferredLanguageCodeValueId || '—',
    },
    {
      id: 'registration',
      label: 'Registration Status',
      value: beneficiary.registrationStatusCodeValueId || '—',
    },
    {
      id: 'createdAt',
      label: 'Created At',
      value: formatDateTime(beneficiary.createdAt),
    },
  ]

  const contactItems = [
    beneficiary.mobileNumber
      ? { id: 'mobile', label: 'Mobile', value: beneficiary.mobileNumber, icon: Phone, href: 'tel:' }
      : null,
    beneficiary.email
      ? { id: 'email', label: 'Email', value: beneficiary.email, icon: Mail, href: 'mailto:' }
      : null,
    beneficiary.address
      ? { id: 'address', label: 'Address', value: beneficiary.address, icon: MapPin }
      : null,
  ].filter(Boolean)

  const shortBeneficiaryId = beneficiary.beneficiaryId
    ? String(beneficiary.beneficiaryId).slice(0, 8).toUpperCase()
    : null

  const ProfileField = ({ label, value, mono = false }) => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span
        className={`mt-2 block text-sm font-semibold text-slate-900 ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value && value !== '' ? value : '—'}
      </span>
    </div>
  )
  
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col px-4 py-10">
        <button
          onClick={() => navigate('/appointment/beneficiaries')}
          className="flex w-fit items-center gap-2 text-sm font-semibold text-sky-600 transition-colors hover:text-sky-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to beneficiaries
        </button>

        <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-100/80">
          <div className="bg-gradient-to-br from-white via-white to-slate-50 px-6 py-8 lg:px-10">
            <div className="flex flex-col gap-8 lg:flex-row">
              <div className="flex flex-col items-center gap-5 lg:w-64 lg:items-start">
                <div className="relative">
                  <div className="overflow-hidden rounded-full border-4 border-white shadow-xl ring-4 ring-sky-100/80">
                    <Avatar size="lg" />
                  </div>
                  <span
                    className={`absolute bottom-3 right-3 h-3 w-3 rounded-full border-2 border-white ${
                      beneficiary.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                </div>

                <div className="flex w-full flex-col gap-3">
                  {contactItems.map((item) => {
                    const Icon = item.icon
                    const content = item.href ? (
                      <a
                        href={`${item.href}${item.value}`}
                        className="text-sm font-semibold text-slate-900 hover:underline"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                    )

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                      >
                        <Icon className="h-5 w-5 text-slate-400" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {item.label}
                          </span>
                          {content}
                        </div>
                      </div>
                    )
                  })}

                  {beneficiaryLocationLink && (
                    <a
                      href={beneficiaryLocationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-600 transition-colors hover:bg-sky-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on Google Maps
                    </a>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold text-slate-900">{beneficiary.fullName}</h1>
                    {shortBeneficiaryId && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                        ID {shortBeneficiaryId}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {beneficiary.nationalId || 'No National ID'} •{' '}
                    {beneficiary.mobileNumber || 'No mobile number saved'}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                        beneficiary.isActive
                          ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
                          : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {beneficiary.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {beneficiary.registrationStatusCodeValueId && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                        {beneficiary.registrationStatusCodeValueId}
                      </span>
                    )}
                    {beneficiary.preferredLanguageCodeValueId && (
                      <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600 ring-1 ring-sky-100">
                        {beneficiary.preferredLanguageCodeValueId}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {heroFields.map((field) => (
                    <ProfileField key={field.id} label={field.label} value={field.value} mono={field.mono} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/70 px-6 lg:px-10">
            <nav className="flex flex-wrap gap-2 py-3">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-sm shadow-sky-200'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-500'}`} />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="bg-white px-6 py-8 lg:px-10">
            {activeTab === 'info' && <PersonalInfoTab beneficiary={beneficiary} />}
            {activeTab === 'family' && <FamilyMembersTab beneficiaryId={beneficiaryId} />}
            {activeTab === 'documents' && <DocumentsTab beneficiaryId={beneficiaryId} />}
            {activeTab === 'appointments' && <AppointmentsTab beneficiaryId={beneficiaryId} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function PersonalInfoTab({ beneficiary }) {
  const hasCoordinates =
    beneficiary.latitude !== null &&
    beneficiary.latitude !== undefined &&
    beneficiary.latitude !== '' &&
    beneficiary.longitude !== null &&
    beneficiary.longitude !== undefined &&
    beneficiary.longitude !== ''

  const formattedLatitude = hasCoordinates ? Number(beneficiary.latitude).toFixed(6) : null
  const formattedLongitude = hasCoordinates ? Number(beneficiary.longitude).toFixed(6) : null
  const locationLink = hasCoordinates
    ? `https://www.google.com/maps?q=${beneficiary.latitude},${beneficiary.longitude}`
    : null
  const locationEmbedUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${beneficiary.latitude},${beneficiary.longitude}&z=15&output=embed`
    : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Full Name</p>
            <p className="font-medium">{beneficiary.fullName}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Mother Name</p>
            <p className="font-medium">{beneficiary.motherName || '-'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Date of Birth</p>
            <p className="font-medium">
              {beneficiary.dateOfBirth 
                ? new Date(beneficiary.dateOfBirth).toLocaleDateString()
                : '-'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">National ID</p>
            <p className="font-medium font-mono text-sm">{beneficiary.nationalId || '-'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Gender</p>
            <p className="font-medium">{beneficiary.genderCodeValueId || '-'}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        
        <div className="flex items-start gap-3">
          <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Mobile</p>
            <p className="font-medium font-mono">{beneficiary.mobileNumber}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-medium">{beneficiary.email || '-'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Address</p>
            <p className="font-medium">{beneficiary.address || '-'}</p>
          </div>
        </div>
        
        {hasCoordinates && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-medium text-sm font-mono">
                {formattedLatitude}, {formattedLongitude}
              </p>
              {locationLink && (
                <a
                  href={locationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open in Maps
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="md:col-span-2 border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Preferred Language</p>
            <p className="font-medium">{beneficiary.preferredLanguageCodeValueId || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Registration Status</p>
            <p className="font-medium">{beneficiary.registrationStatusCodeValueId || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Created At</p>
            <p className="font-medium text-sm">
              {beneficiary.createdAt 
                ? new Date(beneficiary.createdAt).toLocaleString()
                : '-'
              }
            </p>
          </div>
        </div>
      </div>

      {hasCoordinates && locationEmbedUrl && (
        <div className="md:col-span-2 border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Map</h3>
          <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <iframe
              title="Beneficiary Location Map"
              src={locationEmbedUrl}
              className="w-full h-80"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function FamilyMembersTab({ beneficiaryId }) {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  
  useEffect(() => {
    loadMembers()
  }, [beneficiaryId])
  
  const loadMembers = async () => {
    try {
      setLoading(true)
      const response = await api.get(
        `/appointment-service/api/family-members/beneficiary/${beneficiaryId}`
      )
      setMembers(response.data || [])
    } catch (error) {
      console.error('Failed to load family members:', error)
      toast.error('Failed to load family members')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async (familyMemberId) => {
    if (!confirm('Are you sure you want to delete this family member?')) return
    
    try {
      await api.delete(`/appointment-service/api/family-members/${familyMemberId}`)
      toast.success('Family member deleted successfully')
      loadMembers()
    } catch (error) {
      console.error('Failed to delete family member:', error)
      toast.error('Failed to delete family member')
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
          Family Members ({members.length})
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex items-center gap-2"
        >
          <UsersIcon className="w-4 h-4" />
          Add Family Member
        </button>
      </div>
      
      {showAddForm && (
        <FamilyMemberForm
          beneficiaryId={beneficiaryId}
          onCancel={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false)
            loadMembers()
          }}
        />
      )}
      
      {members.length === 0 && !showAddForm && (
        <div className="text-center py-12">
          <UsersIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">No family members found</p>
        </div>
      )}
      
      {members.map((member) => (
        <div
          key={member.familyMemberId}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{member.fullName}</h4>
                <p className="text-sm text-gray-600">
                  {member.relationType}
                  {member.relationDescription && ` - ${member.relationDescription}`}
                </p>
                {member.mobileNumber && (
                  <p className="text-sm text-gray-500 font-mono">{member.mobileNumber}</p>
                )}
                {member.email && (
                  <p className="text-sm text-gray-500">{member.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {member.isEmergencyContact && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                  Emergency Contact
                </span>
              )}
              <span className={`px-2 py-1 text-xs rounded-full ${
                member.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {member.isActive ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => handleDelete(member.familyMemberId)}
                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function FamilyMemberForm({ beneficiaryId, onCancel, onSuccess }) {
  const [form, setForm] = useState({
    beneficiaryId,
    fullName: '',
    motherName: '',
    nationalId: '',
    dateOfBirth: '',
    relationType: '',
    relationDescription: '',
    mobileNumber: '',
    email: '',
    genderCodeValueId: '',
    isEmergencyContact: false,
    canBookAppointments: false,
  })
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/appointment-service/api/family-members', form)
      toast.success('Family member added successfully')
      onSuccess()
    } catch (error) {
      console.error('Failed to create family member:', error)
      toast.error(error.response?.data?.message || 'Failed to create family member')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
      <h4 className="font-semibold text-gray-900 mb-4">Add Family Member</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.fullName}
              onChange={e => setForm({...form, fullName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Relation Type *</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.relationType}
              onChange={e => setForm({...form, relationType: e.target.value})}
            >
              <option value="">Select</option>
              <option value="SPOUSE">Spouse</option>
              <option value="CHILD">Child</option>
              <option value="PARENT">Parent</option>
              <option value="SIBLING">Sibling</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.dateOfBirth}
              onChange={e => setForm({...form, dateOfBirth: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mobile</label>
            <input
              type="text"
              placeholder="+963912345678"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
              value={form.mobileNumber}
              onChange={e => setForm({...form, mobileNumber: e.target.value})}
            />
          </div>
        </div>
        {form.relationType === 'OTHER' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Relation Description</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={form.relationDescription}
              onChange={e => setForm({...form, relationDescription: e.target.value})}
            />
          </div>
        )}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isEmergencyContact}
              onChange={e => setForm({...form, isEmergencyContact: e.target.checked})}
            />
            Emergency Contact
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.canBookAppointments}
              onChange={e => setForm({...form, canBookAppointments: e.target.checked})}
            />
            Can Book Appointments
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50"
          >
            {busy ? 'Adding...' : 'Add Member'}
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

function DocumentsTab({ beneficiaryId }) {
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

  const formatSize = (size) => {
    if (!size || Number.isNaN(size)) return '—'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
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
            <p className="mt-1 text-xs text-gray-500">
              Accepted: JPG, PNG, PDF, DOC, DOCX — up to 10MB.
            </p>
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

function AppointmentsTab({ beneficiaryId }) {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sort, setSort] = useState({ field: 'appointmentDate', direction: 'desc' })
  const [error, setError] = useState(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  useEffect(() => {
    setPage(0)
  }, [beneficiaryId])

  useEffect(() => {
    let isMounted = true

    const fetchAppointments = async () => {
      try {
        setLoading(true)
        setError(null)
        const sortParam = `${sort.field},${sort.direction}`
        const sortParams =
          sort.field === 'appointmentDate'
            ? [sortParam, 'appointmentTime,desc']
            : [sortParam]

        const { data } = await api.get(
          `/appointment-service/api/admin/beneficiaries/${beneficiaryId}/appointments`,
          {
            params: {
              page,
              size: pageSize,
              sort: sortParams,
            },
          }
        )

        if (!isMounted) return

        setAppointments(data?.content || [])
        setTotalElements(data?.totalElements ?? 0)
        setTotalPages(data?.totalPages ?? 0)
      } catch (error) {
        if (!isMounted) return
        console.error('Failed to load appointments:', error)
        setError(error)
        toast.error(error.response?.data?.message || 'Failed to load appointments')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchAppointments()

    return () => {
      isMounted = false
    }
  }, [beneficiaryId, page, pageSize, sort.field, sort.direction, refreshCounter])

  const handlePageChange = (nextPage) => {
    const effectiveTotalPages =
      totalPages || (totalElements > 0 ? Math.ceil(totalElements / pageSize) : 0)

    if (nextPage < 0) return
    if (effectiveTotalPages > 0 && nextPage >= effectiveTotalPages) return
    setPage(nextPage)
  }

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value))
    setPage(0)
  }

  const handleSort = (field) => {
    setSort((prev) => {
      const isSameField = prev.field === field
      const direction = isSameField && prev.direction === 'desc' ? 'asc' : 'desc'
      return { field, direction }
    })
    setPage(0)
  }

  const handleRefresh = () => {
    setRefreshCounter((count) => count + 1)
  }

  const effectiveTotalPages =
    totalPages || (totalElements > 0 ? Math.ceil(totalElements / pageSize) : 0)
  const isFirstPage = page === 0
  const isLastPage = effectiveTotalPages === 0 ? true : page >= effectiveTotalPages - 1

  const formatDate = (value) => {
    if (!value) return '—'
    try {
      return new Date(value).toLocaleDateString()
    } catch {
      return value
    }
  }

  const formatTime = (value) => {
    if (!value) return '—'
    return value.slice(0, 5)
  }

  const formatId = (value) => {
    if (!value) return '—'
    return `${value.slice(0, 8)}…`
  }

  const renderStatusBadge = (status) => {
    if (!status) {
      return (
        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
          Unknown
        </span>
      )
    }
    const normalized = status.toLowerCase()
    const styles =
      normalized === 'completed'
        ? 'bg-green-100 text-green-800'
        : normalized === 'cancelled' || normalized === 'canceled'
        ? 'bg-red-100 text-red-700'
        : normalized === 'scheduled'
        ? 'bg-indigo-100 text-indigo-700'
        : 'bg-gray-100 text-gray-700'

    return (
      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${styles}`}>
        {status}
      </span>
    )
  }

  const renderSortIndicator = (field) => {
    if (sort.field !== field) return null
    return (
      <span className="text-xs font-semibold text-gray-500">
        {sort.direction === 'desc' ? '↓' : '↑'}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Appointments History</h3>
          <p className="text-sm text-gray-500">
            Review all appointments booked for this beneficiary with latest updates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">
            Page Size:
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="ml-2 px-2 py-1 border border-gray-300 rounded-md text-sm"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RotateCw
              className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : 'text-gray-600'}`}
              aria-hidden="true"
            />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-6">
          <p className="font-medium mb-2">Unable to load appointments</p>
          <p className="text-sm">
            {error.response?.data?.message || error.message || 'Please try again later.'}
          </p>
          <button
            onClick={handleRefresh}
            className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">No appointments found for this beneficiary.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort('appointmentDate')}
                      className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                    >
                      Appointment
                      {renderSortIndicator('appointmentDate')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort('createdAt')}
                      className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                    >
                      Created
                      {renderSortIndicator('createdAt')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.appointmentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-gray-900">
                          {formatDate(appointment.appointmentDate)} •{' '}
                          {formatTime(appointment.appointmentTime)}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {formatId(appointment.appointmentId)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-gray-900">
                          {appointment.serviceTypeName || '—'}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {appointment.serviceTypeId || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-gray-900">
                          {appointment.branchName || '—'}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {appointment.organizationBranchId || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {renderStatusBadge(appointment.appointmentStatus)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          appointment.priority === 'URGENT'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {appointment.priority || 'NORMAL'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-gray-900">
                          {appointment.createdAt
                            ? new Date(appointment.createdAt).toLocaleString()
                            : '—'}
                        </span>
                        {appointment.createdById && (
                          <span className="text-xs text-gray-500 font-mono">
                            {appointment.createdById}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
            <div className="text-sm text-gray-600">
              Showing{' '}
              <span className="font-medium text-gray-900">
                {appointments.length}
              </span>{' '}
              of{' '}
              <span className="font-medium text-gray-900">{totalElements}</span> appointments
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={isFirstPage}
                className={`px-3 py-2 rounded-md text-sm ${
                  isFirstPage
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page{' '}
                <span className="font-medium text-gray-900">{page + 1}</span> of{' '}
                <span className="font-medium text-gray-900">
                  {effectiveTotalPages > 0 ? effectiveTotalPages : 1}
                </span>
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={isLastPage}
                className={`px-3 py-2 rounded-md text-sm ${
                  isLastPage
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

