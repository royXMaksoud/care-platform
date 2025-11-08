import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'

/**
 * Universal Breadcrumb Component
 * Works with any module by detecting the base path from the URL
 * 
 * @param {Object} props
 * @param {string} props.currentPageLabel - Custom label for the current page (for details pages)
 * @param {string} props.moduleName - Custom module name (e.g., "Appointments", "CMS"). If not provided, will be inferred from path
 * @param {string} props.moduleTranslationKey - Translation key for module name (e.g., "nav.appointments", "cms.badge")
 */
export default function Breadcrumb({ currentPageLabel, moduleName, moduleTranslationKey }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  // Get path segments (remove empty strings)
  const pathSegments = location.pathname.split('/').filter(Boolean)
  
  // Detect module from first segment
  const firstSegment = pathSegments[0]
  let modulePath = ''
  let segments = pathSegments
  
  // Common module paths
  if (firstSegment === 'cms') {
    modulePath = '/cms'
    segments = pathSegments.slice(1)
    moduleName = moduleName || t('cms.badge') || 'Content Management'
    moduleTranslationKey = moduleTranslationKey || 'cms.badge'
  } else if (firstSegment === 'appointment' || firstSegment === 'appointments') {
    modulePath = '/appointment'
    segments = pathSegments.slice(1)
    moduleName = moduleName || t('nav.appointments') || 'Appointments'
    moduleTranslationKey = moduleTranslationKey || 'nav.appointments'
  } else if (firstSegment === 'das') {
    modulePath = '/das'
    segments = pathSegments.slice(1)
    moduleName = moduleName || 'Data Analysis'
    moduleTranslationKey = moduleTranslationKey || null
  } else {
    // Default: treat first segment as module
    modulePath = `/${firstSegment}`
    segments = pathSegments.slice(1)
    if (!moduleName) {
      moduleName = firstSegment
        .replace(/-([a-z])/g, (_, letter) => ' ' + letter.toUpperCase())
        .replace(/^([a-z])/, (_, letter) => letter.toUpperCase())
    }
  }
  
  // Build breadcrumb items
  const breadcrumbs = []
  
  // Always start with Home
  breadcrumbs.push({
    label: t('nav.home') || 'Home',
    to: '/',
    isClickable: true
  })
  
  // Add module if we have segments
  if (segments.length > 0 && modulePath) {
    breadcrumbs.push({
      label: moduleTranslationKey ? (t(moduleTranslationKey) || moduleName) : moduleName,
      to: modulePath,
      isClickable: true
    })
  }
  
  // Add each segment
  let currentPath = modulePath
  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1
    
    // Check if segment looks like an ID (UUID format or numeric)
    const isLikelyId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || 
                       /^\d+$/.test(segment) ||
                       segment.length > 20
    
    // Always build path (needed for proper navigation)
    currentPath += `/${segment}`
    
    // Get translated label for this segment
    let label = segment
    
    // If it's an ID and we have currentPageLabel, use it
    if (isLikelyId && currentPageLabel) {
      label = currentPageLabel
    } else if (currentPageLabel && isLast) {
      // Use provided label for current page (for details pages)
      label = currentPageLabel
    } else if (!isLikelyId) {
      // Only translate non-ID segments
      // Handle special cases for route segments
      let translationKey = segment
      
      // Handle kebab-case to camelCase (organization-branches -> organizationBranches)
      translationKey = segment.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      
      // Try appointment translation key first
      const appointmentKey = `appointment.${translationKey}`
      let translated = t(appointmentKey)
      if (translated && translated !== appointmentKey) {
        label = translated
      } else {
        // Try cms translation key (for shared terms)
        const cmsKey = `cms.${translationKey}`
        translated = t(cmsKey)
        if (translated && translated !== cmsKey) {
          label = translated
        } else {
          // Try alternative keys (e.g., service-types)
          const altKey = segment.replace(/-/g, '-')
          const altAppointmentKey = `appointment.${altKey}`
          const altTranslated = t(altAppointmentKey)
          if (altTranslated && altTranslated !== altAppointmentKey) {
            label = altTranslated
          } else {
            // Fallback: format the segment nicely
            label = segment
              .replace(/-([a-z])/g, (_, letter) => ' ' + letter.toUpperCase())
              .replace(/^([a-z])/, (_, letter) => letter.toUpperCase())
              .replace(/([A-Z])/g, ' $1')
              .trim()
          }
        }
      }
    } else if (isLikelyId && !currentPageLabel) {
      // If it's an ID but no label provided, try to get parent route name
      if (index > 0) {
        const parentSegment = segments[index - 1]
        const parentKey = parentSegment.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
        const appointmentParentKey = `appointment.${parentKey}`
        const parentTranslated = t(appointmentParentKey)
        label = parentTranslated && parentTranslated !== appointmentParentKey
          ? `${parentTranslated} Details`
          : 'Details'
      } else {
        label = 'Details'
      }
    }
    
    // Only add to breadcrumbs if it's not an ID (unless it's the last segment with a label)
    if (!isLikelyId || (isLast && currentPageLabel)) {
      breadcrumbs.push({
        label,
        to: isLikelyId && !isLast ? currentPath.replace(`/${segment}`, '') : currentPath,
        isClickable: !isLast && !isLikelyId
      })
    }
  })
  
  // Don't show breadcrumb if we're on Home or just the module root
  if (breadcrumbs.length <= 2 && (location.pathname === modulePath || location.pathname === `${modulePath}/`)) {
    return null
  }
  
  // Don't show if only Home (shouldn't happen in modules, but just in case)
  if (breadcrumbs.length <= 1) {
    return null
  }
  
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          
          return (
            <li key={`${crumb.to}-${index}`} className="flex items-center">
              {isLast || !crumb.isClickable ? (
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.to}
                  className="hover:text-slate-900 dark:hover:text-slate-100 underline-offset-4 hover:underline transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(crumb.to)
                  }}
                >
                  {crumb.label}
                </Link>
              )}
              {!isLast && (
                <ChevronRight className="mx-1.5 h-3.5 w-3.5 opacity-60" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

