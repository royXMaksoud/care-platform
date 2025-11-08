import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import { useBranchTypes } from '@/hooks/useBranchTypes'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

// Static columns and fields - defined outside component
const languageColumns = [
  { id: 'language', accessorKey: 'language', header: 'Language', cell: (info) => info.getValue() },
  { id: 'name', accessorKey: 'name', header: 'Name', cell: (info) => info.getValue() },
  { id: 'description', accessorKey: 'description', header: 'Description', cell: (info) => info.getValue() || '-' },
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
]

const languageFields = [
  { type: 'text', name: 'language', label: 'Language Code', required: true, placeholder: 'e.g., en, ar, fr' },
  { type: 'text', name: 'name', label: 'Name', required: true },
  { type: 'textarea', name: 'description', label: 'Description', rows: 3 },
]

export default function OrganizationBranchDetailsPage() {
  const { organizationBranchId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('info')
  const [branch, setBranch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dropdownData, setDropdownData] = useState({
    organizations: [],
    countries: [],
    locations: []
  })

  const sortedCountries = useMemo(
    () => [...dropdownData.countries].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })),
    [dropdownData.countries]
  )
  const [showMapPicker, setShowMapPicker] = useState(false)

  // Get permissions (using CODE_COUNTRY permissions)
  const { getSectionPermissions, isLoading: permissionsLoading } = usePermissionCheck()
  
  // Get branch types for dropdown
  const { branchTypes, loading: typesLoading } = useBranchTypes('en')
  
  const permissions = useMemo(() => 
    getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS),
    [getSectionPermissions]
  )

  const canUpdate = permissions.canUpdate
  const canDelete = permissions.canDelete
  const canManageLanguages = permissions.canCreate || permissions.canUpdate || permissions.canDelete
  
  // Fixed filters for organization branch languages - MUST be before any return statements
  const languageFixedFilters = useMemo(() => 
    organizationBranchId ? [
      {
        key: 'organizationBranchId',
        operator: 'EQUAL',
        value: organizationBranchId,
        dataType: 'UUID',
      },
    ] : [],
    [organizationBranchId]
  )
  
  // Find branch type name
  const branchTypeName = useMemo(() => {
    if (!branch?.branchTypeId || !branchTypes.length) return null
    const type = branchTypes.find(t => t.value === branch.branchTypeId)
    return type?.label || null
  }, [branch?.branchTypeId, branchTypes])

  // Fetch branch details and dropdown data
  useEffect(() => {
    fetchBranch()
    fetchDropdownData()
  }, [organizationBranchId])

  const fetchBranch = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/access/api/organization-branches/${organizationBranchId}`)
      setBranch(data)
      setFormData(data)
    } catch (err) {
      toast.error('Failed to load organization branch details')
      navigate('/cms/organization-branches')
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    let isMounted = true // ✅ Cleanup flag to prevent double calls in StrictMode
    
    try {
      const userLanguage = localStorage.getItem('userLanguage') || 'en'
      
      const [orgRes, countryRes, locRes] = await Promise.all([
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
        setDropdownData({
          organizations: (orgRes.data.content || []).filter(i => i.isActive !== false),
          countries: (countryRes.data.content || []).filter(i => i.isActive !== false),
          locations: (locRes.data.content || []).filter(i => i.isActive !== false)
        })
      }
    } catch (err) {
      if (isMounted) {
        console.error('Failed to load dropdown data:', err)
      }
    }
  }

  const handleUpdate = async () => {
    try {
      const payload = {
        organizationId: formData.organizationId || null,
        countryId: formData.countryId || null,
        locationId: formData.locationId || null,
        branchTypeId: formData.branchTypeId || null,
        code: formData.code?.trim(),
        name: formData.name?.trim(),
        address: formData.address?.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        isHeadquarter: formData.isHeadquarter || false,
        isActive: true, // ✅ Always TRUE
        rowVersion: formData.rowVersion,
      }
      
      await api.put(`/access/api/organization-branches/${organizationBranchId}`, payload)
      toast.success('Organization branch updated successfully')
      setEditing(false)
      fetchBranch()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update organization branch')
    }
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      // Delete organization branch with hard delete (permanent deletion from database)
      await api.delete(`/access/api/organization-branches/${organizationBranchId}?hardDelete=true`)
      
      toast.success('Organization branch deleted permanently')
      navigate('/cms/organization-branches')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete organization branch')
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // Close modal on Escape key or click outside
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showDeleteModal && !deleting) {
        setShowDeleteModal(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showDeleteModal, deleting])

  // Lazy-load Leaflet assets when opening the map picker
  useEffect(() => {
    if (!showMapPicker) return
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
      // Initialize map
      setTimeout(() => {
        try {
          const L = window.L
          if (!L) return
          const containerId = 'branch-map-picker'
          const existing = L && L.map && document.getElementById(containerId)
          if (!existing) return
          // If a map instance already exists on this node, clear it
          if (existing._leaflet_id) {
            existing._leaflet_id = null
          }
          const startLat = typeof formData.latitude === 'number' ? formData.latitude : (formData.latitude ? parseFloat(formData.latitude) : null)
          const startLng = typeof formData.longitude === 'number' ? formData.longitude : (formData.longitude ? parseFloat(formData.longitude) : null)
          const center = (startLat != null && !Number.isNaN(startLat) && startLng != null && !Number.isNaN(startLng))
            ? [startLat, startLng]
            : [25.276987, 55.296249] // Default: Dubai (neutral)
          const zoom = (startLat != null && startLng != null) ? 10 : 3
          const map = L.map(containerId).setView(center, zoom)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map)
          let marker = null
          if (startLat != null && startLng != null) {
            marker = L.marker(center).addTo(map)
          }
          map.on('click', (e) => {
            const { lat, lng } = e.latlng
            setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))
            if (!marker) {
              marker = L.marker([lat, lng]).addTo(map)
            } else {
              marker.setLatLng([lat, lng])
            }
          })
        } catch (_) {
          // noop
        }
      }, 0)
    }
    ensureLeaflet()
  }, [showMapPicker, formData.latitude, formData.longitude])

  if (loading || permissionsLoading || typesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-3"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!branch) {
    return <div className="p-6"><p>Organization branch not found</p></div>
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="px-6 pt-4">
        <CMSBreadcrumb currentPageLabel={branch?.name || t('cms.organization-branches')} />
      </div>
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/cms/organization-branches')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{branch.name}</h1>
            <p className="text-sm text-gray-500">Code: {branch.code} {branch.isHeadquarter && '• Headquarter'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'info' && (canUpdate || canDelete) && (
            <>
              {!editing ? (
                <div className="flex items-center gap-3">
                  {canUpdate && (
                    <button
                      onClick={() => setEditing(true)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
                    >
                      ✏️ Edit Branch
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold hover:from-red-700 hover:to-red-800 shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
                    >
                      🗑️ Delete Branch
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setFormData(branch)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Save Changes
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 border-b-2 font-medium transition ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Information
          </button>
          <button
            onClick={() => setActiveTab('languages')}
            className={`py-3 border-b-2 font-medium transition ${
              activeTab === 'languages'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Languages
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'info' && (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Branch Details</h2>
              <div className="grid grid-cols-2 gap-6">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Code</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{branch.code || '-'}</p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{branch.name || '-'}</p>
                  )}
                </div>

                {/* Organization */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                  {editing ? (
                    <select
                      value={formData.organizationId || ''}
                      onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Organization...</option>
                      {dropdownData.organizations.map(org => (
                        <option key={org.organizationId} value={org.organizationId}>{org.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {dropdownData.organizations.find(o => o.organizationId === branch.organizationId)?.name || '-'}
                    </p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  {editing ? (
                    <select
                      value={formData.countryId || ''}
                      onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Country...</option>
                      {sortedCountries.map(c => (
                        <option key={c.countryId} value={c.countryId}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {sortedCountries.find(c => c.countryId === branch.countryId)?.name || '-'}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  {editing ? (
                    <select
                      value={formData.locationId || ''}
                      onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Location...</option>
                      {dropdownData.locations.map(l => (
                        <option key={l.locationId} value={l.locationId}>{l.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {dropdownData.locations.find(l => l.locationId === branch.locationId)?.name || '-'}
                    </p>
                  )}
                </div>

                {/* Branch Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Type</label>
                  {editing ? (
                    <select
                      value={formData.branchTypeId || ''}
                      onChange={(e) => setFormData({ ...formData, branchTypeId: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Branch Type...</option>
                      {branchTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">{branchTypeName || '-'}</p>
                  )}
                </div>

                {/* Is Headquarter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Headquarter</label>
                  {editing ? (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isHeadquarter || false}
                        onChange={(e) => setFormData({ ...formData, isHeadquarter: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">Is Headquarter</span>
                    </label>
                  ) : (
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      branch.isHeadquarter 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {branch.isHeadquarter ? 'Yes' : 'No'}
                    </span>
                  )}
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  {editing ? (
                    <textarea
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{branch.address || '-'}</p>
                  )}
                </div>

                {/* Location Coordinates Section */}
                <div className="col-span-2">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <label className="text-sm font-semibold text-gray-700">Location Coordinates</label>
                      </div>
                      <div className="flex items-center gap-2">
                        {editing && (
                          <button
                            type="button"
                            onClick={() => setShowMapPicker(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-md transition-all transform hover:scale-105 font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Choose on Map
                          </button>
                        )}
                        {((editing ? formData.latitude : branch.latitude) != null && 
                          (editing ? formData.longitude : branch.longitude) != null) && (
                          <button
                            type="button"
                            onClick={() => setShowMapPicker(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 shadow-md transition-all transform hover:scale-105 font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Show on Map
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Latitude */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                        {editing ? (
                          <input
                            type="number"
                            step="any"
                            value={formData.latitude ?? ''}
                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="e.g., 33.513807"
                          />
                        ) : (
                          <p className="text-gray-900 bg-white px-3 py-2 rounded border border-gray-200 text-sm">
                            {branch.latitude ?? '-'}
                          </p>
                        )}
                      </div>

                      {/* Longitude */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                        {editing ? (
                          <input
                            type="number"
                            step="any"
                            value={formData.longitude ?? ''}
                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="e.g., 36.276528"
                          />
                        ) : (
                          <p className="text-gray-900 bg-white px-3 py-2 rounded border border-gray-200 text-sm">
                            {branch.longitude ?? '-'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Show selected coordinates */}
                    {(formData.latitude != null && formData.longitude != null) && (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Coordinates set: {Number(formData.latitude).toFixed(6)}, {Number(formData.longitude).toFixed(6)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status - Always Active */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created At:</span>
                    <span className="ml-2 text-gray-900">
                      {branch.createdAt ? new Date(branch.createdAt).toLocaleString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated At:</span>
                    <span className="ml-2 text-gray-900">
                      {branch.updatedAt ? new Date(branch.updatedAt).toLocaleString() : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'languages' && (
          <div className="p-6">
            <CrudPage
              title="Branch Languages"
              service="access"
              resourceBase="/api/organization-branch-languages"
              idKey="organizationBranchLanguageId"
              columns={languageColumns}
              pageSize={25}
              formFields={languageFields}
              enableCreate={canManageLanguages}
              enableEdit={canManageLanguages}
              enableDelete={canManageLanguages}
              showAddButton={canManageLanguages}
              tableId={`organization-branch-languages-${organizationBranchId}`}
              fixedFilters={languageFixedFilters}
              queryParams={{ organizationBranchId }}
              toCreatePayload={(f) => ({
                organizationBranchId,
                language: f.language?.trim(),
                name: f.name?.trim(),
                description: f.description?.trim() || null,
                isActive: true, // ✅ Always TRUE
              })}
              toUpdatePayload={(f, row) => ({
                organizationBranchLanguageId: row.organizationBranchLanguageId,
                organizationBranchId,
                language: f.language?.trim(),
                name: f.name?.trim(),
                description: f.description?.trim() || null,
                isActive: true, // ✅ Always TRUE
                rowVersion: row.rowVersion,
              })}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setShowDeleteModal(false)
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">⚠️</div>
                <h3 className="text-xl font-bold text-white">Delete Organization Branch</h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 font-semibold mb-2">
                  Are you sure you want to delete this organization branch?
                </p>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <div className="text-red-600 text-xl">⚠️</div>
                    <div>
                      <p className="text-red-800 font-bold mb-1">This action cannot be undone!</p>
                      <p className="text-red-700 text-sm">
                        Branch: <span className="font-semibold">{branch?.name}</span>
                      </p>
                      <p className="text-red-700 text-sm">
                        Code: <span className="font-semibold">{branch?.code}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-4">
                  <strong>Permanent deletion:</strong> This will permanently delete the organization branch from the database (hard delete).
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  All associated data including languages will be permanently deleted.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold hover:from-red-700 hover:to-red-800 shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    🗑️ Delete Branch
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMapPicker(false)
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Pick Location</h3>
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="text-white/90 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="h-[480px] w-full rounded-lg overflow-hidden border" id="branch-map-picker" />
              <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                <div>
                  Click on the map to set latitude/longitude.
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    {formData.latitude != null && formData.longitude != null
                      ? `${Number(formData.latitude).toFixed(6)}, ${Number(formData.longitude).toFixed(6)}`
                      : 'No location selected'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(false)}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Use This Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

