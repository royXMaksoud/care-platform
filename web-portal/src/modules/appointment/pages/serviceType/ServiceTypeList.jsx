import React, { useMemo, useState, useEffect } from 'react'
import CrudPage from '@/features/crud/CrudPage'
import { api } from '@/lib/axios'
import { FileText } from 'lucide-react'

export default function ServiceTypeList() {
  const [serviceTypesMap, setServiceTypesMap] = useState({})

  // Load service types for parent lookup
  useEffect(() => {
    const loadServiceTypes = async () => {
      try {
        const response = await api.get('/appointment-service/api/admin/service-types/lookup')
        const map = {}
        response.data.forEach((st) => {
          map[st.serviceTypeId] = st.name
        })
        setServiceTypesMap(map)
      } catch (err) {
        console.error('Failed to load service types:', err)
      }
    }
    loadServiceTypes()
  }, [])

  const serviceTypeColumns = [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Service Name',
      cell: ({ getValue }) => (
        <span className="font-medium text-gray-900">{getValue() || '-'}</span>
      ),
      meta: { type: 'string', filterKey: 'name', operators: ['LIKE', 'EQUAL', 'STARTS_WITH'] },
    },
    {
      id: 'code',
      accessorKey: 'code',
      header: 'Code',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-gray-600">{getValue() || '-'}</span>
      ),
      meta: { type: 'string', filterKey: 'code', operators: ['EQUAL', 'STARTS_WITH'] },
    },
    {
      id: 'parentServiceTypeId',
      accessorKey: 'parentServiceTypeId',
      header: 'Parent Service',
      cell: ({ getValue }) => {
        const parentId = getValue()
        if (!parentId) return <span className="text-xs text-gray-500">Root</span>
        return serviceTypesMap[parentId] || parentId
      },
      meta: { type: 'string', filterKey: 'parentServiceTypeId', operators: ['EQUAL', 'IS_NULL'] },
    },
    {
      id: 'isLeaf',
      accessorKey: 'isLeaf',
      header: 'Type',
      cell: ({ getValue }) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          getValue() 
            ? 'bg-purple-100 text-purple-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {getValue() ? 'Detailed' : 'General'}
        </span>
      ),
      meta: { type: 'boolean', filterKey: 'isLeaf', operators: ['EQUAL'] },
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

  const serviceTypeFields = [
    { type: 'text', name: 'name', label: 'Service Name', required: true, maxLength: 200 },
    { type: 'text', name: 'code', label: 'Code', required: true, maxLength: 100 },
    { type: 'textarea', name: 'description', label: 'Description', maxLength: 500, rows: 3 },
    { 
      type: 'select', 
      name: 'parentServiceTypeId', 
      label: 'Parent Service (optional)',
      options: Object.entries(serviceTypesMap).map(([id, name]) => ({ value: id, label: name })),
      placeholder: 'Leave empty for root service'
    },
    { type: 'checkbox', name: 'isLeaf', label: 'Is Detailed Service (Leaf)', defaultValue: false },
    { type: 'number', name: 'displayOrder', label: 'Display Order', min: 1, defaultValue: 1 },
    { type: 'checkbox', name: 'isActive', label: 'Active', defaultValue: true },
  ]

  const toCreatePayload = (formData) => ({
    name: formData.name,
    code: formData.code,
    description: formData.description || null,
    parentServiceTypeId: formData.parentServiceTypeId || null,
    isLeaf: formData.isLeaf === true,
    displayOrder: parseInt(formData.displayOrder) || 1,
    isActive: formData.isActive !== false,
  })

  const toUpdatePayload = (formData) => ({
    name: formData.name,
    code: formData.code,
    description: formData.description || null,
    parentServiceTypeId: formData.parentServiceTypeId || null,
    isLeaf: formData.isLeaf === true,
    displayOrder: parseInt(formData.displayOrder) || 1,
    isActive: formData.isActive !== false,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <FileText className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Type Management</h1>
            <p className="text-sm text-gray-600">Manage service types and categories</p>
          </div>
        </div>

        <CrudPage
          title="Service Types"
          service="appointment-service"
          resourceBase="/api/admin/service-types"
          idKey="serviceTypeId"
          columns={serviceTypeColumns}
          formFields={serviceTypeFields}
          toCreatePayload={toCreatePayload}
          toUpdatePayload={toUpdatePayload}
          pageSize={20}
          enableCreate={true}
          enableEdit={true}
          enableDelete={true}
          tableId="service-types-list"
        />
      </div>
    </div>
  )
}

