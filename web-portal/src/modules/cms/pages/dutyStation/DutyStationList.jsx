import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import { api } from '@/lib/axios'
import { useDutyStationTypes } from '@/hooks/useDutyStationTypes'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

const dutyStationColumns = [
  { 
    id: 'code', 
    accessorKey: 'code', 
    header: 'Code',
    cell: (info) => info.getValue() || '-'
  },
  { 
    id: 'name', 
    accessorKey: 'name', 
    header: 'Duty Station Name',
    cell: (info) => (
      <span className="text-blue-600 font-medium">
        {info.getValue()}
      </span>
    )
  },
  { 
    id: 'address', 
    accessorKey: 'address', 
    header: 'Address', 
    cell: (info) => info.getValue() || '-' 
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Status',
    cell: (info) => (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        Active
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

export default function DutyStationListPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  // Dropdown data
  const [organizations, setOrganizations] = useState([])
  const [operations, setOperations] = useState([])
  const [organizationBranches, setOrganizationBranches] = useState([])
  const [countries, setCountries] = useState([])
  const [locations, setLocations] = useState([])
  
  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })),
    [countries]
  )

  // Get duty station types from hook
  const { dutyStationTypes, loading: typesLoading } = useDutyStationTypes('en')
  
  // Get permissions for Code Country section (using same permissions)
  const { getSectionPermissions, isLoading } = usePermissionCheck()
  
  const permissions = useMemo(() => {
    const perms = getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS)
    console.log('🔍 Duty Stations Page - Permissions:', perms)
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
        const [orgResponse, opResponse, branchResponse, countryResponse, locationResponse] = await Promise.all([
          // Fetch real Organizations (not code table)
          api.post('/access/api/organizations/filter', {
            criteria: []
          }, { params: { page: 0, size: 1000 } }),
          
          // Fetch real Operations
          api.post('/access/api/operations/filter', {
            criteria: []
          }, { params: { page: 0, size: 1000 } }),
          
          // Fetch real Organization Branches
          api.post('/access/api/organization-branches/filter', {
            criteria: []
          }, { params: { page: 0, size: 1000 } }),
          
          // Fetch real Countries (not code table)
          api.post('/access/api/code-countries/filter', {
            criteria: []
          }, { params: { page: 0, size: 1000 } }),
          
          // Fetch real Locations
          api.post('/access/api/locations/filter', {
            criteria: []
          }, { params: { page: 0, size: 1000 } })
        ])
        
        // ✅ Only update state if component is still mounted
        if (isMounted) {
          // Filter only active items on client-side
          const activeOrgs = (orgResponse.data.content || []).filter(item => item.isActive !== false)
          const activeOps = (opResponse.data.content || []).filter(item => item.isActive !== false)
          const activeBranches = (branchResponse.data.content || []).filter(item => item.isActive !== false)
          const activeCountries = (countryResponse.data.content || []).filter(item => item.isActive !== false)
          const activeLocations = (locationResponse.data.content || []).filter(item => item.isActive !== false)
          
          setOrganizations(activeOrgs)
          setOperations(activeOps)
          setOrganizationBranches(activeBranches)
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

  // Define duty station fields with dynamic dropdown options
  const dutyStationFields = useMemo(() => [
    { type: 'text', name: 'code', label: 'Station Code', required: true },
    { type: 'text', name: 'name', label: 'Station Name', required: true },
    { 
      type: 'select', 
      name: 'organizationId', 
      label: 'Organization',
      required: true,
      options: [
        { value: '', label: '-- Select Organization --' },
        ...organizations.map(org => ({ value: org.organizationId, label: org.name }))
      ]
    },
    { 
      type: 'select', 
      name: 'operationId', 
      label: 'Operation',
      options: [
        { value: '', label: '-- Select Operation --' },
        ...operations.map(op => ({ value: op.operationId, label: op.name }))
      ]
    },
    { 
      type: 'select', 
      name: 'organizationBranchId', 
      label: 'Organization Branch',
      options: [
        { value: '', label: '-- Select Branch --' },
        ...organizationBranches.map(branch => ({ value: branch.organizationBranchId, label: branch.name }))
      ]
    },
    { 
      type: 'select', 
      name: 'countryId', 
      label: 'Country',
      required: true,
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
        ...locations.map(loc => ({ value: loc.locationId, label: loc.name }))
      ]
    },
    { 
      type: 'select', 
      name: 'statusId', 
      label: 'Status Type',
      options: [
        { value: '', label: '-- Select Status --' },
        ...dutyStationTypes.map(type => ({ value: type.value, label: type.label }))
      ]
    },
    { type: 'textarea', name: 'address', label: 'Address' },
    { type: 'number', name: 'latitude', label: 'Latitude' },
    { type: 'number', name: 'longitude', label: 'Longitude' },
    // ✅ isActive removed - always TRUE
  ], [organizations, operations, organizationBranches, sortedCountries, locations, dutyStationTypes])

  // Loading state
  if (isLoading || typesLoading || !canList) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          {(isLoading || typesLoading) ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">You do not have permission to view duty stations.</p>
            </>
          )}
        </div>
      </div>
    )
  }

  const handleRowClick = (dutyStation) => {
    navigate(`/cms/duty-stations/${dutyStation.dutyStationId}`)
  }

  const toCreatePayload = (formData) => ({
    organizationId: formData.organizationId || null,
    operationId: formData.operationId || null,
    organizationBranchId: formData.organizationBranchId || null,
    countryId: formData.countryId || null,
    locationId: formData.locationId || null,
    statusId: formData.statusId || null,
    code: formData.code,
    name: formData.name,
    address: formData.address,
    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    isActive: true, // ✅ Always TRUE - cannot be deactivated
  })

  const toUpdatePayload = (formData) => ({
    organizationId: formData.organizationId || null,
    operationId: formData.operationId || null,
    organizationBranchId: formData.organizationBranchId || null,
    countryId: formData.countryId || null,
    locationId: formData.locationId || null,
    statusId: formData.statusId || null,
    code: formData.code,
    name: formData.name,
    address: formData.address,
    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    isActive: true, // ✅ Always TRUE - cannot be deactivated
    rowVersion: formData.rowVersion,
  })

  return (
    <div className="h-full">
      <div className="px-4 pt-4">
        <CMSBreadcrumb />
      </div>
      <CrudPage
        title={t('cms.duty-stations') || 'Duty Stations'}
        entityName="Duty Station"
        entityIdField="dutyStationId"
        apiEndpoint="/access/api/duty-stations"
        columns={dutyStationColumns}
        formFields={dutyStationFields}
        canEdit={canUpdate}
        canDelete={canDelete}
        onRowClick={handleRowClick}
        toCreatePayload={toCreatePayload}
        toUpdatePayload={toUpdatePayload}
      />
    </div>
  )
}


