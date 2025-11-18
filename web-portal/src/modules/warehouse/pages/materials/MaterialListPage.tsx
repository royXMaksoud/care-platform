/**
 * MaterialListPage Component
 *
 * Main list page for materials with filters, search, and DataTable.
 *
 * Features:
 * - DataTable with pagination
 * - Filters (category, brand, status)
 * - Excel/CSV export
 * - Create/Edit drawers
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
  Package,
  PlusCircle,
  Edit3,
  Eye,
  Trash2,
  Filter,
  Download,
  X,
  Tag,
  AlertTriangle,
} from 'lucide-react'
import { useGetCategoriesTreeQuery } from '../../store/api/categoryApi'
import { useGetBrandsQuery } from '../../store/api/brandApi'
import { useDeleteMaterialMutation } from '../../store/api/materialApi'
import EmptyState from '../../components/EmptyState'
import SkeletonTable from '../../components/SkeletonTable'
import { exportToExcel } from '../../utils/exportToExcel'
import MaterialFormDrawer from './MaterialFormDrawer'
import type { Material as MaterialType } from '../../types'

/**
 * Material status options for filter
 */
const MATERIAL_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
]

/**
 * Trackable options
 */
const TRACKABLE_OPTIONS = [
  { value: 'true', label: 'Trackable' },
  { value: 'false', label: 'Non-Trackable' },
]

