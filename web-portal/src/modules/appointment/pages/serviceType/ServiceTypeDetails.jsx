import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import CrudPage from '@/features/crud/CrudPage'
import ConfirmDialog from '@/components/ConfirmDialog'
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
    id: 'description',
    accessorKey: 'description',
    header: 'Description',
    cell: ({ getValue }) => <span className="text-gray-600 text-sm">{getValue() || '-'}</span>,
    meta: { type: 'string', filterKey: 'description', operators: ['LIKE'] },
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
    maxLength: 200,
  },
  {
    type: 'textarea',
    name: 'description',
    label: 'Description',
    rows: 3,
    maxLength: 1000,
  },
  {
    type: 'checkbox',
    name: 'isActive',
    label: 'Active',
    defaultValue: true,
  },
]

export default function ServiceTypeDetails() {
  const { serviceTypeId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [serviceType, setServiceType] = useState(null)
  const [formData, setFormData] = useState(null)
  const [activeTab, setActiveTab] = useState('details')
  const [serviceTypesLookup, setServiceTypesLookup] = useState([])

  useEffect(() => {
    const fetchLookup = async () => {
      try {
        const { data } = await api.get('/appointment-service/api/admin/service-types/lookup')
        setServiceTypesLookup(Array.isArray(data) ? data : [])
      } catch (err) {
        console.warn('Failed to load service type lookup', err)
      }
    }
    fetchLookup()
  }, [])

  useEffect(() => {
    const fetchDetails = async () => {
      if (!serviceTypeId) return
      setLoading(true)
      try {
        const { data } = await api.get(`/appointment-service/api/admin/service-types/${serviceTypeId}`)
        setServiceType(data)
        setFormData({
          name: data?.name ?? '',
          code: data?.code ?? '',
          description: data?.description ?? '',
          parentId: data?.parentId ?? null,
          isLeaf: Boolean(data?.isLeaf),
          displayOrder: data?.displayOrder ?? 1,
          isActive: data?.isActive !== false,
        })
      } catch (err) {
        toast.error('Failed to load service type details')
        navigate('/appointment/service-types')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [serviceTypeId, navigate])

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCheckbox = (field) => (event) => {
    const checked = event.target?.checked ?? false
    handleFieldChange(field, checked)
  }

  const handleDeleteServiceType = async () => {
    if (!serviceTypeId) return

    try {
      setDeleting(true)
      await api.delete(`/appointment-service/api/admin/service-types/${serviceTypeId}`)
      toast.success('Service type deleted')
      navigate('/appointment/service-types')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete service type')
    } finally {
      setDeleting(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData) return
    setSaving(true)
    try {
      const payload = {
        name: formData.name?.trim(),
        code: formData.code?.trim(),
        description: formData.description?.trim() || null,
        parentId: formData.parentId || null,
        isLeaf: formData.isLeaf === true,
        displayOrder: Number(formData.displayOrder) || 1,
        isActive: formData.isActive !== false,
      }

        const { data } = await api.put(
          `/appointment-service/api/admin/service-types/${serviceTypeId}`,
          payload
        )
      setServiceType(data)
      toast.success('Service type updated successfully')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update service type')
    } finally {
      setSaving(false)
    }
  }

  const languageFixedFilters = useMemo(
    () =>
      serviceTypeId
        ? [
            {
              key: 'serviceTypeId',
              operator: 'EQUAL',
              value: serviceTypeId,
              dataType: 'UUID',
            },
          ]
        : [],
    [serviceTypeId]
  )

  const toCreatePayload = (form) => ({
    serviceTypeId,
    languageCode: form.languageCode?.trim(),
    name: form.name?.trim(),
    description: form.description?.trim() || null,
    isActive: form.isActive !== false,
  })

  const toUpdatePayload = (form, row) => ({
    serviceTypeLanguageId: row.serviceTypeLanguageId,
    serviceTypeId,
    languageCode: form.languageCode?.trim(),
    name: form.name?.trim(),
    description: form.description?.trim() || null,
    isActive: form.isActive !== false,
    isDeleted: false,
  })

  const parentOptions = useMemo(() => {
    if (!Array.isArray(serviceTypesLookup)) return []
    return serviceTypesLookup
      .filter((item) => item.serviceTypeId !== serviceTypeId) // avoid self selection
      .map((item) => ({
        value: item.serviceTypeId,
        label: item.name,
      }))
  }, [serviceTypesLookup, serviceTypeId])

  const breadcrumbLabel = useMemo(() => {
    if (!serviceType) return 'Service Type Details'
    return serviceType.name || serviceType.code || 'Service Type Details'
  }, [serviceType])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-sm text-gray-600 animate-pulse">Loading service type details…</div>
      </div>
    )
  }

  if (!serviceType) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <AppointmentBreadcrumb currentPageLabel={breadcrumbLabel} />
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-purple-100">
          <div className="px-6 py-6 border-b border-purple-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{serviceType?.name || 'Service Type'}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage service type configuration and localized labels for <span className="font-semibold">{serviceType?.code}</span>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete Service
                </button>
                <div className="flex divide-x divide-gray-200 text-sm bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-2">
                    <div className="text-gray-500 uppercase text-xs tracking-wide">Code</div>
                    <div className="font-semibold text-gray-900">{serviceType?.code}</div>
                  </div>
                  <div className="px-4 py-2">
                    <div className="text-gray-500 uppercase text-xs tracking-wide">Status</div>
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        serviceType?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {serviceType?.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div className="px-4 py-2">
                    <div className="text-gray-500 uppercase text-xs tracking-wide">Type</div>
                    <div className="font-semibold text-gray-900">
                      {serviceType?.isLeaf ? 'Detailed Service' : 'General Service'}
                    </div>
                  </div>
                  <div className="px-4 py-2">
                    <div className="text-gray-500 uppercase text-xs tracking-wide">Display Order</div>
                    <div className="font-semibold text-gray-900">{serviceType?.displayOrder ?? '-'}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'details'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('details')}
              >
                Service Type Details
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'languages'
                    ? 'bg-purple-600 text-white shadow-sm'
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleFieldChange('code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parent Service</label>
                    <select
                      value={formData.parentId || ''}
                      onChange={(e) => handleFieldChange('parentId', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Root (no parent)</option>
                      {parentOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.displayOrder}
                      onChange={(e) => handleFieldChange('displayOrder', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium text-gray-700">Options</label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.isLeaf}
                        onChange={handleCheckbox('isLeaf')}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      Detailed (Leaf) service
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={handleCheckbox('isActive')}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      Active
                    </label>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'languages' && (
              <CrudPage
                title="Service Type Languages"
                service="appointment-service"
                resourceBase="/api/admin/service-type-languages"
                idKey="serviceTypeLanguageId"
                columns={languageColumns}
                formFields={languageFields}
                fixedFilters={languageFixedFilters}
                toCreatePayload={toCreatePayload}
                toUpdatePayload={toUpdatePayload}
                enableCreate
                enableEdit
                enableDelete
                showAddButton
                tableId={`service-type-languages-${serviceTypeId}`}
              />
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Service Type"
        message="Are you sure you want to delete this service type? This action cannot be undone."
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          setDeleteDialogOpen(false)
          handleDeleteServiceType()
        }}
        busy={deleting}
      />
    </div>
  )
}


