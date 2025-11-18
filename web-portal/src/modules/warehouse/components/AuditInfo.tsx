/**
 * AuditInfo Component
 * 
 * Displays audit information (created/updated by, timestamps) in a subtle format.
 * Used in detail pages to show who created/updated records and when.
 * 
 * @author CARE Team
 */

import React from 'react'
import { Calendar, User, Clock } from 'lucide-react'

interface AuditInfoProps {
  /**
   * Creation timestamp (ISO string)
   */
  createdAt?: string
  
  /**
   * Creator user ID or name
   */
  createdBy?: string
  
  /**
   * Update timestamp (ISO string)
   */
  updatedAt?: string
  
  /**
   * Updater user ID or name
   */
  updatedBy?: string
  
  /**
   * Show labels
   */
  showLabels?: boolean
  
  /**
   * Size variant
   */
  size?: 'sm' | 'md'
}

/**
 * Format date to readable string
 */
function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

/**
 * AuditInfo component for displaying audit fields
 * 
 * @example
 * ```tsx
 * <AuditInfo
 *   createdAt={warehouse.createdAt}
 *   createdBy={warehouse.createdById}
 *   updatedAt={warehouse.updatedAt}
 *   updatedBy={warehouse.updatedById}
 * />
 * ```
 */
export default function AuditInfo({
  createdAt,
  createdBy,
  updatedAt,
  updatedBy,
  showLabels = true,
  size = 'sm',
}: AuditInfoProps) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <div className={`${textSize} text-gray-500 space-y-1`}>
      {createdAt && (
        <div className="flex items-center gap-1">
          <Calendar className={iconSize} />
          {showLabels && <span className="font-medium">Created:</span>}
          <span>{formatDate(createdAt)}</span>
          {createdBy && (
            <>
              <span className="mx-1">•</span>
              <User className={iconSize} />
              <span>{createdBy}</span>
            </>
          )}
        </div>
      )}
      
      {updatedAt && updatedAt !== createdAt && (
        <div className="flex items-center gap-1">
          <Clock className={iconSize} />
          {showLabels && <span className="font-medium">Updated:</span>}
          <span>{formatDate(updatedAt)}</span>
          {updatedBy && (
            <>
              <span className="mx-1">•</span>
              <User className={iconSize} />
              <span>{updatedBy}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

