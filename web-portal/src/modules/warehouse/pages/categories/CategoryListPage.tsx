/**
 * CategoryListPage Component
 *
 * Main list page for categories with tree view and management features.
 *
 * Features:
 * - Tree view with expand/collapse
 * - Material count per category
 * - Create/Edit/Delete categories
 * - 3-level hierarchy support
 *
 * @author CARE Team
 */

import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useActionPermission } from '@/hooks/useActionPermission'
import {
  FolderTree,
  PlusCircle,
  Download,
  RefreshCw,
  Search,
} from 'lucide-react'
import {
  useGetCategoriesTreeQuery,
  useDeleteCategoryMutation,
} from '../../store/api/categoryApi'
import HierarchyTree from '../../components/HierarchyTree'
import CategoryFormDrawer from './CategoryFormDrawer'
import type { CategoryTreeNode } from '../../types'

export default function CategoryListPage() {
  const canCreateCategory = useActionPermission('CATEGORY_CREATE')
  const canEditCategory = useActionPermission('CATEGORY_UPDATE')
  const canDeleteCategory = useActionPermission('CATEGORY_DELETE')

  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryTreeNode | null>(null)
  const [parentCategory, setParentCategory] = useState<CategoryTreeNode | null>(null)
  const [searchText, setSearchText] = useState('')

  // Load categories as tree
  const { data: categoriesTree, isLoading, refetch } = useGetCategoriesTreeQuery()
  const [deleteCategory] = useDeleteCategoryMutation()

  /**
   * Refresh tree data
   */
  const refresh = useCallback(() => {
    refetch()
  }, [refetch])

  /**
   * Handle select category
   */
  const handleSelect = (node: CategoryTreeNode) => {
    setSelectedCategory(node)
  }

  /**
   * Handle edit category
   */
  const handleEdit = (node: CategoryTreeNode) => {
    setSelectedCategory(node)
    setShowEditDrawer(true)
  }

  /**
   * Handle delete category
   */
  const handleDelete = async (node: CategoryTreeNode) => {
    const displayName = node.nameTranslations?.en || 'Unnamed'
    const hasChildren = node.children && node.children.length > 0

    let confirmMessage = `Are you sure you want to delete category "${displayName}"?`
    if (hasChildren) {
      confirmMessage += ` This will also delete ${node.children.length} subcategories.`
    }

    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      await deleteCategory(node.id).unwrap()
      toast.success('Category deleted successfully')
      refresh()
    } catch (error: any) {
      console.error('Delete failed:', error)
      toast.error(error?.data?.message || 'Failed to delete category')
    }
  }

  /**
   * Handle add child category
   */
  const handleAddChild = (parentNode: CategoryTreeNode) => {
    if (parentNode.level >= 2) {
      toast.error('Maximum hierarchy depth (3 levels) reached')
      return
    }
    setParentCategory(parentNode)
    setShowCreateDrawer(true)
  }

  /**
   * Handle create root category
   */
  const handleCreateRoot = () => {
    setParentCategory(null)
    setShowCreateDrawer(true)
  }

  /**
   * Filter tree by search text
   */
  const filteredTree = React.useMemo(() => {
    if (!searchText || !categoriesTree) {
      return categoriesTree || []
    }

    const filterNodes = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
      return nodes
        .map((node) => {
          const matchesSearch =
            node.nameTranslations?.en?.toLowerCase().includes(searchText.toLowerCase()) ||
            node.nameTranslations?.ar?.includes(searchText)

          const filteredChildren = node.children ? filterNodes(node.children) : []
          const hasMatchingChildren = filteredChildren.length > 0

          if (matchesSearch || hasMatchingChildren) {
            return {
              ...node,
              children: filteredChildren,
            }
          }
          return null
        })
        .filter(Boolean) as CategoryTreeNode[]
    }

    return filterNodes(categoriesTree)
  }, [categoriesTree, searchText])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <FolderTree className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Categories</h1>
              <p className="text-amber-100 mt-1">
                Manage category hierarchy (up to 3 levels)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {canCreateCategory && (
              <button
                onClick={handleCreateRoot}
                className="flex items-center gap-2 px-4 py-2 bg-white text-amber-600 rounded-lg hover:bg-amber-50 transition-colors font-medium"
              >
                <PlusCircle className="w-5 h-5" />
                Add Category
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search categories..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Stats */}
            {categoriesTree && (
              <div className="text-sm text-gray-500">
                {categoriesTree.length} root categories
              </div>
            )}
          </div>

          {/* Selected Category Info */}
          {selectedCategory && (
            <div className="text-sm text-gray-600">
              Selected:{' '}
              <span className="font-medium">
                {selectedCategory.nameTranslations?.en || 'Unnamed'}
              </span>
              <span className="text-gray-400 ml-2">
                (Level {selectedCategory.level + 1})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tree View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
          </div>
        ) : (
          <HierarchyTree
            data={filteredTree}
            onSelect={handleSelect}
            onEdit={canEditCategory ? handleEdit : undefined}
            onDelete={canDeleteCategory ? handleDelete : undefined}
            onAddChild={canCreateCategory ? handleAddChild : undefined}
            selectedId={selectedCategory?.id}
            showActions={true}
            showCount={true}
            expandAll={!!searchText}
          />
        )}
      </div>

      {/* Create Drawer */}
      {showCreateDrawer && (
        <CategoryFormDrawer
          open={showCreateDrawer}
          mode="create"
          parentCategory={parentCategory}
          onClose={() => {
            setShowCreateDrawer(false)
            setParentCategory(null)
          }}
          onSuccess={() => {
            setShowCreateDrawer(false)
            setParentCategory(null)
            refresh()
          }}
        />
      )}

      {/* Edit Drawer */}
      {showEditDrawer && selectedCategory && (
        <CategoryFormDrawer
          open={showEditDrawer}
          mode="edit"
          category={selectedCategory}
          onClose={() => {
            setShowEditDrawer(false)
            setSelectedCategory(null)
          }}
          onSuccess={() => {
            setShowEditDrawer(false)
            setSelectedCategory(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}
