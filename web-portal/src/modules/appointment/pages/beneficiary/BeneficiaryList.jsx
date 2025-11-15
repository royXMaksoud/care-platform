import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import { Users, Mail, Phone, BarChart3, Download } from 'lucide-react'
import { api } from '@/lib/axios'
import AppointmentBreadcrumb from '@/modules/appointment/components/AppointmentBreadcrumb'

const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/

const resolvePhotoUrl = (rawUrl, beneficiaryId) => {
  if (!rawUrl) return null
  if (/^https?:\/\//i.test(rawUrl) || rawUrl.startsWith('data:')) {
    return rawUrl
  }
  const baseUrl = api.defaults?.baseURL ?? ''
  const normalized = rawUrl.startsWith('/')
    ? rawUrl
    : `/appointment-service/api/admin/beneficiaries/${beneficiaryId}/profile-photo`
  return `${baseUrl}${normalized}`
}

const AvatarCell = ({ row }) => {
  const record = row.original || {}
  const photoUrl = resolvePhotoUrl(record.profilePhotoUrl, record.beneficiaryId)
  const initials = record.fullName
    ? record.fullName
        .split(' ')
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('')
    : '—'

  if (photoUrl) {
    return (
      <div className="flex items-center justify-center">
        <img
          src={photoUrl}
          alt={record.fullName || 'Beneficiary'}
          className="h-10 w-10 rounded-full object-cover border border-slate-200 shadow-sm"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
      {initials}
    </div>
  )
}

const GENDER_TABLE_ID = '8969b32a-2ff5-4004-9dca-ad6a2425d762'
const LANGUAGE_TABLE_ID = 'fa8c4fd4-8c3a-477a-afbb-dd95472fc913'

export default function BeneficiaryList() {
  const navigate = useNavigate()
  const [genderOptions, setGenderOptions] = useState([])
  const [languageOptions, setLanguageOptions] = useState([])

  useEffect(() => {
    const mapDropdownItems = (items = []) =>
      items.map((item) => ({
        value: item.id ?? item.value ?? item.codeTableValueId ?? item.code,
        label: item.label || item.name || item.description || item.code || '—',
      })).filter((opt) => opt.value)

    const fetchGenderOptions = async () => {
      try {
        const { data } = await api.get(
          '/access/api/cascade-dropdowns/access.code-table-values-by-table',
          { params: { codeTableId: GENDER_TABLE_ID } }
        )
        setGenderOptions(mapDropdownItems(data))
      } catch (error) {
        console.error('Failed to load gender options', error)
      }
    }

    const fetchLanguageOptions = async () => {
      try {
        const response = await api.get('/access/api/cascade-dropdowns/access.code-table-values-by-table', {
          params: { codeTableId: LANGUAGE_TABLE_ID },
        })
        setLanguageOptions(mapDropdownItems(response?.data || []))
      } catch (error) {
        console.error('Failed to load preferred language options', error)
      }
    }

    fetchGenderOptions()
    fetchLanguageOptions()
  }, [])
  
  const handleRowClick = (row) => {
    navigate(`/appointment/beneficiaries/${row.beneficiaryId}`)
  }
  const genderLabelMap = useMemo(
    () =>
      genderOptions.reduce((acc, option) => {
        acc[option.value] = option.label
        return acc
      }, {}),
    [genderOptions]
  )

  const formatAge = (dateString) => {
    if (!dateString) return '—'
    const birthDate = new Date(dateString)
    if (Number.isNaN(birthDate.getTime())) return '—'
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 0 && Number.isFinite(age) ? age : '—'
  }

  const beneficiaryColumns = [
    {
      id: 'avatar',
      accessorKey: 'profilePhotoUrl',
      header: '',
      cell: (info) => <AvatarCell row={info.row} />,
      enableSorting: false,
      enableColumnFilter: false,
      size: 64,
    },
    {
      id: 'fullName',
      accessorKey: 'fullName',
      header: 'Full Name',
      cell: ({ getValue }) => (
        <span className="font-medium text-gray-900">{getValue() || '-'}</span>
      ),
      meta: { type: 'string', filterKey: 'fullName', operators: ['LIKE', 'EQUAL', 'STARTS_WITH'] },
    },
    {
      id: 'nationalId',
      accessorKey: 'nationalId',
      header: 'National ID',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-gray-600">{getValue() || '-'}</span>
      ),
      meta: { type: 'string', filterKey: 'nationalId', operators: ['EQUAL', 'STARTS_WITH'] },
    },
    {
      id: 'mobileNumber',
      accessorKey: 'mobileNumber',
      header: 'Mobile',
      cell: ({ getValue }) => {
        const mobile = getValue()
        return mobile ? (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span className="font-mono text-sm">{mobile}</span>
          </div>
        ) : '-'
      },
      meta: { type: 'string', filterKey: 'mobileNumber', operators: ['EQUAL', 'STARTS_WITH'] },
    },
    {
      id: 'gender',
      accessorKey: 'genderCodeValueId',
      header: 'Gender',
      cell: ({ getValue }) => genderLabelMap[getValue()] || getValue() || '—',
      meta: { type: 'string', filterKey: 'genderCodeValueId', operators: ['EQUAL'] },
    },
    {
      id: 'age',
      header: 'Age',
      cell: ({ row }) => formatAge(row.original?.dateOfBirth),
      meta: { type: 'number' },
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => {
        const email = getValue()
        return email ? (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{email}</span>
          </div>
        ) : '-'
      },
      meta: { type: 'string', filterKey: 'email', operators: ['EQUAL', 'LIKE'] },
    },
    {
      id: 'address',
      accessorKey: 'address',
      header: 'Address',
      cell: ({ getValue }) => {
        const addr = getValue()
        return addr ? (
          <span className="text-sm text-gray-600 line-clamp-1">{addr}</span>
        ) : '-'
      },
      meta: { type: 'string', filterKey: 'address', operators: ['LIKE'] },
    },
    {
      id: 'isActive',
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          getValue() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {getValue() ? 'Active' : 'Inactive'}
        </span>
      ),
      meta: { type: 'boolean', filterKey: 'isActive', operators: ['EQUAL'] },
    },
  ]

  const beneficiaryFields = useMemo(() => [
    { type: 'text', name: 'nationalId', label: 'National ID', required: false, maxLength: 50 },
    { type: 'text', name: 'fullName', label: 'Full Name', required: true, maxLength: 200 },
    { type: 'text', name: 'motherName', label: 'Mother Name', maxLength: 200 },
    {
      type: 'text',
      name: 'mobileNumber',
      label: 'Mobile Number',
      required: true,
      maxLength: 20,
      placeholder: '+963912345678',
      pattern: '^\\+?[1-9]\\d{1,14}$',
    },
    { type: 'email', name: 'email', label: 'Email', maxLength: 100 },
    { type: 'textarea', name: 'address', label: 'Address', maxLength: 1000, rows: 3, required: true },
    {
      type: 'number',
      name: 'latitude',
      label: 'Latitude',
      step: '0.000001',
      min: -90,
      max: 90,
      placeholder: '33.5138',
      required: true,
    },
    {
      type: 'number',
      name: 'longitude',
      label: 'Longitude',
      step: '0.000001',
      min: -180,
      max: 180,
      placeholder: '36.2765',
      required: true,
    },
    {
      type: 'map',
      name: 'locationPicker',
      label: 'Select location on map',
      buttonLabel: 'Choose on Map',
      latName: 'latitude',
      lngName: 'longitude',
    },
    { type: 'date', name: 'dateOfBirth', label: 'Date of Birth', required: true },
    {
      type: 'select',
      name: 'genderCodeValueId',
      label: 'Gender',
      required: true,
      options: [{ value: '', label: 'Select Gender' }, ...genderOptions],
    },
    { type: 'text', name: 'profilePhotoUrl', label: 'Profile Photo URL', maxLength: 500 },
    { 
      type: 'select',
      name: 'registrationStatusCodeValueId',
      label: 'Registration Status',
      options: [
        { value: '', label: 'Select Status' },
        { value: 'QUICK', label: 'Quick Registration' },
        { value: 'COMPLETE', label: 'Complete Registration' },
      ],
    },
    {
      type: 'select',
      name: 'preferredLanguageCodeValueId',
      label: 'Preferred Language',
      required: true,
      options: [{ value: '', label: 'Select Language' }, ...languageOptions],
    },
    { type: 'checkbox', name: 'isActive', label: 'Active', defaultValue: true },
  ], [genderOptions, languageOptions])

  const toNullableFloat = (value) =>
    value === '' || value === null || value === undefined ? null : parseFloat(value)

  const buildBeneficiaryPayload = (formData) => {
    const missingFields = []

    const normalizedFullName = formData.fullName?.trim()
    if (!normalizedFullName) missingFields.push('Full Name')

    const normalizedMobile = formData.mobileNumber?.trim()
    if (!normalizedMobile) {
      missingFields.push('Mobile Number')
    } else if (!PHONE_REGEX.test(normalizedMobile)) {
      throw new Error('Mobile number must use the international format, e.g. +963912345678')
    }

    const normalizedAddress = formData.address?.trim()
    if (!normalizedAddress) missingFields.push('Address')

    const latitude = toNullableFloat(formData.latitude)
    if (latitude === null || Number.isNaN(latitude)) missingFields.push('Latitude')

    const longitude = toNullableFloat(formData.longitude)
    if (longitude === null || Number.isNaN(longitude)) missingFields.push('Longitude')

    if (!formData.dateOfBirth) {
      missingFields.push('Date of Birth')
    } else {
      const dob = new Date(formData.dateOfBirth)
      if (Number.isNaN(dob.getTime())) {
        throw new Error('Date of Birth is invalid')
      }
      if (dob > new Date()) {
        throw new Error('Date of Birth must be in the past')
      }
    }

    if (!formData.genderCodeValueId) {
      missingFields.push('Gender')
    }

    if (!formData.preferredLanguageCodeValueId) {
      missingFields.push('Preferred Language')
    }

    if (missingFields.length > 0) {
      throw new Error(`Please fill in the required fields: ${missingFields.join(', ')}`)
    }

    return {
      nationalId: formData.nationalId?.trim() || null,
      fullName: normalizedFullName,
      motherName: formData.motherName?.trim() || null,
      mobileNumber: normalizedMobile,
      email: formData.email?.trim() || null,
      address: normalizedAddress,
      latitude,
      longitude,
      dateOfBirth: formData.dateOfBirth,
      genderCodeValueId: formData.genderCodeValueId,
      profilePhotoUrl: formData.profilePhotoUrl?.trim() || null,
      registrationStatusCodeValueId: formData.registrationStatusCodeValueId || null,
      preferredLanguageCodeValueId: formData.preferredLanguageCodeValueId,
      isActive: formData.isActive !== false,
    }
  }

  const toCreatePayload = (formData) => buildBeneficiaryPayload(formData)

  const toUpdatePayload = (formData) => buildBeneficiaryPayload(formData)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <AppointmentBreadcrumb />
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Users className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Beneficiary Management</h1>
              <p className="text-sm text-gray-600">Manage patients and service recipients</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/appointment/beneficiaries/statistics')}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center gap-2 shadow-md"
            >
              <BarChart3 className="w-4 h-4" />
              Statistics
            </button>
            <button
              onClick={() => navigate('/appointment/beneficiaries/bulk-update', { state: { selectedIds: [] } })}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all flex items-center gap-2 shadow-md"
            >
              <Download className="w-4 h-4" />
              Bulk Update
            </button>
          </div>
        </div>

        <CrudPage
          title="Beneficiaries"
          service="appointment-service"
          resourceBase="/api/admin/beneficiaries"
          idKey="beneficiaryId"
          columns={beneficiaryColumns}
          formFields={beneficiaryFields}
          toCreatePayload={toCreatePayload}
          toUpdatePayload={toUpdatePayload}
          pageSize={20}
          enableCreate={true}
          enableEdit={true}
          enableDelete={true}
          tableId="beneficiaries-list"
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  )
}

