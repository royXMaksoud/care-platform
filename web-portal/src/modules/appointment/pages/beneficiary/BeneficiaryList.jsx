import React from 'react'
import { useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import { Users, Mail, Phone, BarChart3, Download } from 'lucide-react'

export default function BeneficiaryList() {
  const navigate = useNavigate()
  
  const handleRowClick = (row) => {
    navigate(`/appointment/beneficiaries/${row.beneficiaryId}`)
  }
  const beneficiaryColumns = [
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

  const beneficiaryFields = [
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
    { type: 'textarea', name: 'address', label: 'Address', maxLength: 1000, rows: 3 },
    { 
      type: 'number', 
      name: 'latitude', 
      label: 'Latitude', 
      step: '0.000001',
      min: -90,
      max: 90,
      placeholder: '33.5138'
    },
    { 
      type: 'number', 
      name: 'longitude', 
      label: 'Longitude', 
      step: '0.000001',
      min: -180,
      max: 180,
      placeholder: '36.2765'
    },
    { type: 'date', name: 'dateOfBirth', label: 'Date of Birth' },
    { 
      type: 'select',
      name: 'genderCodeValueId',
      label: 'Gender',
      options: [
        { value: '', label: 'Select Gender' },
        { value: 'MALE', label: 'Male' },
        { value: 'FEMALE', label: 'Female' },
      ],
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
      options: [
        { value: '', label: 'Select Language' },
        { value: 'AR', label: 'Arabic' },
        { value: 'EN', label: 'English' },
        { value: 'TR', label: 'Turkish' },
        { value: 'KU', label: 'Kurdish' },
      ],
    },
    { type: 'checkbox', name: 'isActive', label: 'Active', defaultValue: true },
  ]

  const toCreatePayload = (formData) => ({
    nationalId: formData.nationalId || null,
    fullName: formData.fullName,
    motherName: formData.motherName || null,
    mobileNumber: formData.mobileNumber,
    email: formData.email || null,
    address: formData.address || null,
    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    dateOfBirth: formData.dateOfBirth || null,
    genderCodeValueId: formData.genderCodeValueId || null,
    profilePhotoUrl: formData.profilePhotoUrl || null,
    registrationStatusCodeValueId: formData.registrationStatusCodeValueId || null,
    preferredLanguageCodeValueId: formData.preferredLanguageCodeValueId || null,
    isActive: formData.isActive !== false,
  })

  const toUpdatePayload = (formData) => ({
    nationalId: formData.nationalId || null,
    fullName: formData.fullName,
    motherName: formData.motherName || null,
    mobileNumber: formData.mobileNumber,
    email: formData.email || null,
    address: formData.address || null,
    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    dateOfBirth: formData.dateOfBirth || null,
    genderCodeValueId: formData.genderCodeValueId || null,
    profilePhotoUrl: formData.profilePhotoUrl || null,
    registrationStatusCodeValueId: formData.registrationStatusCodeValueId || null,
    preferredLanguageCodeValueId: formData.preferredLanguageCodeValueId || null,
    isActive: formData.isActive !== false,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
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

