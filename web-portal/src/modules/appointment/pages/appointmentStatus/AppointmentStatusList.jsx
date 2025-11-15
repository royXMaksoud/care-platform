import React from 'react'
import { useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import { BadgeCheck, Languages } from 'lucide-react'
import AppointmentBreadcrumb from '@/modules/appointment/components/AppointmentBreadcrumb'

export default function AppointmentStatusList() {
  const navigate = useNavigate()

  const columns = [
    {
      id: 'code',
      accessorKey: 'code',
      header: 'Status Code',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-gray-800">{getValue() || '-'}</span>
      ),
      meta: { type: 'string', filterKey: 'code', operators: ['LIKE', 'EQUAL', 'STARTS_WITH'] },
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Status Name',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-900 font-medium">{getValue() || '-'}</span>
      ),
      meta: { type: 'string', filterKey: 'name', operators: ['LIKE', 'EQUAL', 'STARTS_WITH'] },
    },
    {
      id: 'isActive',
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            getValue() ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
          }`}
        >
          {getValue() ? 'Active' : 'Inactive'}
        </span>
      ),
      meta: { type: 'boolean', filterKey: 'isActive', operators: ['EQUAL'] },
    },
    {
      id: 'languages',
      header: 'Languages',
      cell: ({ row }) => (
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full hover:bg-amber-100 hover:text-amber-700 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/appointment/statuses/${row.original.appointmentStatusId}`)
          }}
        >
          <Languages className="w-4 h-4" />
          Manage
        </button>
      ),
      enableSorting: false,
    },
  ]

  const fields = [
    { type: 'text', name: 'code', label: 'Status Code', required: true, maxLength: 50 },
    { type: 'text', name: 'name', label: 'Status Name', required: true, maxLength: 120 },
    { type: 'checkbox', name: 'isActive', label: 'Active', defaultValue: true },
  ]

  const toCreatePayload = (formData) => ({
    code: formData.code?.trim(),
    name: formData.name?.trim(),
    isActive: formData.isActive !== false,
  })

  const toUpdatePayload = (formData) => ({
    code: formData.code?.trim(),
    name: formData.name?.trim(),
    isActive: formData.isActive !== false,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <AppointmentBreadcrumb />
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
            <BadgeCheck className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointment Status Management</h1>
            <p className="text-sm text-gray-600">Manage workflow statuses and localized labels</p>
          </div>
        </div>

        <CrudPage
          title="Appointment Statuses"
          service="appointment-service"
          resourceBase="/api/admin/appointment-statuses"
          idKey="appointmentStatusId"
          columns={columns}
          formFields={fields}
          toCreatePayload={toCreatePayload}
          toUpdatePayload={toUpdatePayload}
          pageSize={20}
          enableCreate
          enableEdit
          enableDelete
          tableId="appointment-statuses-list"
          onRowClick={(row) => navigate(`/appointment/statuses/${row.appointmentStatusId}`)}
        />
      </div>
    </div>
  )
}


