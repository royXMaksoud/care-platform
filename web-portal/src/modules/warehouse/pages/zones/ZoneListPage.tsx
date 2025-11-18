/**
 * ZoneListPage Component
 *
 * Main list page for zones with filters, search, and DataTable.
 *
 * Features:
 * - DataTable with pagination and sorting
 * - Filters (warehouse, zone type, status, temperature controlled)
 * - Excel/CSV export
 * - Create/Edit modals
 * - Real-time capacity visualization
 * - Error and empty states
 *
 * @author CARE Team
 */

import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '@/packages/datatable/DataTable'
import SearchableSelect from '@/components/SearchableSelect'
import { toast } from 'sonner'
import { useActionPermission } from '@/hooks/useActionPermission'
import {
  Grid3x3,
  PlusCircle,
  Edit3,
  Eye,
  Trash2,
  Filter,
  Download,
  Thermometer,
  RefreshCw,
  X,
} from 'lucide-react'
import { useDeleteZoneMutation } from '../../store/api/zoneApi'
import EmptyState from '../../components/EmptyState'
import SkeletonTable from '../../components/SkeletonTable'
import { exportToExcel } from '../../utils/exportToExcel'
import { ZoneFormDrawer } from './ZoneFormDrawer'
import type { Zone as ZoneType } from '../../types'
import { api } from '@/lib/axios'

/**
 * Zone type options for filter
 */
const ZONE_TYPE_OPTIONS = [
  { value: 'RECEIVING', label: 'Receiving' },
  { value: 'STORAGE', label: 'Storage' },
  { value: 'PICKING', label: 'Picking' },
  { value: 'PACKING', label: 'Packing' },
  { value: 'SHIPPING', label: 'Shipping' },
]

/**
 * Status options
 */
const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
]

/**
 * Temperature controlled options
 */
const TEMP_CONTROLLED_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
]

