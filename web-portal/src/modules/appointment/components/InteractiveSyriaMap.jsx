import React, { useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON as GeoJSONComponent } from 'react-leaflet'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { Loader, AlertCircle } from 'lucide-react'

// Syria GeoJSON boundary (approximate)
const SYRIA_BOUNDARY = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [36.01, 34.70],
      [35.75, 34.60],
      [35.43, 34.26],
      [35.24, 33.31],
      [35.36, 32.84],
      [35.52, 32.31],
      [35.70, 32.26],
      [36.40, 31.99],
      [37.07, 32.48],
      [38.09, 32.65],
      [39.20, 32.64],
      [40.40, 31.96],
      [41.25, 31.58],
      [42.37, 31.48],
      [42.65, 32.26],
      [42.50, 33.10],
      [42.35, 33.74],
      [42.45, 34.18],
      [42.40, 34.65],
      [42.15, 35.19],
      [42.00, 35.81],
      [41.16, 36.11],
      [40.52, 36.27],
      [39.70, 36.72],
      [38.98, 36.91],
      [38.30, 37.10],
      [37.35, 37.35],
      [36.55, 37.35],
      [36.01, 36.78],
      [35.68, 36.48],
      [35.34, 36.23],
      [35.03, 35.81],
      [34.80, 35.50],
      [34.65, 35.18],
      [34.72, 34.80],
      [35.10, 34.70],
      [36.01, 34.70],
    ]],
  },
  properties: { name: 'Syria' },
}

// Color scale based on appointment count
const getCircleColor = (count, maxCount) => {
  if (!count || maxCount === 0) return '#9CA3AF'
  const ratio = Math.min(count / maxCount, 1)
  if (ratio >= 0.75) return '#DC2626'
  if (ratio >= 0.5) return '#F59E0B'
  if (ratio >= 0.25) return '#3B82F6'
  return '#10B981'
}

// Get circle radius based on appointment count
const getCircleRadius = (count, maxCount) => {
  if (!count) return 8
  const ratio = Math.min(count / maxCount, 1)
  return 8 + ratio * 20
}

export default function InteractiveSyriaMap({ centers = [], loading = false, onCenterClick = null }) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const mapRef = useRef(null)

  // Filter and validate centers
  const validCenters = useMemo(
    () =>
      (centers || []).filter(
        (center) =>
          typeof center.latitude === 'number' &&
          typeof center.longitude === 'number' &&
          !Number.isNaN(center.latitude) &&
          !Number.isNaN(center.longitude) &&
          center.latitude >= 32.0 &&
          center.latitude <= 37.5 &&
          center.longitude >= 35.5 &&
          center.longitude <= 42.5
      ),
    [centers]
  )

  // Calculate max appointments for color scaling
  const maxAppointments = useMemo(
    () =>
      Math.max(
        1,
        ...(validCenters.map((c) => c.totalAppointments ?? 0) || [0])
      ),
    [validCenters]
  )

  // GeoJSON styling
  const geoJsonStyle = {
    color: '#60A5FA',
    weight: 2,
    opacity: 0.8,
    fillColor: '#EFF6FF',
    fillOpacity: 0.3,
  }

  const handleCenterClick = (center) => {
    if (onCenterClick) {
      onCenterClick(center)
    }
  }

  if (!validCenters.length && !loading) {
    return (
      <div className="relative w-full h-96 bg-white rounded-xl overflow-hidden border border-blue-100 shadow-inner flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mb-3" />
        <p className="font-medium text-gray-700">
          {isArabic ? 'لا توجد مراكز لعرضها على الخريطة' : 'No centers to display on map'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {isArabic
            ? 'تأكد من وجود إحداثيات صحيحة للمراكز'
            : 'Ensure centers have valid coordinates'}
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-96 rounded-xl overflow-hidden border border-blue-100 shadow-inner bg-white">
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm text-slate-500">
          <Loader className="w-6 h-6 animate-spin mb-2" />
          <span className="text-sm font-medium">
            {isArabic ? 'جار تحميل بيانات المراكز…' : 'Loading centers...'}
          </span>
        </div>
      )}

      <MapContainer
        center={[34.8021, 38.9968]}
        zoom={6}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
        zoomControl={true}
        dragging={true}
        touchZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={18}
        />

        {/* Syria boundary */}
        <GeoJSONComponent data={SYRIA_BOUNDARY} style={geoJsonStyle} />

        {/* Centers markers */}
        {validCenters.map((center) => {
          const totalAppointments = center.totalAppointments ?? 0
          const completed = center.completedCount ?? 0
          const pending = (center.confirmedCount || 0) + (center.requestedCount || 0)
          const circleColor = getCircleColor(totalAppointments, maxAppointments)
          const circleRadius = getCircleRadius(totalAppointments, maxAppointments)

          return (
            <CircleMarker
              key={center.centerId || center.organizationBranchId}
              center={[center.latitude, center.longitude]}
              radius={circleRadius}
              fillColor={circleColor}
              color={circleColor}
              weight={2}
              opacity={0.9}
              fillOpacity={0.7}
              eventHandlers={{
                click: () => handleCenterClick(center),
              }}
            >
              <Popup
                className="leaflet-popup-custom"
                closeButton={true}
                maxWidth={280}
              >
                <div className="font-sans">
                  {/* Center name */}
                  <div className="font-bold text-gray-900 mb-2 text-base">
                    {center.centerName || 'مركز بدون اسم'}
                  </div>

                  {/* Governorate */}
                  <div className="text-sm text-gray-600 mb-3">
                    {isArabic ? 'المحافظة: ' : 'Governorate: '}
                    <span className="font-medium">{center.governorate || 'N/A'}</span>
                  </div>

                  {/* Statistics */}
                  <div className="border-t pt-2 space-y-1">
                    {/* Total appointments */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">
                        {isArabic ? 'الإحالات الكلية' : 'Total Appointments'}:
                      </span>
                      <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {totalAppointments}
                      </span>
                    </div>

                    {/* Completed */}
                    {completed > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-700">
                          {isArabic ? 'مكتملة' : 'Completed'}:
                        </span>
                        <span className="font-bold text-green-600">{completed}</span>
                      </div>
                    )}

                    {/* Pending */}
                    {pending > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-amber-700">
                          {isArabic ? 'قيد المعالجة' : 'Pending'}:
                        </span>
                        <span className="font-bold text-amber-600">{pending}</span>
                      </div>
                    )}
                  </div>

                  {/* Address if available */}
                  {center.address && (
                    <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                      {isArabic ? 'العنوان: ' : 'Address: '}
                      {center.address}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 border border-gray-200 text-sm">
        <div className="font-semibold text-gray-900 mb-2">
          {isArabic ? 'عدد المواعيد' : 'Appointments Count'}
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border border-green-600" />
            <span>{isArabic ? 'قليل' : 'Low'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border border-blue-600" />
            <span>{isArabic ? 'متوسط' : 'Medium'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500 border border-orange-600" />
            <span>{isArabic ? 'مرتفع' : 'High'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border border-red-600" />
            <span>{isArabic ? 'جداً مرتفع' : 'Very High'}</span>
          </div>
        </div>
      </div>

      {/* Centers count info */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur rounded-lg shadow-lg px-3 py-2 text-sm font-semibold text-blue-900">
        {isArabic ? 'مراكز مسجلة: ' : 'Registered Centers: '}
        <span className="text-blue-600">{validCenters.length}</span>
      </div>
    </div>
  )
}
