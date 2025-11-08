import React, { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import TenantFormWizard from './TenantFormWizard'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { TENANTS, ACCESS_SECTIONS } from '@/config/permissions-constants'

const tenantColumns = [
  { 
    id: 'name', 
    accessorKey: 'name', 
    header: 'Tenant Name',
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
  { id: 'email', accessorKey: 'email', header: 'Email', cell: (info) => info.getValue() || '-' },
  { 
    id: 'countryName', 
    accessorKey: 'countryName', 
    header: 'Country', 
    cell: (info) => info.getValue() || '-' 
  },
  { 
    id: 'industryTypeName', 
    accessorKey: 'industryTypeName', 
    header: 'Industry', 
    cell: (info) => info.getValue() || '-' 
  },
  { 
    id: 'subscriptionPlanName', 
    accessorKey: 'subscriptionPlanName', 
    header: 'Plan', 
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

export default function TenantListPage() {
  const navigate = useNavigate()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardMode, setWizardMode] = useState('create') // 'create' or 'edit'
  const [wizardData, setWizardData] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Get permissions for Tenant section
  // Section: "Tenants" under System: "Access Management"
  const { getSectionPermissions, isLoading, permissionsData } = usePermissionCheck()
  
  const permissions = useMemo(() => {
    // Try with system name first
    let perms = getSectionPermissions(ACCESS_SECTIONS.TENANTS, TENANTS.ACCESS_MANAGEMENT)
    
    // If that doesn't work, try without system name
    if (!perms.canList && !perms.canCreate && !perms.canUpdate && !perms.canDelete) {
      // console.log('⚠️ Trying without system name...')
      perms = getSectionPermissions(ACCESS_SECTIONS.TENANTS)
    }
    
    // Debug logging
    // console.log('🔍 Tenants Page - Debug Info:')
    // console.log('  Section Name:', ACCESS_SECTIONS.TENANTS)
    // console.log('  System Name:', TENANTS.ACCESS_MANAGEMENT)
    // console.log('  Permissions Result:', perms)
    // console.log('  All Systems:', permissionsData?.systems)
    
    // Show all sections in all systems
    // permissionsData?.systems?.forEach(sys => {
    //   // console.log(`  System: ${sys.name}`)
    //   sys.sections?.forEach(sec => {
    //     console.log(`    - Section: ${sec.name}`)
    //   })
    // })
    
    return perms
  }, [getSectionPermissions, permissionsData])

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

  // Debug: Show what we got
  // console.log('✅ Tenants Permissions:', { canCreate, canUpdate, canDelete, canList })

  // Show access denied if user doesn't have List permission
  if (!canList) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 max-w-md">
          <h2 className="text-base font-semibold text-destructive mb-1">Access Denied</h2>
          <p className="text-sm text-destructive/80">
            You don't have permission to view Tenants.
          </p>
          <details className="mt-4 text-xs">
            <summary className="cursor-pointer text-gray-600">Debug Info</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
              {JSON.stringify({
                sectionName: ACCESS_SECTIONS.TENANTS,
                systemName: TENANTS.ACCESS_MANAGEMENT,
                permissions,
                systems: permissionsData?.systems?.map(s => ({
                  name: s.name,
                  sections: s.sections?.map(sec => sec.name)
                }))
              }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    )
  }

  const handleCreateClick = useCallback(() => {
    setWizardMode('create')
    setWizardData(null)
    setWizardOpen(true)
  }, [])

  const handleWizardSuccess = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
    setWizardOpen(false)
  }, [])

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <CrudPage
        key={refreshKey}
        title="Tenants"
        service="access"
        resourceBase="/api/v1/tenants"
        idKey="tenantId"
        columns={tenantColumns}
        pageSize={25}
        enableCreate={canCreate}
        enableEdit={canUpdate}
        enableDelete={canDelete}
        tableId="tenants-list"
        onRowClick={(row) => {
          navigate(`/cms/tenants/${row.tenantId}`)
        }}
        renderHeaderRight={() => (
          canCreate && (
            <button
              onClick={handleCreateClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Tenant
            </button>
          )
        )}
      />

      <TenantFormWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={handleWizardSuccess}
        initialData={wizardData}
      />
    </div>
  )
}

