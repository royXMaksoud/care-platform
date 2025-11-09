import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { TENANTS, ACCESS_SECTIONS } from '@/config/permissions-constants'
import { TENANT_CASCADE_FIELDS } from '@/config/codeTableIds'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

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
    id: 'tenantLogo',
    accessorKey: 'tenantLogo',
    header: 'Logo',
    cell: (info) => {
      const value = info.getValue()
      if (!value) return '—'
      return (
        <div className="flex items-center justify-center">
          <img
            src={value}
            alt="Tenant logo"
            className="h-8 w-8 rounded-full border border-slate-200 bg-white object-contain p-1"
          />
        </div>
      )
    },
    enableSorting: false,
  },
  {
    id: 'sessionTimeoutMinutes',
    accessorKey: 'sessionTimeoutMinutes',
    header: 'Session Timeout',
    cell: (info) => {
      const value = info.getValue()
      return value ? `${value} min` : '-'
    },
    meta: { type: 'number' },
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

const tenantFields = [
  { type: 'text', name: 'name', label: 'Tenant Name', required: true },
  { type: 'email', name: 'email', label: 'Email', required: true },
  // Using pre-configured cascade dropdown fields from config
  ...TENANT_CASCADE_FIELDS,
  { type: 'text', name: 'focalPointName', label: 'Focal Point Name' },
  { type: 'text', name: 'focalPointPhone', label: 'Focal Point Phone' },
  { type: 'textarea', name: 'address', label: 'Address', rows: 2 },
  { type: 'textarea', name: 'comment', label: 'Comments', rows: 2 },
  { type: 'text', name: 'tenantLogo', label: 'Tenant Logo (Base64 or URL)' },
  { type: 'number', name: 'sessionTimeoutMinutes', label: 'Session Timeout (minutes)', required: true, min: 1 },
  { type: 'checkbox', name: 'isActive', label: 'Active' },
]

export default function TenantListPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  
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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="px-4 pt-4">
        <CMSBreadcrumb />
      </div>
      <div className="px-4 pb-2 flex items-center justify-between">
        <div />
        <button
          type="button"
          onClick={() => navigate('/cms/tenants/wizard')}
          className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 5v14M5 12h14"/></svg>
          Multi-Tenant Wizard
        </button>
      </div>
      <CrudPage
        title={t('cms.tenants') || 'Tenants'}
        service="access"
        resourceBase="/api/v1/tenants"
        idKey="tenantId"
        columns={tenantColumns}
        pageSize={25}
        formFields={tenantFields}
        enableCreate={canCreate}
        enableEdit={canUpdate}
        enableDelete={canDelete}
        tableId="tenants-list" // Unique ID for table preferences storage
        onRowClick={(row) => {
          // Navigate to tenant details page
          navigate(`/cms/tenants/${row.tenantId}`)
        }}
        toCreatePayload={(f) => ({
          name: f.name?.trim(),
          email: f.email?.trim(),
          // Reference-data fields (UUID IDs)
          industryTypeId: f.industryTypeId || null,
          subscriptionPlanId: f.subscriptionPlanId || null,
          billingCurrencyId: f.billingCurrencyId || null,
          billingCycleId: f.billingCycleId || null,
          countryId: f.countryId || null,
          // Free-text fields
          focalPointName: f.focalPointName?.trim() || null,
          focalPointPhone: f.focalPointPhone?.trim() || null,
          address: f.address?.trim() || null,
          comment: f.comment?.trim() || null,
          tenantLogo: f.tenantLogo?.trim() || null,
          sessionTimeoutMinutes: Number(f.sessionTimeoutMinutes) || 30,
          isActive: true, // ✅ Always TRUE for new records
        })}
        toUpdatePayload={(f, row) => ({
          tenantId: row.tenantId,
          name: f.name?.trim(),
          email: f.email?.trim(),
          // Reference-data fields (UUID IDs)
          industryTypeId: f.industryTypeId || null,
          subscriptionPlanId: f.subscriptionPlanId || null,
          billingCurrencyId: f.billingCurrencyId || null,
          billingCycleId: f.billingCycleId || null,
          countryId: f.countryId || null,
          // Free-text fields
          focalPointName: f.focalPointName?.trim() || null,
          focalPointPhone: f.focalPointPhone?.trim() || null,
          address: f.address?.trim() || null,
          comment: f.comment?.trim() || null,
          tenantLogo: f.tenantLogo?.trim() || (row.tenantLogo || null),
          sessionTimeoutMinutes: Number(f.sessionTimeoutMinutes) || 30,
          isActive: true, // ✅ Always TRUE - cannot be deactivated
          rowVersion: row.rowVersion,
        })}
      />
    </div>
  )
}

