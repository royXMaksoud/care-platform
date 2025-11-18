/**
 * WarehouseListPage Component
 * 
 * Main list page for warehouses with filters, search, and DataTable.
 * 
 * Features:
 * - DataTable with pagination
 * - Filters (type, city, active state)
 * - Excel/CSV export
 * - Create/Edit modals
 * - Role-based column visibility
 * - Error and empty states
 * 
 * @author CARE Team
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '@/packages/datatable/DataTable'
import SearchableSelect from '@/components/SearchableSelect'
import { toast } from 'sonner'
import { useActionPermission } from '@/hooks/useActionPermission'
import {
  Warehouse,
  PlusCircle,
  Edit3,
  Eye,
  Trash2,
  Filter,
  Download,
  MapPin,
  RefreshCw,
  X,
} from 'lucide-react'
import { warehousesApi } from '../../api'
import EmptyState from '../../components/EmptyState'
import SkeletonTable from '../../components/SkeletonTable'
import { exportToExcel } from '../../utils/exportToExcel'
import type { Warehouse as WarehouseType } from '../../types'

/**
 * Warehouse type options for filter
 */
const WAREHOUSE_TYPE_OPTIONS = [
  { value: 'MAIN', label: 'Main Warehouse' },
  { value: 'BRANCH', label: 'Branch' },
  { value: 'STORE', label: 'Store' },
  { value: 'SUPPLIER', label: 'Supplier' },
  { value: 'THIRD_PARTY_LOGISTICS', label: '3PL' },
]

/**
 * Active state options
 */
const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

