/**
 * BinListPage Component
 *
 * Main list page for bins with filters, search, and DataTable.
 *
 * Features:
 * - DataTable with pagination and sorting
 * - Filters (zone, bin type, status)
 * - Capacity/utilization visualization
 * - Excel/CSV export
 * - Create/Edit modals
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
  Box,
  PlusCircle,
  Edit3,
  Eye,
  Trash2,
  Filter,
  Download,
  Barcode,
  MapPin,
  RefreshCw,
  X,
} from 'lucide-react'
import { useDeleteBinMutation } from '../../store/api/binApi'
import EmptyState from '../../components/EmptyState'
import SkeletonTable from '../../components/SkeletonTable'
import { exportToExcel } from '../../utils/exportToExcel'
import { BinFormDrawer } from './BinFormDrawer'
import type { Bin as BinType } from '../../types'
import { api } from '@/lib/axios'

/**
 * Bin type options for filter
 */
const BIN_TYPE_OPTIONS = [
  { value: 'PALLET', label: 'Pallet' },
  { value: 'SHELF', label: 'Shelf' },
  { value: 'RACK', label: 'Rack' },
  { value: 'CAGE', label: 'Cage' },
  { value: 'DRAWER', label: 'Drawer' },
]

/**
 * Status options
 */
const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
]

