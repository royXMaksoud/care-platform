// Purpose: CMS landing page with quick links to sub-areas
import { Link } from 'react-router-dom'
import { usePermissionCheck } from '../../../contexts/PermissionsContext'
import { CMS_MENU_ITEMS } from '../../../config/permissions-constants'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { useFastAccessShortcuts } from '@/hooks/useFastAccessShortcuts'

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
  'system-roles': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      <circle cx="12" cy="7" r="2" fill="currentColor" />
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
  'organization-branches': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  'duty-stations': (
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
  'location-ocha': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 2a10 10 0 00-3.516 19.367c.555.101.758-.241.758-.536 0-.264-.01-1.115-.016-2.023-3.086.671-3.738-1.489-3.738-1.489-.505-1.282-1.233-1.624-1.233-1.624-1.008-.689.077-.676.077-.676 1.115.079 1.702 1.162 1.702 1.162.992 1.699 2.603 1.208 3.238.924.101-.718.389-1.208.708-1.486-2.463-.281-5.052-1.232-5.052-5.486 0-1.212.433-2.204 1.142-2.98-.114-.282-.495-1.418.108-2.956 0 0 .93-.297 3.05 1.137a10.514 10.514 0 015.552 0c2.118-1.434 3.047-1.137 3.047-1.137.605 1.538.224 2.674.11 2.956.711.776 1.14 1.768 1.14 2.98 0 4.266-2.593 5.202-5.064 5.477.4.344.757 1.016.757 2.048 0 1.48-.014 2.674-.014 3.037 0 .298.2.643.766.534A10 10 0 0012 2z" />
    </svg>
  ),
  'auditLog': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
}

// Soft Pastel Colors - Very Light
const SECTION_GRADIENTS = {
  'systems': 'from-slate-400 to-slate-500',
  'sections': 'from-blue-300 to-blue-400',
  'actions': 'from-slate-400 to-slate-500',
  'tenants': 'from-slate-400 to-slate-500',
  'users': 'from-blue-300 to-blue-400',
  'system-roles': 'from-purple-300 to-purple-400',
  'subscriptions': 'from-slate-400 to-slate-500',
  'codeTable': 'from-slate-400 to-slate-500',
  'codeCountry': 'from-blue-300 to-blue-400',
  'organizations': 'from-slate-400 to-slate-500',
  'organization-branches': 'from-blue-300 to-blue-400',
  'duty-stations': 'from-blue-300 to-blue-400',
  'operations': 'from-blue-300 to-blue-400',
  'location': 'from-slate-400 to-slate-500',
  'location-ocha': 'from-slate-400 to-slate-500',
  'auditLog': 'from-blue-300 to-blue-400',
}

// Calm Professional Category Configuration
const CATEGORIES = {
  'systemManagement': {
    title: 'System Management',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    gradient: 'from-slate-500 to-slate-600',
    bgGradient: 'from-slate-50/30 to-slate-100/20 dark:from-slate-800/20 dark:to-slate-700/10',
    borderColor: 'border-slate-200 dark:border-slate-700',
    accentColor: 'text-slate-600 dark:text-slate-400',
    items: ['systems', 'sections', 'actions']
  },
  'code': {
    title: 'Code',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
        <circle cx="8" cy="7" r="1.5" fill="currentColor" />
        <circle cx="8" cy="12" r="1.5" fill="currentColor" />
        <circle cx="8" cy="17" r="1.5" fill="currentColor" />
      </svg>
    ),
    gradient: 'from-blue-400 to-blue-500',
    bgGradient: 'from-blue-50/20 to-blue-100/15 dark:from-blue-900/15 dark:to-blue-800/8',
    borderColor: 'border-blue-200 dark:border-blue-800',
    accentColor: 'text-blue-500 dark:text-blue-400',
    items: ['codeTable', 'codeCountry', 'location', 'location-ocha', 'organizations', 'organization-branches', 'duty-stations', 'operations']
  },
  'userManagement': {
    title: 'User Management',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    gradient: 'from-blue-400 to-blue-500',
    bgGradient: 'from-blue-50/20 to-blue-100/15 dark:from-blue-900/15 dark:to-blue-800/8',
    borderColor: 'border-blue-200 dark:border-blue-800',
    accentColor: 'text-blue-500 dark:text-blue-400',
    items: ['users', 'system-roles', 'auditLog']
  },
  'tenant': {
    title: 'Tenant',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    gradient: 'from-slate-500 to-slate-600',
    bgGradient: 'from-slate-50/30 to-slate-100/20 dark:from-slate-800/20 dark:to-slate-700/10',
    borderColor: 'border-slate-200 dark:border-slate-700',
    accentColor: 'text-slate-600 dark:text-slate-400',
    items: ['tenants']
  }
}

