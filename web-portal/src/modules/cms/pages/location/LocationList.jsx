import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import LocationImportModal from '../../components/LocationImportModal'
import LocationCreateModal from '../../components/LocationCreateModal'
import { FileSpreadsheet, Plus } from 'lucide-react'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

const LEVEL_LABELS = {
  0: 'Governorate',
  1: 'District',
  2: 'Subdistrict',
  3: 'Community',
  4: 'Neighborhood',
}

// Columns will be built inside the component to access country names

export default function LocationListPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [countries, setCountries] = useState([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const countryNameById = useMemo(() => Object.fromEntries((countries || []).map(c => [c.countryId, c.name])), [countries])
  
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

  const LEVEL_OPTIONS = [
    { value: 0, label: 'Governorate' },
    { value: 1, label: 'District' },
    { value: 2, label: 'Subdistrict' },
    { value: 3, label: 'Community' },
    { value: 4, label: 'Neighborhood' },
  ]

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1)
    toast.success('Location created successfully')
  }

  const handleImportSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleCreateSubmit = async (payload) => {
    try {
      await api.post('/access/api/locations', payload)
      handleCreateSuccess()
      setCreateModalOpen(false)
    } catch (err) {
      const errorMsg = err?.response?.data?.message || 'Failed to create location'
      toast.error(errorMsg)
      throw err
    }
  }

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

  const columns = useMemo(() => [
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
      cell: (info) => {
        const v = info.getValue()
        if (v === null || v === undefined || v === '') return '-'
        return LEVEL_LABELS[v] ?? `Level ${v}`
      },
      meta: { type: 'string', enumValues: Object.values(LEVEL_LABELS) },
    },
    { 
      id: 'countryId', 
      accessorKey: 'countryId', 
      header: 'Country', 
      cell: (info) => {
        const countryId = info.getValue()
        return countryId ? (countryNameById[countryId] || countryId.substring(0, 8) + '...') : '-'
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
  ], [countryNameById])

  return (
    <div className="p-6">
      <div className="mb-4">
        <CMSBreadcrumb />
      </div>
      <CrudPage
        title={t('cms.location') || 'Locations'}
        service="access"
        resourceBase="/api/locations"
        idKey="locationId"
        columns={columns}
        pageSize={25}
        enableCreate={false} // Disable default create, use custom modal
        enableEdit={canUpdate}
        enableDelete={canDelete}
        showAddButton={false} // Hide default button
        tableId="locations-list"
        key={refreshKey} // Force refresh when key changes
        renderHeaderRight={() => (
          <div className="flex items-center gap-2">
            {canCreate && (
              <>
                <button
                  onClick={() => setImportModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  title="Import from Excel"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Import Excel</span>
                </button>
                <button
                  onClick={() => {
                    try {
                      setCreateModalOpen(true)
                    } catch (error) {
                      console.error('Error opening create modal:', error)
                      toast.error('Failed to open create form. Please try again.')
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  title="Create New Location"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Location</span>
                </button>
              </>
            )}
          </div>
        )}
        toUpdatePayload={(f, row) => ({
          locationId: row.locationId,
          countryId: f.countryId,
          code: f.code?.trim(),
          name: f.name?.trim(),
          level: f.level === '' || f.level === undefined || f.level === null ? null : parseInt(f.level),
          parentLocationId: f.parentLocationId || null,
          lineagePath: f.lineagePath?.trim() || null,
          latitude: f.latitude ? parseFloat(f.latitude) : null,
          longitude: f.longitude ? parseFloat(f.longitude) : null,
          isActive: true, // ✅ Always TRUE - cannot be deactivated
          ...(row.rowVersion != null ? { rowVersion: row.rowVersion } : {}),
        })}
        onRowClick={(row) => navigate(`/cms/location/${row.locationId}`)}
      />

      {/* Import Modal */}
      <LocationImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Create Modal */}
      {createModalOpen && (
        <LocationCreateModal
          open={createModalOpen}
          mode="create"
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}
    </div>
  )
}

