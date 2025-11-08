import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import { api } from '@/lib/axios'
import { useBranchTypes } from '@/hooks/useBranchTypes'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

function OrganizationBranchCreateModal({ open, onClose, onSuccess, organizations, countries, locations, branchTypes }) {
  const [busy, setBusy] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [form, setForm] = useState({
    code: '',
    name: '',
    organizationId: '',
    countryId: '',
    locationId: '',
    branchTypeId: '',
    address: '',
    latitude: '',
    longitude: '',
    isHeadquarter: false,
  })

  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })),
    [countries]
  )

  // Lazy-load Leaflet when map opens
  useEffect(() => {
    if (!showMap) return
    const ensureLeaflet = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
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
      setTimeout(() => {
        try {
          const L = window.L
          const containerId = 'org-branch-create-map'
          const node = document.getElementById(containerId)
          if (!L || !node) return
          if (node._leaflet_id) node._leaflet_id = null
          const lat = form.latitude ? parseFloat(form.latitude) : null
          const lng = form.longitude ? parseFloat(form.longitude) : null
          const center = (lat != null && !Number.isNaN(lat) && lng != null && !Number.isNaN(lng))
            ? [lat, lng]
            : [25.276987, 55.296249]
          const zoom = (lat != null && lng != null) ? 10 : 3
          const map = L.map(containerId).setView(center, zoom)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map)
          let marker = null
          if (lat != null && lng != null) marker = L.marker([lat, lng]).addTo(map)
          map.on('click', (e) => {
            const { lat: la, lng: lo } = e.latlng
            setForm(prev => ({ ...prev, latitude: la, longitude: lo }))
            if (!marker) marker = L.marker([la, lo]).addTo(map)
            else marker.setLatLng([la, lo])
          })
        } catch (_) {}
      }, 0)
    }
    ensureLeaflet()
  }, [showMap, form.latitude, form.longitude])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/access/api/organization-branches', {
        code: form.code?.trim(),
        name: form.name?.trim(),
        organizationId: form.organizationId || null,
        countryId: form.countryId || null,
        locationId: form.locationId || null,
        branchTypeId: form.branchTypeId || null,
        address: form.address?.trim() || null,
        latitude: form.latitude !== '' ? parseFloat(form.latitude) : null,
        longitude: form.longitude !== '' ? parseFloat(form.longitude) : null,
        isHeadquarter: !!form.isHeadquarter,
        isActive: true,
      })
      onSuccess?.()
    } catch (err) {
      console.error('Create branch failed', err)
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Create Organization Branch</h3>
            <button onClick={onClose} className="text-white/90 hover:text-white">✕</button>
          </div>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input className="w-full px-3 py-2 border rounded-md" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label>
              <input className="w-full px-3 py-2 border rounded-md" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
              <select className="w-full px-3 py-2 border rounded-md" value={form.organizationId} onChange={e=>setForm(f=>({...f,organizationId:e.target.value}))} required>
                <option value="">-- Select Organization --</option>
                {organizations.map(org => (
                  <option key={org.organizationId} value={org.organizationId}>{org.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <select className="w-full px-3 py-2 border rounded-md" value={form.countryId} onChange={e=>setForm(f=>({...f,countryId:e.target.value}))} required>
                <option value="">-- Select Country --</option>
                {sortedCountries.map(c => (
                  <option key={c.countryId} value={c.countryId}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <select className="w-full px-3 py-2 border rounded-md" value={form.locationId} onChange={e=>setForm(f=>({...f,locationId:e.target.value}))} required>
                <option value="">-- Select Location --</option>
                {locations.map(l => (
                  <option key={l.locationId} value={l.locationId}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch Type</label>
              <select className="w-full px-3 py-2 border rounded-md" value={form.branchTypeId} onChange={e=>setForm(f=>({...f,branchTypeId:e.target.value}))}>
                <option value="">-- Select Branch Type --</option>
                {branchTypes.map(bt => (
                  <option key={bt.value} value={bt.value}>{bt.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input className="w-full px-3 py-2 border rounded-md" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input type="number" step="any" className="w-full px-3 py-2 border rounded-md" value={form.latitude} onChange={e=>setForm(f=>({...f,latitude:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input type="number" step="any" className="w-full px-3 py-2 border rounded-md" value={form.longitude} onChange={e=>setForm(f=>({...f,longitude:e.target.value}))} />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <button type="button" onClick={() => setShowMap(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Choose on Map</button>
              {form.latitude !== '' && form.longitude !== '' && (
                <span className="text-sm text-gray-600">Selected: {Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)}</span>
              )}
              <label className="ml-auto flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isHeadquarter} onChange={e=>setForm(f=>({...f,isHeadquarter:e.target.checked}))} />
                Is Headquarter
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" disabled={busy} className="px-4 py-2 bg-blue-600 text-white rounded-md">{busy ? 'Saving...' : 'Create'}</button>
          </div>
        </form>

        {showMap && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
               onClick={(e)=>{ if (e.target === e.currentTarget) setShowMap(false) }}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 flex items-center justify-between">
                <h4 className="text-white font-semibold">Pick Location</h4>
                <button onClick={()=>setShowMap(false)} className="text-white/90 hover:text-white">✕</button>
              </div>
              <div className="p-4">
                <div id="org-branch-create-map" className="h-[480px] w-full rounded-lg border" />
                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                  <div>Click on the map to set latitude/longitude.</div>
                  <div className="flex items-center gap-2">
                    <span>
                      {form.latitude !== '' && form.longitude !== ''
                        ? `${Number(form.latitude).toFixed(6)}, ${Number(form.longitude).toFixed(6)}`
                        : 'No location selected'}
                    </span>
                    <button type="button" onClick={()=>setShowMap(false)} className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">Use This Location</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Columns will be defined inside component to access dropdown data
const createOrganizationBranchColumns = (organizations, countries, locations, branchTypes) => [
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
    id: 'organization',
    accessorKey: 'organizationId',
    header: 'Organization',
    cell: (info) => {
      const orgId = info.getValue()
      const org = organizations.find(o => o.organizationId === orgId)
      return (
        <span className="text-gray-700">
          {org?.name || '-'}
        </span>
      )
    }
  },
  {
    id: 'country',
    accessorKey: 'countryId',
    header: 'Country',
    cell: (info) => {
      const countryId = info.getValue()
      const country = countries.find(c => c.countryId === countryId)
      return (
        <span className="text-gray-700">
          {country?.name || '-'}
        </span>
      )
    }
  },
  {
    id: 'location',
    accessorKey: 'locationId',
    header: 'Location',
    cell: (info) => {
      const locationId = info.getValue()
      const location = locations.find(l => l.locationId === locationId)
      return (
        <span className="text-gray-700">
          {location?.name || '-'}
        </span>
      )
    }
  },
  {
    id: 'branchType',
    accessorKey: 'branchTypeId',
    header: 'Branch Type',
    cell: (info) => {
      const branchTypeId = info.getValue()
      const branchType = branchTypes.find(bt => bt.value === branchTypeId)
      return (
        <span className="text-gray-700">
          {branchType?.label || '-'}
        </span>
      )
    }
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
  const { t } = useTranslation()
  
  // Dropdown data
  const [organizations, setOrganizations] = useState([])
  const [countries, setCountries] = useState([])
  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })),
    [countries]
  )

  const [locations, setLocations] = useState([])
  
  // Get branch types from hook
  const { branchTypes, loading: typesLoading } = useBranchTypes('en')
  
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
          // Fetch real Organizations (not code table)
          api.post('/access/api/organizations/filter', {
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

  // Define columns with dropdown data access
  const organizationBranchColumns = useMemo(() => 
    createOrganizationBranchColumns(organizations, countries, locations, branchTypes),
    [organizations, countries, locations, branchTypes]
  )

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
        ...sortedCountries.map(country => ({ value: country.countryId, label: country.name }))
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
    { 
      type: 'select', 
      name: 'branchTypeId', 
      label: 'Branch Type',
      options: [
        { value: '', label: '-- Select Branch Type --' },
        ...branchTypes.map(type => ({ value: type.value, label: type.label }))
      ]
    },
    { type: 'textarea', name: 'address', label: 'Address' },
    { type: 'number', name: 'latitude', label: 'Latitude', step: 'any' },
    { type: 'number', name: 'longitude', label: 'Longitude', step: 'any' },
    { type: 'checkbox', name: 'isHeadquarter', label: 'Is Headquarter', defaultValue: false },
    // ✅ isActive removed - always TRUE by default
  ], [organizations, countries, locations, branchTypes])

  // Show loading state while fetching permissions or branch types
  if (isLoading || typesLoading) {
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
      <div className="px-4 pt-4">
        <CMSBreadcrumb />
      </div>
      <CrudPage
        title={t('cms.organization-branches') || 'Organization Branches'}
        service="access"
        resourceBase="/api/organization-branches"
        idKey="organizationBranchId"
        columns={organizationBranchColumns}
        formFields={organizationBranchFields}
        enableCreate={canCreate}
        enableEdit={canUpdate}
        enableDelete={canDelete}
        onRowClick={handleRowClick}
        toCreatePayload={toCreatePayload}
        toUpdatePayload={toUpdatePayload}
        tableId="organization-branches"
        renderCreate={({ open, onClose, onSuccess }) => (
          <OrganizationBranchCreateModal
            open={open}
            onClose={onClose}
            onSuccess={onSuccess}
            organizations={organizations}
            countries={sortedCountries}
            locations={locations}
            branchTypes={branchTypes}
          />
        )}
      />
    </div>
  )
}


