import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

const countryColumns = [
  { 
    id: 'iso2Code', 
    accessorKey: 'iso2Code', 
    header: 'ISO2',
    cell: (info) => info.getValue() || '-'
  },
  { 
    id: 'name', 
    accessorKey: 'name', 
    header: 'Country Name',
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
  { 
    id: 'iso3Code', 
    accessorKey: 'iso3Code', 
    header: 'ISO3', 
    cell: (info) => info.getValue() || '-' 
  },
  { 
    id: 'phoneCode', 
    accessorKey: 'phoneCode', 
    header: 'Phone Code', 
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

const countryFields = [
  { type: 'text', name: 'iso2Code', label: 'ISO2 Code (2 chars)', required: true, maxLength: 2 },
  { type: 'text', name: 'name', label: 'Country Name', required: true },
  { type: 'text', name: 'iso3Code', label: 'ISO3 Code (3 chars)', maxLength: 3 },
  { type: 'text', name: 'numericCode', label: 'Numeric Code' },
  { type: 'text', name: 'phoneCode', label: 'Phone Code', placeholder: 'e.g., +1' },
  { type: 'checkbox', name: 'isActive', label: 'Active', defaultValue: true },
]

export default function CountryListPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  // Get permissions for Code Country section
  const { getSectionPermissions, isLoading, permissionsData } = usePermissionCheck()
  
  const permissions = useMemo(() => {
    const perms = getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS)
    return perms
  }, [getSectionPermissions])

  const canCreate = permissions.canCreate
  const canUpdate = permissions.canUpdate
  const canDelete = permissions.canDelete
  const canList = permissions.canList

  const defaultSorting = useMemo(() => ([{ id: 'name', desc: false }]), [])

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
            You don't have permission to view Countries.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <CMSBreadcrumb />
      </div>
      <CrudPage
        title={t('cms.codeCountry') || 'Countries'}
        service="access"
        resourceBase="/api/code-countries"
        idKey="countryId"
        columns={countryColumns}
        pageSize={25}
        formFields={countryFields}
        enableCreate={canCreate}
        enableEdit={canUpdate}
        enableDelete={canDelete}
        showAddButton={canCreate}
        tableId="countries-list"
        defaultSorting={defaultSorting}
        quickSearch={{ fields: ['name'], operator: 'LIKE' }}
        toCreatePayload={(f) => ({
          iso2Code: f.iso2Code?.trim().toUpperCase(),
          name: f.name?.trim(),
          iso3Code: f.iso3Code?.trim().toUpperCase() || null,
          numericCode: f.numericCode?.trim() || null,
          phoneCode: f.phoneCode?.trim() || null,
          isActive: true, // ✅ Always TRUE for new records
        })}
        toUpdatePayload={(f, row) => ({
          countryId: row.countryId,
          iso2Code: f.iso2Code?.trim().toUpperCase(),
          name: f.name?.trim(),
          iso3Code: f.iso3Code?.trim().toUpperCase() || null,
          numericCode: f.numericCode?.trim() || null,
          phoneCode: f.phoneCode?.trim() || null,
          isActive: true, // ✅ Always TRUE - cannot be deactivated
          ...(row.rowVersion != null ? { rowVersion: row.rowVersion } : {}),
        })}
        onRowClick={(row) => navigate(`/cms/codeCountry/${row.countryId}`)}
      />
    </div>
  )
}