export default function WarehouseListPage() {
  const navigate = useNavigate()
  const canCreateWarehouse = useActionPermission('WAREHOUSE_CREATE') // TODO: Replace with actual permission ID
  const canViewInternalFields = useActionPermission('WAREHOUSE_VIEW_INTERNAL') // For sensitive columns

  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Filters
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedActive, setSelectedActive] = useState<string | null>(null)
  const [citySearch, setCitySearch] = useState('')

  /**
   * Refresh table data
   */
  const refresh = useCallback(() => {
    setRefreshKey((key) => key + 1)
  }, [])

  /**
   * Build filters for DataTable
   */
  const combinedFilters = useMemo(() => {
    const filters: any[] = []

    if (selectedType) {
      filters.push({
        key: 'warehouseType',
        operator: 'EQUAL',
        value: selectedType,
        dataType: 'STRING',
      })
    }

    if (selectedCity) {
      filters.push({
        key: 'city',
        operator: 'EQUAL',
        value: selectedCity,
        dataType: 'STRING',
      })
    }

    if (selectedActive !== null) {
      filters.push({
        key: 'isActive',
        operator: 'EQUAL',
        value: selectedActive === 'true',
        dataType: 'BOOLEAN',
      })
    }

    return filters
  }, [selectedType, selectedCity, selectedActive])

  /**
   * Handle row click - navigate to details
   */
  const handleRowClick = (row: any) => {
    navigate(`/warehouse/warehouses/${row.id}`)
  }

  /**
   * Handle export to Excel
   */
  const handleExport = async () => {
    try {
      toast.info('Exporting warehouses...')
      
      // Fetch all warehouses (without pagination for export)
      const response = await warehousesApi.getAll({ page: 0, size: 10000 })
      const warehouses = response.data?.content || response.data || []

      const columns = [
        { key: 'code', label: 'Code' },
        { key: 'displayName', label: 'Name' },
        { key: 'warehouseType', label: 'Type' },
        { key: 'city', label: 'City' },
        { key: 'latitude', label: 'Latitude', formatter: (v: any) => v?.toFixed(4) || '' },
        { key: 'longitude', label: 'Longitude', formatter: (v: any) => v?.toFixed(4) || '' },
        { key: 'isActive', label: 'Active', formatter: (v: any) => v ? 'Yes' : 'No' },
        { key: 'createdAt', label: 'Created At' },
      ]

      exportToExcel(warehouses, columns, 'warehouses')
      toast.success('Export completed')
    } catch (error: any) {
      console.error('Export failed:', error)
      toast.error(error?.response?.data?.message || 'Failed to export warehouses')
    }
  }

  /**
   * Handle delete warehouse
   */
  const handleDelete = async (warehouse: WarehouseType) => {
    if (!window.confirm(`Are you sure you want to delete warehouse "${warehouse.displayName || warehouse.code}"?`)) {
      return
    }

    try {
      await warehousesApi.delete(warehouse.id)
      toast.success('Warehouse deleted successfully')
      refresh()
    } catch (error: any) {
      console.error('Delete failed:', error)
      toast.error(error?.response?.data?.message || 'Failed to delete warehouse')
    }
  }

  /**
   * DataTable columns definition
   */
  const warehouseColumns = useMemo(() => [
    {
      id: 'code',
      accessorKey: 'code',
      header: 'Code',
      cell: ({ getValue }: any) => (
        <span className="font-mono text-sm font-semibold text-gray-900">
          {getValue() || '—'}
        </span>
      ),
      meta: { 
        type: 'string', 
        filterKey: 'code', 
        operators: ['EQUAL', 'LIKE', 'STARTS_WITH'],
        sensitive: false,
      },
    },
    {
      id: 'displayName',
      accessorKey: 'displayName',
      header: 'Name',
      cell: ({ getValue, row }: any) => {
        const name = getValue() || row.original?.nameTranslations?.['en'] || '—'
        return <span className="font-medium text-gray-900">{name}</span>
      },
      meta: { 
        type: 'string', 
        filterKey: 'nameTranslations', 
        operators: ['LIKE'],
      },
    },
    {
      id: 'warehouseType',
      accessorKey: 'warehouseType',
      header: 'Type',
      cell: ({ getValue }: any) => {
        const type = getValue()
        const typeLabel = WAREHOUSE_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {typeLabel}
          </span>
        )
      },
      meta: { 
        type: 'string', 
        filterKey: 'warehouseType', 
        operators: ['EQUAL', 'IN'],
      },
    },
    {
      id: 'city',
      accessorKey: 'city',
      header: 'City',
      cell: ({ getValue }: any) => {
        const city = getValue()
        return city ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>{city}</span>
          </div>
        ) : (
          '—'
        )
      },
      meta: { 
        type: 'string', 
        filterKey: 'city', 
        operators: ['EQUAL', 'LIKE'],
      },
    },
    {
      id: 'location',
      accessorKey: 'latitude',
      header: 'GPS Coordinates',
      cell: ({ row }: any) => {
        const lat = row.original?.latitude
        const lng = row.original?.longitude
        if (lat != null && lng != null) {
          return (
            <span className="font-mono text-xs text-gray-600">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          )
        }
        return '—'
      },
      meta: { sensitive: false },
    },
    {
      id: 'isActive',
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }: any) => {
        const isActive = getValue()
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        )
      },
      meta: { 
        type: 'boolean', 
        filterKey: 'isActive', 
        operators: ['EQUAL'],
      },
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }: any) => {
        const date = getValue()
        return date
          ? new Date(date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : '—'
      },
      meta: { 
        type: 'date', 
        filterKey: 'createdAt', 
        operators: ['BEFORE', 'AFTER', 'BETWEEN'],
      },
    },
    // Sensitive column - only visible if user has permission
    ...(canViewInternalFields
      ? [
          {
            id: 'internalCode',
            accessorKey: 'internalCode',
            header: 'Internal Code',
            cell: ({ getValue }: any) => (
              <span className="font-mono text-xs text-gray-500">
                {getValue() || '—'}
              </span>
            ),
            meta: { 
              sensitive: true,
              permission: 'WAREHOUSE_VIEW_INTERNAL',
            },
          },
        ]
      : []),
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const warehouse = row.original as WarehouseType
        const canEdit = useActionPermission('WAREHOUSE_UPDATE') // TODO: Replace with actual permission ID
        const canDelete = useActionPermission('WAREHOUSE_DELETE') // TODO: Replace with actual permission ID
        const canView = useActionPermission('WAREHOUSE_VIEW') // TODO: Replace with actual permission ID

        return (
          <div className="flex items-center gap-2">
            {canView && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/warehouse/warehouses/${warehouse.id}`)
                }}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="View"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedWarehouse(warehouse)
                  setShowEditModal(true)
                }}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Edit"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(warehouse)
                }}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      },
      meta: { sortable: false },
    },
  ], [canViewInternalFields, navigate])

  /**
   * Load unique cities for filter dropdown
   */
  const [cityOptions, setCityOptions] = useState<Array<{ value: string; label: string }>>([])
  
  useEffect(() => {
    // TODO: Load cities from API or extract from warehouses
    // For now, use empty array
    setCityOptions([])
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Warehouse className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Warehouses</h1>
              <p className="text-blue-100 mt-1">
                Manage warehouse locations and inventory
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            {canCreateWarehouse && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                <PlusCircle className="w-5 h-5" />
                Add Warehouse
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <SearchableSelect
                options={WAREHOUSE_TYPE_OPTIONS}
                value={selectedType}
                onChange={(value) => setSelectedType(value as string | null)}
                placeholder="All types"
                isClearable
              />
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <SearchableSelect
                options={cityOptions}
                value={selectedCity}
                onChange={(value) => setSelectedCity(value as string | null)}
                placeholder="All cities"
                isClearable
                onInputChange={setCitySearch}
              />
            </div>

            {/* Active Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <SearchableSelect
                options={ACTIVE_OPTIONS}
                value={selectedActive}
                onChange={(value) => setSelectedActive(value as string | null)}
                placeholder="All statuses"
                isClearable
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedType(null)
                  setSelectedCity(null)
                  setSelectedActive(null)
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Active Filter Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedType && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Type: {WAREHOUSE_TYPE_OPTIONS.find(opt => opt.value === selectedType)?.label}
                <button
                  onClick={() => setSelectedType(null)}
                  className="ml-1 hover:text-blue-900"
                  aria-label="Clear type filter"
                >
                  ×
                </button>
              </span>
            )}
            {selectedCity && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                City: {selectedCity}
                <button
                  onClick={() => setSelectedCity(null)}
                  className="ml-1 hover:text-blue-900"
                  aria-label="Clear city filter"
                >
                  ×
                </button>
              </span>
            )}
            {selectedActive && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Status: {selectedActive === 'true' ? 'Active' : 'Inactive'}
                <button
                  onClick={() => setSelectedActive(null)}
                  className="ml-1 hover:text-blue-900"
                  aria-label="Clear status filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* DataTable */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <DataTable
          title="All Warehouses"
          service="warehouse-service"
          resourceBase="/api/warehouse/v1/warehouses"
          columns={warehouseColumns}
          pageSize={20}
          refreshKey={refreshKey}
          getRowId={(r) => r?.id}
          tableId="warehouses-list"
          onRowClick={handleRowClick}
          filters={combinedFilters}
        />
      </div>

      {/* TODO: Add WarehouseFormModal component */}
      {/* {showCreateModal && (
        <WarehouseFormModal
          open={showCreateModal}
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            refresh()
          }}
        />
      )} */}
    </div>
  )
}

