import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import { api } from '@/lib/axios'
import { toast } from 'sonner'

const locationColumns = [
  { 
    id: 'code', 
    accessorKey: 'code', 
    header: 'Location Code',
    cell: (info) => info.getValue() || '-'
  },
  { 
    id: 'name', 
    accessorKey: 'name', 
    header: 'Location Name',
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
    id: 'level', 
    accessorKey: 'level', 
    header: 'Level', 
    cell: (info) => info.getValue() ?? '-',
    meta: { type: 'number' },
  },
  { 
    id: 'countryId', 
    accessorKey: 'countryId', 
    header: 'Country', 
    cell: (info) => {
      const countryId = info.getValue()
      // You can enhance this to show country name
      return countryId ? countryId.substring(0, 8) + '...' : '-'
    }
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

export default function LocationListPage() {
  const navigate = useNavigate()
  const [countries, setCountries] = useState([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  
  // Get permissions for Location section
  const { getSectionPermissions, isLoading, permissionsData } = usePermissionCheck()
  
  const permissions = useMemo(() => {
    // Use CODE_COUNTRY permissions for Location (same permissions)
    const perms = getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS)
    
    // Debug logging
    console.log('🔍 Locations Page - Permissions (using Country permissions):', perms)
    
    return perms
  }, [getSectionPermissions])

  const canCreate = permissions.canCreate
  const canUpdate = permissions.canUpdate
  const canDelete = permissions.canDelete
  const canList = permissions.canList

  // Fetch countries for dropdown
  useEffect(() => {
    let isMounted = true // ✅ Cleanup flag to prevent double calls in StrictMode
    
    const fetchCountries = async () => {
      setLoadingCountries(true)
      try {
        const { data } = await api.post('/access/api/code-countries/filter', {
          criteria: [{ 
            key: 'isActive', 
            operator: 'EQUAL', 
            value: true,
            dataType: 'BOOLEAN' // ✅ Specify data type for correct comparison
          }]
        }, {
          params: { page: 0, size: 1000 }
        })
        
        if (isMounted) {
          setCountries(data.content || [])
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load countries:', err)
          toast.error('Failed to load countries')
        }
      } finally {
        if (isMounted) {
          setLoadingCountries(false)
        }
      }
    }
    
    fetchCountries()
    
    // ✅ Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false
    }
  }, [])

  const locationFields = useMemo(() => [
    { 
      type: 'select', 
      name: 'countryId', 
      label: 'Country', 
      required: true,
      options: countries.map(c => ({ value: c.countryId, label: c.name })),
      loading: loadingCountries
    },
    { type: 'text', name: 'code', label: 'Location Code', required: true, placeholder: 'e.g., LOC001' },
    { type: 'text', name: 'name', label: 'Location Name', required: true },
    { type: 'number', name: 'level', label: 'Level', placeholder: '0 = root, 1 = province, 2 = city...' },
    { type: 'text', name: 'parentLocationId', label: 'Parent Location ID (optional)', placeholder: 'UUID' },
    { type: 'text', name: 'lineagePath', label: 'Lineage Path', placeholder: 'e.g., /country/province/city' },
    { type: 'number', name: 'latitude', label: 'Latitude', step: 'any', placeholder: 'e.g., 33.5138' },
    { type: 'number', name: 'longitude', label: 'Longitude', step: 'any', placeholder: 'e.g., 36.2765' },
    { type: 'checkbox', name: 'isActive', label: 'Active', defaultValue: true },
  ], [countries, loadingCountries])

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
            You don't have permission to view Locations.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <CrudPage
        title="Locations"
        service="access"
        resourceBase="/api/locations"
        idKey="locationId"
        columns={locationColumns}
        pageSize={25}
        formFields={locationFields}
        enableCreate={canCreate}
        enableEdit={canUpdate}
        enableDelete={canDelete}
        showAddButton={canCreate}
        tableId="locations-list"
        toCreatePayload={(f) => ({
          countryId: f.countryId,
          code: f.code?.trim(),
          name: f.name?.trim(),
          level: f.level ? parseInt(f.level) : null,
          parentLocationId: f.parentLocationId?.trim() || null,
          lineagePath: f.lineagePath?.trim() || null,
          latitude: f.latitude ? parseFloat(f.latitude) : null,
          longitude: f.longitude ? parseFloat(f.longitude) : null,
          isActive: true, // ✅ Always TRUE for new records
        })}
        toUpdatePayload={(f, row) => ({
          locationId: row.locationId,
          countryId: f.countryId,
          code: f.code?.trim(),
          name: f.name?.trim(),
          level: f.level ? parseInt(f.level) : null,
          parentLocationId: f.parentLocationId?.trim() || null,
          lineagePath: f.lineagePath?.trim() || null,
          latitude: f.latitude ? parseFloat(f.latitude) : null,
          longitude: f.longitude ? parseFloat(f.longitude) : null,
          isActive: true, // ✅ Always TRUE - cannot be deactivated
          ...(row.rowVersion != null ? { rowVersion: row.rowVersion } : {}),
        })}
        onRowClick={(row) => navigate(`/cms/location/${row.locationId}`)}
      />
    </div>
  )
}

