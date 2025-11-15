import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'

/**
 * Advanced dashboard filter panel
 * Supports date range, service types, statuses, centers, governorates, priority, and beneficiary status
 */
export default function DashboardFilterPanel({
  value,
  onChange,
  onApply,
  onClear,
  options = {},
  isExpanded = false,
  onToggleExpand,
}) {
  const { t } = useTranslation()
  const [filters, setFilters] = useState(value || {})

  useEffect(() => {
    setFilters(value || {})
  }, [value])

  // Default options
  const {
    serviceTypes = [],
    statuses = [],
    centers = [],
    governorates = [],
    periods = ['DAILY', 'WEEKLY', 'MONTHLY'],
  } = options

  const handleDateChange = (field, newValue) => {
    const updated = { ...filters, [field]: newValue }
    setFilters(updated)
    onChange?.(updated)
  }

  const handleMultiSelect = (field, option) => {
    const current = filters[field] || []
    const updated = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option]
    const newFilters = { ...filters, [field]: updated }
    setFilters(newFilters)
    onChange?.(newFilters)
  }

  const handlePriorityChange = (priority) => {
    const updated = { ...filters, priority: filters.priority === priority ? null : priority }
    setFilters(updated)
    onChange?.(updated)
  }

  const handleStatusChange = (status) => {
    const updated = { ...filters, beneficiaryStatus: filters.beneficiaryStatus === status ? null : status }
    setFilters(updated)
    onChange?.(updated)
  }

  const handleClear = () => {
    setFilters({})
    onClear?.()
  }

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : v !== '')
  )

  return (
    <div className="border rounded-lg bg-white">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onToggleExpand?.()
          }
        }}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
            {hasActiveFilters && (
              <p className="text-xs text-blue-600">
                {Object.values(filters).flat().filter((v) => v).length} filters applied
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleClear()
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Clear filters"
            >
              <RotateCcw className="w-4 h-4 text-gray-600" />
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleDateChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleDateChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                value={filters.period || 'DAILY'}
                onChange={(e) => handleDateChange('period', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {periods.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Types</label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                {serviceTypes.map((st) => (
                  <label key={st.id} className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(filters.serviceTypeIds || []).includes(st.id)}
                      onChange={() => handleMultiSelect('serviceTypeIds', st.id)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{st.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Status</label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                {statuses.map((status) => (
                  <label key={status} className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(filters.statuses || []).includes(status)}
                      onChange={() => handleMultiSelect('statuses', status)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Centers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Centers</label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                {centers.map((center) => (
                  <label
                    key={center.id}
                    className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(filters.centerIds || []).includes(center.id)}
                      onChange={() => handleMultiSelect('centerIds', center.id)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{center.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Governorates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Governorates</label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                {governorates.map((gov) => (
                  <label key={gov} className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(filters.governorates || []).includes(gov)}
                      onChange={() => handleMultiSelect('governorates', gov)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{gov}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <div className="flex gap-2">
                {['NORMAL', 'URGENT'].map((priority) => (
                  <button
                    key={priority}
                    onClick={() => handlePriorityChange(priority)}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                      filters.priority === priority
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Beneficiary Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Beneficiary Status</label>
              <div className="flex gap-2">
                {[
                  { label: 'Active', value: true },
                  { label: 'Inactive', value: false },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                      filters.beneficiaryStatus === opt.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button
              onClick={() => {
                onApply?.(filters)
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
