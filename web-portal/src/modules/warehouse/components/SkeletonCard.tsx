/**
 * SkeletonCard Component
 * 
 * Displays skeleton loading state for cards (KPI cards, dashboard widgets).
 * Shows placeholder content with animated shimmer effect.
 * 
 * @author CARE Team
 */

import React from 'react'

interface SkeletonCardProps {
  /**
   * Card height variant
   */
  height?: 'sm' | 'md' | 'lg'
  
  /**
   * Show icon placeholder
   */
  showIcon?: boolean
  
  /**
   * Show multiple lines of text
   */
  lines?: number
}

/**
 * SkeletonCard component for loading states
 * 
 * @example
 * ```tsx
 * {loading ? (
 *   <SkeletonCard height="md" showIcon lines={2} />
 * ) : (
 *   <MetricCard {...metric} />
 * )}
 * ```
 */
export default function SkeletonCard({
  height = 'md',
  showIcon = true,
  lines = 2,
}: SkeletonCardProps) {
  const heights = {
    sm: 'h-24',
    md: 'h-32',
    lg: 'h-40',
  }

  return (
    <div className={`${heights[height]} bg-white rounded-lg shadow-sm border border-gray-200 p-4`}>
      <div className="flex items-start justify-between">
        {showIcon && (
          <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
        )}
        <div className="flex-1 ml-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4" />
          {Array.from({ length: lines }).map((_, idx) => (
            <div
              key={idx}
              className={`h-3 bg-gray-200 rounded animate-pulse mb-1 ${
                idx === lines - 1 ? 'w-1/2' : 'w-full'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

