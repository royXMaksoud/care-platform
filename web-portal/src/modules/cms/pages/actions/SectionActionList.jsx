// src/modules/cms/sections/SectionActionList.jsx
// Purpose: List System Section Actions and use a custom modal for create/edit.
// Notes:
// - Uses generic <CrudPage/> for the table and wires a custom modal via renderCreate/renderEdit.
// - Backend base: /access/api/system-section-actions

import React, { useMemo } from 'react'
import CrudPage from '@/features/crud/CrudPage'
import SystemSectionActionFormModal from './SystemSectionActionFormModal'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

const columns = [
  { id: 'code', accessorKey: 'code', header: 'Code', cell: (i) => i.getValue() },
  { id: 'name', accessorKey: 'name', header: 'Name', cell: (i) => i.getValue() },
  // Show friendly section name if backend returns it, fallback to ID
    { id: 'systemSectionName', accessorKey: 'systemSectionName', header: 'System Section', cell: (i) => i.getValue() },
     { id: 'systemName', accessorKey: 'systemName', header: 'System Name', cell: (i) => i.getValue() },

  // { id: 'systemSectionId', accessorKey: 'systemSectionId', header: 'Section Id', cell: (i) => String(i.getValue() || '') },
  {
    id: 'isActive', accessorKey: 'isActive', header: 'Active',
    cell: (i) => (i.getValue() ? 'Active' : 'Inactive'), meta: { type: 'boolean' },
  },
   { id: 'createdAt', accessorKey: 'createdAt', header: 'Created At', cell: (i) => (i.getValue() ? new Date(i.getValue()).toLocaleString() : '') ,
    meta: {
      type: 'date',
      
      operators: ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN']

    },
  },
]

export default function SectionActionList() {
  const { t } = useTranslation()
  // Get permissions for System Section Action
  const { getSectionPermissions, isLoading } = usePermissionCheck()
  
  const permissions = useMemo(() => 
    getSectionPermissions(CMS_SECTIONS.ACTIONS, SYSTEMS.CMS),
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
            You don't have permission to view System Section Actions.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden min-h-0">
      <div className="px-4 pt-4">
        <CMSBreadcrumb />
      </div>
      <CrudPage
        title={t('cms.actions') || 'System Section Actions'}
        service="access"
        resourceBase="/api/system-section-actions"
        idKey="systemSectionActionId"
        columns={columns}
        pageSize={25}
        enableCreate={canCreate}
        enableEdit={canUpdate}
        enableDelete={canDelete}
        tableId="section-actions-list" // Unique ID for table preferences storage

        // Use our custom modal for Create
        renderCreate={({ open, onClose, onSuccess }) => (
          <SystemSectionActionFormModal
            open={open}
            mode="create"
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}

        // Use our custom modal for Edit
        renderEdit={({ open, initial, onClose, onSuccess }) => (
          <SystemSectionActionFormModal
            open={open}
            mode="edit"
            initial={initial}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}

        // Keep payload mappers only if CrudPage uses them elsewhere
        toCreatePayload={(f) => ({
          systemSectionId: f.systemSectionId || null,
          code: f.code?.trim(),
          name: f.name?.trim(),
          isActive: !!f.isActive,
        })}
        toUpdatePayload={(f) => ({
          systemSectionId: f.systemSectionId || null,
          code: f.code?.trim(),
          name: f.name?.trim(),
          isActive: !!f.isActive,
          ...(f.rowVersion != null ? { rowVersion: f.rowVersion } : {}),
        })}
      />
    </div>
  )
}
