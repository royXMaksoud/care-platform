import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/axios'

// Components
import DashboardFilterPanel from '@/modules/appointment/components/DashboardFilterPanel'
import MetricCard, { MetricCardsGrid } from '@/modules/appointment/components/MetricCard'
import InteractiveSyriaMap from '@/modules/appointment/components/InteractiveSyriaMap'
import {
  StatusDistributionChart,
  ServiceTypeChart,
  TrendChart,
  AgeDistributionChart,
  GenderDistributionChart,
  PriorityDistributionChart,
} from '@/modules/appointment/components/AppointmentCharts'

// Hooks
import { useDashboardMetrics } from '@/modules/appointment/hooks/useDashboardMetrics'

// Utils
import { useQuery } from '@tanstack/react-query'


/**
 * Professional Appointment Dashboard
 * Comprehensive analytics and reporting system with Power BI-style visualizations
 *
 * Features:
 * - Executive summary KPI cards
 * - Multi-dimensional filtering (date, status, service, center, location, priority)
 * - Advanced charts and visualizations
 * - Geographic map with center data
 * - Demographic analysis
 * - Time-series trend analysis
 * - Role-based data filtering
 */
export default function AppointmentDashboard() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  const [filterPanelExpanded, setFilterPanelExpanded] = useState(false)
  const [activeFilters, setActiveFilters] = useState(null)
  const [organizationBranches, setOrganizationBranches] = useState([])
  const [branchesLoading, setBranchesLoading] = useState(false)
  const [filterRequest, setFilterRequest] = useState(() => {
    const defaultRange = getDefaultDateRange()
    return {
      ...defaultRange,
      period: 'DAILY',
    }
  })

  // Mock data - replace with actual API calls in production
  const filterOptions = {
    serviceTypes: [
      { id: '1', name: 'Medical Consultation' },
      { id: '2', name: 'Dental Care' },
      { id: '3', name: 'Mental Health' },
      { id: '4', name: 'Vaccination' },
      { id: '5', name: 'Eye Care' },
    ],
    statuses: ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'REQUESTED', 'CONFIRMED'],
    centers: [
      { id: '1', name: 'Damascus Center' },
      { id: '2', name: 'Aleppo Center' },
      { id: '3', name: 'Lattakia Center' },
      { id: '4', name: 'Homs Center' },
    ],
    governorates: ['Damascus', 'Aleppo', 'Lattakia', 'Homs', 'Hama', 'Tartus'],
    periods: ['DAILY', 'WEEKLY', 'MONTHLY'],
  }

  function getDefaultDateRange() {
    const today = new Date()
    const from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    return {
      dateFrom: from.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      period: 'DAILY',
    }
  }

  // Fetch dashboard metrics
  const { metrics, isLoading, error } = useDashboardMetrics(filterRequest)

  // Load organization branches to get accurate geo coordinates
  useEffect(() => {
    let isMounted = true

    const fetchBranches = async () => {
      setBranchesLoading(true)
      try {
        const { data } = await api.post(
          '/access/api/organization-branches/filter',
          { criteria: [] },
          {
            params: {
              page: 0,
              size: 1000,
            },
          }
        )

        if (!isMounted) return

        const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : []
        const activeBranches = content.filter((branch) => branch?.isActive !== false)
        setOrganizationBranches(activeBranches)
      } catch (err) {
        console.error('Failed to load organization branches for dashboard map', err)
        if (isMounted) {
          toast.error(
            t('appointment.reports.dashboard.filtersGeoError', {
              defaultValue: 'Unable to load geographic center data',
            })
          )
        }
      } finally {
        if (isMounted) {
          setBranchesLoading(false)
        }
      }
    }

    fetchBranches()

    return () => {
      isMounted = false
    }
  }, [])

  const branchesById = useMemo(() => {
    const map = new Map()
    organizationBranches.forEach((branch) => {
      const key = branch?.organizationBranchId ?? branch?.id
      if (!key) return
      map.set(String(key), branch)
    })
    return map
  }, [organizationBranches])

  const centerMetricsWithGeo = useMemo(() => {
    const metricCenters = metrics?.centerMetrics ?? []
    if (!metricCenters.length && !branchesById.size) {
      return []
    }

    return metricCenters.map((center) => {
      const branch = branchesById.get(String(center?.centerId))

      const latitude =
        typeof center?.latitude === 'number' && !Number.isNaN(center.latitude)
          ? center.latitude
          : typeof branch?.latitude === 'number'
            ? branch.latitude
            : branch?.latitude != null
              ? Number(branch.latitude)
              : null

      const longitude =
        typeof center?.longitude === 'number' && !Number.isNaN(center.longitude)
          ? center.longitude
          : typeof branch?.longitude === 'number'
            ? branch.longitude
            : branch?.longitude != null
              ? Number(branch.longitude)
              : null

      return {
        ...center,
        centerName: center?.centerName || branch?.name || center?.name,
        governorate: branch?.governorateName || branch?.governorate || center?.governorate,
        latitude,
        longitude,
        address: branch?.address || center?.address,
        organizationBranchId: branch?.organizationBranchId || center?.centerId,
      }
    })
  }, [branchesById, metrics?.centerMetrics])

  // Handle filter application
  const handleApplyFilters = (filters) => {
    const defaultRange = getDefaultDateRange()
    const dateFrom = filters.dateFrom || filterRequest.dateFrom || defaultRange.dateFrom
    const dateTo = filters.dateTo || filterRequest.dateTo || defaultRange.dateTo
    const period = filters.period || filterRequest.period || 'DAILY'

    const request = {
      dateFrom,
      dateTo,
      serviceTypeIds: filters.serviceTypeIds || [],
      statuses: filters.statuses || [],
      centerIds: filters.centerIds || [],
      governorates: filters.governorates || [],
      priority: filters.priority || null,
      beneficiaryStatus: filters.beneficiaryStatus || null,
      period,
    }

    setActiveFilters({
      ...filters,
      dateFrom,
      dateTo,
      period,
    })
    setFilterRequest(request)
    toast.success(
      t('appointment.reports.dashboard.filtersApplied', {
        defaultValue: 'Filters applied successfully',
      })
    )
  }

  const handleClearFilters = () => {
    const defaultRange = getDefaultDateRange()
    const defaultRequest = {
      ...defaultRange,
      period: 'DAILY',
    }
    setActiveFilters(null)
    setFilterRequest(defaultRequest)
    toast.success(
      t('appointment.reports.dashboard.filtersCleared', {
        defaultValue: 'Filters cleared',
      })
    )
  }

  return (
    <div className={`flex flex-col h-full bg-gradient-to-br from-slate-50 to-gray-100 ${isArabic ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex-none px-6 py-4 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('appointment.reports.dashboard.title', { defaultValue: 'Appointment Dashboard' })}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {t('appointment.reports.dashboard.subtitle', {
                defaultValue: 'Professional analytics and reporting for appointment management',
              })}
            </p>
          </div>
          {error && (
            <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                {t('appointment.reports.dashboard.error', {
                  defaultValue: 'Error loading dashboard',
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6">
          {/* Filter Panel */}
          <DashboardFilterPanel
            value={activeFilters}
            onChange={setActiveFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            options={filterOptions}
            isExpanded={filterPanelExpanded}
            onToggleExpand={() => setFilterPanelExpanded(!filterPanelExpanded)}
          />

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-2 text-gray-600">
                {t('appointment.reports.dashboard.loading', {
                  defaultValue: 'Loading dashboard metrics...',
                })}
              </span>
            </div>
          )}

          {!isLoading && metrics && (
            <>
              {/* KPI Cards */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('appointment.reports.dashboard.kpiSection', {
                    defaultValue: 'Key Performance Indicators',
                  })}
                </h2>
                <MetricCardsGrid metrics={metrics} isLoading={isLoading} />
              </section>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('appointment.reports.dashboard.charts.statusDistribution', {
                      defaultValue: 'Appointment Status Distribution',
                    })}
                  </h3>
                  <StatusDistributionChart
                    data={metrics.appointmentsByStatus}
                    isLoading={isLoading}
                  />
                </div>

                {/* Service Type Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('appointment.reports.dashboard.charts.serviceTypeDistribution', {
                      defaultValue: 'Top Service Types',
                    })}
                  </h3>
                  <ServiceTypeChart
                    data={metrics.appointmentsByServiceType}
                    isLoading={isLoading}
                  />
                </div>

                {/* Trend Chart */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('appointment.reports.dashboard.charts.trendAnalysis', {
                      defaultValue: 'Appointment Trend Analysis',
                    })}
                  </h3>
                  <TrendChart
                    data={metrics.appointmentsTrend}
                    isLoading={isLoading}
                    period={filterRequest.period}
                  />
                </div>

                {/* Age Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('appointment.reports.dashboard.charts.ageDistribution', {
                      defaultValue: 'Beneficiary Age Distribution',
                    })}
                  </h3>
                  <AgeDistributionChart
                    data={metrics.beneficiaryByAgeGroup}
                    isLoading={isLoading}
                  />
                </div>

                {/* Gender Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('appointment.reports.dashboard.charts.genderDistribution', {
                      defaultValue: 'Beneficiary Gender Distribution',
                    })}
                  </h3>
                  <GenderDistributionChart
                    data={metrics.beneficiaryByGender}
                    isLoading={isLoading}
                  />
                </div>

                {/* Priority Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('appointment.reports.dashboard.charts.priorityDistribution', {
                      defaultValue: 'Appointment Priority',
                    })}
                  </h3>
                  <PriorityDistributionChart
                    data={metrics.appointmentsByPriority}
                    isLoading={isLoading}
                  />
                </div>
              </div>

              {/* Centers Map Section */}
              <section className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t('appointment.reports.dashboard.map.title', {
                      defaultValue: 'Interactive Centers Map in Syria',
                    })}
                  </h3>
                </div>
                <InteractiveSyriaMap
                  centers={centerMetricsWithGeo}
                  loading={branchesLoading}
                  onCenterClick={(center) => {
                    console.log('Center clicked:', center)
                  }}
                />
                {centerMetricsWithGeo?.length > 0 && (
                  <div className="mt-6 w-full bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 border-b bg-slate-50 text-sm font-semibold text-slate-700">
                      {t('appointment.reports.dashboard.map.summaryTitle', {
                        defaultValue: 'Center statistics summary',
                      })}
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-xs tracking-wide">
                          <tr>
                            <th className="px-4 py-2 text-left">
                              {t('appointment.reports.dashboard.map.tableHeaders.center', {
                                defaultValue: 'Center',
                              })}
                            </th>
                            <th className="px-4 py-2 text-left">
                              {t('appointment.reports.dashboard.map.tableHeaders.governorate', {
                                defaultValue: 'Governorate',
                              })}
                            </th>
                            <th className="px-4 py-2 text-right">
                              {t('appointment.reports.dashboard.map.tableHeaders.referrals', {
                                defaultValue: 'Referrals',
                              })}
                            </th>
                            <th className="px-4 py-2 text-right">
                              {t('appointment.reports.dashboard.map.tableHeaders.completed', {
                                defaultValue: 'Completed',
                              })}
                            </th>
                            <th className="px-4 py-2 text-right">
                              {t('appointment.reports.dashboard.map.tableHeaders.inProgress', {
                                defaultValue: 'In progress',
                              })}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {centerMetricsWithGeo.map((center) => {
                            const pendingCount = (center.confirmedCount || 0) + (center.requestedCount || 0)
                            return (
                              <tr key={center.centerId || center.organizationBranchId} className="hover:bg-slate-50">
                                <td className="px-4 py-2 font-medium text-slate-800">{center.centerName}</td>
                                <td className="px-4 py-2 text-slate-600">{center.governorate || '—'}</td>
                                <td className="px-4 py-2 text-right text-slate-700">{center.totalAppointments ?? 0}</td>
                                <td className="px-4 py-2 text-right text-emerald-600 font-semibold">{center.completedCount ?? 0}</td>
                                <td className="px-4 py-2 text-right text-blue-600">
                                  {pendingCount}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>

              {/* Centers Performance Table */}
              {centerMetricsWithGeo && centerMetricsWithGeo.length > 0 && (
                <section className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t('appointment.reports.dashboard.centerPerformance.title', {
                        defaultValue: 'Center Performance Metrics',
                      })}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            {t('appointment.reports.dashboard.centerPerformance.headers.centerName', {
                              defaultValue: 'Center Name',
                            })}
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            {t('appointment.reports.dashboard.centerPerformance.headers.governorate', {
                              defaultValue: 'Governorate',
                            })}
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                            {t('appointment.reports.dashboard.centerPerformance.headers.total', {
                              defaultValue: 'Total',
                            })}
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                            {t('appointment.reports.dashboard.centerPerformance.headers.completed', {
                              defaultValue: 'Completed',
                            })}
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                            {t('appointment.reports.dashboard.centerPerformance.headers.completionRate', {
                              defaultValue: 'Completion %',
                            })}
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                            {t('appointment.reports.dashboard.centerPerformance.headers.noShowRate', {
                              defaultValue: 'No-Show %',
                            })}
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                            {t('appointment.reports.dashboard.centerPerformance.headers.cancellationRate', {
                              defaultValue: 'Cancelled %',
                            })}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {centerMetricsWithGeo.map((center) => (
                          <tr key={center.centerId || center.organizationBranchId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{center.centerName}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{center.governorate}</td>
                            <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                              {center.totalAppointments}
                            </td>
                            <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                              {center.completedCount}
                            </td>
                            <td className="px-6 py-4 text-sm text-right">
                              <span
                                className={`px-2 py-1 rounded-full font-medium ${
                                  center.completionRate >= 85
                                    ? 'bg-green-100 text-green-800'
                                    : center.completionRate >= 70
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {center.completionRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-right">
                              <span className="px-2 py-1 rounded-full font-medium bg-orange-100 text-orange-800">
                                {center.noShowRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-right">
                              <span className="px-2 py-1 rounded-full font-medium bg-red-100 text-red-800">
                                {center.cancellationRate.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
