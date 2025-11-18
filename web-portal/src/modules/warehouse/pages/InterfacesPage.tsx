/**
 * InterfacesPage Component
 * 
 * Displays all available interfaces/pages in the Warehouse Management System.
 * 
 * @author CARE Team
 */

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Warehouse,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  FileText,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

interface InterfaceItem {
  id: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  status: 'available' | 'coming-soon' | 'planned'
  categoryKey: string
}

const interfaces: InterfaceItem[] = [
  {
    id: 'dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    status: 'available',
    categoryKey: 'overview',
  },
  {
    id: 'warehouses',
    path: '/warehouses',
    icon: Warehouse,
    status: 'available',
    categoryKey: 'management',
  },
  {
    id: 'materials',
    path: '/materials',
    icon: Package,
    status: 'coming-soon',
    categoryKey: 'management',
  },
  {
    id: 'orders',
    path: '/orders',
    icon: ShoppingCart,
    status: 'coming-soon',
    categoryKey: 'management',
  },
  {
    id: 'stock',
    path: '/stock',
    icon: Package,
    status: 'coming-soon',
    categoryKey: 'management',
  },
  {
    id: 'reports',
    path: '/reports',
    icon: BarChart3,
    status: 'coming-soon',
    categoryKey: 'analytics',
  },
  {
    id: 'custom-fields',
    path: '/custom-fields',
    icon: Settings,
    status: 'planned',
    categoryKey: 'configuration',
  },
]

const categoryColors: Record<string, string> = {
  overview: 'bg-blue-100 text-blue-700',
  management: 'bg-green-100 text-green-700',
  analytics: 'bg-purple-100 text-purple-700',
  configuration: 'bg-orange-100 text-orange-700',
}

export default function InterfacesPage() {
  const location = useLocation()
  const { t, i18n } = useTranslation()
  
  // Get base path (either /warehouse or /warehouse-management-system)
  const basePath = location.pathname.split('/').slice(0, 2).join('/')
  
  // Get current language
  const currentLang = i18n.language || 'en'
  const isRtl = currentLang === 'ar'
  
  // Get status config based on current language
  const getStatusConfig = (status: 'available' | 'coming-soon' | 'planned') => {
    const configs = {
      available: {
        label: t('warehouse.interfaces.available'),
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      },
      'coming-soon': {
        label: t('warehouse.interfaces.comingSoon'),
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
      planned: {
        label: t('warehouse.interfaces.planned'),
        icon: FileText,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
      },
    }
    return configs[status]
  }
  
  const groupedInterfaces = React.useMemo(() => {
    const grouped: Record<string, InterfaceItem[]> = {}
    interfaces.forEach((item) => {
      if (!grouped[item.categoryKey]) {
        grouped[item.categoryKey] = []
      }
      grouped[item.categoryKey].push(item)
    })
    return grouped
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Warehouse className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('warehouse.interfaces.title')}</h1>
            <p className="text-blue-100 mt-1">
              {t('warehouse.interfaces.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Interfaces by Category */}
      {Object.entries(groupedInterfaces).map(([categoryKey, items]) => {
        const categoryName = t(`warehouse.interfaces.categories.${categoryKey}`)
        return (
        <div key={categoryKey} className="space-y-4">
          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-xl font-semibold text-gray-800">{categoryName}</h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                categoryColors[categoryKey] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {items.length} {items.length === 1 ? t('warehouse.interfaces.interface') : t('warehouse.interfaces.interfaces')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const statusConfig = getStatusConfig(item.status)
              const StatusIcon = statusConfig.icon
              const isAvailable = item.status === 'available'
              
              // Get translated name and description
              const itemName = t(`warehouse.interfaces.items.${item.id}.name`)
              const itemDescription = t(`warehouse.interfaces.items.${item.id}.description`)

              return (
                <Link
                  key={item.id}
                  to={isAvailable ? `${basePath}${item.path}` : '#'}
                  className={`bg-white rounded-lg border-2 p-6 shadow-sm transition-all duration-200 ${
                    isAvailable
                      ? 'border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer'
                      : 'border-gray-100 opacity-75 cursor-not-allowed'
                  }`}
                  onClick={(e) => {
                    if (!isAvailable) {
                      e.preventDefault()
                    }
                  }}
                >
                  <div className={`flex items-start justify-between mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`p-3 rounded-lg ${
                        isAvailable
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        statusConfig.bgColor
                      } ${statusConfig.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>

                  <h3 className={`text-lg font-semibold text-gray-900 mb-2 ${isRtl ? 'text-right' : ''}`}>
                    {itemName}
                  </h3>
                  <p className={`text-sm text-gray-600 mb-4 line-clamp-2 ${isRtl ? 'text-right' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
                    {itemDescription}
                  </p>

                  {isAvailable && (
                    <div className={`flex items-center gap-2 text-blue-600 text-sm font-medium ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <span>{t('warehouse.interfaces.open')}</span>
                      <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )})}

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className={`text-lg font-semibold text-gray-800 mb-4 ${isRtl ? 'text-right' : ''}`}>
          {t('warehouse.interfaces.summary')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className={`flex items-center gap-2 mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-800">{t('warehouse.interfaces.available')}</span>
            </div>
            <p className={`text-2xl font-bold text-green-600 ${isRtl ? 'text-right' : ''}`}>
              {
                interfaces.filter((i) => i.status === 'available').length
              }
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className={`flex items-center gap-2 mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-800">{t('warehouse.interfaces.comingSoon')}</span>
            </div>
            <p className={`text-2xl font-bold text-blue-600 ${isRtl ? 'text-right' : ''}`}>
              {
                interfaces.filter((i) => i.status === 'coming-soon').length
              }
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className={`flex items-center gap-2 mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <FileText className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-800">{t('warehouse.interfaces.planned')}</span>
            </div>
            <p className={`text-2xl font-bold text-gray-600 ${isRtl ? 'text-right' : ''}`}>
              {interfaces.filter((i) => i.status === 'planned').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

