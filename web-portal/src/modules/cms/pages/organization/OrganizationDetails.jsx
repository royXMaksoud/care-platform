import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import CrudPage from '@/features/crud/CrudPage'
import { usePermissionCheck } from '@/contexts/PermissionsContext'
import { SYSTEMS, CMS_SECTIONS } from '@/config/permissions-constants'
import { useOrganizationTypes } from '@/hooks/useOrganizationTypes'
import { useBranchTypes } from '@/hooks/useBranchTypes'
import CMSBreadcrumb from '../../components/CMSBreadcrumb'
import { useTranslation } from 'react-i18next'

// Static columns and fields - defined outside component
const languageColumns = [
  { id: 'language', accessorKey: 'language', header: 'Language' },
  { id: 'name', accessorKey: 'name', header: 'Translated Name' },
  { id: 'description', accessorKey: 'description', header: 'Description', cell: (info) => info.getValue() || '-' },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Status',
    cell: (info) => (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
        info.getValue() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {info.getValue() ? 'Active' : 'Inactive'}
      </span>
    ),
  },
]

const languageFields = [
  { type: 'text', name: 'language', label: 'Language Code', required: true, placeholder: 'e.g., en, ar, fr' },
  { type: 'text', name: 'name', label: 'Translated Name', required: true },
  { type: 'textarea', name: 'description', label: 'Description', rows: 3 },
  { type: 'checkbox', name: 'isActive', label: 'Active', defaultValue: true },
]

// Operation Columns - without organization column since it's fixed
const createOperationColumns = (countries, locations) => [
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
]

// Organization Branch Columns - without organization column since it's fixed
const createBranchColumns = (countries, locations, branchTypes) => [
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
]

