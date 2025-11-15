import React from 'react'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

/**
 * Reusable metric card component for displaying KPIs
 * Supports trend indicators and color coding
 */
export default function MetricCard({
  title,
  value,
  unit = '%',
  trend = null, // { direction: 'up'|'down', percentage: number, period: 'vs last month' }
  status = 'normal', // 'normal', 'warning', 'critical', 'success'
  icon: Icon = null,
  description = '',
  onClick = null,
  className = '',
}) {
  // Status colors
  const statusColors = {
    normal: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    critical: 'bg-red-50 border-red-200 text-red-900',
  }

  const statusValueColors = {
    normal: 'text-blue-700',
    success: 'text-green-700',
    warning: 'text-yellow-700',
    critical: 'text-red-700',
  }

  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.direction === 'up') {
      return <TrendingUp className="w-4 h-4" />
    }
    return <TrendingDown className="w-4 h-4" />
  }

  const getTrendColor = () => {
    if (!trend) return ''
    if (trend.direction === 'up') return 'text-green-600'
    return 'text-red-600'
  }

  return (
    <div
      className={`
        border rounded-lg p-6 transition-all
        ${statusColors[status]}
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header with icon and title */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium opacity-75">{title}</h3>
        {Icon && <Icon className="w-5 h-5 opacity-50" />}
      </div>

      {/* Main value */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-3xl font-bold ${statusValueColors[status]}`}>
          {typeof value === 'number' && value % 1 !== 0
            ? value.toFixed(1)
            : value}
        </span>
        <span className="text-sm opacity-75">{unit}</span>
      </div>

      {/* Description and trend */}
      <div className="flex items-center justify-between text-xs">
        {description && <span className="opacity-70">{description}</span>}

        {trend && (
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>
              {trend.direction === 'up' ? '+' : '-'}
              {trend.percentage}% {trend.period}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Metric Cards Container - Grid of metric cards
 */
export function MetricCardsGrid({ metrics, isLoading, className = '' }) {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gray-200 border border-gray-300 rounded-lg p-6 animate-pulse h-32"
          />
        ))}
      </div>
    )
  }

  if (!metrics) {
    return null
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      <MetricCard
        title="Total Appointments"
        value={metrics.totalAppointments || 0}
        unit="appts"
        status="normal"
        description="This period"
      />

      <MetricCard
        title="Completion Rate"
        value={metrics.completionRate || 0}
        unit="%"
        status={
          metrics.completionRate >= 85
            ? 'success'
            : metrics.completionRate >= 70
              ? 'normal'
              : 'warning'
        }
        description="Successfully completed"
      />

      <MetricCard
        title="No-Show Rate"
        value={metrics.noShowRate || 0}
        unit="%"
        status={metrics.noShowRate > 10 ? 'warning' : 'normal'}
        description="Beneficiaries absent"
      />

      <MetricCard
        title="Cancellation Rate"
        value={metrics.cancellationRate || 0}
        unit="%"
        status={metrics.cancellationRate > 15 ? 'critical' : 'normal'}
        description="Cancelled appointments"
      />
    </div>
  )
}
