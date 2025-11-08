import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Select from 'react-select'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import { useOrganizationTypes } from '@/hooks/useOrganizationTypes'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/axios'

// Add custom CSS for map tooltips
if (typeof document !== 'undefined' && !document.getElementById('org-map-styles')) {
  const style = document.createElement('style')
  style.id = 'org-map-styles'
  style.textContent = `
    .branch-tooltip {
      background-color: rgba(37, 99, 235, 0.95) !important;
      border: 2px solid white !important;
      border-radius: 8px !important;
      padding: 6px 12px !important;
      font-weight: 600 !important;
      font-size: 13px !important;
      color: white !important;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2) !important;
    }
    .branch-tooltip::before {
      border-top-color: rgba(37, 99, 235, 0.95) !important;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px !important;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15) !important;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }
  `
  document.head.appendChild(style)
}

const organizationColumns = [
  { 
    id: 'code', 
    accessorKey: 'code', 
    header: 'Code',
    cell: (info) => info.getValue() || '-'
  },
  { 
    id: 'name', 
    accessorKey: 'name', 
    header: 'Organization Name',
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
    id: 'websiteUrl', 
    accessorKey: 'websiteUrl', 
    header: 'Website', 
    cell: (info) => info.getValue() ? (
      <a href={info.getValue()} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
        {info.getValue()}
      </a>
    ) : '-'
  },
  { 
    id: 'email', 
    accessorKey: 'email', 
    header: 'Email', 
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

// Fields will be defined in component to use organizationTypes hook
const getOrganizationFields = (organizationTypes) => [
  { type: 'text', name: 'code', label: 'Organization Code', required: true, maxLength: 50 },
  { type: 'text', name: 'name', label: 'Organization Name', required: true },
  { 
    type: 'select', 
    name: 'organizationTypeId', 
    label: 'Organization Type',
    options: organizationTypes,
    placeholder: 'Select organization type...'
  },
  { type: 'text', name: 'websiteUrl', label: 'Website', placeholder: 'https://example.org' },
  { type: 'text', name: 'email', label: 'Email', placeholder: 'contact@example.org' },
  { type: 'text', name: 'phone', label: 'Phone', placeholder: '+1234567890' },
  { type: 'textarea', name: 'description', label: 'Description', rows: 3 },
  { type: 'checkbox', name: 'isActive', label: 'Active', defaultValue: true },
]

export default function OrganizationListPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  // Get permissions
  const { getSectionPermissions, isLoading } = usePermissionCheck()
  
  // Get organization types for dropdown
  const { organizationTypes, loading: typesLoading } = useOrganizationTypes('en')
  
  const permissions = useMemo(() => {
    const perms = getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS)
    console.log('🔍 Organizations Page - Permissions:', perms)
    return perms
  }, [getSectionPermissions])

  const canCreate = permissions.canCreate
  const canUpdate = permissions.canUpdate
  const canDelete = permissions.canDelete
  const canList = permissions.canList
  
  // Map state
  const [showMap, setShowMap] = useState(false)
  const [selectedCountries, setSelectedCountries] = useState([])
  const [selectedOrganizations, setSelectedOrganizations] = useState([])
  const [selectedLocations, setSelectedLocations] = useState([])
  const [appliedFilters, setAppliedFilters] = useState({
    countries: [],
    organizations: [],
    locations: []
  })
  const [countries, setCountries] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [locations, setLocations] = useState([])
  const [branches, setBranches] = useState([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  
  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })),
    [countries]
  )

  // Ref to store map instance
  const mapRef = React.useRef(null)
  const markersRef = React.useRef([])
  
  // Generate form fields with organization types
  const organizationFields = useMemo(() => 
    getOrganizationFields(organizationTypes),
    [organizationTypes]
  )

  // Load dropdown data (countries, organizations, locations)
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [countriesRes, organizationsRes, locationsRes] = await Promise.all([
          api.post('/access/api/code-countries/filter', {
            criteria: []
          }, { params: { page: 0, size: 1000 } }),
          api.post('/access/api/organizations/filter', {
            criteria: []
          }, { params: { page: 0, size: 1000 } }),
          api.post('/access/api/locations/filter', {
            criteria: []
          }, { params: { page: 0, size: 1000 } })
        ])
        
        setCountries((countriesRes.data.content || []).filter(item => item.isActive !== false))
        setOrganizations((organizationsRes.data.content || []).filter(item => item.isActive !== false))
        setLocations((locationsRes.data.content || []).filter(item => item.isActive !== false))
      } catch (error) {
        console.error('Failed to fetch dropdown data:', error)
      }
    }
    fetchDropdownData()
  }, [])

  // Load branches when applied filters change
  useEffect(() => {
    // If no filter is applied, don't load branches
    if (!appliedFilters.countries.length && !appliedFilters.organizations.length && !appliedFilters.locations.length) {
      setBranches([])
      return
    }

    let isMounted = true // Track if component is still mounted

    const fetchBranches = async () => {
      setLoadingBranches(true)
      try {
        console.log('🔄 Fetching branches with filters:', appliedFilters)

        // Strategy: Fetch all branches then filter on client side
        const res = await api.post('/access/api/organization-branches/filter', {
          criteria: [] // Get all branches
        }, { params: { page: 0, size: 10000 } })

        if (!isMounted) return // Don't update state if component unmounted

        let allBranches = (res.data.content || [])
          .filter(b => b.isActive !== false && b.latitude != null && b.longitude != null)

        console.log(`📊 Total branches with coordinates: ${allBranches.length}`)

        // Apply client-side filtering
        const filteredBranches = allBranches.filter(branch => {
          // Check if branch matches any selected country
          const countryMatches = appliedFilters.countries.length === 0 ||
                                 appliedFilters.countries.includes(branch.countryId)

          // Check if branch matches any selected organization
          const organizationMatches = appliedFilters.organizations.length === 0 ||
                                      appliedFilters.organizations.includes(branch.organizationId)

          // Check if branch matches any selected location
          const locationMatches = appliedFilters.locations.length === 0 ||
                                  appliedFilters.locations.includes(branch.locationId)

          // Return true if at least one filter type matches (OR logic)
          return countryMatches || organizationMatches || locationMatches
        })

        console.log(`✅ Filtered branches: ${filteredBranches.length}`)
        setBranches(filteredBranches)
      } catch (error) {
        console.error('❌ Failed to fetch branches:', error)
        if (isMounted) {
          toast.error('Failed to load branches. Please try again.')
          setBranches([])
        }
      } finally {
        if (isMounted) {
          setLoadingBranches(false)
        }
      }
    }

    fetchBranches()

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [appliedFilters])

  // Initialize and update map when branches change
  useEffect(() => {
    if (!showMap || branches.length === 0) {
      // Clear markers if map exists but no branches
      if (mapRef.current && showMap) {
        markersRef.current.forEach(m => {
          try {
            mapRef.current.removeLayer(m)
          } catch (e) {}
        })
        markersRef.current = []
      }
      return
    }

    // IMPORTANT: Destroy old map instance completely before creating new one
    if (mapRef.current) {
      console.log('🗑️ Destroying old map instance')
      try {
        mapRef.current.remove()
      } catch (e) {
        console.error('❌ Error removing map:', e)
      }
      mapRef.current = null
      markersRef.current = []
    }

    const initAndUpdateMap = async () => {
      // Load Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Load Leaflet JS
      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          script.async = true
          script.onload = resolve
          script.onerror = reject
          document.body.appendChild(script)
        })
      }

      // Wait for DOM and initialize map
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            const L = window.L
            if (!L) {
              console.error('❌ Leaflet not loaded')
              return
            }

            const containerId = 'org-branches-map'
            const node = document.getElementById(containerId)
            console.log(`🔎 Looking for DOM node with id "${containerId}":`, node)
            console.log(`📊 Node visible? offsetParent:`, node?.offsetParent, 'offsetHeight:', node?.offsetHeight)

            if (!node) {
              console.error('❌ Map container not found in DOM')
              return
            }

            let map = mapRef.current

            // Create map since we destroyed it earlier
            if (!map) {
              console.log('🆕 Creating new map instance')
              if (node._leaflet_id) {
                delete node._leaflet_id
              }

              map = L.map(containerId).setView([25.276987, 55.296249], 3)
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
              }).addTo(map)

              mapRef.current = map
              console.log('✅ Map created successfully')
            }

            // Invalidate size
            map.invalidateSize(false)

            // Add new markers
            console.log(`📍 Adding ${branches.length} markers to map`)
            branches.forEach((branch, i) => {
              if (branch.latitude && branch.longitude) {
                const marker = L.marker([branch.latitude, branch.longitude]).addTo(map)

                const branchName = branch.name.length > 30
                  ? branch.name.substring(0, 27) + '...'
                  : branch.name

                marker.bindTooltip(branchName, {
                  permanent: false,
                  direction: 'top',
                  className: 'branch-tooltip'
                })

                const popupContent = `
                  <div class="p-2">
                    <h4 class="font-bold text-blue-600 mb-1 cursor-pointer hover:underline" onclick="window.open('/cms/organization-branches/${branch.organizationBranchId}', '_blank')" style="cursor: pointer;">
                      ${branch.name}
                    </h4>
                    <p class="text-xs text-gray-600 mb-1"><strong>Code:</strong> ${branch.code || '-'}</p>
                    <p class="text-xs text-gray-600 mb-1"><strong>Address:</strong> ${branch.address || '-'}</p>
                    ${branch.isHeadquarter ? '<span class="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">Headquarter</span>' : ''}
                    <button
                      onclick="window.open('/cms/organization-branches/${branch.organizationBranchId}', '_blank')"
                      class="mt-2 w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition flex items-center justify-center gap-1"
                      style="cursor: pointer;"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Details
                    </button>
                  </div>
                `
                marker.bindPopup(popupContent)

                marker.on('click', () => {
                  window.open(`/cms/organization-branches/${branch.organizationBranchId}`, '_blank')
                })

                markersRef.current.push(marker)
                console.log(`  ✓ ${i + 1}. ${branch.name}`)
              }
            })

            // Fit map to markers
            if (markersRef.current.length > 0) {
              try {
                const boundsArray = branches
                  .filter(b => b.latitude && b.longitude)
                  .map(b => [parseFloat(b.latitude), parseFloat(b.longitude)])

                if (boundsArray.length > 0) {
                  const bounds = L.latLngBounds(boundsArray)
                  map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
                  console.log(`✅ fitBounds applied successfully`)
                }
              } catch (boundsErr) {
                console.error('❌ Bounds error:', boundsErr)
              }
            }

            console.log(`✅ ${markersRef.current.length} markers displayed on map`)
          } catch (err) {
            console.error('❌ Map error:', err)
          }
        }, 300)
      })
    }

    initAndUpdateMap()

    // Cleanup
    return () => {
      if (!showMap && mapRef.current) {
        try {
          mapRef.current.remove()
          mapRef.current = null
          markersRef.current = []
        } catch (e) {}
      }
    }
  }, [showMap, branches])

  // Show loading state while fetching permissions or types
  if (isLoading || typesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Show message if no list permission
  if (!canList) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">You don't have permission to view organizations</div>
      </div>
    )
  }

  const toCreatePayload = (formData) => ({
    code: formData.code,
    name: formData.name,
    organizationTypeId: formData.organizationTypeId || null,
    websiteUrl: formData.websiteUrl || null,
    email: formData.email || null,
    phone: formData.phone || null,
    description: formData.description || null,
    isActive: formData.isActive !== false, // Default to true
  })

  const toUpdatePayload = (formData) => ({
    organizationId: formData.organizationId,
    code: formData.code,
    name: formData.name,
    organizationTypeId: formData.organizationTypeId || null,
    websiteUrl: formData.websiteUrl || null,
    email: formData.email || null,
    phone: formData.phone || null,
    description: formData.description || null,
    isActive: formData.isActive !== false,
    rowVersion: formData.rowVersion,
  })

  const handleRowClick = (row) => {
    navigate(`/cms/organizations/${row.organizationId}`)
  }

  const handleShowResults = () => {
    // Check if at least one filter is selected
    if (!selectedCountries.length && !selectedOrganizations.length && !selectedLocations.length) {
      toast.error('Please select at least one filter (Country, Organization, or Location)')
      return
    }
    
    // Apply the filters (extract IDs)
    setAppliedFilters({
      countries: selectedCountries.map(c => c.value),
      organizations: selectedOrganizations.map(o => o.value),
      locations: selectedLocations.map(l => l.value)
    })
  }

  const handleClearFilters = () => {
    setSelectedCountries([])
    setSelectedOrganizations([])
    setSelectedLocations([])
    setAppliedFilters({
      countries: [],
      organizations: [],
      locations: []
    })
    setBranches([])
  }

  // Custom styles for react-select
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderWidth: '2px',
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#3b82f6' : '#9ca3af',
      },
      minHeight: '42px',
      borderRadius: '0.5rem',
      padding: '2px 8px',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#dbeafe',
      borderRadius: '0.375rem',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#1e40af',
      fontWeight: '600',
      fontSize: '0.875rem',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#3b82f6',
      ':hover': {
        backgroundColor: '#3b82f6',
        color: 'white',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#3b82f6' 
        : state.isFocused 
        ? '#dbeafe' 
        : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      cursor: 'pointer',
      fontWeight: state.isSelected ? '600' : '500',
      '&:active': {
        backgroundColor: '#2563eb',
      },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 50,
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
      fontWeight: '500',
    }),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <CMSBreadcrumb />
        </div>

        {/* Map View Toggle and Filters */}
        <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-5">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMap(!showMap)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  showMap 
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {showMap ? 'Hide Map' : 'Show Map'}
              </button>
            </div>

            {showMap && (
              <>
                <div className="flex-1 min-w-[280px]">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🌍 Countries (Optional - Multi-Select)
                  </label>
                  <Select
                    isMulti
                    value={selectedCountries}
                    onChange={(selected) => setSelectedCountries(selected || [])}
                    options={sortedCountries.map(c => ({ value: c.countryId, label: c.name }))}
                    placeholder="Search and select countries..."
                    isClearable
                    isSearchable
                    styles={selectStyles}
                    noOptionsMessage={() => 'No countries found'}
                    closeMenuOnSelect={false}
                  />
                </div>

                <div className="flex-1 min-w-[280px]">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🏢 Organizations (Optional - Multi-Select)
                  </label>
                  <Select
                    isMulti
                    value={selectedOrganizations}
                    onChange={(selected) => setSelectedOrganizations(selected || [])}
                    options={organizations.map(org => ({ value: org.organizationId, label: org.name }))}
                    placeholder="Search and select organizations..."
                    isClearable
                    isSearchable
                    styles={selectStyles}
                    noOptionsMessage={() => 'No organizations found'}
                    closeMenuOnSelect={false}
                  />
                </div>

                <div className="flex-1 min-w-[280px]">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📍 Locations (Optional - Multi-Select)
                  </label>
                  <Select
                    isMulti
                    value={selectedLocations}
                    onChange={(selected) => setSelectedLocations(selected || [])}
                    options={locations.map(loc => ({ value: loc.locationId, label: loc.name }))}
                    placeholder="Search and select locations..."
                    isClearable
                    isSearchable
                    styles={selectStyles}
                    noOptionsMessage={() => 'No locations found'}
                    closeMenuOnSelect={false}
                  />
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {showMap && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleShowResults}
                disabled={!selectedCountries.length && !selectedOrganizations.length && !selectedLocations.length}
                className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 shadow-md ${
                  selectedCountries.length || selectedOrganizations.length || selectedLocations.length
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Show Results
              </button>

              {(appliedFilters.countries.length > 0 || appliedFilters.organizations.length > 0 || appliedFilters.locations.length > 0) && (
                <>
                  <button
                    onClick={handleClearFilters}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Filters
                  </button>

                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-blue-800">
                      {loadingBranches ? 'Loading branches...' : `${branches.length} branch(es) found`}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Map Container - Always in DOM to preserve Leaflet instance */}
          <div
            className={`transition-all duration-300 ${
              showMap && (appliedFilters.countries.length > 0 || appliedFilters.organizations.length > 0 || appliedFilters.locations.length > 0)
                ? 'mt-5 animate-fadeIn'
                : 'hidden'
            }`}
          >
            {loadingBranches ? (
              <div className="h-[500px] bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-600">Loading branches...</p>
                </div>
              </div>
            ) : branches.length === 0 ? (
              <div className="h-[300px] bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p className="text-gray-500 font-medium">No branches found with selected filters</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your filter selections</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Map div always in DOM - preserved across renders */}
                <div id="org-branches-map" className="h-[500px] w-full rounded-xl shadow-lg border-2 border-gray-200"></div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{branches.length}</span> branches displayed on map • Click any marker to view details
                  </div>
                  <button
                    onClick={() => setShowMap(false)}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Close Map
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Message when map is shown but no results yet */}
          {showMap && !appliedFilters.countries.length && !appliedFilters.organizations.length && !appliedFilters.locations.length && (
            <div className="mt-5 animate-fadeIn">
              <div className="h-[300px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-300 flex items-center justify-center">
                <div className="text-center px-6">
                  <svg className="w-20 h-20 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <p className="text-blue-700 font-bold text-lg mb-2">Select Filters to View Branches</p>
                  <p className="text-blue-600 text-sm mb-3">
                    🔍 Use searchable multi-select dropdowns above to choose filters
                  </p>
                  <p className="text-blue-600 text-sm mb-3">
                    ✅ You can select multiple options from each filter (Countries, Organizations, Locations)
                  </p>
                  <p className="text-blue-500 text-sm font-semibold">
                    🚀 Then click "Show Results" to display branches on the map
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <CrudPage
          title={t('cms.organizations') || 'Organizations'}
          service="access"
          resourceBase="/api/organizations"
          idKey="organizationId"
          columns={organizationColumns}
          formFields={organizationFields}
          toCreatePayload={toCreatePayload}
          toUpdatePayload={toUpdatePayload}
          pageSize={10}
          enableCreate={canCreate}
          enableEdit={canUpdate}
          enableDelete={canDelete}
          onRowClick={handleRowClick}
          tableId="organizations-list"
        />
      </div>
    </div>
  )
}

