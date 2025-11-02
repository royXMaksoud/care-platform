import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import UserFormModal from './UserFormModal'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'

export default function UsersList() {
  // Get permissions for User Management
  const { getSectionPermissions, isLoading: permissionsLoading } = usePermissionCheck()
  
  const permissions = useMemo(() => 
    getSectionPermissions(CMS_SECTIONS.USER_MANAGEMENT, SYSTEMS.CMS),
    [getSectionPermissions]
  )

  // Extract individual permissions
  const canCreate = permissions.canCreate
  const canUpdate = permissions.canUpdate
  const canDelete = permissions.canDelete
  const canList = permissions.canList
  const columns = useMemo(() => [
    {
      id: 'fullName',
      accessorKey: 'fullName',
      header: 'Full name',
      cell: ({ row, getValue }) => {
        const id = row.original.id || row.original.userId
        return (
          <Link
            to={`/cms/users/${id}`}
            className="text-blue-600 hover:text-blue-800 underline font-medium"
            title="View user details"
          >
            {getValue()}
          </Link>
        )
      },
      meta: { type: 'string', filterKey: 'fullName', operators: ['LIKE','EQUAL','STARTS_WITH','ENDS_WITH','IN'] },
    },
    { 
      id: 'emailAddress', 
      accessorKey: 'emailAddress', 
      header: 'Email', 
      cell: (i) => i.getValue() 
    },
    {
      id: 'accountKind',
      accessorKey: 'accountKind',
      header: 'Account Kind',
      cell: ({ getValue }) => {
        const kind = getValue()
        if (!kind) return '-'
        
        const styles = {
          ADMIN: 'bg-red-100 text-red-800 border-red-300',
          OPERATOR: 'bg-blue-100 text-blue-800 border-blue-300',
          GENERAL: 'bg-gray-100 text-gray-800 border-gray-300',
        }
        
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[kind] || styles.GENERAL}`}>
            {kind}
          </span>
        )
      },
      meta: { type: 'enum', filterKey: 'accountKind', operators: ['EQUAL','IN'] },
    },
    {
      id: 'authMethod',
      accessorKey: 'authMethod',
      header: 'Login Method',
      cell: ({ getValue, row }) => {
        const method = getValue()
        const provider = row.original.lastAuthProvider
        
        if (method === 'LOCAL') {
          return (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold border border-blue-300">
              🔐 Local
            </span>
          )
        } else if (method === 'OAUTH') {
          return (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold border border-green-300">
              🌐 OAuth {provider && <span className="text-[10px]">({provider})</span>}
            </span>
          )
        } else if (method === 'FEDERATED_AD') {
          return (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold border border-purple-300">
              🏢 AD
            </span>
          )
        }
        return '-'
      },
      meta: { type: 'enum', filterKey: 'authMethod', operators: ['EQUAL','IN'] },
    },
    {
      id: 'enabled',
      accessorKey: 'enabled',
      header: 'Status',
      cell: ({ getValue }) => {
        const enabled = getValue()
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            enabled 
              ? 'bg-green-100 text-green-800 border-green-300' 
              : 'bg-red-100 text-red-800 border-red-300'
          }`}>
            {enabled ? '✓ Enabled' : '✗ Disabled'}
          </span>
        )
      },
      meta: { type: 'boolean' },
    },
    {
      id: 'passwordExpiresAt',
      accessorKey: 'passwordExpiresAt',
      header: 'Password Expires',
      cell: ({ getValue }) => {
        const value = getValue()
        if (!value) return <span className="text-gray-400">N/A</span>
        
        const expiry = new Date(value)
        const now = new Date()
        const isExpired = expiry < now
        const isExpiringSoon = expiry < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
        
        return (
          <span className={`text-xs ${
            isExpired ? 'text-red-600 font-semibold' :
            isExpiringSoon ? 'text-orange-600 font-medium' :
            'text-gray-600'
          }`}>
            {expiry.toLocaleDateString()}
            {isExpired && ' (Expired!)'}
            {!isExpired && isExpiringSoon && ' (Soon)'}
          </span>
        )
      },
      meta: { type: 'date', operators: ['EQUAL','BEFORE','AFTER','BETWEEN'] },
    },
    {
      id: 'validTo',
      accessorKey: 'validTo',
      header: 'Account Valid Until',
      cell: ({ getValue }) => {
        const value = getValue()
        if (!value) return <span className="text-gray-400">Never expires</span>
        
        const expiry = new Date(value)
        const now = new Date()
        const isExpired = expiry < now
        
        return (
          <span className={`text-xs ${isExpired ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
            {expiry.toLocaleDateString()}
            {isExpired && ' (Expired!)'}
          </span>
        )
      },
      meta: { type: 'date', operators: ['EQUAL','BEFORE','AFTER','BETWEEN'] },
    },
    { 
      id: 'language', 
      accessorKey: 'language', 
      header: 'Language', 
      cell: (i) => i.getValue() || 'en' 
    },
    {
      id: 'createdAt', 
      accessorKey: 'createdAt', 
      header: 'Created',
      cell: (i) => (i.getValue() ? new Date(i.getValue()).toLocaleString() : ''),
      meta: { type: 'date', operators: ['EQUAL','BEFORE','AFTER','BETWEEN'] },
    },
    {
      id: 'lastLogin', 
      accessorKey: 'lastLogin', 
      header: 'Last login',
      cell: (i) => (i.getValue() ? new Date(i.getValue()).toLocaleString() : 'Never'),
      meta: { type: 'date', operators: ['EQUAL','BEFORE','AFTER','BETWEEN'] },
    },
  ], [])

  // Show loading state while fetching permissions
  if (permissionsLoading) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-gray-500">Loading permissions...</p>
        </div>
      </div>
    )
  }

  // Show access denied if user doesn't have List permission
  if (!canList) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-sm text-red-700">
            You don't have permission to view Users.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <CrudPage
          title="Users"
          service="auth"
          resourceBase="/api/users"
          idKey="id"
          columns={columns}
          pageSize={10}
          enableCreate={canCreate}
          enableEdit={canUpdate}
          enableDelete={canDelete}
          tableId="users-list" // Unique ID for table preferences storage
          renderCreate={({ open, onClose, onSuccess }) => (
            <UserFormModal open={open} mode="create" onClose={onClose} onSuccess={onSuccess} />
          )}
          renderEdit={({ open, initial, onClose, onSuccess }) => (
            <UserFormModal open={open} mode="edit" initial={initial} onClose={onClose} onSuccess={onSuccess} />
          )}
          toFilter={(text) =>
            text?.trim()
              ? { criteria: [{ field: 'q', operator: 'CONTAINS', value: text.trim() }] }
              : { criteria: [] }
          }
          toCreatePayload={(f) => ({
            firstName: f.firstName?.trim() || null,
            fatherName: f.fatherName?.trim() || null,
            surName: f.surName?.trim() || null,
            fullName: f.fullName?.trim() || null,
            emailAddress: f.emailAddress?.trim() || null,
            password: f.password || null,
            language: f.language || 'en',
            type: f.type || 'USER',
            enabled: !!f.enabled,
            profileImageUrl: f.profileImageUrl || null,
          })}
          toUpdatePayload={(f) => ({
            firstName: f.firstName?.trim() || null,
            fatherName: f.fatherName?.trim() || null,
            surName: f.surName?.trim() || null,
            fullName: f.fullName?.trim() || null,
            emailAddress: f.emailAddress?.trim() || null,
            password: f.password || null,
            language: f.language || null,
            type: f.type || null,
            enabled: typeof f.enabled === 'boolean' ? f.enabled : null,
            deleted: typeof f.deleted === 'boolean' ? f.deleted : null,
            profileImageUrl: f.profileImageUrl || null,
          })}
        />
      </div>
    </div>
  )
}
