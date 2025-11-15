import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import CrudPage from '@/features/crud/CrudPage'
import { api } from '@/lib/axios'
import AppointmentBreadcrumb from '@/modules/appointment/components/AppointmentBreadcrumb'

const languageColumns = [
  {
    id: 'languageCode',
    accessorKey: 'languageCode',
    header: 'Language',
    cell: ({ getValue }) => <span className="font-medium text-gray-900">{getValue()?.toUpperCase() || '-'}</span>,
    meta: { type: 'string', filterKey: 'languageCode', operators: ['EQUAL', 'LIKE'] },
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Localized Name',
    cell: ({ getValue }) => <span className="text-gray-800">{getValue() || '-'}</span>,
    meta: { type: 'string', filterKey: 'name', operators: ['LIKE'] },
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
]

const languageFields = [
  {
    type: 'text',
    name: 'languageCode',
    label: 'Language Code',
    required: true,
    placeholder: 'en, ar, fr',
    maxLength: 10,
  },
  {
    type: 'text',
    name: 'name',
    label: 'Localized Name',
    required: true,
    maxLength: 100,
  },
  {
    type: 'checkbox',
    name: 'isActive',
    label: 'Active',
    defaultValue: true,
  },
]

export default function AppointmentStatusDetails() {
  const { appointmentStatusId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)
  const [formData, setFormData] = useState(null)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    const fetchDetails = async () => {
      if (!appointmentStatusId) return
      setLoading(true)
      try {
        const { data } = await api.get(`/appointment-service/api/admin/appointment-statuses/${appointmentStatusId}`)
        setStatus(data)
        setFormData({
          code: data?.code ?? '',
          name: data?.name ?? '',
          isActive: data?.isActive !== false,
        })
      } catch (err) {
        toast.error('Failed to load appointment status details')
        navigate('/appointment/statuses')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [appointmentStatusId, navigate])

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData) return
    setSaving(true)
    try {
      const payload = {
        code: formData.code?.trim(),
        name: formData.name?.trim(),
        isActive: formData.isActive !== false,
      }
      const { data } = await api.put(
        `/appointment-service/api/admin/appointment-statuses/${appointmentStatusId}`,
        payload
      )
      setStatus(data)
      toast.success('Appointment status updated successfully')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update appointment status')
    } finally {
      setSaving(false)
    }
  }

  const breadcrumbLabel = useMemo(() => {
    if (!status) return 'Appointment Status Details'
    return status.name || status.code || 'Appointment Status Details'
  }, [status])

  const languageFixedFilters = useMemo(
    () =>
      appointmentStatusId
        ? [
            {
              key: 'appointmentStatusId',
              operator: 'EQUAL',
              value: appointmentStatusId,
              dataType: 'UUID',
            },
          ]
        : [],
    [appointmentStatusId]
  )

  const toCreatePayload = (form) => ({
    appointmentStatusId,
    languageCode: form.languageCode?.trim(),
    name: form.name?.trim(),
    isActive: form.isActive !== false,
  })

  const toUpdatePayload = (form, row) => ({
    appointmentStatusLanguageId: row.appointmentStatusLanguageId,
    appointmentStatusId,
    languageCode: form.languageCode?.trim(),
    name: form.name?.trim(),
    isActive: form.isActive !== false,
    isDeleted: false,
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="text-sm text-gray-600 animate-pulse">Loading appointment status details…</div>
      </div>
    )
  }

  if (!status) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <AppointmentBreadcrumb currentPageLabel={breadcrumbLabel} />
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-amber-100">
          <div className="px-6 py-6 border-b border-amber-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{status?.name || status?.code || 'Appointment Status'}</h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <span>Manage core status configuration and localized labels.</span>
                  {status?.code && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-semibold">
                      {status.code}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex divide-x divide-gray-200 text-sm bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-2">
                  <div className="text-gray-500 uppercase text-xs tracking-wide">Status</div>
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      status?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {status?.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'details'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('details')}
              >
                Status Details
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'languages'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('languages')}
              >
                Language Options
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            {activeTab === 'details' && formData && (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status Code</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleFieldChange('code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Active</label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-5 py-2.5 bg-amber-500 text-white font-semibold rounded-lg shadow hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'languages' && (
              <CrudPage
                title="Status Languages"
                service="appointment-service"
                resourceBase="/api/admin/appointment-status-languages"
                idKey="appointmentStatusLanguageId"
                columns={languageColumns}
                formFields={languageFields}
                fixedFilters={languageFixedFilters}
                toCreatePayload={toCreatePayload}
                toUpdatePayload={toUpdatePayload}
                enableCreate
                enableEdit
                enableDelete
                showAddButton
                tableId={`appointment-status-languages-${appointmentStatusId}`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


