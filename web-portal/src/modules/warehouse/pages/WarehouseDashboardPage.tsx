/**
 * WarehouseDashboardPage Component
 * 
 * Main dashboard page for Warehouse Management module.
 * Displays KPIs, charts, and overview metrics.
 * 
 * Features:
 * - KPI cards (Total warehouses, materials, orders, items below reorder level)
 * - Charts (Stock by Warehouse, Materials by Category, Orders over Time)
 * - Export functionality
 * - Feature flag support
 * 
 * @author CARE Team
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import {
  Warehouse,
  Package,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  RefreshCw,
  Grid3x3,
} from 'lucide-react'
import { useFeatureFlag } from '../hooks/useFeatureFlag'
import SkeletonCard from '../components/SkeletonCard'
import EmptyState from '../components/EmptyState'
import { exportToExcel, generateExportFileName } from '../utils/exportToExcel'

/**
 * KPI Metric Card Component
 */
interface MetricCardProps {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'stable'
  trendValue?: number
  color?: string
  onClick?: () => void
}

function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
  onClick,
}: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  }

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
  }

  const TrendIcon = trend ? trendIcons[trend] : null

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && TrendIcon && trendValue !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <TrendIcon
                className={`w-4 h-4 ${
                  trend === 'up'
                    ? 'text-green-500'
                    : trend === 'down'
                    ? 'text-red-500'
                    : 'text-gray-400'
                }`}
              />
              <span
                className={`text-sm ${
                  trend === 'up'
                    ? 'text-green-600'
                    : trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {trend === 'up' ? '+' : ''}
                {trendValue}%
              </span>
            </div>
          )}
        </div>
        <div className={`${colorClasses[color as keyof typeof colorClasses]} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

/**
 * Main Dashboard Component
 */
export default function WarehouseDashboardPage() {
  const navigate = useNavigate()
  const dashboardEnabled = useFeatureFlag('warehouse.dashboard')
  const reportsEnabled = useFeatureFlag('warehouse.reports')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [metrics, setMetrics] = useState({
    totalWarehouses: 0,
    totalMaterials: 0,
    totalOpenOrders: 0,
    itemsBelowReorderLevel: 0,
  })
  const [stockByWarehouse, setStockByWarehouse] = useState<any[]>([])
  const [materialsByCategory, setMaterialsByCategory] = useState<any[]>([])
  const [ordersOverTime, setOrdersOverTime] = useState<any[]>([])

  /**
   * Load dashboard metrics
   */
  const loadMetrics = async () => {
    try {
      setLoading(true)

      // Load KPIs in parallel
      const [warehousesRes, materialsRes, ordersRes, thresholdRes] = await Promise.allSettled([
        api.get('/warehouse-service/api/warehouse/v1/warehouses', {
          params: { page: 0, size: 1 },
        }),
        api.get('/warehouse-service/api/warehouse/v1/materials', {
          params: { page: 0, size: 1 },
        }),
        api.get('/warehouse-service/api/warehouse/v1/orders', {
          params: { page: 0, size: 1, status: 'PENDING,APPROVED' },
        }),
        api.get('/warehouse-service/api/warehouse/v1/reports/items-below-reorder-level'),
      ])

      // Extract totals from paginated responses
      const warehousesTotal =
        warehousesRes.status === 'fulfilled'
          ? warehousesRes.value?.data?.totalElements || 0
          : 0
      const materialsTotal =
        materialsRes.status === 'fulfilled'
          ? materialsRes.value?.data?.totalElements || 0
          : 0
      const ordersTotal =
        ordersRes.status === 'fulfilled'
          ? ordersRes.value?.data?.totalElements || 0
          : 0
      const thresholdItems =
        thresholdRes.status === 'fulfilled'
          ? thresholdRes.value?.data?.items?.length || 0
          : 0

      setMetrics({
        totalWarehouses: warehousesTotal,
        totalMaterials: materialsTotal,
        totalOpenOrders: ordersTotal,
        itemsBelowReorderLevel: thresholdItems,
      })

      // TODO: Load chart data
      // For now, set empty arrays
      // In production, call reports API endpoints
      setStockByWarehouse([])
      setMaterialsByCategory([])
      setOrdersOverTime([])
    } catch (error: any) {
      console.error('Failed to load dashboard metrics:', error)
      toast.error(
        error?.response?.data?.message || 'Failed to load dashboard data'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    setRefreshing(true)
    loadMetrics()
  }

  /**
   * Handle export
   */
  const handleExport = (type: 'warehouses' | 'materials' | 'orders') => {
    try {
      // TODO: Fetch full data and export
      toast.info(`Exporting ${type}...`)
      // exportToExcel(data, columns, type)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export data')
    }
  }

  useEffect(() => {
    if (dashboardEnabled) {
      loadMetrics()
    }
  }, [dashboardEnabled])

  // Show feature disabled message if dashboard is not enabled
  if (!dashboardEnabled) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <EmptyState
          title="Dashboard not available"
          description="This feature is not enabled for your account. Please contact your administrator."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Warehouse className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Warehouse Management</h1>
              <p className="text-blue-100 mt-1">
                Overview of stock, materials, and warehouse performance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/interfaces"
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-white"
              title="View All Interfaces"
            >
              <Grid3x3 className="w-5 h-5" />
            </Link>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            <SkeletonCard height="md" showIcon lines={2} />
            <SkeletonCard height="md" showIcon lines={2} />
            <SkeletonCard height="md" showIcon lines={2} />
            <SkeletonCard height="md" showIcon lines={2} />
          </>
        ) : (
          <>
            <MetricCard
              label="Total Warehouses"
              value={metrics.totalWarehouses}
              icon={Warehouse}
              color="blue"
              onClick={() => navigate('/warehouse/warehouses')}
            />
            <MetricCard
              label="Total Materials"
              value={metrics.totalMaterials}
              icon={Package}
              color="green"
              onClick={() => navigate('/warehouse/materials')}
            />
            <MetricCard
              label="Open Orders"
              value={metrics.totalOpenOrders}
              icon={ShoppingCart}
              color="orange"
              onClick={() => navigate('/warehouse/orders')}
            />
            <MetricCard
              label="Items Below Reorder Level"
              value={metrics.itemsBelowReorderLevel}
              icon={AlertTriangle}
              color="red"
              onClick={() => navigate('/warehouse/reports?filter=below-threshold')}
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      {reportsEnabled && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock by Warehouse Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Stock by Warehouse
              </h2>
              <button
                onClick={() => handleExport('warehouses')}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                title="Export"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            {loading ? (
              <SkeletonCard height="lg" showIcon={false} lines={5} />
            ) : stockByWarehouse.length === 0 ? (
              <EmptyState
                title="No stock data"
                description="Stock data will appear here once warehouses have materials"
                size="sm"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                {/* TODO: Integrate chart library (Chart.js, Recharts, etc.) */}
                Chart placeholder - Stock by Warehouse
              </div>
            )}
          </div>

          {/* Materials by Category Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Materials by Category
              </h2>
              <button
                onClick={() => handleExport('materials')}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                title="Export"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            {loading ? (
              <SkeletonCard height="lg" showIcon={false} lines={5} />
            ) : materialsByCategory.length === 0 ? (
              <EmptyState
                title="No category data"
                description="Category distribution will appear here once materials are categorized"
                size="sm"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                {/* TODO: Integrate chart library */}
                Chart placeholder - Materials by Category
              </div>
            )}
          </div>

          {/* Orders over Time Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Orders over Time
              </h2>
              <button
                onClick={() => handleExport('orders')}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                title="Export"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            {loading ? (
              <SkeletonCard height="lg" showIcon={false} lines={5} />
            ) : ordersOverTime.length === 0 ? (
              <EmptyState
                title="No order data"
                description="Order trends will appear here once orders are created"
                size="sm"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                {/* TODO: Integrate chart library */}
                Chart placeholder - Orders over Time
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

