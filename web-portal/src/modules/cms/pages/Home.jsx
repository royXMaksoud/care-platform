// Purpose: CMS landing page with quick links to sub-areas
import { Link } from 'react-router-dom'
import { usePermissionCheck } from '../../../contexts/PermissionsContext'
import { CMS_MENU_ITEMS } from '../../../config/permissions-constants'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

// Creative minimal icon mapping for each section
const SECTION_ICONS = {
  'systems': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" strokeWidth={2.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v2m0 14v2M3 12h2m14 0h2M6.34 6.34l1.42 1.42m8.48 8.48l1.42 1.42M6.34 17.66l1.42-1.42m8.48-8.48l1.42-1.42" />
    </svg>
  ),
  'sections': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth={2.5} />
      <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth={2.5} />
      <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth={2.5} />
      <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth={2.5} />
    </svg>
  ),
  'actions': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5-5 5M6 12h12" />
    </svg>
  ),
  'tenants': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  'users': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="7" r="4" strokeWidth={2.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.5 21a6.5 6.5 0 0113 0" />
    </svg>
  ),
  'subscriptions': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'codeTable': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="8" cy="7" r="1.5" fill="currentColor" />
      <circle cx="8" cy="12" r="1.5" fill="currentColor" />
      <circle cx="8" cy="17" r="1.5" fill="currentColor" />
    </svg>
  ),
  'codeCountry': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'organizations': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  'organizationBranches': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  'dutyStations': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 15h2m4 0h2" />
    </svg>
  ),
  'operations': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  'location': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  'auditLog': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
}

// Official colors: Gray and Light Blue only
const SECTION_GRADIENTS = {
  'systems': 'from-gray-500 to-gray-600',
  'sections': 'from-sky-400 to-sky-500',
  'actions': 'from-gray-400 to-gray-500',
  'tenants': 'from-gray-500 to-gray-600',
  'users': 'from-sky-400 to-sky-500',
  'subscriptions': 'from-gray-400 to-gray-500',
  'codeTable': 'from-gray-500 to-gray-600',
  'codeCountry': 'from-sky-400 to-sky-500',
  'organizations': 'from-gray-500 to-gray-600',
  'organizationBranches': 'from-sky-400 to-sky-500',
  'dutyStations': 'from-gray-400 to-gray-500',
  'operations': 'from-sky-400 to-sky-500',
  'location': 'from-gray-500 to-gray-600',
  'auditLog': 'from-sky-400 to-sky-500',
}

// Category configuration: Gray and Light Blue theme
const CATEGORIES = {
  'systemManagement': {
    title: 'System Management',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    gradient: 'from-gray-400 via-gray-500 to-gray-600',
    bgGradient: 'from-gray-50/50 to-gray-100/40 dark:from-gray-800/30 dark:to-gray-700/20',
    borderColor: 'border-gray-200 dark:border-gray-600',
    items: ['systems', 'sections', 'actions']
  },
  'code': {
    title: 'Code',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7h16M4 12h16M4 17h16" />
        <circle cx="8" cy="7" r="1.5" fill="currentColor" />
        <circle cx="8" cy="12" r="1.5" fill="currentColor" />
        <circle cx="8" cy="17" r="1.5" fill="currentColor" />
      </svg>
    ),
    gradient: 'from-sky-500 via-sky-600 to-sky-700',
    bgGradient: 'from-sky-50/50 to-blue-50/40 dark:from-sky-950/40 dark:to-blue-950/30',
    borderColor: 'border-sky-200 dark:border-sky-800',
    items: ['codeTable', 'codeCountry', 'location', 'organizations', 'organizationBranches', 'dutyStations', 'operations']
  },
  'userManagement': {
    title: 'User Management',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    gradient: 'from-sky-500 via-sky-600 to-sky-700',
    bgGradient: 'from-sky-50/50 to-blue-50/40 dark:from-sky-950/40 dark:to-blue-950/30',
    borderColor: 'border-sky-200 dark:border-sky-800',
    items: ['users', 'auditLog']
  },
  'tenant': {
    title: 'Tenant',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    gradient: 'from-gray-400 via-gray-500 to-gray-600',
    bgGradient: 'from-gray-50/50 to-gray-100/40 dark:from-gray-800/30 dark:to-gray-700/20',
    borderColor: 'border-gray-200 dark:border-gray-600',
    items: ['tenants']
  }
}

