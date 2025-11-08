// List code tables. Click the name to open details at /cms/codeTable/:codeTableId

import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import CodeTableFormModal from './CodeTableFormModal'// <- this file must exist
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import { api } from '@/lib/axios'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

export default function CodeTableList() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const [listKey, setListKey] = useState(0)
  const [codeTablesMap, setCodeTablesMap] = useState({})

  // Get permissions for Code Table section
  const { getSectionPermissions, isLoading } = usePermissionCheck()
  
  const permissions = useMemo(() => 
    getSectionPermissions(CMS_SECTIONS.SYSTEMS, SYSTEMS.CMS),
    [getSectionPermissions]
  )

  // Extract individual permissions
  const canCreate = permissions.canCreate
  const canUpdate = permissions.canUpdate
  const canDelete = permissions.canDelete
  const canList = permissions.canList

  // Load CodeTables for parent lookup
  useEffect(() => {
    const loadCodeTables = async () => {
      try {
        const response = await api.get('/access/api/code-tables/lookup')
        const map = {}
        response.data.forEach((ct) => {
          map[ct.codeTableId] = ct.name
        })
        setCodeTablesMap(map)
      } catch (err) {
        console.error('Failed to load code tables for lookup:', err)
      }
    }
    
    if (canList) {
      loadCodeTables()
    }
  }, [canList])

  const columns = useMemo(() => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row, getValue }) => {
        const raw = row.original
        const tableId = raw.codeTableId ?? raw.id
        return (
          <button
            className="text-blue-600 hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`${tableId}`) // relative to /cms/codeTable
            }}
            title="Open details"
          >
            {getValue()}
          </button>
        )
      },
      meta: { type: 'string', filterKey: 'name', operators: ['LIKE', 'EQUAL', 'STARTS_WITH', 'ENDS_WITH', 'IN'] },
    },
    {
      id: 'description',
      accessorKey: 'description',
      header: 'Description',
      cell: (i) => i.getValue() ?? '',
      meta: { type: 'string', filterKey: 'description', operators: ['LIKE', 'EQUAL', 'STARTS_WITH', 'ENDS_WITH', 'IN'] },
    },
    {
      id: 'parentId',
      accessorKey: 'parentId',
      header: 'Parent Table',
      cell: ({ getValue }) => {
        const parentId = getValue()
        if (!parentId) return '-'
        return codeTablesMap[parentId] || parentId
      },
      meta: { type: 'string', filterKey: 'parentId', operators: ['EQUAL', 'IN'] },
    },
    {
      id: 'isReferenceTable',
      accessorKey: 'isReferenceTable',
      header: 'Reference Table',
      cell: (i) => (i.getValue() ? 'Yes' : 'No'),
      meta: { type: 'boolean', filterKey: 'isReferenceTable', operators: ['EQUAL'] },
    },
    {
      id: 'hasScope',
      accessorKey: 'hasScope',
      header: 'Has Scope',
      cell: (i) => (i.getValue() ? 'Yes' : 'No'),
      meta: { type: 'boolean', filterKey: 'hasScope', operators: ['EQUAL'] },
    },
    {
      id: 'entityName',
      accessorKey: 'entityName',
      header: 'Entity Name',
      cell: (i) => i.getValue() ?? '-',
      meta: { type: 'string', filterKey: 'entityName', operators: ['LIKE', 'EQUAL', 'STARTS_WITH', 'ENDS_WITH', 'IN'] },
    },
    {
      id: 'isActive',
      accessorKey: 'isActive',
      header: 'Active',
      cell: (i) => (i.getValue() ? 'Active' : 'Inactive'),
      meta: { type: 'boolean', filterKey: 'isActive', operators: ['EQUAL'] },
    },
    {
      id: 'createdDate',
      accessorKey: 'createdDate',
      header: 'Created At',
      cell: (i) => (i.getValue() ? new Date(i.getValue()).toLocaleString() : ''),
      meta: { type: 'datetime', filterKey: 'createdDate', operators: ['EQUAL', 'BEFORE', 'AFTER', 'BETWEEN'] },
    },
  ], [navigate, codeTablesMap])

  const formFields = [
    { type: 'text', name: 'name', label: 'Name', required: true },
    { type: 'textarea', name: 'description', label: 'Description' },
    { type: 'checkbox', name: 'isActive', label: 'Active' },
  ]

  useEffect(() => {
    if (location.state?.refresh) {
      setListKey((k) => k + 1)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  // Show loading state while fetching permissions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-3"></div>
          <p className="text-gray-600">Loading permissions...</p>
        </div>
      </div>
    )
  }

  // Show access denied if user doesn't have List permission
  if (!canList) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to view Code Tables.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="px-4 pt-4">
        <CMSBreadcrumb />
      </div>
      <CrudPage
        key={listKey}
        title={t('cms.codeTable') || 'Code Tables'}
        service="access"
        resourceBase="/api/code-tables"
        idKey="codeTableId"
        columns={columns}
        pageSize={10}
        formFields={formFields}
        enableCreate={canCreate}
        enableEdit={canUpdate}
        enableDelete={canDelete}
        showAddButton={canCreate}
        tableId="code-tables-list" // Unique ID for table preferences storage
        toCreatePayload={(f) => ({
          name: f.name?.trim(),
          description: f.description?.trim() || null,
          parentId: f.parentId || null,
          isActive: !!f.isActive,
        })}
        toUpdatePayload={(f, row) => ({
          codeTableId: row.codeTableId ?? row.id,
          name: f.name?.trim(),
          description: f.description?.trim() || null,
          parentId: f.parentId || null,
          isActive: !!f.isActive,
          ...(row.rowVersion != null ? { rowVersion: row.rowVersion } : {}),
        })}
        renderCreate={({ open, onClose, onSuccess }) => (
          <CodeTableFormModal open={open} mode="create" onClose={onClose} onSuccess={onSuccess} />
        )}
        renderEdit={({ open, initial, onClose, onSuccess }) => (
          <CodeTableFormModal open={open} mode="edit" initial={initial} onClose={onClose} onSuccess={onSuccess} />
        )}
      />
    </div>
  )
}
