// src/modules/cms/sections/SectionList.jsx
// Purpose: List sections; supports opening a full-page editor, and refreshes on return.

import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import SystemSectionFormModal from './SystemSectionFormModal'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

const columns = [
  { id: 'code', accessorKey: 'code', header: 'Code', cell: (i) => i.getValue() },
  { id: 'name', accessorKey: 'name', header: 'Name', cell: (i) => i.getValue() },
  { id: 'systemName', accessorKey: 'systemName', header: 'System Name', cell: (i) => i.getValue() },
  { id: 'isActive', accessorKey: 'isActive', header: 'Active', cell: (i) => (i.getValue() ? 'Active' : 'Inactive'), meta: { type: 'boolean' } },
  { id: 'createdAt', accessorKey: 'createdAt', header: 'Created At', cell: (i) => (i.getValue() ? new Date(i.getValue()).toLocaleString() : '') ,
    meta: {
      type: 'date',
      
      operators: ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN']

    },
  },
]

export default function SectionList() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const [listKey, setListKey] = useState(0)

  // Get permissions for System Section
  const { getSectionPermissions, isLoading } = usePermissionCheck()
  
  const permissions = useMemo(() => 
    getSectionPermissions(CMS_SECTIONS.SECTIONS, SYSTEMS.CMS),
    [getSectionPermissions]
  )

  // Extract individual permissions
  const canCreate = permissions.canCreate
  const canUpdate = permissions.canUpdate
  const canDelete = permissions.canDelete
  const canList = permissions.canList

  // If we came back with { state: { refresh: true } }, remount CrudPage to refetch
  useEffect(() => {
    if (location.state?.refresh) {
      setListKey((k) => k + 1) // remount CrudPage
      navigate(location.pathname, { replace: true, state: {} }) // clear state to avoid loops
    }
  }, [location.state, location.pathname, navigate])

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
            You don't have permission to view System Sections.
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
        key={listKey}
        title={t('cms.sections') || 'System Sections'}
        service="access"
        resourceBase="/api/system-sections"
        idKey="systemSectionId"
        columns={columns}
        pageSize={25}
        enableCreate={canCreate}
        enableEdit={canUpdate}
        enableDelete={canDelete}
        tableId="sections-list" // Unique ID for table preferences storage

        // Default modals (you can keep them too)
        renderCreate={({ open, onClose, onSuccess }) => (
          <SystemSectionFormModal open={open} mode="create" onClose={onClose} onSuccess={onSuccess} />
        )}
        renderEdit={({ open, initial, onClose, onSuccess }) => (
          <SystemSectionFormModal open={open} mode="edit" initial={initial} onClose={onClose} onSuccess={onSuccess} />
        )}
      />
    </div>
  )
}
