import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import DataTable from '@/packages/datatable/DataTable'
import { format } from 'date-fns'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'

export default function AuditLogList() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState({
    actionType: '',
    entityName: '',
    username: '',
  })
  const { getSectionPermissions, isLoading } = usePermissionCheck()

  const permissions = useMemo(() => 
    getSectionPermissions(CMS_SECTIONS.SYSTEMS, SYSTEMS.CMS),
    [getSectionPermissions]
  )

  const canList = permissions.canList

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
            You don't have permission to view the Audit Log.
          </p>
        </div>
      </div>
    )
  }

  // Build query params for server-side fetching
  const queryParams = useMemo(() => {
    const params = {
      sortBy: 'timestamp',
      direction: 'DESC',
    }
    
    if (filters.actionType) params.actionType = filters.actionType
    if (filters.entityName) params.entityName = filters.entityName
    if (filters.username) params.username = filters.username
    
    return params
  }, [filters])

  // Define columns
  const columns = [
    {
      accessorKey: 'timestamp',
      header: t('auditLog.timestamp'),
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.timestamp 
            ? format(new Date(row.original.timestamp), 'yyyy-MM-dd HH:mm:ss')
            : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'actionType',
      header: t('auditLog.action'),
      cell: ({ row }) => {
        const actionType = row.original.actionType
        const colors = {
          CREATE: 'bg-success/10 text-success',
          UPDATE: 'bg-primary/10 text-primary',
          DELETE: 'bg-destructive/10 text-destructive',
          READ: 'bg-blue-500/10 text-blue-600',
          LOGIN: 'bg-green-500/10 text-green-600',
          LOGOUT: 'bg-gray-500/10 text-gray-600',
        }
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${colors[actionType] || 'bg-muted text-muted-foreground'}`}>
            {actionType}
          </span>
        )
      },
    },
    {
      accessorKey: 'entityName',
      header: t('auditLog.entity'),
      cell: ({ row }) => (
        <div className="text-sm font-medium">{row.original.entityName || '-'}</div>
      ),
    },
    {
      accessorKey: 'username',
      header: t('auditLog.user'),
      cell: ({ row }) => (
        <div className="text-sm">{row.original.username || 'System'}</div>
      ),
    },
    {
      accessorKey: 'description',
      header: t('auditLog.description'),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground max-w-md truncate">
          {row.original.description || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
      cell: ({ row }) => (
        <div className="text-sm font-mono">{row.original.ipAddress || '-'}</div>
      ),
    },
    {
      accessorKey: 'success',
      header: t('auditLog.status'),
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
          row.original.success 
            ? 'bg-success/10 text-success' 
            : 'bg-destructive/10 text-destructive'
        }`}>
          {row.original.success ? t('common.success') : t('common.failed')}
        </span>
      ),
    },
    {
      accessorKey: 'executionTimeMs',
      header: 'Time (ms)',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.executionTimeMs ? `${row.original.executionTimeMs}ms` : '-'}
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="gradient-mesh fixed inset-0 opacity-30 pointer-events-none"></div>
      
      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <CMSBreadcrumb />
        </div>
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-600 rounded-full text-[11px] font-medium mb-2">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('auditLog.badge')}
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            {t('auditLog.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('auditLog.description')}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('auditLog.filterAction')}
              </label>
              <select
                value={filters.actionType}
                onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{t('common.all')}</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="READ">READ</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="PERMISSION_CHANGE">PERMISSION_CHANGE</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('auditLog.filterEntity')}
              </label>
              <input
                type="text"
                value={filters.entityName}
                onChange={(e) => setFilters({ ...filters, entityName: e.target.value })}
                placeholder={t('auditLog.entityPlaceholder')}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('auditLog.filterUser')}
              </label>
              <input
                type="text"
                value={filters.username}
                onChange={(e) => setFilters({ ...filters, username: e.target.value })}
                placeholder={t('auditLog.userPlaceholder')}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(filters.actionType || filters.entityName || filters.username) && (
            <div className="mt-4">
              <button
                onClick={() => setFilters({ actionType: '', entityName: '', username: '' })}
                className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
              >
                {t('common.clearFilters')}
              </button>
            </div>
          )}
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          resourceBase="/access/api/audit-logs"
          queryParams={queryParams}
          pageSize={20}
          title="Audit Log"
          tableId="audit-log-list"
          getRowId={(row) => row.id}
        />

        {/* Info Note */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-600 mb-1">{t('auditLog.infoTitle')}</h3>
              <p className="text-sm text-blue-600/80">{t('auditLog.infoDescription')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

