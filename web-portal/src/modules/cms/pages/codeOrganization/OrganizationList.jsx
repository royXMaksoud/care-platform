import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'

const organizationColumns = [
  { 
    id: 'iso2', 
    accessorKey: 'iso2', 
    header: 'ISO2',
    cell: (info) => info.getValue() || '-'
  },
  { 
    id: 'name', 
    accessorKey: 'name', 
    header: 'Organization Name',
    cell: (info) => (
      <button 
        onClick={() => {
          // Navigation handled by onRowClick
        }}
        className="text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
      >
        {info.getValue()}
      </button>
    )
  },
  { 
    id: 'iso3', 
    accessorKey: 'iso3', 
    header: 'ISO3', 
    cell: (info) => info.getValue() || '-' 
  },
  { 
    id: 'shortCode', 
    accessorKey: 'shortCode', 
    header: 'Short Code', 
    cell: (info) => info.getValue() || '-' 
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Status',
    cell: (info) => (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
        info.getValue() 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {info.getValue() ? 'Active' : 'Inactive'}
      </span>
    ),
    meta: { type: 'boolean' },
  },
  { 
    id: 'createdAt', 
    accessorKey: 'createdAt', 
    header: 'Created At', 
    cell: (info) => info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '-',
    meta: {
      type: 'date',
      operators: ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN']
    },
  },
]

const organizationFields = [
  { type: 'text', name: 'iso2', label: 'ISO2 Code', maxLength: 10 },
  { type: 'text', name: 'name', label: 'Organization Name', required: true },
  { type: 'text', name: 'iso3', label: 'ISO3 Code', maxLength: 10 },
  { type: 'text', name: 'shortCode', label: 'Short Code' },
  { type: 'text', name: 'numericCode', label: 'Numeric Code' },
  { type: 'text', name: 'phoneCode', label: 'Phone Code' },
  { type: 'checkbox', name: 'isActive', label: 'Active', defaultValue: true },
]

export default function OrganizationListPage() {
  const navigate = useNavigate()
  
  // Get permissions for Code Country section (using same permissions)
  const { getSectionPermissions, isLoading } = usePermissionCheck()
  
  const permissions = useMemo(() => {
    const perms = getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS)
    console.log('🔍 Organizations Page - Permissions:', perms)
    return perms
  }, [getSectionPermissions])

  const canCreate = permissions.canCreate
  const canUpdate = permissions.canUpdate
  const canDelete = permissions.canDelete
  const canList = permissions.canList

  // Show loading state while fetching permissions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading permissions...</div>
      </div>
    )
  }

  // Show message if no list permission
  if (!canList) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">You don't have permission to view organizations</div>
      </div>
    )
  }

  const toCreatePayload = (formData) => ({
    iso2: formData.iso2 || null,
    iso3: formData.iso3 || null,
    name: formData.name,
    shortCode: formData.shortCode || null,
    numericCode: formData.numericCode || null,
    phoneCode: formData.phoneCode || null,
    isActive: true, // ✅ Always TRUE for new records
  })

  const toUpdatePayload = (formData) => ({
    organizationId: formData.organizationId,
    iso2: formData.iso2 || null,
    iso3: formData.iso3 || null,
    name: formData.name,
    shortCode: formData.shortCode || null,
    numericCode: formData.numericCode || null,
    phoneCode: formData.phoneCode || null,
    isActive: true, // ✅ Always TRUE - cannot be deactivated
    rowVersion: formData.rowVersion,
  })

  const handleRowClick = (row) => {
    navigate(`/cms/organizations/${row.organizationId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <CrudPage
          title="Organizations"
          service="access"
          resourceBase="/api/code-organizations"
          idKey="organizationId"
          columns={organizationColumns}
          formFields={organizationFields}
          toCreatePayload={toCreatePayload}
          toUpdatePayload={toUpdatePayload}
          pageSize={10}
          enableCreate={canCreate}
          enableEdit={canUpdate}
          enableDelete={canDelete}
          onRowClick={handleRowClick}
          tableId="organizations-list"
        />
      </div>
    </div>
  )
}

