import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

const systemColumns = [
  { id: 'code', accessorKey: 'code', header: 'Code', cell: (info) => info.getValue() },
  { id: 'name', accessorKey: 'name', header: 'Name', cell: (info) => info.getValue() },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Active',
    cell: (info) => (info.getValue() ? 'Active' : 'Inactive'),
    meta: { type: 'boolean' },
  },
    { id: 'createdAt', accessorKey: 'createdAt', header: 'Created At', cell: (i) => (i.getValue() ? new Date(i.getValue()).toLocaleString() : '') ,
    meta: {
      type: 'date',
      
      operators: ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN']

    },
  },
]

const systemFields = [
  { type: 'text', name: 'code', label: 'Code', required: true },
  { type: 'text', name: 'name', label: 'Name', required: true },
  { type: 'checkbox', name: 'isActive', label: 'Active' },
  { type: 'text', name: 'systemIcon', label: 'System Icon (URL)', placeholder: 'https://example.com/icon.svg' },
]

export default function SystemsListPage() {
  const navigate = useNavigate()
  // Get permissions for System section
  const { getSectionPermissions, isLoading } = usePermissionCheck()
  const { t } = useTranslation()
  
  const permissions = useMemo(() => 
    getSectionPermissions(CMS_SECTIONS.SYSTEMS, SYSTEMS.CMS),
    [getSectionPermissions]
  )

  // Extract individual permissions
  const canCreate = permissions.canCreate
  const canUpdate = permissions.canUpdate
  const canDelete = permissions.canDelete
  const canList = permissions.canList

  // Show loading state while fetching permissions
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading permissions...</p>
      </div>
    )
  }

  // Show access denied if user doesn't have List permission
  if (!canList) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 max-w-md">
          <h2 className="text-base font-semibold text-destructive mb-1">Access Denied</h2>
          <p className="text-sm text-destructive/80">
            You don't have permission to view Systems.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="px-4 pt-4">
        <CMSBreadcrumb />
      </div>
      <CrudPage
        title={t('cms.systems') || 'Systems'}
        service="access"
        resourceBase="/api/systems"
        idKey="systemId"
        columns={systemColumns}
        pageSize={25}
        formFields={systemFields}
        enableCreate={canCreate}
        enableEdit={canUpdate}
        enableDelete={canDelete}
        tableId="systems-list" // Unique ID for table preferences storage
        toCreatePayload={(f) => ({
          code: f.code?.trim(),
          name: f.name?.trim(),
          isActive: !!f.isActive,
          systemIcon: f.systemIcon?.trim() || null,
        })}
        toUpdatePayload={(f, row) => ({
          systemId: row.systemId,
          code: f.code?.trim(),
          name: f.name?.trim(),
          isActive: !!f.isActive,
          systemIcon: f.systemIcon?.trim() || null,
        })}
        onRowClick={(system) => navigate(`/cms/systems/${system.systemId}`)}
      />
    </div>
  )
}
