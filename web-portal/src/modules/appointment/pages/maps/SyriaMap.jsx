import React, { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from 'react-leaflet'
import L from 'leaflet'
import {
  MapPin,
  Filter,
  Download,
  BarChart3,
  Users,
  Calendar,
  Building2,
  Layers,
  X,
  ExternalLink,
  Loader,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

// Hooks and API
import { useAppointmentsMap } from '@/modules/appointment/hooks/useAppointmentsMap'
import AppointmentBreadcrumb from '@/modules/appointment/components/AppointmentBreadcrumb'

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Syria boundary GeoJSON (approximate)
const SYRIA_BOUNDARY = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [36.01, 34.70], [35.75, 34.60], [35.43, 34.26], [35.24, 33.31],
      [35.36, 32.84], [35.52, 32.31], [35.70, 32.26], [36.40, 31.99],
      [37.07, 32.48], [38.09, 32.65], [39.20, 32.64], [40.40, 31.96],
      [41.25, 31.58], [42.37, 31.48], [42.65, 32.26], [42.50, 33.10],
      [42.35, 33.74], [42.45, 34.18], [42.40, 34.65], [42.15, 35.19],
      [42.00, 35.81], [41.16, 36.11], [40.52, 36.27], [39.70, 36.72],
      [38.98, 36.91], [38.30, 37.10], [37.35, 37.35], [36.55, 37.35],
      [36.01, 36.78], [35.68, 36.48], [35.34, 36.23], [35.03, 35.81],
      [34.80, 35.50], [34.65, 35.18], [34.72, 34.80], [35.10, 34.70],
      [36.01, 34.70],
    ]],
  },
  properties: { name: 'Syria' },
}

// Visualization modes
const VISUALIZATION_MODES = {
  POINTS: 'points',
  CLUSTERS: 'clusters',
  HEATMAP: 'heatmap',
  CHOROPLETH: 'choropleth',
}

/**
 * Syria Map Appointment Dashboard
 * Interactive map visualization of appointments with filtering and multiple visualization modes
 */
