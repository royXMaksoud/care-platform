/**
 * EmptyState Component
 * 
 * Displays a friendly empty state message when no data is available.
 * Used in tables, dashboards, and pages with no data.
 * 
 * @author CARE Team
 */

import React from 'react'
import { Package, Inbox, Search, AlertCircle } from 'lucide-react'

interface EmptyStateProps {
  /**
   * Title of the empty state
   */
  title: string
  
  /**
   * Optional description text
   */
  description?: string
  
  /**
   * Optional action button label
   */
  actionLabel?: string
  
  /**
   * Optional action button click handler
   */
  onAction?: () => void
  
  /**
   * Icon to display (default: Package)
   */
  icon?: React.ComponentType<{ className?: string }>
  
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * EmptyState component for displaying no-data states
 * 
 * @example
 * ```tsx
 * {data.length === 0 && (
 *   <EmptyState
 *     title="No warehouses found"
 *     description="Create your first warehouse to get started"
 *     actionLabel="Create Warehouse"
 *     onAction={() => setShowCreateModal(true)}
 *   />
 * )}
 * ```
 */
export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Package,
  size = 'md',
}: EmptyStateProps) {
  const iconSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  }

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className={`${iconSizes[size]} text-gray-400 mb-4`}>
        <Icon className="w-full h-full" />
      </div>
      
      <h3 className={`${textSizes[size]} font-semibold text-gray-700 mb-2`}>
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-500 text-center max-w-md mb-6">
          {description}
        </p>
      )}
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

/**
 * EmptyState variants for common scenarios
 */
export const EmptyStateVariants = {
  /**
   * No data found (search/filter results)
   */
  NoResults: (props: Omit<EmptyStateProps, 'icon'>) => (
    <EmptyState
      {...props}
      icon={Search}
      title={props.title || 'No results found'}
      description={props.description || 'Try adjusting your filters or search criteria'}
    />
  ),
  
  /**
   * No data available (initial state)
   */
  NoData: (props: Omit<EmptyStateProps, 'icon'>) => (
    <EmptyState
      {...props}
      icon={Inbox}
      title={props.title || 'No data available'}
      description={props.description || 'Get started by creating your first item'}
    />
  ),
  
  /**
   * Error state
   */
  Error: (props: Omit<EmptyStateProps, 'icon'>) => (
    <EmptyState
      {...props}
      icon={AlertCircle}
      title={props.title || 'Something went wrong'}
      description={props.description || 'Please try again later'}
    />
  ),
}

