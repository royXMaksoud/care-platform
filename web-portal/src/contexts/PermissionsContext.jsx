import React, { createContext, useContext, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMyPermissions } from '../api/permissions.api'
import authStorage from '../auth/authStorage'

/**
 * Permissions Context
 * Provides permissions data and helper functions throughout the app
 */
const PermissionsContext = createContext(null)

/**
 * Permissions Provider Component
 * Wraps the app to provide permissions to all components
 */
export function PermissionsProvider({ children }) {
  // Fetch permissions once and cache them
  // On first load after login, force fresh data to avoid stale cache
  const isFirstLoad = sessionStorage.getItem('perms_loaded') !== 'true'
  
  // ✅ Only fetch permissions if user has a token (is authenticated)
  const hasToken = Boolean(authStorage.getToken())
  
  const { data: permissionsData, isLoading, error, refetch } = useQuery({
    queryKey: ['me', 'permissions'],
    queryFn: () => fetchMyPermissions({ force: isFirstLoad }),
    enabled: hasToken, // ✅ Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    onSuccess: () => {
      // Mark permissions as loaded in this session
      sessionStorage.setItem('perms_loaded', 'true')
    }
  })

  // Function to force refresh permissions (bypass cache)
  const refreshPermissions = async () => {
    sessionStorage.removeItem('perms_loaded')
    return refetch({ queryKey: ['me', 'permissions'], exact: true })
  }

  // Create optimized lookup maps for fast permission checks
  const permissionMaps = useMemo(() => {
    if (!permissionsData?.systems) {
      return {
        bySystemName: new Map(),
        bySectionName: new Map(),
        byActionCode: new Map(),
        byActionId: new Map(),
      }
    }

    const bySystemName = new Map()
    const bySectionName = new Map()
    const byActionCode = new Map()
    const byActionId = new Map()

    permissionsData.systems.forEach(system => {
      // Index by system name
      bySystemName.set(system.name.toLowerCase(), system)

      system.sections?.forEach(section => {
        // Index by section name (with system context)
        const sectionKey = `${system.name}:${section.name}`.toLowerCase()
        bySectionName.set(sectionKey, { system, section })
        
        // Also index by section name alone (for quick lookup)
        bySectionName.set(section.name.toLowerCase(), { system, section })

        section.actions?.forEach(action => {
          // Index by action code (with section context)
          const actionKey = `${section.name}:${action.code}`.toLowerCase()
          byActionCode.set(actionKey, { system, section, action })
          
          // Also index by action code alone
          byActionCode.set(action.code.toLowerCase(), { system, section, action })
          
          // Index by action ID
          byActionId.set(action.systemSectionActionId, { system, section, action })
        })
      })
    })

    return {
      bySystemName,
      bySectionName,
      byActionCode,
      byActionId,
    }
  }, [permissionsData])

  const value = {
    permissionsData,
    permissionMaps,
    isLoading,
    error,
    refetch,
    refreshPermissions, // Function to force refresh
  }

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

/**
 * Hook to access permissions context
 */
export function usePermissionsContext() {
  const context = useContext(PermissionsContext)
  if (!context) {
    throw new Error('usePermissionsContext must be used within PermissionsProvider')
  }
  return context
}

/**
 * Hook for permission checks with optimized lookups
 */