export default function ZoneListPage() {
  const navigate = useNavigate()
  const canCreateZone = useActionPermission('ZONE_CREATE')
  const canViewInternalFields = useActionPermission('ZONE_VIEW_INTERNAL')

  const [showFilters, setShowFilters] = useState(true)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [selectedZone, setSelectedZone] = useState<ZoneType | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Filters
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedTempControlled, setSelectedTempControlled] = useState<string | null>(null)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null)

  const [deleteZone] = useDeleteZoneMutation()

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
        key: 'zoneType',
        operator: 'EQUAL',
        value: selectedType,
        dataType: 'STRING',
      })
    }

    if (selectedStatus) {
      filters.push({
        key: 'status',
        operator: 'EQUAL',
        value: selectedStatus,
        dataType: 'STRING',
      })
    }

    if (selectedTempControlled !== null) {
      filters.push({
        key: 'temperatureControlled',
        operator: 'EQUAL',
        value: selectedTempControlled === 'true',
        dataType: 'BOOLEAN',
      })
    }

    if (selectedWarehouseId) {
      filters.push({
        key: 'warehouseId',
        operator: 'EQUAL',
        value: selectedWarehouseId,
        dataType: 'STRING',
      })
    }

    return filters
  }, [selectedType, selectedStatus, selectedTempControlled, selectedWarehouseId])

  /**
   * Handle row click - navigate to details
   */
  const handleRowClick = (row: any) => {
    navigate(`/warehouse/zones/${row.id}`)
  }

  /**
   * Handle export to Excel
   */
  const handleExport = async () => {
    try {
      toast.info('Exporting zones...')

      // Fetch all zones (without pagination for export)
      const response = await api.get('/warehouse-service/api/warehouse/v1/zones', {
        params: { page: 0, size: 10000 },
      })
      const zones = response.data?.content || response.data || []

      const columns = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'zoneType', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'capacityCubicMeters', label: 'Capacity (m³)' },
        { key: 'currentOccupancyCubicMeters', label: 'Occupancy (m³)' },
        { key: 'utilizationPercentage', label: 'Utilization %', formatter: (v: any) => v?.toFixed(1) || '0' },
        { key: 'temperatureControlled', label: 'Temp Controlled', formatter: (v: any) => v ? 'Yes' : 'No' },
        { key: 'temperatureMin', label: 'Min Temp (°C)' },
        { key: 'temperatureMax', label: 'Max Temp (°C)' },
        { key: 'createdAt', label: 'Created At' },
      ]

      exportToExcel(zones, columns, 'zones')
      toast.success('Export completed')
    } catch (error: any) {
      console.error('Export failed:', error)
      toast.error(error?.response?.data?.message || 'Failed to export zones')
    }
  }

  /**
   * Handle delete zone
   */
  const handleDelete = async (zone: ZoneType) => {
    if (!window.confirm(`Are you sure you want to delete zone "${zone.name || zone.code}"?`)) {
      return
    }

    try {
      await deleteZone(zone.id).unwrap()
      toast.success('Zone deleted successfully')
      refresh()
    } catch (error: any) {
      console.error('Delete failed:', error)
      toast.error(error?.data?.message || 'Failed to delete zone')
    }
  }

  /**
   * DataTable columns definition
   */
  const zoneColumns = useMemo(() => [
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
      },
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      cell: ({ getValue }: any) => (
        <span className="font-medium text-gray-900">{getValue() || '—'}</span>
      ),
      meta: {
        type: 'string',
        filterKey: 'name',
        operators: ['LIKE'],
      },
    },
    {
      id: 'zoneType',
      accessorKey: 'zoneType',
      header: 'Type',
      cell: ({ getValue }: any) => {
        const type = getValue()
        const typeLabel = ZONE_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type
        const typeColors: Record<string, string> = {
          RECEIVING: 'bg-blue-100 text-blue-800',
          STORAGE: 'bg-green-100 text-green-800',
          PICKING: 'bg-yellow-100 text-yellow-800',
          PACKING: 'bg-purple-100 text-purple-800',
          SHIPPING: 'bg-orange-100 text-orange-800',
        }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}>
            {typeLabel}
          </span>
        )
      },
      meta: {
        type: 'string',
        filterKey: 'zoneType',
        operators: ['EQUAL', 'IN'],
      },
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }: any) => {
        const status = getValue()
        const statusColors: Record<string, string> = {
          ACTIVE: 'bg-green-100 text-green-800',
          INACTIVE: 'bg-gray-100 text-gray-800',
          MAINTENANCE: 'bg-yellow-100 text-yellow-800',
        }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
          </span>
        )
      },
      meta: {
        type: 'string',
        filterKey: 'status',
        operators: ['EQUAL'],
      },
    },
    {
      id: 'capacity',
      accessorKey: 'capacityCubicMeters',
      header: 'Capacity',
      cell: ({ row }: any) => {
        const capacity = row.original?.capacityCubicMeters || 0
        const utilization = row.original?.utilizationPercentage || 0
        const utilizationColor = utilization > 90 ? 'text-red-600' : utilization > 70 ? 'text-yellow-600' : 'text-green-600'

        return (
          <div className="flex flex-col">
            <span className="text-sm">{capacity.toFixed(1)} m³</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${utilization > 90 ? 'bg-red-500' : utilization > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${utilizationColor}`}>
                {utilization.toFixed(0)}%
              </span>
            </div>
          </div>
        )
      },
      meta: {
        type: 'number',
        filterKey: 'capacityCubicMeters',
        operators: ['GREATER_THAN', 'LESS_THAN'],
      },
    },
    {
      id: 'temperatureControlled',
      accessorKey: 'temperatureControlled',
      header: 'Temp Control',
      cell: ({ row }: any) => {
        const tempControlled = row.original?.temperatureControlled
        const tempMin = row.original?.temperatureMin
        const tempMax = row.original?.temperatureMax

        if (!tempControlled) {
          return <span className="text-gray-400">—</span>
        }

        return (
          <div className="flex items-center gap-1">
            <Thermometer className="w-4 h-4 text-blue-500" />
            <span className="text-sm">
              {tempMin !== null && tempMax !== null
                ? `${tempMin}°C - ${tempMax}°C`
                : 'Yes'}
            </span>
          </div>
        )
      },
      meta: {
        type: 'boolean',
        filterKey: 'temperatureControlled',
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
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const zone = row.original as ZoneType
        const canEdit = useActionPermission('ZONE_UPDATE')
        const canDelete = useActionPermission('ZONE_DELETE')
        const canView = useActionPermission('ZONE_VIEW')

        return (
          <div className="flex items-center gap-2">
            {canView && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/warehouse/zones/${zone.id}`)
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
                  setSelectedZone(zone)
                  setShowEditDrawer(true)
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
                  handleDelete(zone)
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
  ], [navigate])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Grid3x3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Zones</h1>
              <p className="text-purple-100 mt-1">
                Manage warehouse zones and storage areas
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
            {canCreateZone && (
              <button
                onClick={() => setShowCreateDrawer(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
              >
                <PlusCircle className="w-5 h-5" />
                Add Zone
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

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone Type
              </label>
              <SearchableSelect
                options={ZONE_TYPE_OPTIONS}
                value={selectedType}
                onChange={(value) => setSelectedType(value as string | null)}
                placeholder="All types"
                isClearable
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <SearchableSelect
                options={STATUS_OPTIONS}
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value as string | null)}
                placeholder="All statuses"
                isClearable
              />
            </div>

            {/* Temperature Controlled Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temp Controlled
              </label>
              <SearchableSelect
                options={TEMP_CONTROLLED_OPTIONS}
                value={selectedTempControlled}
                onChange={(value) => setSelectedTempControlled(value as string | null)}
                placeholder="Any"
                isClearable
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedType(null)
                  setSelectedStatus(null)
                  setSelectedTempControlled(null)
                  setSelectedWarehouseId(null)
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
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                Type: {ZONE_TYPE_OPTIONS.find(opt => opt.value === selectedType)?.label}
                <button
                  onClick={() => setSelectedType(null)}
                  className="ml-1 hover:text-purple-900"
                  aria-label="Clear type filter"
                >
                  ×
                </button>
              </span>
            )}
            {selectedStatus && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                Status: {selectedStatus}
                <button
                  onClick={() => setSelectedStatus(null)}
                  className="ml-1 hover:text-purple-900"
                  aria-label="Clear status filter"
                >
                  ×
                </button>
              </span>
            )}
            {selectedTempControlled && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                Temp Controlled: {selectedTempControlled === 'true' ? 'Yes' : 'No'}
                <button
                  onClick={() => setSelectedTempControlled(null)}
                  className="ml-1 hover:text-purple-900"
                  aria-label="Clear temp controlled filter"
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
          title="All Zones"
          service="warehouse-service"
          resourceBase="/api/warehouse/v1/zones"
          columns={zoneColumns}
          pageSize={20}
          refreshKey={refreshKey}
          getRowId={(r) => r?.id}
          tableId="zones-list"
          onRowClick={handleRowClick}
          filters={combinedFilters}
        />
      </div>

      {/* Create Zone Drawer */}
      {showCreateDrawer && (
        <ZoneFormDrawer
          open={showCreateDrawer}
          onClose={() => setShowCreateDrawer(false)}
          onSuccess={() => {
            setShowCreateDrawer(false)
            refresh()
          }}
        />
      )}

      {/* Edit Zone Drawer */}
      {showEditDrawer && selectedZone && (
        <ZoneFormDrawer
          open={showEditDrawer}
          onClose={() => {
            setShowEditDrawer(false)
            setSelectedZone(null)
          }}
          zoneId={selectedZone.id}
          onSuccess={() => {
            setShowEditDrawer(false)
            setSelectedZone(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}
