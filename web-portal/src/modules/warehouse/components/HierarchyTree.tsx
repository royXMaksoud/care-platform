/**
 * HierarchyTree Component
 *
 * A reusable tree view component for displaying hierarchical data.
 * Supports expand/collapse, selection, and action buttons.
 *
 * @author CARE Team
 */

import React, { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Edit3,
  Trash2,
  Plus,
  MoreVertical,
} from 'lucide-react'

interface TreeNode {
  id: string
  nameTranslations: Record<string, string>
  children?: TreeNode[]
  level?: number
  isActive?: boolean
  materialCount?: number
}

interface HierarchyTreeProps {
  data: TreeNode[]
  onSelect?: (node: TreeNode) => void
  onEdit?: (node: TreeNode) => void
  onDelete?: (node: TreeNode) => void
  onAddChild?: (parentNode: TreeNode) => void
  selectedId?: string
  language?: string
  showActions?: boolean
  showCount?: boolean
  expandAll?: boolean
  className?: string
}

interface TreeNodeItemProps {
  node: TreeNode
  level: number
  onSelect?: (node: TreeNode) => void
  onEdit?: (node: TreeNode) => void
  onDelete?: (node: TreeNode) => void
  onAddChild?: (parentNode: TreeNode) => void
  selectedId?: string
  language: string
  showActions: boolean
  showCount: boolean
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
}

function TreeNodeItem({
  node,
  level,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  selectedId,
  language,
  showActions,
  showCount,
  expandedIds,
  onToggleExpand,
}: TreeNodeItemProps) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id
  const displayName = node.nameTranslations[language] || node.nameTranslations['en'] || 'Unnamed'

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleExpand(node.id)
  }

  const handleSelect = () => {
    onSelect?.(node)
  }

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors
          ${isSelected ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}
          ${!node.isActive ? 'opacity-50' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Folder Icon */}
        {isExpanded && hasChildren ? (
          <FolderOpen className="w-4 h-4 text-yellow-500" />
        ) : (
          <Folder className="w-4 h-4 text-yellow-500" />
        )}

        {/* Node Name */}
        <span className="flex-1 text-sm font-medium truncate">
          {displayName}
        </span>

        {/* Material Count */}
        {showCount && node.materialCount !== undefined && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {node.materialCount}
          </span>
        )}

        {/* Status Badge */}
        {!node.isActive && (
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            Inactive
          </span>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onAddChild && level < 2 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddChild(node)
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Add subcategory"
              >
                <Plus className="w-3.5 h-3.5 text-green-600" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(node)
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Edit"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(node)
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              selectedId={selectedId}
              language={language}
              showActions={showActions}
              showCount={showCount}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function HierarchyTree({
  data,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  selectedId,
  language = 'en',
  showActions = true,
  showCount = true,
  expandAll = false,
  className = '',
}: HierarchyTreeProps) {
  // Collect all node IDs for expandAll
  const getAllIds = (nodes: TreeNode[]): string[] => {
    return nodes.flatMap((node) => [
      node.id,
      ...(node.children ? getAllIds(node.children) : []),
    ])
  }

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    expandAll ? new Set(getAllIds(data)) : new Set()
  )

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleExpandAll = () => {
    setExpandedIds(new Set(getAllIds(data)))
  }

  const handleCollapseAll = () => {
    setExpandedIds(new Set())
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>No categories found</p>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Controls */}
      <div className="flex justify-end gap-2 text-xs">
        <button
          onClick={handleExpandAll}
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          Expand All
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={handleCollapseAll}
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          Collapse All
        </button>
      </div>

      {/* Tree */}
      <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
        {data.map((node) => (
          <div key={node.id} className="group">
            <TreeNodeItem
              node={node}
              level={0}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              selectedId={selectedId}
              language={language}
              showActions={showActions}
              showCount={showCount}
              expandedIds={expandedIds}
              onToggleExpand={handleToggleExpand}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