export default function MaterialListPage() {
  const navigate = useNavigate()
  const canCreateMaterial = useActionPermission('MATERIAL_CREATE')

  const [showFilters, setShowFilters] = useState(true)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedTrackable, setSelectedTrackable] = useState<string | null>(null)

  // Load categories and brands for filter dropdowns
  const { data: categoriesTree } = useGetCategoriesTreeQuery()
  const { data: brandsData } = useGetBrandsQuery({ size: 1000, isActive: true })

  const [deleteMaterial] = useDeleteMaterialMutation()

  // Flatten categories for dropdown
  const categoryOptions = useMemo(() => {
    const flatten = (nodes: any[], prefix = ''): any[] => {
      return nodes.flatMap((node) => [
        {
          value: node.id,
          label: prefix + (node.nameTranslations?.en || 'Unnamed'),
        },
        ...(node.children ? flatten(node.children, prefix + '  ') : []),
      ])
    }
    return categoriesTree ? flatten(categoriesTree) : []
  }, [categoriesTree])

  // Brand options for dropdown
  const brandOptions = useMemo(() => {
    return (brandsData?.content || []).map((brand) => ({
      value: brand.id,
      label: brand.nameTranslations?.en || 'Unnamed',
    }))
  }, [brandsData])

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

    if (selectedCategory) {
      filters.push({
        key: 'categoryId',
        operator: 'EQUAL',
        value: selectedCategory,
        dataType: 'STRING',
      })
    }

    if (selectedBrand) {
      filters.push({
        key: 'brandId',
        operator: 'EQUAL',
        value: selectedBrand,
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

    if (selectedTrackable !== null) {
      filters.push({
        key: 'isTrackable',
        operator: 'EQUAL',
        value: selectedTrackable === 'true',
        dataType: 'BOOLEAN',
      })
    }

    return filters
  }, [selectedCategory, selectedBrand, selectedStatus, selectedTrackable])

  /**
   * Handle delete material
   */
  const handleDelete = async (material: MaterialType) => {
    const displayName = material.nameTranslations?.en || material.code
    if (!window.confirm(`Are you sure you want to delete material "${displayName}"?`)) {
      return
    }

    try {
      await deleteMaterial(material.id).unwrap()
      toast.success('Material deleted successfully')
      refresh()
    } catch (error: any) {
      console.error('Delete failed:', error)
      toast.error(error?.data?.message || 'Failed to delete material')
    }
  }

  /**
   * Handle export to Excel
   */
  const handleExport = async () => {
    toast.info('Export functionality coming soon')
  }

  /**
   * DataTable columns definition
   */
  const materialColumns = useMemo(
    () => [
      {
        id: 'code',
        accessorKey: 'code',
        header: 'Code',
        cell: ({ getValue }: any) => (
          <span className="font-mono text-sm font-semibold text-gray-900">
            {getValue() || '-'}
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
        accessorKey: 'nameTranslations',
        header: 'Name',
        cell: ({ getValue }: any) => {
          const translations = getValue()
          const name = translations?.en || translations?.ar || 'Unnamed'
          return <span className="font-medium text-gray-900">{name}</span>
        },
        meta: {
          type: 'string',
          filterKey: 'nameSearch',
          operators: ['LIKE'],
        },
      },
      {
        id: 'category',
        accessorKey: 'categoryId',
        header: 'Category',
        cell: ({ getValue }: any) => {
          const categoryId = getValue()
          const category = categoryOptions.find((c) => c.value === categoryId)
          return category ? (
            <span className="text-sm text-gray-600">{category.label.trim()}</span>
          ) : (
            <span className="text-gray-400">-</span>
          )
        },
      },
      {
        id: 'brand',
        accessorKey: 'brandId',
        header: 'Brand',
        cell: ({ getValue }: any) => {
          const brandId = getValue()
          const brand = brandOptions.find((b) => b.value === brandId)
          return brand ? (
            <span className="text-sm text-gray-600">{brand.label}</span>
          ) : (
            <span className="text-gray-400">-</span>
          )
        },
      },
      {
        id: 'unit',
        accessorKey: 'unit',
        header: 'Unit',
        cell: ({ getValue }: any) => {
          const unit = getValue()
          return unit ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
              {unit}
            </span>
          ) : (
            '-'
          )
        },
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }: any) => {
          const status = getValue()
          const statusConfig: Record<string, { bg: string; text: string }> = {
            ACTIVE: { bg: 'bg-green-100', text: 'text-green-800' },
            INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800' },
            DISCONTINUED: { bg: 'bg-red-100', text: 'text-red-800' },
            PENDING_APPROVAL: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
          }
          const config = statusConfig[status] || statusConfig.INACTIVE
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
            >
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
        id: 'isTrackable',
        accessorKey: 'isTrackable',
        header: 'Trackable',
        cell: ({ getValue }: any) => {
          const isTrackable = getValue()
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                isTrackable
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isTrackable ? 'Yes' : 'No'}
            </span>
          )
        },
      },
      {
        id: 'reorderLevel',
        accessorKey: 'reorderLevel',
        header: 'Reorder Level',
        cell: ({ getValue }: any) => {
          const level = getValue()
          return level !== undefined && level !== null ? (
            <span className="text-sm">{level}</span>
          ) : (
            '-'
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }: any) => {
          const material = row.original as MaterialType
          const canEdit = useActionPermission('MATERIAL_UPDATE')
          const canDelete = useActionPermission('MATERIAL_DELETE')
          const canView = useActionPermission('MATERIAL_VIEW')

          return (
            <div className="flex items-center gap-2">
              {canView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/warehouse/materials/${material.id}`)
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
                    setSelectedMaterial(material)
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
                    handleDelete(material)
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
    ],
    [categoryOptions, brandOptions, navigate]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Materials</h1>
              <p className="text-indigo-100 mt-1">
                Manage material catalog and inventory items
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
            {canCreateMaterial && (
              <button
                onClick={() => setShowCreateDrawer(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
              >
                <PlusCircle className="w-5 h-5" />
                Add Material
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <SearchableSelect
                options={categoryOptions}
                value={selectedCategory}
                onChange={(value) => setSelectedCategory(value as string | null)}
                placeholder="All categories"
                isClearable
              />
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <SearchableSelect
                options={brandOptions}
                value={selectedBrand}
                onChange={(value) => setSelectedBrand(value as string | null)}
                placeholder="All brands"
                isClearable
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <SearchableSelect
                options={MATERIAL_STATUS_OPTIONS}
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value as string | null)}
                placeholder="All statuses"
                isClearable
              />
            </div>

            {/* Trackable Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trackable
              </label>
              <SearchableSelect
                options={TRACKABLE_OPTIONS}
                value={selectedTrackable}
                onChange={(value) => setSelectedTrackable(value as string | null)}
                placeholder="All"
                isClearable
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  setSelectedBrand(null)
                  setSelectedStatus(null)
                  setSelectedTrackable(null)
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DataTable */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <DataTable
          title="All Materials"
          service="warehouse-service"
          resourceBase="/api/warehouse/v1/materials"
          columns={materialColumns}
          pageSize={20}
          refreshKey={refreshKey}
          getRowId={(r) => r?.id}
          tableId="materials-list"
          filters={combinedFilters}
        />
      </div>

      {/* Create Drawer */}
      {showCreateDrawer && (
        <MaterialFormDrawer
          open={showCreateDrawer}
          mode="create"
          onClose={() => setShowCreateDrawer(false)}
          onSuccess={() => {
            setShowCreateDrawer(false)
            refresh()
          }}
        />
      )}

      {/* Edit Drawer */}
      {showEditDrawer && selectedMaterial && (
        <MaterialFormDrawer
          open={showEditDrawer}
          mode="edit"
          material={selectedMaterial}
          onClose={() => {
            setShowEditDrawer(false)
            setSelectedMaterial(null)
          }}
          onSuccess={() => {
            setShowEditDrawer(false)
            setSelectedMaterial(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}