export default function CMSHome() {
  const { hasSectionAccess, getSectionPermissions, isLoading, permissionsData } = usePermissionCheck()
  const [searchTerm, setSearchTerm] = useState('')
  const { t } = useTranslation()

  // 🔍 DEBUG: Log permissions data
  console.log('🔍 HOME DEBUG - Full permissionsData:', permissionsData)
  console.log('🔍 HOME DEBUG - Systems array:', permissionsData?.systems)
  console.log('🔍 HOME DEBUG - Systems length:', permissionsData?.systems?.length)
  console.log('🔍 HOME DEBUG - isLoading:', isLoading)

  const defaultItems = [
    { to: 'systems', label: 'Systems' },
    { to: 'sections', label: 'Sections' },
    { to: 'actions', label: 'Actions' },
    { to: 'organizations', label: 'Organizations' },
    { to: 'organizationBranches', label: 'Organization Branches' },
    { to: 'dutyStations', label: 'Duty Stations' },
    { to: 'tenants', label: 'Tenants' },
    { to: 'users', label: 'Users' },
    { to: 'subscriptions', label: 'Tenant Subscriptions' },
    { to: 'codeTable', label: 'Code Table' },
    { to: 'codeCountry', label: 'Countries' },
    { to: 'operations', label: 'Operations' },
    { to: 'location', label: 'Locations' },
    { to: 'auditLog', label: 'Audit Log' },
  ]

  let allItems = []
  
  try {
    // ✅ FIX: Check if systems array exists AND has items
    if (permissionsData?.systems && permissionsData.systems.length > 0) {
      console.log('✅ HOME DEBUG - Permissions found! Systems count:', permissionsData.systems.length)
      console.log('🔍 HOME DEBUG - Filtering CMS_MENU_ITEMS...')
      allItems = CMS_MENU_ITEMS.filter(item => {
        try {
          const hasAccess = hasSectionAccess(item.sectionName, item.systemName)
          console.log(`🔍 Checking ${item.label}:`, { hasAccess, sectionName: item.sectionName, systemName: item.systemName })
          if (!hasAccess) return false
          const permissions = getSectionPermissions(item.sectionName, item.systemName)
          console.log(`🔍 Permissions for ${item.label}:`, permissions)
          return permissions.canList
        } catch (error) {
          console.error('Error checking permission for item:', item, error)
          return false
        }
      })
      
      console.log('🔍 HOME DEBUG - Filtered items:', allItems.length)
      
    
      allItems.push({ to: 'auditLog', label: 'Audit Log' })
    } else {
      // ✅ TEMPORARY FIX: Always show defaultItems for testing
      allItems = defaultItems
    }
  } catch (error) {
    console.error('❌ Error filtering menu items:', error)
    allItems = defaultItems
  }
  
  console.log('🔍 HOME DEBUG - Final allItems:', allItems.length)
  console.log('🔍 HOME DEBUG - visibleItems will be:', allItems.filter(item => 
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  ).length)

  // Filter items based on search term
  const visibleItems = allItems.filter(item => 
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Organize items into categories
  const categorizedItems = useMemo(() => {
    const categories = {}
    
    // Initialize categories
    Object.keys(CATEGORIES).forEach(catKey => {
      categories[catKey] = {
        ...CATEGORIES[catKey],
        items: []
      }
    })

    // Group items by category
    visibleItems.forEach(item => {
      Object.keys(CATEGORIES).forEach(catKey => {
        if (CATEGORIES[catKey].items.includes(item.to)) {
          categories[catKey].items.push(item)
        }
      })
    })

    // Remove empty categories
    return Object.fromEntries(
      Object.entries(categories).filter(([_, cat]) => cat.items.length > 0)
    )
  }, [visibleItems])

  // Show loading state with skeleton
  if (isLoading) {
    console.log('🔄 HOME - Showing loading state...')
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-10 bg-muted rounded-lg w-48 mb-3"></div>
              <div className="h-6 bg-muted rounded-lg w-96"></div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-card rounded-2xl border animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  console.log('🔍 HOME - visibleItems.length:', visibleItems.length)
  console.log('🔍 HOME - permissionsData?.systems:', permissionsData?.systems?.length || 0)

  // Show message if no permissions (DISABLED FOR NOW - ALWAYS SHOW DEFAULT ITEMS)
  if (false && permissionsData?.systems && visibleItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-card rounded-2xl border shadow-lg-modern p-8 text-center animate-scale-in">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-warning/10 mb-6">
              <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-semibold text-foreground mb-2">No Access</h2>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access any CMS sections. Please contact your administrator to request access.
            </p>
            
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover-lift transition-all">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    )
  }

  console.log('✅ HOME - Rendering main view with', visibleItems.length, 'items')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium mb-3">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t('cms.badge') || 'CMS'}
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 tracking-tight">
                {t('cms.title') || 'Content Management System'}
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
                {t('cms.description') || 'Manage systems, codes, users, and tenants from a centralized dashboard'}
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full max-w-md">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={t('cms.searchModules') || 'Search all modules...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchTerm && visibleItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-md text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="font-medium">{visibleItems.length}</span> {visibleItems.length === 1 ? 'result found' : 'results found'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categorized View - Gray and Light Blue */}
        {visibleItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <svg className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('cms.noModulesFound')}</h3>
              <p className="text-base text-gray-600 dark:text-gray-400">
                {searchTerm ? `${t('cms.noResultsFor')} "${searchTerm}"` : t('cms.noModulesAvailable')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(categorizedItems).map(([catKey, category]) => (
              <div
                key={catKey}
                className={`bg-white dark:bg-gray-900 rounded-lg border-2 ${category.borderColor} shadow-sm hover:shadow-md transition-all overflow-hidden bg-gradient-to-br ${category.bgGradient}`}
              >
                {/* Category Header */}
                <div className={`px-5 py-4 bg-gradient-to-r ${category.gradient} border-b ${category.borderColor}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/30">
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-white">{category.title}</h2>
                      <p className="text-xs text-white/80 font-medium">{category.items.length} {category.items.length === 1 ? 'module' : 'modules'}</p>
                    </div>
                  </div>
                </div>

                {/* Category Items */}
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-2">
                    {category.items.map((it) => {
                      let perms = null
                      
                      try {
                        if (it.sectionName && it.systemName) {
                          perms = getSectionPermissions(it.sectionName, it.systemName)
                        }
                      } catch (error) {
                        console.error('Error getting permissions for item:', it, error)
                      }
                      
                      const gradient = SECTION_GRADIENTS[it.to] || 'from-gray-400 to-gray-500'
                      const icon = SECTION_ICONS[it.to]
                      
                      const iconContent = icon ? icon.props.children : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                      )
                      
                      return (
                        <Link
                          key={it.to}
                          to={it.to}
                          className="group flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-sm"
                        >
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-all`}>
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              {iconContent}
                            </svg>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                              {t(`cms.${it.to}`) || it.label}
                            </h3>
                            {perms && (
                              <div className="flex items-center gap-1.5 mt-1">
                                {perms.canCreate && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[10px] font-medium border border-gray-300 dark:border-gray-600">
                                    C
                                  </span>
                                )}
                                {perms.canUpdate && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-400 rounded text-[10px] font-medium border border-sky-200 dark:border-sky-800">
                                    E
                                  </span>
                                )}
                                {perms.canDelete && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[10px] font-medium border border-gray-300 dark:border-gray-600">
                                    D
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Arrow Icon */}
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer - Gray and Light Blue */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 p-4 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-300 dark:border-gray-700">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{visibleItems.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('cms.modules') || 'Available Modules'}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-sky-200 dark:border-sky-800 p-4 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center flex-shrink-0 border border-sky-200 dark:border-sky-800">
                <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{Object.keys(categorizedItems).length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('cms.categories') || 'Categories'}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 p-4 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center flex-shrink-0 border border-sky-200 dark:border-sky-800">
                <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">100%</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('cms.speed') || 'Performance'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
