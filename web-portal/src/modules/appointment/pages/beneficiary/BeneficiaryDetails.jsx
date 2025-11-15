import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import {
  User,
  Users as UsersIcon,
  FileText,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  Loader2,
  ExternalLink,
  History,
  ImagePlus,
  Trash2,
} from 'lucide-react'
import AppointmentBreadcrumb from '@/modules/appointment/components/AppointmentBreadcrumb'
import BeneficiaryPersonalInfoTab from './tabs/BeneficiaryPersonalInfoTab'
import BeneficiaryFamilyTab from './tabs/BeneficiaryFamilyTab'
import BeneficiaryDocumentsTab from './tabs/BeneficiaryDocumentsTab'
import BeneficiaryAppointmentsTab from './tabs/BeneficiaryAppointmentsTab'
import MapPickerModal from '@/components/MapPickerModal'

export default function BeneficiaryDetails() {
  const { beneficiaryId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [beneficiary, setBeneficiary] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [genderOptions, setGenderOptions] = useState([])
  const [languageOptions, setLanguageOptions] = useState([])
  const GENDER_TABLE_ID = '8969b32a-2ff5-4004-9dca-ad6a2425d762'
  const LANGUAGE_TABLE_ID = 'fa8c4fd4-8c3a-477a-afbb-dd95472fc913'
  const toInputCoordinate = (value) =>
    value === null || value === undefined || value === '' ? '' : String(value)
  const parseCoordinateOrFallback = (value, fallback) => {
    if (value === null || value === undefined || value === '') {
      return fallback ?? null
    }
    const parsed = typeof value === 'number' ? value : parseFloat(value)
    return Number.isFinite(parsed) ? parsed : fallback ?? null
  }

  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false)
  const [personalInfoForm, setPersonalInfoForm] = useState({
    fullName: '',
    motherName: '',
    nationalId: '',
    genderCodeValueId: '',
    dateOfBirth: '',
    mobileNumber: '',
    email: '',
    address: '',
    preferredLanguageCodeValueId: '',
    registrationStatusCodeValueId: '',
    isActive: true,
    latitude: '',
    longitude: '',
  })
  const [personalInfoErrors, setPersonalInfoErrors] = useState({})
  const [savingPersonalInfo, setSavingPersonalInfo] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)

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

  useEffect(() => {
    const loadGenderOptions = async () => {
      try {
        const { data } = await api.get(
          '/access/api/cascade-dropdowns/access.code-table-values-by-table',
          { params: { codeTableId: GENDER_TABLE_ID } }
        )
        const mapped =
          (data || []).map((item) => ({
            value: item.id ?? item.value ?? item.codeTableValueId ?? item.code,
            label: item.label || item.name || item.description || item.code || '—',
          })).filter((opt) => opt.value) || []
        setGenderOptions(mapped)
      } catch (error) {
        console.error('Failed to load gender code table values', error)
      }
    }
    loadGenderOptions()
  }, [])

  useEffect(() => {
    const mapDropdownItems = (items = []) =>
      items
        .map((item) => ({
          value: item.id ?? item.value ?? item.codeTableValueId ?? item.code,
          label: item.label || item.name || item.description || item.code || '—',
        }))
        .filter((opt) => opt.value)

    const loadLanguageOptions = async () => {
      try {
        const response = await api.get('/access/api/cascade-dropdowns/access.code-table-values-by-table', {
          params: { codeTableId: LANGUAGE_TABLE_ID },
        })
        setLanguageOptions(mapDropdownItems(response?.data || []))
      } catch (error) {
        console.error('Failed to load preferred language options', error)
      }
    }

    loadLanguageOptions()
  }, [])

  useEffect(() => {
    if (!beneficiary) return
    setPersonalInfoForm({
      fullName: beneficiary.fullName || '',
      motherName: beneficiary.motherName || '',
      nationalId: beneficiary.nationalId || '',
      genderCodeValueId: beneficiary.genderCodeValueId || '',
      dateOfBirth: beneficiary.dateOfBirth ? beneficiary.dateOfBirth.split('T')[0] : '',
      mobileNumber: beneficiary.mobileNumber || '',
      email: beneficiary.email || '',
      address: beneficiary.address || '',
      preferredLanguageCodeValueId: beneficiary.preferredLanguageCodeValueId || '',
      registrationStatusCodeValueId: beneficiary.registrationStatusCodeValueId || '',
      isActive: beneficiary.isActive !== false,
      latitude: toInputCoordinate(beneficiary.latitude),
      longitude: toInputCoordinate(beneficiary.longitude),
    })
  }, [beneficiary])
  
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

  const handlePersonalInfoChange = (field, value) => {
    setPersonalInfoForm(prev => ({ ...prev, [field]: value }))
    setPersonalInfoErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const validatePersonalInfo = () => {
    const errors = {}
    if (!personalInfoForm.fullName?.trim()) {
      errors.fullName = 'Full name is required'
    }
    if (!personalInfoForm.mobileNumber?.trim()) {
      errors.mobileNumber = 'Mobile number is required'
    }
    if (!personalInfoForm.address?.trim()) {
      errors.address = 'Address is required'
    }
    if (
      personalInfoForm.latitude === '' ||
      personalInfoForm.latitude === null ||
      Number.isNaN(Number(personalInfoForm.latitude))
    ) {
      errors.latitude = 'Latitude is required'
    }
    if (
      personalInfoForm.longitude === '' ||
      personalInfoForm.longitude === null ||
      Number.isNaN(Number(personalInfoForm.longitude))
    ) {
      errors.longitude = 'Longitude is required'
    }
    if (!personalInfoForm.preferredLanguageCodeValueId) {
      errors.preferredLanguageCodeValueId = 'Preferred language is required'
    }
    if (!personalInfoForm.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required'
    }
    if (personalInfoForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfoForm.email)) {
      errors.email = 'Invalid email format'
    }
    setPersonalInfoErrors(errors)
    return Object.keys(errors).length === 0
  }

  const buildUpdatePayload = () => {
    const fallbackString = (value, fallback) => {
      if (value === '' || value === undefined || value === null) {
        return fallback ?? null
      }
      return value
    }

    const fallbackTrimmed = (value, fallback) => {
      const normalized = value?.trim()
      if (!normalized) {
        return fallback ?? null
      }
      return normalized
    }

    const fallbackDate = (value, fallback) => {
      if (!value) {
        return fallback ?? null
      }
      return value
    }

    return {
      nationalId: fallbackTrimmed(personalInfoForm.nationalId, beneficiary?.nationalId),
      fullName: fallbackTrimmed(personalInfoForm.fullName, beneficiary?.fullName),
      motherName: fallbackTrimmed(personalInfoForm.motherName, beneficiary?.motherName),
      mobileNumber: fallbackTrimmed(personalInfoForm.mobileNumber, beneficiary?.mobileNumber),
      email: fallbackTrimmed(personalInfoForm.email, beneficiary?.email),
      address: fallbackTrimmed(personalInfoForm.address, beneficiary?.address),
      latitude: parseCoordinateOrFallback(personalInfoForm.latitude, beneficiary?.latitude ?? null),
      longitude: parseCoordinateOrFallback(personalInfoForm.longitude, beneficiary?.longitude ?? null),
      dateOfBirth: fallbackDate(personalInfoForm.dateOfBirth, beneficiary?.dateOfBirth?.split('T')[0]),
      genderCodeValueId: fallbackString(personalInfoForm.genderCodeValueId, beneficiary?.genderCodeValueId),
      profilePhotoUrl: beneficiary?.profilePhotoUrl ?? null,
      registrationStatusCodeValueId: fallbackString(
        personalInfoForm.registrationStatusCodeValueId,
        beneficiary?.registrationStatusCodeValueId
      ),
      preferredLanguageCodeValueId: fallbackString(
        personalInfoForm.preferredLanguageCodeValueId,
        beneficiary?.preferredLanguageCodeValueId
      ),
      isActive: Boolean(personalInfoForm.isActive),
    }
  }

  const handleSavePersonalInfo = async () => {
    if (!validatePersonalInfo()) return
    try {
      setSavingPersonalInfo(true)
      const payload = buildUpdatePayload()
      const { data } = await api.put(
        `/appointment-service/api/admin/beneficiaries/${beneficiaryId}`,
        payload
      )
      await loadBeneficiary()
      if (!data) {
        // ensure local state reflects persisted change even if API returned no body
        setBeneficiary(prev => (prev ? { ...prev } : prev))
      }
      toast.success('Personal information updated successfully')
      setIsEditingPersonalInfo(false)
    } catch (error) {
      console.error('Failed to update beneficiary info:', error)
      toast.error(
        error.response?.data?.message || 'Failed to update personal information'
      )
    } finally {
      setSavingPersonalInfo(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingPersonalInfo(false)
    if (beneficiary) {
      setPersonalInfoForm({
        fullName: beneficiary.fullName || '',
        motherName: beneficiary.motherName || '',
        nationalId: beneficiary.nationalId || '',
        genderCodeValueId: beneficiary.genderCodeValueId || '',
        dateOfBirth: beneficiary.dateOfBirth ? beneficiary.dateOfBirth.split('T')[0] : '',
        mobileNumber: beneficiary.mobileNumber || '',
        email: beneficiary.email || '',
        address: beneficiary.address || '',
        preferredLanguageCodeValueId: beneficiary.preferredLanguageCodeValueId || '',
        registrationStatusCodeValueId: beneficiary.registrationStatusCodeValueId || '',
        isActive: beneficiary.isActive !== false,
        latitude: toInputCoordinate(beneficiary.latitude),
        longitude: toInputCoordinate(beneficiary.longitude),
      })
    }
    setPersonalInfoErrors({})
  }
  const handleMapPick = ({ latitude, longitude }) => {
    if (latitude !== undefined) {
      handlePersonalInfoChange('latitude', latitude.toFixed(6))
    }
    if (longitude !== undefined) {
      handlePersonalInfoChange('longitude', longitude.toFixed(6))
    }
  }
  
  const genderLabelMap = useMemo(
    () =>
      genderOptions.reduce((acc, option) => {
        acc[option.value] = option.label
        return acc
      }, {}),
    [genderOptions]
  )

  const languageLabelMap = useMemo(
    () =>
      languageOptions.reduce((acc, option) => {
        acc[option.value] = option.label
        return acc
      }, {}),
    [languageOptions]
  )

  const breadcrumbLabel = useMemo(() => {
    return beneficiary?.fullName || beneficiary?.nationalId || 'Beneficiary Details'
  }, [beneficiary])

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
    const effectiveUrl = photoUrl ?? resolvedProfilePhotoUrl ?? beneficiary?.profilePhotoUrl ?? null
    
    if (effectiveUrl && !imageError) {
      return (
        <img
          src={effectiveUrl}
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
    {
      id: 'gender',
      label: 'Gender',
      value:
        genderLabelMap[beneficiary.genderCodeValueId] ||
        beneficiary.genderCodeValueId ||
        '—',
    },
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
      value:
        languageLabelMap[beneficiary.preferredLanguageCodeValueId] ||
        beneficiary.preferredLanguageCodeValueId ||
        '—',
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
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm shadow-slate-100/70">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </span>
      <span
        className={`mt-2 block text-base font-semibold text-slate-900 ${
          mono ? 'font-mono tracking-tight' : ''
        }`}
      >
        {value && value !== '' ? value : '—'}
      </span>
    </div>
  )
  
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col px-4 py-10">
        <AppointmentBreadcrumb currentPageLabel={breadcrumbLabel} />
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
                    <Avatar size="lg" photoUrl={resolvedProfilePhotoUrl} />
                  </div>
                  <span
                    className={`absolute bottom-3 right-3 h-3 w-3 rounded-full border-2 border-white ${
                      beneficiary.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                </div>

                <div className="flex w-full flex-col items-stretch gap-2">
                  <button
                    onClick={triggerProfilePhotoInput}
                    disabled={photoUploading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <ImagePlus className={`h-4 w-4 ${photoUploading ? 'animate-pulse' : ''}`} />
                    {photoUploading ? 'Uploading...' : 'Upload Photo'}
                  </button>
                  {beneficiary?.profilePhotoUrl && (
                    <button
                      onClick={handleRemoveProfilePhoto}
                      disabled={photoUploading}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove Photo
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePhotoUpload}
                />

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
                      <article
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm shadow-slate-200/60"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                            {item.label}
                          </span>
                          {content}
                        </div>
                      </article>
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {heroFields.map((field) => (
                    <ProfileField key={field.id} label={field.label} value={field.value} mono={field.mono} />
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
                      <p className="text-sm text-slate-500">Update identity, contact, and demographic data</p>
                    </div>
                    {!isEditingPersonalInfo ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingPersonalInfo(true)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-600"
                      >
                        Edit Info
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleSavePersonalInfo}
                          disabled={savingPersonalInfo}
                          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {savingPersonalInfo ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={savingPersonalInfo}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditingPersonalInfo && (
                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <PersonalInfoField
                        label="Full Name"
                        required
                        value={personalInfoForm.fullName}
                        error={personalInfoErrors.fullName}
                        onChange={(value) => handlePersonalInfoChange('fullName', value)}
                      />
                      <PersonalInfoField
                        label="Mother Name"
                        value={personalInfoForm.motherName}
                        onChange={(value) => handlePersonalInfoChange('motherName', value)}
                      />
                      <PersonalInfoField
                        label="National ID"
                        value={personalInfoForm.nationalId}
                        onChange={(value) => handlePersonalInfoChange('nationalId', value)}
                      />
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Gender
                        </label>
                        <select
                          value={personalInfoForm.genderCodeValueId}
                          onChange={(event) => handlePersonalInfoChange('genderCodeValueId', event.target.value)}
                          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        >
                          <option value="">Select gender</option>
                          {genderOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={personalInfoForm.dateOfBirth}
                          onChange={(event) => handlePersonalInfoChange('dateOfBirth', event.target.value)}
                          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        />
                        {personalInfoErrors.dateOfBirth && (
                          <p className="mt-1 text-xs font-medium text-rose-500">{personalInfoErrors.dateOfBirth}</p>
                        )}
                      </div>
                      <PersonalInfoField
                        label="Mobile Number"
                        required
                        value={personalInfoForm.mobileNumber}
                        error={personalInfoErrors.mobileNumber}
                        onChange={(value) => handlePersonalInfoChange('mobileNumber', value)}
                      />
                      <PersonalInfoField
                        label="Email"
                        value={personalInfoForm.email}
                        error={personalInfoErrors.email}
                        onChange={(value) => handlePersonalInfoChange('email', value)}
                      />
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Address
                        </label>
                        <textarea
                          value={personalInfoForm.address}
                          onChange={(event) => handlePersonalInfoChange('address', event.target.value)}
                          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                          rows={3}
                        />
                        {personalInfoErrors.address && (
                          <p className="mt-1 text-xs font-medium text-rose-500">{personalInfoErrors.address}</p>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Latitude
                          </label>
                          <button
                            type="button"
                            className="text-xs font-semibold text-sky-600 hover:text-sky-500"
                            onClick={() => setShowMapPicker(true)}
                          >
                            Choose on map
                          </button>
                        </div>
                        <input
                          type="number"
                          step="0.000001"
                          value={personalInfoForm.latitude}
                          onChange={(event) => handlePersonalInfoChange('latitude', event.target.value)}
                          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        />
                        {personalInfoErrors.latitude && (
                          <p className="mt-1 text-xs font-medium text-rose-500">{personalInfoErrors.latitude}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          value={personalInfoForm.longitude}
                          onChange={(event) => handlePersonalInfoChange('longitude', event.target.value)}
                          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        />
                        {personalInfoErrors.longitude && (
                          <p className="mt-1 text-xs font-medium text-rose-500">{personalInfoErrors.longitude}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Preferred Language
                        </label>
                        <select
                          value={personalInfoForm.preferredLanguageCodeValueId}
                          onChange={(event) => handlePersonalInfoChange('preferredLanguageCodeValueId', event.target.value)}
                          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        >
                          <option value="">Select language</option>
                          {languageOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {personalInfoErrors.preferredLanguageCodeValueId && (
                          <p className="mt-1 text-xs font-medium text-rose-500">
                            {personalInfoErrors.preferredLanguageCodeValueId}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Registration Status
                        </label>
                        <select
                          value={personalInfoForm.registrationStatusCodeValueId}
                          onChange={(event) => handlePersonalInfoChange('registrationStatusCodeValueId', event.target.value)}
                          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        >
                          <option value="">Select status</option>
                          <option value="QUICK">Quick Registration</option>
                          <option value="COMPLETE">Complete Registration</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <label className="text-sm font-semibold text-slate-700">
                          Active Beneficiary
                        </label>
                        <input
                          type="checkbox"
                          checked={personalInfoForm.isActive}
                          onChange={(event) => handlePersonalInfoChange('isActive', event.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                      </div>
                    </div>
                  )}
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
            {activeTab === 'info' && <BeneficiaryPersonalInfoTab beneficiary={beneficiary} />}
            {activeTab === 'family' && <BeneficiaryFamilyTab beneficiaryId={beneficiaryId} />}
            {activeTab === 'documents' && <BeneficiaryDocumentsTab beneficiaryId={beneficiaryId} />}
            {activeTab === 'appointments' && <BeneficiaryAppointmentsTab beneficiaryId={beneficiaryId} />}
          </div>
        </div>
      </div>
      <MapPickerModal
        open={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        initialLat={parseCoordinateOrFallback(personalInfoForm.latitude, beneficiary.latitude ?? 33.5138)}
        initialLng={parseCoordinateOrFallback(personalInfoForm.longitude, beneficiary.longitude ?? 36.2765)}
        onPick={handleMapPick}
      />
    </div>
  )
}

function PersonalInfoField({ label, required = false, value, onChange, error }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 ${
          error
            ? 'border-rose-300 bg-white text-slate-900 focus:border-rose-400 focus:ring-rose-100'
            : 'border-slate-200 bg-white text-slate-900 focus:border-sky-400 focus:ring-sky-100'
        }`}
      />
      {error && <p className="mt-1 text-xs font-medium text-rose-500">{error}</p>}
    </div>
  )
}

