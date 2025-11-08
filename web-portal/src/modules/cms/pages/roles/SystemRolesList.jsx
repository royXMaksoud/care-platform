import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/axios'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'
import SystemRoleFormModal from './SystemRoleFormModal'

// Create columns function that accepts systems dropdown data
const createSystemRoleColumns = (systems) => [
  { id: 'code', accessorKey: 'code', header: 'Code', cell: (info) => info.getValue() },
  { id: 'name', accessorKey: 'name', header: 'Name', cell: (info) => info.getValue() },
  {
    id: 'systemId',
    accessorKey: 'systemId',
    header: 'System',
    cell: (info) => {
      const systemId = info.getValue()
      if (!systemId || !systems.length) return 'N/A'
      const system = systems.find(s => s.systemId === systemId || s.id === systemId)
      return system?.name || 'N/A'
    },
  },
  {
    id: 'roleType',
    accessorKey: 'roleType',
    header: 'Type',
    cell: (info) => {
      const type = info.getValue()
      return type === 'BUILTIN' ? 'Built-in' : 'Custom'
    },
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Active',
    cell: (info) => (info.getValue() ? 'Active' : 'Inactive'),
    meta: { type: 'boolean' },
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: (i) => (i.getValue() ? new Date(i.getValue()).toLocaleString() : ''),
    meta: {
      type: 'date',
      operators: ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN']
    },
  },
]

const systemRoleFields = [
  { type: 'text', name: 'code', label: 'Code', required: true },
  { type: 'text', name: 'name', label: 'Name', required: true },
  {
    type: 'select',
    name: 'systemId',
    label: 'System',
    required: true,
    options: [], // Will be populated dynamically
    optionValue: 'systemId',
    optionLabel: 'name',
  },
  {
    type: 'select',
    name: 'roleType',
    label: 'Role Type',
    required: true,
    options: [
      { value: 'CUSTOM', label: 'Custom' },
      { value: 'BUILTIN', label: 'Built-in' }
    ],
  },
  { type: 'textarea', name: 'description', label: 'Description' },
  { type: 'checkbox', name: 'isActive', label: 'Active' },
]

export default function SystemRolesListPage() {
  const navigate = useNavigate()
  const { getSectionPermissions, isLoading } = usePermissionCheck()
  const { t } = useTranslation()
  const [systems, setSystems] = useState([])

  const permissions = useMemo(
    () => getSectionPermissions(CMS_SECTIONS.SYSTEMS || CMS_SECTIONS.SYSTEM_ROLES, SYSTEMS.CMS),
    [getSectionPermissions]
  )

  const canCreate = permissions.canCreate
  const canUpdate = permissions.canUpdate
  const canDelete = permissions.canDelete
  const canList = permissions.canList

  // Fetch systems dropdown data
  useEffect(() => {
    let isMounted = true
    const fetchSystems = async () => {
      try {
        const { data } = await api.get('/access/api/dropdowns/systems')
        if (!isMounted) return
        if (Array.isArray(data)) {
          setSystems(data.map(x => ({ systemId: x.id || x.systemId, name: x.name })))
        } else {
          const { data: fullData } = await api.get('/access/api/systems', { params: { page: 0, size: 500 } })
          const list = fullData?.content ?? fullData ?? []
          setSystems(list.map(x => ({ systemId: x.systemId || x.id, name: x.name })))
        }
      } catch (err) {
        console.error('Failed to load systems:', err)
      }
    }
    fetchSystems()
    return () => { isMounted = false }
  }, [])

  // Create columns with systems data
  const systemRoleColumns = useMemo(() => createSystemRoleColumns(systems), [systems])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading permissions...</p>
      </div>
    )
  }

  if (!canList) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 max-w-md">
          <h2 className="text-base font-semibold text-destructive mb-1">Access Denied</h2>
          <p className="text-sm text-destructive/80">
            You don't have permission to view System Roles.
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
        title={t('cms.systemRoles') || 'System Roles'}
        service="access"
        resourceBase="/api/system-roles"
        idKey="systemRoleId"
        columns={systemRoleColumns}
        pageSize={25}
        formFields={systemRoleFields}
        enableCreate={canCreate}
        enableEdit={canUpdate}
        enableDelete={canDelete}
        tableId="system-roles-list"
        toCreatePayload={(f) => ({
          code: f.code?.trim(),
          name: f.name?.trim(),
          systemId: f.systemId,
          roleType: f.roleType || 'CUSTOM',
          description: f.description?.trim() || null,
          isActive: !!f.isActive,
        })}
        toUpdatePayload={(f, row) => ({
          systemRoleId: row.systemRoleId,
          code: f.code?.trim(),
          name: f.name?.trim(),
          description: f.description?.trim() || null,
          roleType: f.roleType,
          isActive: !!f.isActive,
        })}
        onRowClick={(role) => navigate(`/cms/system-roles/${role.systemRoleId}`)}
        renderCreate={({ open, onClose, onSuccess }) => (
          <SystemRoleFormModal 
            open={open} 
            mode="create" 
            onClose={onClose} 
            onSuccess={onSuccess} 
          />
        )}
        renderEdit={({ open, initial, onClose, onSuccess }) => (
          <SystemRoleFormModal 
            open={open} 
            mode="edit" 
            initial={initial} 
            onClose={onClose} 
            onSuccess={onSuccess} 
          />
        )}
      />
    </div>
  )
}