export function usePermissionCheck() {
  const { permissionsData, permissionMaps, isLoading } = usePermissionsContext()

  /**
   * Check if user has permission by action code
   * @param {string} actionCode - Action code (e.g., 'List', 'CRE', 'Del')
   * @param {string} [sectionName] - Optional section name for specificity
   * @param {string} [scopeValueId] - Optional scope value ID
   * @returns {boolean}
   */
  const hasPermission = (actionCode, sectionName = null, scopeValueId = null) => {
    if (!permissionsData || isLoading) return false

    const key = sectionName 
      ? `${sectionName}:${actionCode}`.toLowerCase()
      : actionCode.toLowerCase()

    const found = permissionMaps.byActionCode.get(key)
    
    if (!found) return false

    const { action } = found

    // If effect is DENY or NONE, action is not allowed
    if (action.effect === 'DENY') return false
    if (action.effect === 'NONE') return false

    // Check action-level permission
    if (action.effect === 'ALLOW' && !scopeValueId) return true

    // Check scope-level permission
    if (scopeValueId && action.scopes?.length > 0) {
      const scope = action.scopes.find(s => s.scopeValueId === scopeValueId)
      return scope?.effect === 'ALLOW'
    }

    // If no scope specified but action has scopes, check if ANY scope is allowed
    if (!scopeValueId && action.scopes?.length > 0) {
      return action.scopes.some(s => s.effect === 'ALLOW')
    }

    return false
  }

  /**
   * Check if user has access to a section
   * @param {string} sectionName - Section name (e.g., 'Code Table', 'User Management')
   * @param {string} [systemName] - Optional system name for specificity
   * @returns {boolean}
   */
  const hasSectionAccess = (sectionName, systemName = null) => {
    if (!permissionsData || isLoading) return false

    const key = systemName 
      ? `${systemName}:${sectionName}`.toLowerCase()
      : sectionName.toLowerCase()

    const found = permissionMaps.bySectionName.get(key)
    
    if (!found) return false

    // Check if section has at least one allowed action
    return found.section.actions?.some(action => {
      // Ignore actions with DENY or NONE effect
      if (action.effect === 'DENY') return false
      if (action.effect === 'NONE') return false
      
      // Check if ALLOW
      if (action.effect === 'ALLOW') return true
      
      // Check scopes
      return action.scopes?.some(s => s.effect === 'ALLOW')
    }) || false
  }

  /**
   * Get all permissions for a specific section
   * @param {string} sectionName - Section name
   * @param {string} [systemName] - Optional system name
   * @returns {Object} { canCreate, canList, canUpdate, canDelete, actions }
   */
  const getSectionPermissions = (sectionName, systemName = null) => {
    const key = systemName 
      ? `${systemName}:${sectionName}`.toLowerCase()
      : sectionName.toLowerCase()

    const found = permissionMaps.bySectionName.get(key)
    
    if (!found) {
      return {
        canCreate: false,
        canList: false,
        canUpdate: false,
        canDelete: false,
        actions: [],
      }
    }

    const actions = found.section.actions || []
    
    // Helper to check if action is allowed
    const isActionAllowed = (action) => {
      // If effect is DENY or NONE, action is not allowed
      if (action.effect === 'DENY') return false
      if (action.effect === 'NONE') return false
      
      // If effect is ALLOW, action is allowed
      if (action.effect === 'ALLOW') return true
      
      // If no effect set, check scopes
      return action.scopes?.some(s => s.effect === 'ALLOW') || false
    }

    // Map common action codes (case-insensitive)
    const canCreate = actions.some(a => 
      /^(create|cre|add|new)$/i.test(a.code) && isActionAllowed(a)
    )
    const canList = actions.some(a => 
      /^(list|view|read|get)$/i.test(a.code) && isActionAllowed(a)
    )
    const canUpdate = actions.some(a => 
      /^(update|up|edit|modify)$/i.test(a.code) && isActionAllowed(a)
    )
    const canDelete = actions.some(a => 
      /^(delete|del|remove)$/i.test(a.code) && isActionAllowed(a)
    )

    return {
      canCreate,
      canList,
      canUpdate,
      canDelete,
      actions: actions.filter(isActionAllowed),
      allActions: actions,
    }
  }

  /**
   * Get all accessible sections with their permissions
   * Useful for navigation menus
   * @returns {Array} Array of sections with permissions
   */
  const getAccessibleSections = () => {
    if (!permissionsData?.systems) return []

    const sections = []

    permissionsData.systems.forEach(system => {
      system.sections?.forEach(section => {
        const hasAccess = section.actions?.some(action => {
          // Ignore actions with DENY or NONE effect
          if (action.effect === 'DENY') return false
          if (action.effect === 'NONE') return false
          
          // Check if ALLOW
          if (action.effect === 'ALLOW') return true
          
          // Check scopes
          return action.scopes?.some(s => s.effect === 'ALLOW')
        })

        if (hasAccess) {
          sections.push({
            systemId: system.systemId,
            systemName: system.name,
            sectionId: section.systemSectionId,
            sectionName: section.name,
            permissions: getSectionPermissions(section.name, system.name),
          })
        }
      })
    })

    return sections
  }

  // Get refreshPermissions from context
  const { refreshPermissions } = usePermissionsContext()

  return {
    hasPermission,
    hasSectionAccess,
    getSectionPermissions,
    getAccessibleSections,
    refreshPermissions, // Expose refresh function
    isLoading,
    permissionsData,
  }
}

export default PermissionsContext