export default function SyriaMap() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isArabic = i18n.language === 'ar'

  // State
  const [filtersVisible, setFiltersVisible] = useState(true)
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [visualizationMode, setVisualizationMode] = useState(VISUALIZATION_MODES.POINTS)
  const [mapRequest, setMapRequest] = useState(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    return {
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      includeStatistics: true,
    }
  })

  // Filters state
  const [filters, setFilters] = useState({
    ageGroups: [],
    appointmentStatusIds: [],
    organizationBranchIds: [],
    genderCodeValueIds: [],
    serviceTypeIds: [],
    priority: null,
    registrationStatusCodeValueIds: [],
  })

  // Fetch map data
  const { mapData, isLoading, isError, error, refetch } = useAppointmentsMap({
    ...mapRequest,
    ...filters,
    visualizationMode,
  })

  // Extract features from response and group by branch
  const branchGroups = useMemo(() => {
    if (!mapData?.featureCollection?.features) return new Map()
    
    const features = mapData.featureCollection.features.filter(
      (f) => f.geometry?.coordinates && f.geometry.coordinates.length === 2
    )
    
    // Group appointments by branch
    const groups = new Map()
    features.forEach((feature) => {
      const branchId = feature.properties?.organizationBranchId
      const branchName = feature.properties?.branchName || 'Unknown Branch'
      const branchLat = feature.properties?.latitude || feature.geometry.coordinates[1]
      const branchLon = feature.properties?.longitude || feature.geometry.coordinates[0]
      
      if (!branchId) return
      
      if (!groups.has(branchId)) {
        groups.set(branchId, {
          branchId,
          branchName,
          latitude: branchLat,
          longitude: branchLon,
          appointments: [],
          statusCounts: {},
          priorityCounts: {},
        })
      }
      
      const group = groups.get(branchId)
      group.appointments.push(feature)
      
      // Count statuses
      const status = feature.properties?.appointmentStatus || 'UNKNOWN'
      group.statusCounts[status] = (group.statusCounts[status] || 0) + 1
      
      // Count priorities
      const priority = feature.properties?.priority || 'UNKNOWN'
      group.priorityCounts[priority] = (group.priorityCounts[priority] || 0) + 1
    })
    
    return groups
  }, [mapData])

  // Convert branch groups to features for map display
  const branchFeatures = useMemo(() => {
    return Array.from(branchGroups.values()).map((group) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [group.longitude, group.latitude],
      },
      properties: {
        branchId: group.branchId,
        branchName: group.branchName,
        totalAppointments: group.appointments.length,
        statusCounts: group.statusCounts,
        priorityCounts: group.priorityCounts,
        appointments: group.appointments,
      },
    }))
  }, [branchGroups])

  // Summary statistics
  const summary = mapData?.summary || {}

  // Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Handle date range change
  const handleDateRangeChange = useCallback((dateFrom, dateTo) => {
    setMapRequest((prev) => ({ ...prev, dateFrom, dateTo }))
  }, [])

  // Export to CSV - export all appointments from all branches
  const handleExportCSV = useCallback(() => {
    if (!branchFeatures.length) {
      toast.error(isArabic ? 'لا توجد بيانات للتصدير' : 'No data to export')
      return
    }

    const headers = [
      'Branch Name',
      'Total Appointments',
      'Status Distribution',
      'Priority Distribution',
      'Latitude',
      'Longitude',
    ]

    const rows = branchFeatures.map((f) => {
      const p = f.properties || {}
      const statusDist = Object.entries(p.statusCounts || {}).map(([k, v]) => `${k}:${v}`).join('; ')
      const priorityDist = Object.entries(p.priorityCounts || {}).map(([k, v]) => `${k}:${v}`).join('; ')
      return [
        p.branchName || '',
        p.totalAppointments || 0,
        statusDist,
        priorityDist,
        f.geometry.coordinates[1] || '',
        f.geometry.coordinates[0] || '',
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `appointments-map-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success(isArabic ? 'تم التصدير بنجاح' : 'Export successful')
  }, [branchFeatures, isArabic])

  // Calculate max count for color scaling based on total appointments per branch
  const maxCount = useMemo(() => {
    if (branchFeatures.length === 0) return 1
    return Math.max(1, ...branchFeatures.map((f) => f.properties.totalAppointments || 0))
  }, [branchFeatures])

  // Get color based on appointment count
  const getPointColor = useCallback((feature) => {
    const count = feature.properties?.totalAppointments || 0
    const max = maxCount || 1
    const ratio = count / max
    
    if (ratio >= 0.75) return '#DC2626' // red - very high
    if (ratio >= 0.5) return '#F59E0B' // orange - high
    if (ratio >= 0.25) return '#3B82F6' // blue - medium
    return '#10B981' // green - low
  }, [maxCount])

  // Get circle radius based on appointment count
  const getCircleRadius = useCallback((feature) => {
    const count = feature.properties?.totalAppointments || 0
    const max = maxCount || 1
    const ratio = Math.min(count / max, 1)
    return 8 + ratio * 20 // Min 8, max 28
  }, [maxCount])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
      <div className="mx-auto max-w-[1920px] px-4 py-6 sm:px-6 lg:px-8">
        <AppointmentBreadcrumb />

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isArabic ? 'خريطة المواعيد التفاعلية' : 'Interactive Appointment Map'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {isArabic
                ? 'تصور جغرافي للمواعيد مع إمكانيات التصفية والتحليل'
                : 'Geographic visualization of appointments with filtering and analytics'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Filter className="h-4 w-4" />
              {isArabic ? 'الفلترة' : 'Filters'}
              {filtersVisible ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              {isArabic ? 'تصدير CSV' : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={Calendar}
            label={isArabic ? 'إجمالي المواعيد' : 'Total Appointments'}
            value={summary.totalAppointments || 0}
            color="blue"
          />
          <KPICard
            icon={Users}
            label={isArabic ? 'إجمالي المستفيدين' : 'Total Beneficiaries'}
            value={summary.totalBeneficiaries || 0}
            color="green"
          />
          <KPICard
            icon={Building2}
            label={isArabic ? 'إجمالي الفروع' : 'Total Branches'}
            value={summary.totalBranches || 0}
            color="purple"
          />
          <KPICard
            icon={BarChart3}
            label={isArabic ? 'متوسط المواعيد لكل فرع' : 'Avg per Branch'}
            value={summary.averageAppointmentsPerBranch?.toFixed(1) || '0.0'}
            color="orange"
          />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Filters Sidebar */}
          {filtersVisible && (
            <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:w-80">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  {isArabic ? 'الفلترة' : 'Filters'}
                </h2>
                <button
                  onClick={() => setFiltersVisible(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <FilterPanel
                filters={filters}
                mapRequest={mapRequest}
                onFilterChange={handleFilterChange}
                onDateRangeChange={handleDateRangeChange}
                isArabic={isArabic}
              />

              {/* Visualization Mode Selector */}
              <div className="mt-6 border-t border-slate-200 pt-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {isArabic ? 'وضع التصور' : 'Visualization Mode'}
                </label>
                <div className="space-y-2">
                  {Object.entries(VISUALIZATION_MODES).map(([key, value]) => (
                    <button
                      key={value}
                      onClick={() => setVisualizationMode(value)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                        visualizationMode === value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        <span>
                          {isArabic
                            ? {
                                points: 'نقاط',
                                clusters: 'مجموعات',
                                heatmap: 'خريطة حرارية',
                                choropleth: 'خريطة ملونة',
                              }[value]
                            : key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Map Container */}
          <div className="flex-1 rounded-xl border border-slate-200 bg-white shadow-sm">
            {isLoading && (
              <div className="flex h-[600px] items-center justify-center">
                <div className="text-center">
                  <Loader className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                  <p className="mt-2 text-sm text-slate-600">
                    {isArabic ? 'جار تحميل بيانات الخريطة...' : 'Loading map data...'}
                  </p>
                </div>
              </div>
            )}

            {isError && (
              <div className="flex h-[600px] items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
                  <p className="mt-2 text-sm text-red-600">
                    {isArabic
                      ? 'حدث خطأ في تحميل البيانات'
                      : 'Error loading map data'}
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    {isArabic ? 'إعادة المحاولة' : 'Retry'}
                  </button>
                </div>
              </div>
            )}

            {!isLoading && !isError && (
              <MapVisualization
                features={branchFeatures}
                visualizationMode={visualizationMode}
                onFeatureClick={setSelectedFeature}
                isArabic={isArabic}
                getPointColor={getPointColor}
                getCircleRadius={getCircleRadius}
              />
            )}
          </div>
        </div>

        {/* Branch Details Drawer */}
        {selectedFeature && (
          <BranchDetailsDrawer
            feature={selectedFeature}
            onClose={() => setSelectedFeature(null)}
            onViewDetails={(branchId) => {
              navigate(`/appointment/appointments?branchId=${branchId}`)
              setSelectedFeature(null)
            }}
            isArabic={isArabic}
          />
        )}
      </div>
    </div>
  )
}

/**
 * KPI Card Component
 */
function KPICard({ icon: Icon, label, value, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

/**
 * Filter Panel Component
 */
function FilterPanel({
  filters,
  mapRequest,
  onFilterChange,
  onDateRangeChange,
  isArabic,
}) {
  return (
    <div className="space-y-4">
      {/* Date Range */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {isArabic ? 'نطاق التاريخ' : 'Date Range'}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={mapRequest.dateFrom || ''}
            onChange={(e) => onDateRangeChange(e.target.value, mapRequest.dateTo)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={mapRequest.dateTo || ''}
            onChange={(e) => onDateRangeChange(mapRequest.dateFrom, e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Priority Filter */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {isArabic ? 'الأولوية' : 'Priority'}
        </label>
        <select
          value={filters.priority || ''}
          onChange={(e) => onFilterChange('priority', e.target.value || null)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">{isArabic ? 'الكل' : 'All'}</option>
          <option value="NORMAL">{isArabic ? 'عادية' : 'Normal'}</option>
          <option value="URGENT">{isArabic ? 'عاجلة' : 'Urgent'}</option>
        </select>
      </div>

      {/* Note: Additional filters (status, branch, service type, etc.) would be added here */}
      {/* For now, keeping it simple - can be extended with dropdowns from API */}
    </div>
  )
}

/**
 * Map Visualization Component
 */
function MapVisualization({
  features,
  visualizationMode,
  onFeatureClick,
  isArabic,
  getPointColor,
  getCircleRadius,
}) {
  const center = [34.8021, 38.9968] // Syria center
  const zoom = 6

  // For clusters mode, use larger radius and different opacity to simulate clustering
  const clusterOpacity = visualizationMode === VISUALIZATION_MODES.CLUSTERS ? 0.6 : 0.9

  // Points mode (default)
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '600px', width: '100%', zIndex: 1 }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {features.map((feature, idx) => {
        const coords = feature.geometry.coordinates
        const radius = getCircleRadius ? getCircleRadius(feature) : 12
        const color = getPointColor(feature)
        return (
          <CircleMarker
            key={feature.properties?.branchId || idx}
            center={[coords[1], coords[0]]}
            radius={radius}
            fillColor={color}
            color={color}
            weight={2}
            opacity={clusterOpacity}
            fillOpacity={clusterOpacity}
            eventHandlers={{
              click: () => onFeatureClick(feature),
            }}
          >
            <Popup className="branch-popup" maxWidth={300} autoPan={true}>
              <PopupContent 
                feature={feature} 
                isArabic={isArabic}
                onViewDetails={(branchId) => {
                  onFeatureClick(feature)
                }}
              />
            </Popup>
          </CircleMarker>
        )
      })}
      <style>{`
        .leaflet-popup-content-wrapper {
          z-index: 1000 !important;
        }
        .leaflet-popup {
          z-index: 1001 !important;
        }
        .branch-popup .leaflet-popup-content {
          margin: 8px 12px;
        }
      `}</style>
    </MapContainer>
  )
}

/**
 * Popup Content Component - Shows branch statistics
 */
function PopupContent({ feature, isArabic, onViewDetails }) {
  const props = feature.properties || {}
  const totalAppointments = props.totalAppointments || 0
  const statusCounts = props.statusCounts || {}
  const priorityCounts = props.priorityCounts || {}
  
  return (
    <div className="min-w-[250px] font-sans">
      {/* Branch Name */}
      <div className="font-bold text-lg text-gray-900 mb-3 border-b pb-2">
        {props.branchName || (isArabic ? 'فرع غير معروف' : 'Unknown Branch')}
      </div>
      
      {/* Total Appointments */}
      <div className="mb-3 p-2 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">
            {isArabic ? 'إجمالي المواعيد' : 'Total Appointments'}
          </span>
          <span className="text-2xl font-bold text-blue-600">{totalAppointments}</span>
        </div>
      </div>
      
      {/* Status Distribution */}
      {Object.keys(statusCounts).length > 0 && (
        <div className="mb-3">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            {isArabic ? 'توزيع الحالات' : 'Status Distribution'}
          </div>
          <div className="space-y-1">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex justify-between text-sm">
                <span className="text-gray-600">{status}</span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Priority Distribution */}
      {Object.keys(priorityCounts).length > 0 && (
        <div className="mb-3">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            {isArabic ? 'توزيع الأولوية' : 'Priority Distribution'}
          </div>
          <div className="space-y-1">
            {Object.entries(priorityCounts).map(([priority, count]) => (
              <div key={priority} className="flex justify-between text-sm">
                <span className="text-gray-600">{priority}</span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* View Details Button */}
      {onViewDetails && props.branchId && (
        <button
          onClick={() => onViewDetails(props.branchId)}
          className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          {isArabic ? 'عرض التفاصيل' : 'View Details'}
        </button>
      )}
    </div>
  )
}

/**
 * Branch Details Drawer Component - Shows branch statistics and appointments
 */
function BranchDetailsDrawer({ feature, onClose, onViewDetails, isArabic }) {
  const props = feature.properties || {}
  const totalAppointments = props.totalAppointments || 0
  const statusCounts = props.statusCounts || {}
  const priorityCounts = props.priorityCounts || {}
  const appointments = props.appointments || []

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {isArabic ? 'تفاصيل الفرع' : 'Branch Details'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* Branch Name */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {props.branchName || (isArabic ? 'فرع غير معروف' : 'Unknown Branch')}
                </h3>
              </div>

              {/* Total Appointments Card */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    {isArabic ? 'إجمالي المواعيد' : 'Total Appointments'}
                  </span>
                  <span className="text-3xl font-bold text-blue-600">{totalAppointments}</span>
                </div>
              </div>

              {/* Status Distribution */}
              {Object.keys(statusCounts).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {isArabic ? 'توزيع الحالات' : 'Status Distribution'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">{status}</span>
                        <span className="font-bold text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority Distribution */}
              {Object.keys(priorityCounts).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {isArabic ? 'توزيع الأولوية' : 'Priority Distribution'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(priorityCounts).map(([priority, count]) => (
                      <div key={priority} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">{priority}</span>
                        <span className="font-bold text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointments List */}
              {appointments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {isArabic ? 'قائمة المواعيد' : 'Appointments List'}
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {appointments.slice(0, 10).map((apt, idx) => {
                      const aptProps = apt.properties || {}
                      return (
                        <div key={idx} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {aptProps.beneficiaryName || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {aptProps.appointmentDate} {aptProps.appointmentTime && `- ${aptProps.appointmentTime}`}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-medium text-gray-600">{aptProps.appointmentStatus}</div>
                              <div className="text-xs text-gray-500">{aptProps.priority}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {appointments.length > 10 && (
                      <div className="text-sm text-gray-500 text-center py-2">
                        {isArabic 
                          ? `و ${appointments.length - 10} مواعيد أخرى...`
                          : `and ${appointments.length - 10} more appointments...`}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-6 py-4">
            <button
              onClick={() => onViewDetails(props.branchId)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <ExternalLink className="h-4 w-4" />
              {isArabic ? 'عرض جميع المواعيد' : 'View All Appointments'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-900">{value || 'N/A'}</div>
    </div>
  )
}

