import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import { api } from '@/lib/axios'

const organizationBranchColumns = [
  { 
    id: 'code', 
    accessorKey: 'code', 
    header: 'Code',
    cell: (info) => info.getValue() || '-'
  },
  { 
    id: 'name', 
    accessorKey: 'name', 
    header: 'Branch Name',
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
    id: 'isHeadquarter',
    accessorKey: 'isHeadquarter',
    header: 'Headquarter',
    cell: (info) => (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
        info.getValue() 
          ? 'bg-blue-100 text-blue-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {info.getValue() ? 'Yes' : 'No'}
      </span>
    ),
    meta: { type: 'boolean' },
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

export default function OrganizationBranchListPage() {
  const navigate = useNavigate()
  
  // Dropdown data
  const [organizations, setOrganizations] = useState([])
  const [countries, setCountries] = useState([])
  const [locations, setLocations] = useState([])
  
  // Get permissions for Code Country section (using same permissions)
  const { getSectionPermissions, isLoading } = usePermissionCheck()
  
  const permissions = useMemo(() => {
    const perms = getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS)
    console.log('🔍 Organization Branches Page - Permissions:', perms)
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
          api.post('/access/api/code-organization-languages/filter', {
            criteria: [{ field: 'languageCode', operator: 'EQUAL', value: userLanguage }]
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

  // Define organization branch fields with dynamic dropdown options
  const organizationBranchFields = useMemo(() => [
    { type: 'text', name: 'code', label: 'Branch Code', required: true },
    { type: 'text', name: 'name', label: 'Branch Name', required: true },
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
      name: 'countryId', 
      label: 'Country',
      required: true,
      options: [
        { value: '', label: '-- Select Country --' },
        ...countries.map(country => ({ value: country.countryId, label: country.name }))
      ]
    },
    { 
      type: 'select', 
      name: 'locationId', 
      label: 'Location',
      required: true,
      options: [
        { value: '', label: '-- Select Location --' },
        ...locations.map(location => ({ value: location.locationId, label: location.name }))
      ]
    },
    { type: 'textarea', name: 'address', label: 'Address' },
    { type: 'number', name: 'latitude', label: 'Latitude', step: 'any' },
    { type: 'number', name: 'longitude', label: 'Longitude', step: 'any' },
    { type: 'checkbox', name: 'isHeadquarter', label: 'Is Headquarter', defaultValue: false },
    // ✅ isActive removed - always TRUE by default
  ], [organizations, countries, locations])

  // Show loading state while fetching permissions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show access denied if no list permission
  if (!canList) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view organization branches.</p>
        </div>
      </div>
    )
  }

  const handleRowClick = (branch) => {
    navigate(`/cms/organization-branches/${branch.organizationBranchId}`)
  }

  const toCreatePayload = (formData) => ({
    code: formData.code,
    name: formData.name,
    organizationId: formData.organizationId || null,
    countryId: formData.countryId || null,
    locationId: formData.locationId || null,
    branchTypeId: formData.branchTypeId || null,
    address: formData.address,
    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    isHeadquarter: formData.isHeadquarter || false,
    isActive: true, // ✅ Always TRUE - cannot be deactivated
  })

  const toUpdatePayload = (formData) => ({
    organizationBranchId: formData.organizationBranchId,
    code: formData.code,
    name: formData.name,
    organizationId: formData.organizationId || null,
    countryId: formData.countryId || null,
    locationId: formData.locationId || null,
    branchTypeId: formData.branchTypeId || null,
    address: formData.address,
    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    isHeadquarter: formData.isHeadquarter || false,
    isActive: true, // ✅ Always TRUE - cannot be deactivated
    rowVersion: formData.rowVersion,
  })

  return (
    <div className="h-full">
      <CrudPage
        title="Organization Branches"
        entityName="Organization Branch"
        entityIdField="organizationBranchId"
        apiEndpoint="/access/api/organization-branches"
        columns={organizationBranchColumns}
        formFields={organizationBranchFields}
        canEdit={canUpdate}
        canDelete={canDelete}
        onRowClick={handleRowClick}
        toCreatePayload={toCreatePayload}
        toUpdatePayload={toUpdatePayload}
      />
    </div>
  )
}