export default function CMSHome() {
  const { hasSectionAccess, getSectionPermissions, isLoading, permissionsData } = usePermissionCheck()
  const [searchTerm, setSearchTerm] = useState('')
  const { t } = useTranslation()
  const { toggleShortcut, isPinned } = useFastAccessShortcuts()
  const handleToggleShortcut = (event, shortcut) => {
    event.preventDefault()
    event.stopPropagation()
    toggleShortcut(shortcut)
  }


  const defaultItems = [
    { to: 'systems', label: 'Systems' },
    { to: 'sections', label: 'Sections' },
    { to: 'actions', label: 'Actions' },
    { to: 'organizations', label: 'Organizations' },
    { to: 'organization-branches', label: 'Organization Branches' },
    { to: 'duty-stations', label: 'Duty Stations' },
    { to: 'location-ocha', label: 'Location Syria OCHA' },
    { to: 'tenants', label: 'Tenants' },
    { to: 'users', label: 'Users' },
    { to: 'system-roles', label: 'System Roles' },
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
      allItems = CMS_MENU_ITEMS.filter(item => {
        try {
          const hasAccess = hasSectionAccess(item.sectionName, item.systemName)
          if (!hasAccess) return false
          const permissions = getSectionPermissions(item.sectionName, item.systemName)
          return permissions.canList
        } catch (error) {
          console.error('Error checking permission for item:', item, error)
          return false
        }
      })
    } else {
      // ✅ TEMPORARY FIX: Always show defaultItems for testing
      allItems = defaultItems
    }
  } catch (error) {
    console.error('❌ Error filtering menu items:', error)
    allItems = defaultItems
  }

  // ✅ Ensure essential modules like Audit Log & System Roles are always visible
  defaultItems.forEach(defaultItem => {
    const exists = allItems.some(item => item.to === defaultItem.to)
    if (!exists) {
      allItems.push(defaultItem)
    }
  })


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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Clean Calm Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-normal mb-3">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t('cms.badge') || 'CMS'}
              </div>
              
              <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-200 mb-3 tracking-normal">
                {t('cms.title') || 'Content Management System'}
              </h1>
              <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed font-normal">
                {t('cms.description') || 'Manage systems, codes, users, and tenants from a centralized dashboard'}
              </p>
            </div>

            {/* Calm Search Box */}
            <div className="relative w-full max-w-md">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={t('cms.searchModules') || 'Search all modules...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-11 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400/30 focus:border-blue-400 transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchTerm && visibleItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-md text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <span className="font-medium">{visibleItems.length}</span> {visibleItems.length === 1 ? 'result found' : 'results found'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calm Categorized Cards View */}
        {visibleItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <svg className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">{t('cms.noModulesFound')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {searchTerm ? `${t('cms.noResultsFor')} "${searchTerm}"` : t('cms.noModulesAvailable')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Object.entries(categorizedItems).map(([catKey, category]) => (
              <div
                key={catKey}
                className={`bg-white dark:bg-slate-900 rounded-lg border ${category.borderColor} shadow-sm hover:shadow transition-all overflow-hidden bg-gradient-to-br ${category.bgGradient}`}
              >
                {/* Calm Category Header - Smaller */}
                <div className={`px-4 py-3 bg-gradient-to-r ${category.gradient} border-b ${category.borderColor}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-white/25 flex items-center justify-center text-white">
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-sm font-medium text-white mb-0.5">{category.title}</h2>
                      <p className="text-xs text-white/80 font-normal">{category.items.length} {category.items.length === 1 ? 'module' : 'modules'}</p>
                    </div>
                  </div>
                </div>

                {/* Calm Category Items - Smaller */}
                <div className="p-3">
                  <div className="grid grid-cols-1 gap-1.5">
                    {category.items.map((it) => {
                      let perms = null
                      
                      try {
                        if (it.sectionName && it.systemName) {
                          perms = getSectionPermissions(it.sectionName, it.systemName)
                        }
                      } catch (error) {
                        console.error('Error getting permissions for item:', it, error)
                      }
                      
                      const gradient = SECTION_GRADIENTS[it.to] || 'from-slate-400 to-slate-500'
                      const icon = SECTION_ICONS[it.to]
                      
                      const iconContent = icon ? icon.props.children : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      )
                      const fullPath = it.to.startsWith('/') ? it.to : `/cms/${it.to}`
                      const label = t(`cms.${it.to}`, { defaultValue: it.label })
                      const pinned = isPinned(fullPath)

                      return (
                        <Link
                          key={it.to}
                          to={it.to}
                          className="group/item flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                        >
                          {/* Icon - Smaller */}
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              {iconContent}
                            </svg>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-sm font-medium ${category.accentColor} group-hover/item:text-blue-500 dark:group-hover/item:text-blue-400 transition-colors`}>
                              {t(`cms.${it.to}`) || it.label}
                            </h3>
                            {perms && (
                              <div className="flex items-center gap-1 mt-0.5">
                                {perms.canCreate && (
                                  <span className="inline-flex items-center px-1 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-[9px] font-normal">
                                    C
                                  </span>
                                )}
                                {perms.canUpdate && (
                                  <span className="inline-flex items-center px-1 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded text-[9px] font-normal">
                                    E
                                  </span>
                                )}
                                {perms.canDelete && (
                                  <span className="inline-flex items-center px-1 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-[9px] font-normal">
                                    D
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Arrow Icon */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={pinned ? 'Remove from fast access' : 'Add to fast access'}
                              onClick={(event) =>
                                handleToggleShortcut(event, {
                                  path: fullPath,
                                  title: label,
                                  badge: category.title,
                                  module: 'cms',
                                })
                              }
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                                pinned
                                  ? 'border-amber-400 bg-amber-50 text-amber-500'
                                  : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'
                              }`}
                            >
                              <Star
                                className="h-4 w-4"
                                strokeWidth={2}
                                fill={pinned ? 'currentColor' : 'none'}
                              />
                            </button>
                            <svg className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover/item:text-blue-500 dark:group-hover/item:text-blue-400 group-hover/item:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Calm Stats Footer */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-medium text-slate-700 dark:text-slate-300">{visibleItems.length}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">{t('cms.modules') || 'Available Modules'}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-800 p-4 shadow-sm hover:shadow transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-medium text-slate-700 dark:text-slate-300">{Object.keys(categorizedItems).length}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">{t('cms.categories') || 'Categories'}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-medium text-slate-700 dark:text-slate-300">100%</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">{t('cms.speed') || 'Performance'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