export default function BinListPage() {
  const navigate = useNavigate()
  const canCreateBin = useActionPermission('BIN_CREATE')
  const canViewInternalFields = useActionPermission('BIN_VIEW_INTERNAL')

  const [showFilters, setShowFilters] = useState(true)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [selectedBin, setSelectedBin] = useState<BinType | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Filters
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)

  const [deleteBin] = useDeleteBinMutation()

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
        key: 'binType',
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

    if (selectedZoneId) {
      filters.push({
        key: 'zoneId',
        operator: 'EQUAL',
        value: selectedZoneId,
        dataType: 'STRING',
      })
    }

    return filters
  }, [selectedType, selectedStatus, selectedZoneId])

  /**
   * Handle row click - navigate to details
   */
  const handleRowClick = (row: any) => {
    navigate(`/warehouse/bins/${row.id}`)
  }

  /**
   * Handle export to Excel
   */
  const handleExport = async () => {
    try {
      toast.info('Exporting bins...')

      // Fetch all bins (without pagination for export)
      const response = await api.get('/warehouse-service/api/warehouse/v1/bins', {
        params: { page: 0, size: 10000 },
      })
      const bins = response.data?.content || response.data || []

      const columns = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'binType', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'maxWeightKg', label: 'Max Weight (kg)' },
        { key: 'currentWeightKg', label: 'Current Weight (kg)' },
        { key: 'capacityCubicMeters', label: 'Capacity (m³)' },
        { key: 'currentOccupancyCubicMeters', label: 'Occupancy (m³)' },
        { key: 'utilizationPercentage', label: 'Utilization %', formatter: (v: any) => v?.toFixed(1) || '0' },
        { key: 'locationString', label: 'Location' },
        { key: 'barcode', label: 'Barcode' },
        { key: 'createdAt', label: 'Created At' },
      ]

      exportToExcel(bins, columns, 'bins')
      toast.success('Export completed')
    } catch (error: any) {
      console.error('Export failed:', error)
      toast.error(error?.response?.data?.message || 'Failed to export bins')
    }
  }

  /**
   * Handle delete bin
   */
  const handleDelete = async (bin: BinType) => {
    if (!window.confirm(`Are you sure you want to delete bin "${bin.name || bin.code}"?`)) {
      return
    }

    try {
      await deleteBin(bin.id).unwrap()
      toast.success('Bin deleted successfully')
      refresh()
    } catch (error: any) {
      console.error('Delete failed:', error)
      toast.error(error?.data?.message || 'Failed to delete bin')
    }
  }

  /**
   * DataTable columns definition
   */
  const binColumns = useMemo(() => [
    {
      id: 'code',
      accessorKey: 'code',
      header: 'Code',
      cell: ({ getValue }: any) => (
        <span className="font-mono text-sm font-semibold text-gray-900">
          {getValue() || '---'}
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
        <span className="font-medium text-gray-900">{getValue() || '---'}</span>
      ),
      meta: {
        type: 'string',
        filterKey: 'name',
        operators: ['LIKE'],
      },
    },
    {
      id: 'binType',
      accessorKey: 'binType',
      header: 'Type',
      cell: ({ getValue }: any) => {
        const type = getValue()
        const typeLabel = BIN_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type
        const typeColors: Record<string, string> = {
          PALLET: 'bg-blue-100 text-blue-800',
          SHELF: 'bg-green-100 text-green-800',
          RACK: 'bg-yellow-100 text-yellow-800',
          CAGE: 'bg-purple-100 text-purple-800',
          DRAWER: 'bg-orange-100 text-orange-800',
        }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}>
            {typeLabel}
          </span>
        )
      },
      meta: {
        type: 'string',
        filterKey: 'binType',
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
          AVAILABLE: 'bg-green-100 text-green-800',
          OCCUPIED: 'bg-blue-100 text-blue-800',
          RESERVED: 'bg-yellow-100 text-yellow-800',
          MAINTENANCE: 'bg-red-100 text-red-800',
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
      id: 'location',
      accessorKey: 'locationString',
      header: 'Location',
      cell: ({ row }: any) => {
        const aisle = row.original?.aisleNumber
        const shelf = row.original?.shelfNumber
        const level = row.original?.levelNumber
        const locationStr = row.original?.locationString

        if (locationStr) {
          return (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{locationStr}</span>
            </div>
          )
        }

        if (aisle || shelf || level) {
          return (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-mono">
                {aisle ? `A${aisle}` : ''}{shelf ? `-S${shelf}` : ''}{level ? `-L${level}` : ''}
              </span>
            </div>
          )
        }

        return <span className="text-gray-400">---</span>
      },
      meta: {
        type: 'string',
        filterKey: 'locationString',
        operators: ['LIKE'],
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
      id: 'weight',
      accessorKey: 'maxWeightKg',
      header: 'Weight',
      cell: ({ row }: any) => {
        const maxWeight = row.original?.maxWeightKg
        const currentWeight = row.original?.currentWeightKg || 0

        if (!maxWeight) {
          return <span className="text-gray-400">---</span>
        }

        const weightUtilization = (currentWeight / maxWeight) * 100
        const weightColor = weightUtilization > 90 ? 'text-red-600' : weightUtilization > 70 ? 'text-yellow-600' : 'text-green-600'

        return (
          <div className="flex flex-col">
            <span className="text-sm">{currentWeight.toFixed(1)} / {maxWeight} kg</span>
            <span className={`text-xs ${weightColor}`}>
              {weightUtilization.toFixed(0)}% used
            </span>
          </div>
        )
      },
      meta: {
        type: 'number',
        filterKey: 'maxWeightKg',
        operators: ['GREATER_THAN', 'LESS_THAN'],
      },
    },
    {
      id: 'barcode',
      accessorKey: 'barcode',
      header: 'Barcode',
      cell: ({ getValue }: any) => {
        const barcode = getValue()
        if (!barcode) {
          return <span className="text-gray-400">---</span>
        }
        return (
          <div className="flex items-center gap-1">
            <Barcode className="w-4 h-4 text-gray-400" />
            <span className="font-mono text-xs">{barcode}</span>
          </div>
        )
      },
      meta: {
        type: 'string',
        filterKey: 'barcode',
        operators: ['EQUAL', 'LIKE'],
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
          : '---'
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
        const bin = row.original as BinType
        const canEdit = useActionPermission('BIN_UPDATE')
        const canDelete = useActionPermission('BIN_DELETE')
        const canView = useActionPermission('BIN_VIEW')

        return (
          <div className="flex items-center gap-2">
            {canView && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/warehouse/bins/${bin.id}`)
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
                  setSelectedBin(bin)
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
                  handleDelete(bin)
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
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Box className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Bins</h1>
              <p className="text-orange-100 mt-1">
                Manage storage bins and locations
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
            {canCreateBin && (
              <button
                onClick={() => setShowCreateDrawer(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium"
              >
                <PlusCircle className="w-5 h-5" />
                Add Bin
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
                Bin Type
              </label>
              <SearchableSelect
                options={BIN_TYPE_OPTIONS}
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

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedType(null)
                  setSelectedStatus(null)
                  setSelectedZoneId(null)
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
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                Type: {BIN_TYPE_OPTIONS.find(opt => opt.value === selectedType)?.label}
                <button
                  onClick={() => setSelectedType(null)}
                  className="ml-1 hover:text-orange-900"
                  aria-label="Clear type filter"
                >
                  x
                </button>
              </span>
            )}
            {selectedStatus && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                Status: {selectedStatus}
                <button
                  onClick={() => setSelectedStatus(null)}
                  className="ml-1 hover:text-orange-900"
                  aria-label="Clear status filter"
                >
                  x
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* DataTable */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <DataTable
          title="All Bins"
          service="warehouse-service"
          resourceBase="/api/warehouse/v1/bins"
          columns={binColumns}
          pageSize={20}
          refreshKey={refreshKey}
          getRowId={(r) => r?.id}
          tableId="bins-list"
          onRowClick={handleRowClick}
          filters={combinedFilters}
        />
      </div>

      {/* Create Bin Drawer */}
      {showCreateDrawer && (
        <BinFormDrawer
          open={showCreateDrawer}
          onClose={() => setShowCreateDrawer(false)}
          onSuccess={() => {
            setShowCreateDrawer(false)
            refresh()
          }}
        />
      )}

      {/* Edit Bin Drawer */}
      {showEditDrawer && selectedBin && (
        <BinFormDrawer
          open={showEditDrawer}
          onClose={() => {
            setShowEditDrawer(false)
            setSelectedBin(null)
          }}
          binId={selectedBin.id}
          onSuccess={() => {
            setShowEditDrawer(false)
            setSelectedBin(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}
