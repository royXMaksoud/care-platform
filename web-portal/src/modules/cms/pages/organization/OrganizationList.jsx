import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import { useOrganizationTypes } from '@/hooks/useOrganizationTypes'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

const organizationColumns = [
  { 
    id: 'code', 
    accessorKey: 'code', 
    header: 'Code',
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
    id: 'websiteUrl', 
    accessorKey: 'websiteUrl', 
    header: 'Website', 
    cell: (info) => info.getValue() ? (
      <a href={info.getValue()} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
        {info.getValue()}
      </a>
    ) : '-'
  },
  { 
    id: 'email', 
    accessorKey: 'email', 
    header: 'Email', 
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

// Fields will be defined in component to use organizationTypes hook
const getOrganizationFields = (organizationTypes) => [
  { type: 'text', name: 'code', label: 'Organization Code', required: true, maxLength: 50 },
  { type: 'text', name: 'name', label: 'Organization Name', required: true },
  { 
    type: 'select', 
    name: 'organizationTypeId', 
    label: 'Organization Type',
    options: organizationTypes,
    placeholder: 'Select organization type...'
  },
  { type: 'text', name: 'websiteUrl', label: 'Website', placeholder: 'https://example.org' },
  { type: 'text', name: 'email', label: 'Email', placeholder: 'contact@example.org' },
  { type: 'text', name: 'phone', label: 'Phone', placeholder: '+1234567890' },
  { type: 'textarea', name: 'description', label: 'Description', rows: 3 },
  { type: 'checkbox', name: 'isActive', label: 'Active', defaultValue: true },
]

export default function OrganizationListPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  // Get permissions
  const { getSectionPermissions, isLoading } = usePermissionCheck()
  
  // Get organization types for dropdown
  const { organizationTypes, loading: typesLoading } = useOrganizationTypes('en')
  
  const permissions = useMemo(() => {
    const perms = getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS)
    console.log('🔍 Organizations Page - Permissions:', perms)
    return perms
  }, [getSectionPermissions])

  const canCreate = permissions.canCreate
  const canUpdate = permissions.canUpdate
  const canDelete = permissions.canDelete
  const canList = permissions.canList
  
  // Generate form fields with organization types
  const organizationFields = useMemo(() => 
    getOrganizationFields(organizationTypes),
    [organizationTypes]
  )

  // Show loading state while fetching permissions or types
  if (isLoading || typesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
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
    code: formData.code,
    name: formData.name,
    organizationTypeId: formData.organizationTypeId || null,
    websiteUrl: formData.websiteUrl || null,
    email: formData.email || null,
    phone: formData.phone || null,
    description: formData.description || null,
    isActive: formData.isActive !== false, // Default to true
  })

  const toUpdatePayload = (formData) => ({
    organizationId: formData.organizationId,
    code: formData.code,
    name: formData.name,
    organizationTypeId: formData.organizationTypeId || null,
    websiteUrl: formData.websiteUrl || null,
    email: formData.email || null,
    phone: formData.phone || null,
    description: formData.description || null,
    isActive: formData.isActive !== false,
    rowVersion: formData.rowVersion,
  })

  const handleRowClick = (row) => {
    navigate(`/cms/organizations/${row.organizationId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <CMSBreadcrumb />
        </div>
        <CrudPage
          title={t('cms.organizations') || 'Organizations'}
          service="access"
          resourceBase="/api/organizations"
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

