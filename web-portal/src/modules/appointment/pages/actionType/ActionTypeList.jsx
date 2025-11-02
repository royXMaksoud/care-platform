import React from 'react'
import CrudPage from '@/features/crud/CrudPage'
import { Shield } from 'lucide-react'

export default function ActionTypeList() {
  const actionTypeColumns = [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Action Name',
      cell: ({ getValue }) => (
        <span className="font-medium text-gray-900">{getValue() || '-'}</span>
      ),
      meta: { type: 'string', filterKey: 'name', operators: ['LIKE', 'EQUAL'] },
    },
    {
      id: 'code',
      accessorKey: 'code',
      header: 'Code',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-gray-600">{getValue() || '-'}</span>
      ),
      meta: { type: 'string', filterKey: 'code', operators: ['EQUAL'] },
    },
    {
      id: 'color',
      accessorKey: 'color',
      header: 'Color',
      cell: ({ getValue }) => {
        const color = getValue()
        return color ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border" style={{ backgroundColor: color }}></div>
            <span className="text-xs text-gray-500">{color}</span>
          </div>
        ) : '-'
      },
    },
    {
      id: 'requiresTransfer',
      accessorKey: 'requiresTransfer',
      header: 'Requires Transfer',
      cell: ({ getValue }) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          getValue() ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {getValue() ? 'Yes' : 'No'}
        </span>
      ),
      meta: { type: 'boolean', filterKey: 'requiresTransfer', operators: ['EQUAL'] },
    },
    {
      id: 'completesAppointment',
      accessorKey: 'completesAppointment',
      header: 'Completes Appt',
      cell: ({ getValue }) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          getValue() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {getValue() ? 'Yes' : 'No'}
        </span>
      ),
      meta: { type: 'boolean', filterKey: 'completesAppointment', operators: ['EQUAL'] },
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

  const actionTypeFields = [
    { type: 'text', name: 'name', label: 'Action Name', required: true, maxLength: 200 },
    { type: 'text', name: 'code', label: 'Code', required: true, maxLength: 50 },
    { type: 'textarea', name: 'description', label: 'Description', maxLength: 500, rows: 3 },
    { type: 'color', name: 'color', label: 'Color', defaultValue: '#4CAF50' },
    { type: 'number', name: 'displayOrder', label: 'Display Order', min: 1, defaultValue: 1 },
    { type: 'checkbox', name: 'requiresTransfer', label: 'Requires Transfer to Another Center', defaultValue: false },
    { type: 'checkbox', name: 'completesAppointment', label: 'Marks Appointment as Completed', defaultValue: false },
    { type: 'checkbox', name: 'isActive', label: 'Active', defaultValue: true },
  ]

  const toCreatePayload = (formData) => ({
    name: formData.name,
    code: formData.code,
    description: formData.description || null,
    color: formData.color || '#4CAF50',
    displayOrder: parseInt(formData.displayOrder) || 1,
    requiresTransfer: formData.requiresTransfer === true,
    completesAppointment: formData.completesAppointment === true,
    isActive: formData.isActive !== false,
  })

  const toUpdatePayload = (formData) => ({
    name: formData.name,
    code: formData.code,
    description: formData.description || null,
    color: formData.color || '#4CAF50',
    displayOrder: parseInt(formData.displayOrder) || 1,
    requiresTransfer: formData.requiresTransfer === true,
    completesAppointment: formData.completesAppointment === true,
    isActive: formData.isActive !== false,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
            <Shield className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Action Type Management</h1>
            <p className="text-sm text-gray-600">Configure appointment outcomes and actions</p>
          </div>
        </div>

        <CrudPage
          title="Action Types"
          service="appointment-service"
          resourceBase="/api/admin/action-types"
          idKey="actionTypeId"
          columns={actionTypeColumns}
          formFields={actionTypeFields}
          toCreatePayload={toCreatePayload}
          toUpdatePayload={toUpdatePayload}
          pageSize={20}
          enableCreate={true}
          enableEdit={true}
          enableDelete={true}
          tableId="action-types-list"
        />
      </div>
    </div>
  )
}

