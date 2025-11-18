/**
 * SkeletonTable Component
 * 
 * Displays skeleton loading state for DataTable.
 * Shows placeholder rows with animated shimmer effect.
 * 
 * @author CARE Team
 */

import React from 'react'

interface SkeletonTableProps {
  /**
   * Number of rows to display
   */
  rows?: number
  
  /**
   * Number of columns to display
   */
  columns?: number
  
  /**
   * Show header row
   */
  showHeader?: boolean
}

/**
 * SkeletonTable component for loading states
 * 
 * @example
 * ```tsx
 * {loading ? (
 *   <SkeletonTable rows={10} columns={6} />
 * ) : (
 *   <DataTable data={data} columns={columns} />
 * )}
 * ```
 */
export default function SkeletonTable({
  rows = 5,
  columns = 6,
  showHeader = true,
}: SkeletonTableProps) {
  return (
    <div className="w-full">
      <table className="w-full border-collapse">
        {showHeader && (
          <thead>
            <tr className="border-b border-gray-200">
              {Array.from({ length: columns }).map((_, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                >
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