export default function OrganizationDetailsPage() {
  const { organizationId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('info')
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [branchDropdownData, setBranchDropdownData] = useState({
    countries: [],
    locations: []
  })
  const [operationDropdownData, setOperationDropdownData] = useState({
    countries: [],
    locations: []
  })

  const sortedBranchCountries = useMemo(
    () => [...branchDropdownData.countries].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })),
    [branchDropdownData.countries]
  )

  const sortedOperationCountries = useMemo(
    () => [...operationDropdownData.countries].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })),
    [operationDropdownData.countries]
  )

  // Get permissions
  const { getSectionPermissions, isLoading: permissionsLoading } = usePermissionCheck()
  
  // Get organization types for dropdown
  const { organizationTypes, loading: typesLoading } = useOrganizationTypes('en')
  
  // Get branch types for dropdown
  const { branchTypes, loading: branchTypesLoading } = useBranchTypes('en')
  
  const permissions = useMemo(() => 
    getSectionPermissions(CMS_SECTIONS.CODE_COUNTRY, SYSTEMS.CMS),
    [getSectionPermissions]
  )

  const canUpdate = permissions.canUpdate
  const canDelete = permissions.canDelete
  const canManageLanguages = permissions.canCreate || permissions.canUpdate || permissions.canDelete
  const canManageBranches = permissions.canCreate || permissions.canUpdate || permissions.canDelete
  const canManageOperations = permissions.canCreate || permissions.canUpdate || permissions.canDelete
  
  // Fixed filters for organization languages - MUST be before any return statements
  const languageFixedFilters = useMemo(() => 
    organizationId ? [
      {
        key: 'organizationId',
        operator: 'EQUAL',
        value: organizationId,
        dataType: 'UUID',
      },
    ] : [],
    [organizationId]
  )

  // Fixed filters for organization branches - MUST be before any return statements
  const branchFixedFilters = useMemo(() => 
    organizationId ? [
      {
        key: 'organizationId',
        operator: 'EQUAL',
        value: organizationId,
        dataType: 'UUID',
      },
    ] : [],
    [organizationId]
  )

  // Fixed filters for organization operations - MUST be before any return statements
  const operationFixedFilters = useMemo(() => 
    organizationId ? [
      {
        key: 'organizationId',
        operator: 'EQUAL',
        value: organizationId,
        dataType: 'UUID',
      },
    ] : [],
    [organizationId]
  )

  // Find organization type name
  const organizationTypeName = useMemo(() => {
    if (!organization?.organizationTypeId || !organizationTypes.length) return null
    const type = organizationTypes.find(t => t.value === organization.organizationTypeId)
    return type?.label || null
  }, [organization?.organizationTypeId, organizationTypes])

  // Fetch organization details and dropdown data
  useEffect(() => {
    fetchOrganization()
    fetchBranchDropdownData()
    fetchOperationDropdownData()
  }, [organizationId])

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showDeleteModal) {
        setShowDeleteModal(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showDeleteModal])

  const fetchOrganization = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/access/api/organizations/${organizationId}`)
      setOrganization(data)
      setFormData(data)
    } catch (err) {
      toast.error('Failed to load organization details')
      navigate('/cms/organizations')
    } finally {
      setLoading(false)
    }
  }

  const fetchBranchDropdownData = async () => {
    let isMounted = true
    
    try {
      const [countryResponse, locationResponse] = await Promise.all([
        api.post('/access/api/code-countries/filter', {
          criteria: []
        }, { params: { page: 0, size: 1000 } }),
        api.post('/access/api/locations/filter', {
          criteria: []
        }, { params: { page: 0, size: 1000 } })
      ])
      
      if (isMounted) {
        const activeCountries = (countryResponse.data.content || []).filter(item => item.isActive !== false)
        const activeLocations = (locationResponse.data.content || []).filter(item => item.isActive !== false)
        
        setBranchDropdownData({
          countries: activeCountries,
          locations: activeLocations
        })
      }
    } catch (error) {
      if (isMounted) {
        console.error('Failed to fetch branch dropdown data:', error)
      }
    }
  }

  const fetchOperationDropdownData = async () => {
    let isMounted = true
    
    try {
      const userLanguage = localStorage.getItem('userLanguage') || 'en'
      
      const [countryResponse, locationResponse] = await Promise.all([
        api.post('/access/api/code-country-languages/filter', {
          criteria: [{ field: 'language', operator: 'EQUAL', value: userLanguage }]
        }, { params: { page: 0, size: 1000 } }),
        api.post('/access/api/location-languages/filter', {
          criteria: [{ field: 'language', operator: 'EQUAL', value: userLanguage }]
        }, { params: { page: 0, size: 1000 } })
      ])
      
      if (isMounted) {
        const activeCountries = (countryResponse.data.content || []).filter(item => item.isActive !== false)
        const activeLocations = (locationResponse.data.content || []).filter(item => item.isActive !== false)
        
        setOperationDropdownData({
          countries: activeCountries,
          locations: activeLocations
        })
      }
    } catch (error) {
      if (isMounted) {
        console.error('Failed to fetch operation dropdown data:', error)
      }
    }
  }

  const handleSave = async () => {
    try {
      const payload = {
        organizationId: organizationId,
        code: formData.code,
        name: formData.name,
        organizationTypeId: formData.organizationTypeId || null,
        websiteUrl: formData.websiteUrl || null,
        email: formData.email || null,
        phone: formData.phone || null,
        description: formData.description || null,
        isActive: formData.isActive !== false,
        rowVersion: formData.rowVersion,
      }
      
      await api.put(`/access/api/organizations/${organizationId}`, payload)
      toast.success('Organization updated successfully')
      setEditing(false)
      fetchOrganization()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update organization')
    }
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      // First, check if there are any CodeTableValue related to this organization
      // Check by organization code or organizationId if it's stored in CodeTableValue
      try {
        // Search for CodeTableValue that might reference this organization by code
        const codeTableResponse = await api.post('/access/api/CodeTableValues/filter', {
          criteria: [
            { field: 'shortCode', operator: 'EQUAL', value: organization?.code }
          ]
        }, { params: { page: 0, size: 1000 } })
        
        const relatedValues = codeTableResponse.data?.content || []
        
        // Also search by name in case organization is stored as name
        const nameResponse = await api.post('/access/api/CodeTableValues/filter', {
          criteria: [
            { field: 'name', operator: 'EQUAL', value: organization?.name }
          ]
        }, { params: { page: 0, size: 1000 } })
        
        const relatedByName = nameResponse.data?.content || []
        
        // Combine and deduplicate values
        const allRelatedValues = [...relatedValues, ...relatedByName]
        const uniqueValues = Array.from(
          new Map(allRelatedValues.map(v => [v.codeTableValueId, v])).values()
        )
        
        // Delete related CodeTableValues if found
        if (uniqueValues.length > 0) {
          for (const value of uniqueValues) {
            try {
              await api.delete(`/access/api/CodeTableValues/${value.codeTableValueId}`, {
                params: { hardDelete: true }
              })
            } catch (deleteErr) {
              console.warn(`Failed to delete CodeTableValue ${value.codeTableValueId}:`, deleteErr)
            }
          }
        }
      } catch (codeTableErr) {
        // If we can't check CodeTableValues, continue with organization deletion
        console.warn('Could not check CodeTableValues:', codeTableErr)
      }

      // Delete organization with hard delete (permanent deletion from database)
      await api.delete(`/access/api/organizations/${organizationId}?hardDelete=true`)
      
      toast.success('Organization and related data deleted permanently')
      navigate('/cms/organizations')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete organization')
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // Create branch columns with dropdown data
  const branchColumns = useMemo(() => 
    createBranchColumns(sortedBranchCountries, branchDropdownData.locations, branchTypes),
    [sortedBranchCountries, branchDropdownData.locations, branchTypes]
  )

  // Create operation columns with dropdown data
  const operationColumns = useMemo(() => 
    createOperationColumns(sortedOperationCountries, operationDropdownData.locations),
    [sortedOperationCountries, operationDropdownData.locations]
  )

  // Create operation fields with dropdown options
  const operationFields = useMemo(() => [
    { type: 'text', name: 'code', label: 'Operation Code', required: true },
    { type: 'text', name: 'name', label: 'Operation Name', required: true },
    { 
      type: 'select', 
      name: 'countryId', 
      label: 'Country',
      options: [
        { value: '', label: '-- Select Country --' },
        ...sortedOperationCountries.map(country => ({ value: country.countryId, label: country.name }))
      ]
    },
    { 
      type: 'select', 
      name: 'locationId', 
      label: 'Location',
      options: [
        { value: '', label: '-- Select Location --' },
        ...operationDropdownData.locations.map(location => ({ value: location.locationId, label: location.name }))
      ]
    },
    { type: 'textarea', name: 'description', label: 'Description' },
    { type: 'date', name: 'startDate', label: 'Start Date' },
    { type: 'date', name: 'endDate', label: 'End Date' },
  ], [sortedOperationCountries, operationDropdownData.locations])

  // Create branch fields with dropdown options
  const branchFields = useMemo(() => [
    { type: 'text', name: 'code', label: 'Branch Code', required: true },
    { type: 'text', name: 'name', label: 'Branch Name', required: true },
    { 
      type: 'select', 
      name: 'countryId', 
      label: 'Country',
      required: true,
      options: [
        { value: '', label: '-- Select Country --' },
        ...sortedBranchCountries.map(country => ({ value: country.countryId, label: country.name }))
      ]
    },
    { 
      type: 'select', 
      name: 'locationId', 
      label: 'Location',
      required: true,
      options: [
        { value: '', label: '-- Select Location --' },
        ...branchDropdownData.locations.map(location => ({ value: location.locationId, label: location.name }))
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
    { 
      type: 'number', 
      name: 'latitude', 
      label: 'Latitude', 
      step: 'any',
      placeholder: 'e.g., 33.513807'
    },
    { 
      type: 'number', 
      name: 'longitude', 
      label: 'Longitude', 
      step: 'any',
      placeholder: 'e.g., 36.276528'
    },
    {
      type: 'map',
      latName: 'latitude',
      lngName: 'longitude',
    },
    { type: 'checkbox', name: 'isHeadquarter', label: 'Is Headquarter', defaultValue: false },
  ], [sortedBranchCountries, branchDropdownData.locations, branchTypes])

  if (loading || permissionsLoading || typesLoading || branchTypesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Organization not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-4">
          <CMSBreadcrumb currentPageLabel={organization?.name || t('cms.organizations')} />
        </div>
        
        {/* Modern Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{organization.name}</h1>
                <p className="text-blue-100 mt-2 flex items-center gap-3">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">{organization.code}</span>
                </p>
              </div>
              <div className="text-6xl opacity-20">🏢</div>
            </div>
          </div>
        </div>

        {/* Modern Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
          <div className="flex border-b-2 border-gray-100 bg-gray-50">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-8 py-4 font-bold transition-all relative ${
                activeTab === 'info'
                  ? 'text-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                📋 Organization Info
              </span>
              {activeTab === 'info' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              )}
            </button>
            {canManageBranches && (
              <button
                onClick={() => setActiveTab('branches')}
                className={`px-8 py-4 font-bold transition-all relative ${
                  activeTab === 'branches'
                    ? 'text-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  🏢 Branches
                </span>
                {activeTab === 'branches' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                )}
              </button>
            )}
            {canManageOperations && (
              <button
                onClick={() => setActiveTab('operations')}
                className={`px-8 py-4 font-bold transition-all relative ${
                  activeTab === 'operations'
                    ? 'text-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  ⚙️ Operations
                </span>
                {activeTab === 'operations' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                )}
              </button>
            )}
            {canManageLanguages && (
              <button
                onClick={() => setActiveTab('languages')}
                className={`px-8 py-4 font-bold transition-all relative ${
                  activeTab === 'languages'
                    ? 'text-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  🌐 Languages
                </span>
                {activeTab === 'languages' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                )}
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'info' && (
              <div>
                {editing ? (
                  <div className="space-y-6">
                    <fieldset className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50/30">
                      <legend className="text-base font-bold text-blue-800 px-3 bg-white rounded-md shadow-sm">
                        📝 Organization Details
                      </legend>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Organization Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.code || ''}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter organization code"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Organization Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter organization name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Organization Type</label>
                          <select
                            value={formData.organizationTypeId || ''}
                            onChange={(e) => setFormData({ ...formData, organizationTypeId: e.target.value || null })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          >
                            <option value="">Select type...</option>
                            {organizationTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Website</label>
                          <input
                            type="url"
                            value={formData.websiteUrl || ''}
                            onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="https://example.org"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                          <input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="contact@example.org"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                          <input
                            type="tel"
                            value={formData.phone || ''}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="+1234567890"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                          <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            rows="3"
                            placeholder="Organization description"
                          />
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className="mt-5">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={formData.isActive !== false}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <label className="text-sm font-semibold text-gray-700">
                            Active
                          </label>
                        </div>
                      </div>
                    </fieldset>

                    <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                      <button
                        onClick={() => {
                          setEditing(false)
                          setFormData(organization)
                        }}
                        className="px-6 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all transform hover:scale-105"
                      >
                        💾 Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Code</div>
                          <div className="text-lg font-bold text-gray-900">{organization.code}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name</div>
                          <div className="text-lg font-bold text-gray-900">{organization.name}</div>
                        </div>
                        {organizationTypeName && (
                          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Type</div>
                            <div className="text-lg font-bold text-gray-900">{organizationTypeName}</div>
                          </div>
                        )}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Website</div>
                          <div className="text-sm font-semibold text-blue-600">
                            {organization.websiteUrl ? (
                              <a href={organization.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {organization.websiteUrl}
                              </a>
                            ) : '-'}
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</div>
                          <div className="text-sm font-semibold text-gray-900">{organization.email || '-'}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</div>
                          <div className="text-sm font-semibold text-gray-900">{organization.phone || '-'}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 md:col-span-2">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</div>
                          <div className="text-sm font-semibold text-gray-900">{organization.description || '-'}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</div>
                          <div>
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-full ${
                              organization.isActive 
                                ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
                            }`}>
                              {organization.isActive ? '✅ Active' : '❌ Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {(canUpdate || canDelete) && (
                      <div className="flex justify-end gap-3">
                        {canUpdate && (
                          <button
                            onClick={() => setEditing(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
                          >
                            ✏️ Edit Organization
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={handleDelete}
                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold hover:from-red-700 hover:to-red-800 shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
                          >
                            🗑️ Delete Organization
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'branches' && canManageBranches && organizationId && (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                        <span className="text-3xl">🏢</span>
                        Organization Branches
                      </h2>
                      <p className="text-gray-600">
                        Manage branches for <span className="font-bold text-blue-600">{organization.name}</span>
                      </p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-blue-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Organization Code</div>
                      <div className="text-lg font-bold text-blue-600">{organization.code}</div>
                    </div>
                  </div>
                </div>

                {/* Branches Table */}
                <div className="bg-white rounded-xl border-2 border-gray-100 shadow-sm overflow-hidden">
                  <CrudPage
                  title=""
                  service="access"
                  resourceBase="/api/organization-branches"
                  idKey="organizationBranchId"
                  columns={branchColumns}
                  formFields={branchFields}
                  pageSize={10}
                  fixedFilters={branchFixedFilters}
                  queryParams={{ organizationId }}
                  toCreatePayload={(f) => ({
                    organizationId: organizationId, // Always set to current organization
                    code: f.code,
                    name: f.name,
                    countryId: f.countryId || null,
                    locationId: f.locationId || null,
                    branchTypeId: f.branchTypeId || null,
                    address: f.address,
                    latitude: f.latitude ? parseFloat(f.latitude) : null,
                    longitude: f.longitude ? parseFloat(f.longitude) : null,
                    isHeadquarter: f.isHeadquarter || false,
                    isActive: true,
                  })}
                  toUpdatePayload={(f) => ({
                    organizationBranchId: f.organizationBranchId,
                    organizationId: organizationId, // Always set to current organization
                    code: f.code,
                    name: f.name,
                    countryId: f.countryId || null,
                    locationId: f.locationId || null,
                    branchTypeId: f.branchTypeId || null,
                    address: f.address,
                    latitude: f.latitude ? parseFloat(f.latitude) : null,
                    longitude: f.longitude ? parseFloat(f.longitude) : null,
                    isHeadquarter: f.isHeadquarter || false,
                    isActive: true,
                    rowVersion: f.rowVersion,
                  })}
                  enableCreate={permissions.canCreate}
                  enableEdit={permissions.canUpdate}
                  enableDelete={permissions.canDelete}
                  onRowClick={(branch) => navigate(`/cms/organization-branches/${branch.organizationBranchId}`)}
                  tableId={`organization-branches-${organizationId}`}
                />
                </div>
              </div>
            )}

            {activeTab === 'operations' && canManageOperations && organizationId && (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                        <span className="text-3xl">⚙️</span>
                        Operations
                      </h2>
                      <p className="text-gray-600">
                        Manage operations for <span className="font-bold text-indigo-600">{organization.name}</span>
                      </p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-indigo-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Organization Code</div>
                      <div className="text-lg font-bold text-indigo-600">{organization.code}</div>
                    </div>
                  </div>
                </div>

                {/* Operations Table */}
                <div className="bg-white rounded-xl border-2 border-gray-100 shadow-sm overflow-hidden">
                  <CrudPage
                  title=""
                  service="access"
                  resourceBase="/api/operations"
                  idKey="operationId"
                  columns={operationColumns}
                  formFields={operationFields}
                  pageSize={10}
                  fixedFilters={operationFixedFilters}
                  queryParams={{ organizationId }}
                  toCreatePayload={(f) => ({
                    organizationId: organizationId, // Always set to current organization
                    code: f.code,
                    name: f.name,
                    description: f.description || null,
                    countryId: f.countryId || null,
                    locationId: f.locationId || null,
                    startDate: f.startDate || null,
                    endDate: f.endDate || null,
                    isActive: true,
                  })}
                  toUpdatePayload={(f) => ({
                    operationId: f.operationId,
                    organizationId: organizationId, // Always set to current organization
                    code: f.code,
                    name: f.name,
                    description: f.description || null,
                    countryId: f.countryId || null,
                    locationId: f.locationId || null,
                    startDate: f.startDate || null,
                    endDate: f.endDate || null,
                    isActive: true,
                    rowVersion: f.rowVersion,
                  })}
                  enableCreate={permissions.canCreate}
                  enableEdit={permissions.canUpdate}
                  enableDelete={permissions.canDelete}
                  onRowClick={(operation) => navigate(`/cms/operations/${operation.operationId}`)}
                  tableId={`organization-operations-${organizationId}`}
                />
                </div>
              </div>
            )}

            {activeTab === 'languages' && canManageLanguages && organizationId && (
              <CrudPage
                title="Organization Languages"
                service="access"
                resourceBase="/api/organization-languages"
                idKey="organizationLanguageId"
                columns={languageColumns}
                formFields={languageFields}
                pageSize={10}
                fixedFilters={languageFixedFilters}
                queryParams={{ organizationId }}
                toCreatePayload={(f) => ({
                  organizationId: organizationId,
                  language: f.language,
                  name: f.name,
                  description: f.description || null,
                  isActive: f.isActive !== false,
                })}
                toUpdatePayload={(f) => ({
                  organizationLanguageId: f.organizationLanguageId,
                  organizationId: organizationId,
                  language: f.language,
                  name: f.name,
                  description: f.description || null,
                  isActive: f.isActive !== false,
                  rowVersion: f.rowVersion,
                })}
                enableCreate={permissions.canCreate}
                enableEdit={permissions.canUpdate}
                enableDelete={permissions.canDelete}
                tableId={`organization-languages-${organizationId}`}
              />
            )}
          </div>
        </div>
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
                <h3 className="text-xl font-bold text-white">Delete Organization</h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 font-semibold mb-2">
                  Are you sure you want to delete this organization?
                </p>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <div className="text-red-600 text-xl">⚠️</div>
                    <div>
                      <p className="text-red-800 font-bold mb-1">This action cannot be undone!</p>
                      <p className="text-red-700 text-sm">
                        Organization: <span className="font-semibold">{organization?.name}</span>
                      </p>
                      <p className="text-red-700 text-sm">
                        Code: <span className="font-semibold">{organization?.code}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-4">
                  <strong>Permanent deletion:</strong> This will permanently delete the organization from the database (hard delete).
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  All associated data including branches, operations, languages, and any related CodeTableValues will be permanently deleted.
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
                    🗑️ Delete Organization
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

