import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import { api } from '@/lib/axios'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

const operationColumns = [
  { 
    id: 'code', 
    accessorKey: 'code', 
    header: 'Code',
    cell: (info) => info.getValue() || '-'
  },
  { 
    id: 'name', 
    accessorKey: 'name', 
    header: 'Operation Name',
    cell: (info) => (
      <span className="text-blue-600 font-medium">
        {info.getValue()}
      </span>
    )
  },
  { 
    id: 'description', 
    accessorKey: 'description', 
    header: 'Description', 
    cell: (info) => info.getValue() || '-' 
  },
  {
    id: 'startDate',
    accessorKey: 'startDate',
    header: 'Start Date',
    cell: (info) => info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '-',
  },
  {
    id: 'endDate',
    accessorKey: 'endDate',
    header: 'End Date',
    cell: (info) => info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '-',
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

export default function OperationListPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  // Dropdown data
  const [organizations, setOrganizations] = useState([])
  const [countries, setCountries] = useState([])
  const [locations, setLocations] = useState([])
  
  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })),
    [countries]
  )

  // Get permissions for Code Country section (using same permissions)
  const { getSectionPermissions, isLoading } = usePermissionCheck()
  
  const permissions = useMemo(() => {
    const perms = getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS)
    return perms
  }, [getSectionPermissions])

  const canCreate = permissions.canCreate
  const canUpdate = permissions.canUpdate
  const canDelete = permissions.canDelete
  const canList = permissions.canList

  // Fetch dropdown data on mount
  useEffect(() => {
    let isMounted = true // ✅ Cleanup flag to prevent double calls in StrictMode
    
    const fetchDropdownData = async () => {
      try {
        // Get user's language or default to 'en'
        const userLanguage = localStorage.getItem('userLanguage') || 'en'
        
        // ✅ Use Promise.all to fetch all data in parallel (faster!)
        const [orgResponse, countryResponse, locationResponse] = await Promise.all([
          api.post('/access/api/organization-languages/filter', {
            criteria: [{ field: 'language', operator: 'EQUAL', value: userLanguage }]
          }, { params: { page: 0, size: 1000 } }),
          
          api.post('/access/api/code-country-languages/filter', {
            criteria: [{ field: 'language', operator: 'EQUAL', value: userLanguage }]
          }, { params: { page: 0, size: 1000 } }),
          
          api.post('/access/api/location-languages/filter', {
            criteria: [{ field: 'language', operator: 'EQUAL', value: userLanguage }]
          }, { params: { page: 0, size: 1000 } })
        ])
        
        // ✅ Only update state if component is still mounted
        if (isMounted) {
          // Filter only active items on client-side
          const activeOrgs = (orgResponse.data.content || []).filter(item => item.isActive !== false)
          const activeCountries = (countryResponse.data.content || []).filter(item => item.isActive !== false)
          const activeLocations = (locationResponse.data.content || []).filter(item => item.isActive !== false)
          
          setOrganizations(activeOrgs)
          setCountries(activeCountries)
          setLocations(activeLocations)
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch dropdown data:', error)
        }
      }
    }
    
    fetchDropdownData()
    
    // ✅ Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false
    }
  }, [])

  // Define operation fields with dynamic dropdown options
  const operationFields = useMemo(() => [
    { type: 'text', name: 'code', label: 'Operation Code', required: true },
    { type: 'text', name: 'name', label: 'Operation Name', required: true },
    { 
      type: 'select', 
      name: 'organizationId', 
      label: 'Organization',
      options: [
        { value: '', label: '-- Select Organization --' },
        ...organizations.map(org => ({ value: org.organizationId, label: org.name }))
      ]
    },
    { 
      type: 'select', 
      name: 'countryId', 
      label: 'Country',
      options: [
        { value: '', label: '-- Select Country --' },
        ...sortedCountries.map(country => ({ value: country.countryId, label: country.name }))
      ]
    },
    { 
      type: 'select', 
      name: 'locationId', 
      label: 'Location',
      options: [
        { value: '', label: '-- Select Location --' },
        ...locations.map(location => ({ value: location.locationId, label: location.name }))
      ]
    },
    { type: 'textarea', name: 'description', label: 'Description' },
    { type: 'date', name: 'startDate', label: 'Start Date' },
    { type: 'date', name: 'endDate', label: 'End Date' },
    // ✅ isActive removed - always TRUE by default
  ], [organizations, sortedCountries, locations])

  // Show loading state while fetching permissions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!canList) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view operations.</p>
          <p className="text-sm text-gray-500 mt-2">Required: CODE_COUNTRY section with 'list' action</p>
        </div>
      </div>
    )
  }

  const handleRowClick = (operation) => {
    navigate(`/cms/operations/${operation.operationId}`)
  }

  const toCreatePayload = (formData) => ({
    code: formData.code,
    name: formData.name,
    description: formData.description,
    organizationId: formData.organizationId || null,
    countryId: formData.countryId || null,
    locationId: formData.locationId || null,
    startDate: formData.startDate,
    endDate: formData.endDate,
    isActive: true, // ✅ Always TRUE - cannot be deactivated
  })

  const toUpdatePayload = (formData) => ({
    operationId: formData.operationId,
    code: formData.code,
    name: formData.name,
    description: formData.description,
    organizationId: formData.organizationId || null,
    countryId: formData.countryId || null,
    locationId: formData.locationId || null,
    startDate: formData.startDate,
    endDate: formData.endDate,
    isActive: true, // ✅ Always TRUE - cannot be deactivated
    rowVersion: formData.rowVersion,
  })

  return (
    <div className="h-full">
      <div className="px-4 pt-4">
        <CMSBreadcrumb />
      </div>
      <CrudPage
        title={t('cms.operations') || 'Operations'}
        entityName="Operation"
        entityIdField="operationId"
        apiEndpoint="/access/api/operations"
        columns={operationColumns}
        formFields={operationFields}
        canEdit={canUpdate}
        canDelete={canDelete}
        onRowClick={handleRowClick}
        toCreatePayload={toCreatePayload}
        toUpdatePayload={toUpdatePayload}
      />
    </div>
  )
}
