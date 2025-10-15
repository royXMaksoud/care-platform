// Purpose: CMS landing page with quick links to sub-areas
import { Link } from 'react-router-dom'
import { usePermissionCheck } from '../../../contexts/PermissionsContext'
import { CMS_MENU_ITEMS } from '../../../config/permissions-constants'
import { useState } from 'react'
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
  'auditLog': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
}

// Gradient colors for each section
const SECTION_GRADIENTS = {
  'systems': 'from-violet-500 to-purple-600',
  'sections': 'from-blue-500 to-cyan-600',
  'actions': 'from-amber-500 to-orange-600',
  'tenants': 'from-emerald-500 to-teal-600',
  'users': 'from-pink-500 to-rose-600',
  'subscriptions': 'from-indigo-500 to-blue-600',
  'codeTable': 'from-slate-500 to-gray-600',
  'auditLog': 'from-red-500 to-orange-600',
}

export default function CMSHome() {
  const { hasSectionAccess, getSectionPermissions, isLoading, permissionsData } = usePermissionCheck()
  const [searchTerm, setSearchTerm] = useState('')
  const { t } = useTranslation()

  const defaultItems = [
    { to: 'systems', label: 'Systems' },
    { to: 'sections', label: 'Sections' },
    { to: 'actions', label: 'Actions' },
    { to: 'tenants', label: 'Tenants' },
    { to: 'users', label: 'Users' },
    { to: 'subscriptions', label: 'Tenant Subscriptions' },
    { to: 'codeTable', label: 'Code Table' },
    { to: 'auditLog', label: 'Audit Log' },
  ]

  let allItems = []
  
  try {
    if (permissionsData?.systems) {
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
      
      // إضافة Audit Log كآخر عنصر (لا يحتاج صلاحيات)
      allItems.push({ to: 'auditLog', label: 'Audit Log' })
    } else {
      allItems = defaultItems
    }
  } catch (error) {
    console.error('Error filtering menu items:', error)
    allItems = defaultItems
  }

  // Filter items based on search term
  const visibleItems = allItems.filter(item => 
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  // Show message if no permissions
  if (permissionsData?.systems && visibleItems.length === 0) {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="gradient-mesh fixed inset-0 opacity-30 pointer-events-none"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header */}
        <div className="mb-6 animate-slide-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-medium mb-2">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t('cms.badge')}
              </div>
              
              <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                {t('cms.title')}
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                {t('cms.description')}
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-80">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t('cms.searchModules')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-base border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Professional List View */}
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <svg className="w-12 h-12 text-muted-foreground/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-foreground mb-2">{t('cms.noModulesFound')}</h3>
              <p className="text-base text-muted-foreground">
                {searchTerm ? `${t('cms.noResultsFor')} "${searchTerm}"` : t('cms.noModulesAvailable')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {visibleItems.map((it, idx) => {
              let perms = null
              
              try {
                if (it.sectionName && it.systemName) {
                  perms = getSectionPermissions(it.sectionName, it.systemName)
                }
              } catch (error) {
                console.error('Error getting permissions for item:', it, error)
              }
              
              const gradient = SECTION_GRADIENTS[it.to] || 'from-gray-500 to-slate-600'
              const icon = SECTION_ICONS[it.to]
              
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className="group flex items-center gap-5 px-6 py-5 hover:bg-muted/30 transition-all"
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      {icon.props.children}
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                      {t(`cms.${it.to}`)}
                    </h3>
                    <p className="text-base text-muted-foreground">
                      {t(`cms.manage${it.label.replace(/\s+/g, '')}`)}
                    </p>
                  </div>
                  
                  {/* Permission Badges */}
                  {perms && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {perms.canCreate && (
                        <span className="inline-flex items-center px-3 py-1.5 bg-success/10 text-success rounded text-sm font-medium">
                          {t('common.create')}
                        </span>
                      )}
                      {perms.canUpdate && (
                        <span className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded text-sm font-medium">
                          {t('common.edit')}
                        </span>
                      )}
                      {perms.canDelete && (
                        <span className="inline-flex items-center px-3 py-1.5 bg-destructive/10 text-destructive rounded text-sm font-medium">
                          {t('common.delete')}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Arrow Icon */}
                  <svg className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )
              })}
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
          <div className="bg-card rounded-lg border p-3 shadow-sm-modern">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{visibleItems.length}</div>
                <div className="text-xs text-muted-foreground">{t('cms.modules')}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-3 shadow-sm-modern">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{t('common.active')}</div>
                <div className="text-xs text-muted-foreground">{t('common.status')}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-3 shadow-sm-modern">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{t('cms.fast')}</div>
                <div className="text-xs text-muted-foreground">{t('cms.speed')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
