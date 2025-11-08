import React, { useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import UserFormModal from './UserFormModal'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export default function UsersList() {
  const { t } = useTranslation()
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

  const [refreshKey, setRefreshKey] = useState(0)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importStats, setImportStats] = useState(null)

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
      id: 'organization',
      accessorKey: 'organization',
      header: 'Organization',
      cell: ({ getValue }) => {
        const org = getValue()
        return org?.name || org?.id || '-'
      },
      meta: { type: 'string', filterKey: 'organization.name', operators: ['LIKE','EQUAL'] },
    },
    {
      id: 'tenant',
      accessorKey: 'tenant',
      header: 'Tenant',
      cell: ({ getValue }) => {
        const tenant = getValue()
        return tenant?.name || tenant?.id || '-'
      },
      meta: { type: 'string', filterKey: 'tenant.name', operators: ['LIKE','EQUAL'] },
    },
    {
      id: 'organizationBranch',
      accessorKey: 'organizationBranch',
      header: 'Organization Branch',
      cell: ({ getValue }) => {
        const branch = getValue()
        return branch?.name || branch?.id || '-'
      },
      meta: { type: 'string', filterKey: 'organizationBranch.name', operators: ['LIKE','EQUAL'] },
    },
    {
      id: 'roles',
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ getValue }) => {
        const roles = getValue()
        if (!roles || (Array.isArray(roles) && roles.length === 0)) {
          return <span className="text-gray-400">No roles</span>
        }

        return (
          <div className="flex flex-wrap gap-1">
            {Array.isArray(roles) ? (
              roles.map((role, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium border border-purple-300"
                >
                  {role.name || role.roleName || role.id}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium border border-purple-300">
                {roles.name || roles.roleName || '-'}
              </span>
            )}
          </div>
        )
      },
      meta: { type: 'string', filterKey: 'roles.name', operators: ['LIKE','EQUAL'] },
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

  const downloadTemplate = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/api/users/bulk/template', {
        responseType: 'blob',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      })

      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'users-template.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Template downloaded successfully')
    } catch (error) {
      console.error('Failed to download template:', error)
      toast.error('Failed to download template. Please try again.')
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (!importFile) {
      toast.warning('Please choose an Excel file first')
      return
    }

    setImporting(true)
    setImportStats(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const { data } = await api.post('/auth/api/users/bulk/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setImportStats(data)
      setImportFile(null)
      setImporting(false)
      setRefreshKey((key) => key + 1)

      const created = data?.created ?? 0
      const failed = data?.failed ?? 0
      toast.success(`Import finished. Created: ${created}, Failed: ${failed}`)
    } catch (error) {
      console.error('Failed to import users:', error)
      const msg = error?.response?.data?.error || error?.response?.data?.message || error.message || 'Unknown error'
      toast.error(`Import failed: ${msg}`)
      setImporting(false)
    }
  }, [importFile])

  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImportFile(null)
      return
    }

    const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    if (!allowed.includes(file.type)) {
      toast.warning('Please select a valid Excel file (.xlsx or .xls)')
      event.target.value = ''
      setImportFile(null)
      return
    }

    setImportFile(file)
  }, [])

  const closeImportModal = useCallback(() => {
    if (importing) return
    setImportModalOpen(false)
    setImportFile(null)
    setImportStats(null)
  }, [importing])

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
        <div className="mb-4">
          <CMSBreadcrumb />
        </div>
        <CrudPage
          key={refreshKey}
          title={t('cms.users') || 'Users'}
          service="auth"
          resourceBase="/api/users"
          idKey="id"
          columns={columns}
          pageSize={10}
          enableCreate={canCreate}
          enableEdit={canUpdate}
          enableDelete={canDelete}
          tableId="users-list" // Unique ID for table preferences storage
          renderHeaderRight={() => (
            <div className="flex items-center gap-2">
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0 0l-4-4m4 4l4-4" />
                </svg>
                <span>Download Template</span>
              </button>
              {canCreate && (
                <button
                  onClick={() => setImportModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Import Users</span>
                </button>
              )}
            </div>
          )}
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
          toCreatePayload={(f) => {
            const toISOInstant = (datetimeLocal) => {
              if (!datetimeLocal) return null
              try {
                return new Date(datetimeLocal).toISOString()
              } catch {
                return null
              }
            }

            const toISODate = (dateLocal) => {
              if (!dateLocal) return null
              try {
                return dateLocal
              } catch {
                return null
              }
            }

            return {
              firstName: f.firstName?.trim() || null,
              fatherName: f.fatherName?.trim() || null,
              surName: f.surName?.trim() || null,
              fullName: f.fullName?.trim() || null,
              emailAddress: f.emailAddress?.trim() || null,
              authMethod: f.authMethod || 'LOCAL',
              tenantId: f.tenantId || null,
              organizationId: f.organizationId || null,
              organizationBranchId: f.organizationBranchId || null,
              accountKind: f.accountKind || 'GENERAL',
              enabled: !!f.enabled,
              validFrom: toISOInstant(f.validFrom),
              validTo: toISOInstant(f.validTo),
              mustRenewAt: toISOInstant(f.mustRenewAt),
              employmentStartDate: toISODate(f.employmentStartDate),
              employmentEndDate: toISODate(f.employmentEndDate),
              passwordExpiresAt: toISOInstant(f.passwordExpiresAt),
              mustChangePassword: !!f.mustChangePassword,
              language: f.language || 'en',
              type: f.type || 'USER',
              profileImageUrl: f.profileImageUrl?.trim() || null,
              password: f.password?.trim() || null,
            }
          }}
          toUpdatePayload={(f) => {
            const toISOInstant = (datetimeLocal) => {
              if (!datetimeLocal) return null
              try {
                return new Date(datetimeLocal).toISOString()
              } catch {
                return null
              }
            }

            const toISODate = (dateLocal) => {
              if (!dateLocal) return null
              try {
                return dateLocal
              } catch {
                return null
              }
            }

            const payload = {
              firstName: f.firstName?.trim() || null,
              fatherName: f.fatherName?.trim() || null,
              surName: f.surName?.trim() || null,
              fullName: f.fullName?.trim() || null,
              emailAddress: f.emailAddress?.trim() || null,
              authMethod: f.authMethod || null,
              tenantId: f.tenantId || null,
              organizationId: f.organizationId || null,
              organizationBranchId: f.organizationBranchId || null,
              accountKind: f.accountKind || null,
              enabled: typeof f.enabled === 'boolean' ? f.enabled : null,
              validFrom: f.validFrom ? toISOInstant(f.validFrom) : null,
              validTo: f.validTo ? toISOInstant(f.validTo) : null,
              mustRenewAt: f.mustRenewAt ? toISOInstant(f.mustRenewAt) : null,
              employmentStartDate: f.employmentStartDate ? toISODate(f.employmentStartDate) : null,
              employmentEndDate: f.employmentEndDate ? toISODate(f.employmentEndDate) : null,
              passwordExpiresAt: f.passwordExpiresAt ? toISOInstant(f.passwordExpiresAt) : null,
              mustChangePassword: typeof f.mustChangePassword === 'boolean' ? f.mustChangePassword : null,
              language: f.language || null,
              type: f.type || null,
              profileImageUrl: f.profileImageUrl?.trim() || null,
              deleted: typeof f.deleted === 'boolean' ? f.deleted : null,
            }

            if (f.password?.trim()) {
              payload.password = f.password.trim()
            }

            if (f.rowVersion != null) {
              payload.rowVersion = f.rowVersion
            }

            return payload
          }}
        />
      </div>

      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-800">Bulk Import Users</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={closeImportModal}
                disabled={importing}
              >
                <span className="sr-only">Close</span>
                X
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="text-sm text-gray-600 space-y-1">
                <p>1. Download the template and fill in user details.</p>
                <p>2. Select a role for each system using the dropdown lists.</p>
                <p>3. Upload the completed file to create users in bulk.</p>
              </div>
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
                <input
                  id="users-import-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={importing}
                  className="mx-auto block w-full cursor-pointer text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
                />
                <p className="mt-2 text-xs text-gray-500">Supported formats: .xlsx, .xls</p>
                {importFile && (
                  <p className="mt-2 text-sm font-medium text-gray-700">Selected file: {importFile.name}</p>
                )}
              </div>
              {importStats && (
                <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  <p className="font-semibold">Import summary</p>
                  <ul className="mt-2 space-y-1">
                    <li>Created: {importStats.created ?? 0}</li>
                    <li>Failed: {importStats.failed ?? 0}</li>
                    <li>Roles assigned: {importStats.rolesAssigned ?? 0}</li>
                  </ul>
                  {Array.isArray(importStats.errors) && importStats.errors.length > 0 && (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
                      <p className="font-semibold">Errors (showing up to 10):</p>
                      <ul className="list-disc pl-5 text-xs">
                        {importStats.errors.slice(0, 10).map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                onClick={closeImportModal}
                disabled={importing}
              >
                Cancel
              </button>
              <button
                className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
                  importing ? 'bg-blue-300 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? 'Importing...' : 'Import Users'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
