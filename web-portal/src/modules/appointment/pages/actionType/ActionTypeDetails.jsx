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

export default function ActionTypeDetails() {
  const { actionTypeId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [actionType, setActionType] = useState(null)
  const [formData, setFormData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    const fetchDetails = async () => {
      if (!actionTypeId) return
      setLoading(true)
      try {
        const { data } = await api.get(`/appointment-service/api/admin/action-types/${actionTypeId}`)
        setActionType(data)
        setFormData({
          name: data?.name ?? '',
          description: data?.description ?? '',
          color: data?.color ?? '#4CAF50',
          displayOrder: data?.displayOrder ?? 1,
          requiresTransfer: Boolean(data?.requiresTransfer),
          completesAppointment: Boolean(data?.completesAppointment),
          isActive: data?.isActive !== false,
        })
      } catch (err) {
        toast.error('Failed to load action type details')
        navigate('/appointment/action-types')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [actionTypeId, navigate])

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleToggleChange = (field) => (event) => {
    const checked = event.target?.checked ?? false
    handleFieldChange(field, checked)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData) return
    setSaving(true)
    try {
      const payload = {
        name: formData.name?.trim(),
        description: formData.description?.trim() || null,
        color: formData.color || '#4CAF50',
        displayOrder: Number(formData.displayOrder) || 1,
        requiresTransfer: formData.requiresTransfer === true,
        completesAppointment: formData.completesAppointment === true,
        isActive: formData.isActive !== false,
      }

      const { data } = await api.put(
        `/appointment-service/api/admin/action-types/${actionTypeId}`,
        payload
      )
      setActionType(data)
      toast.success('Action type updated successfully')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update action type')
    } finally {
      setSaving(false)
    }
  }

  const languageFixedFilters = useMemo(
    () =>
      actionTypeId
        ? [
            {
              key: 'actionTypeId',
              operator: 'EQUAL',
              value: actionTypeId,
              dataType: 'UUID',
            },
          ]
        : [],
    [actionTypeId]
  )

  const toCreatePayload = (form) => ({
    actionTypeId,
    languageCode: form.languageCode?.trim(),
    name: form.name?.trim(),
    isActive: form.isActive !== false,
  })

  const toUpdatePayload = (form, row) => ({
    actionTypeLanguageId: row.actionTypeLanguageId,
    actionTypeId,
    languageCode: form.languageCode?.trim(),
    name: form.name?.trim(),
    isActive: form.isActive !== false,
    isDeleted: false,
  })

  const formatBreadcrumbLabel = (value) => {
    if (!value) return 'Action Type Details'
    return value.name || value.code || 'Action Type Details'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="text-sm text-gray-600 animate-pulse">Loading action type details…</div>
      </div>
    )
  }

  if (!actionType) {
    return null
  }

  const breadcrumbLabel = formatBreadcrumbLabel(actionType)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-8">
        <AppointmentBreadcrumb currentPageLabel={breadcrumbLabel} />
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-orange-100">
          <div className="px-6 py-6 border-b border-orange-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{actionType?.name || 'Action Type'}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage action type settings and localized labels for <span className="font-semibold">{actionType?.code}</span>.
                </p>
              </div>
              <div className="flex divide-x divide-gray-200 text-sm bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-2">
                  <div className="text-gray-500 uppercase text-xs tracking-wide">Code</div>
                  <div className="font-semibold text-gray-900">{actionType?.code}</div>
                </div>
                <div className="px-4 py-2">
                  <div className="text-gray-500 uppercase text-xs tracking-wide">Status</div>
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      actionType?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {actionType?.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="px-4 py-2">
                  <div className="text-gray-500 uppercase text-xs tracking-wide">Completes</div>
                  <div className="font-semibold text-gray-900">
                    {actionType?.completesAppointment ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="px-4 py-2">
                  <div className="text-gray-500 uppercase text-xs tracking-wide">Requires Transfer</div>
                  <div className="font-semibold text-gray-900">
                    {actionType?.requiresTransfer ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'details'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('details')}
              >
                Action Type Details
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'languages'
                    ? 'bg-orange-500 text-white shadow-sm'
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.displayOrder}
                      onChange={(e) => handleFieldChange('displayOrder', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => handleFieldChange('color', e.target.value)}
                        className="h-10 w-16 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => handleFieldChange('color', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium text-gray-700">Options</label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.requiresTransfer}
                        onChange={handleToggleChange('requiresTransfer')}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      Requires transfer to another centre
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.completesAppointment}
                        onChange={handleToggleChange('completesAppointment')}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      Marks appointment as completed
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={handleToggleChange('isActive')}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      Active
                    </label>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-lg shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'languages' && (
              <CrudPage
                title="Action Type Languages"
                service="appointment-service"
                resourceBase="/api/admin/action-type-languages"
                idKey="actionTypeLanguageId"
                columns={languageColumns}
                formFields={languageFields}
                fixedFilters={languageFixedFilters}
                toCreatePayload={toCreatePayload}
                toUpdatePayload={toUpdatePayload}
                enableCreate
                enableEdit
                enableDelete
                showAddButton
                tableId={`action-type-languages-${actionTypeId}`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


