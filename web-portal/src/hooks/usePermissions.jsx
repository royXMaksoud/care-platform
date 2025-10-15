import { useQuery } from '@tanstack/react-query'
import { fetchMyPermissions } from '../api/permissions.api'
import { 
  canPerformAction, 
  hasActionAccess, 
  hasSystemAccess,
  getAccessibleSystems,
  createPermissionChecker 
} from '../utils/permissions'
import { useMemo } from 'react'

/**
 * Custom hook for checking user permissions
 * Provides easy-to-use functions for permission checks in components
 * 
 * @example
 * const { canCreate, canEdit, canDelete, canView, hasPermission } = usePermissions()
 * 
 * // Simple usage
 * {canCreate && <Button>Create User</Button>}
 * 
 * // With action code
 * {hasPermission('list') && <UsersList />}
 */
export function usePermissions() {
  // Fetch permissions from backend with caching
  const { data: permissions, isLoading, error } = useQuery({
    queryKey: ['me', 'permissions'],
    queryFn: () => fetchMyPermissions({ force: false }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })

  // Create memoized checker functions
  const checker = useMemo(() => {
    if (!permissions) return null
    return createPermissionChecker(permissions)
  }, [permissions])

  /**
   * Check if user has permission for a specific action code
   * @param {string} actionCode - The action code (e.g., 'create', 'list', 'update', 'delete')
   * @param {string} [scopeValueId] - Optional scope value ID for scope-level permissions
   * @returns {boolean}
   */
  const hasPermission = (actionCode, scopeValueId = null) => {
    if (!permissions) return false
    return canPerformAction(permissions, actionCode, scopeValueId)
  }

  /**
   * Check multiple permissions at once
   * @param {string[]} actionCodes - Array of action codes
   * @returns {Object} Object with action codes as keys and boolean values
   */
  const hasPermissions = (actionCodes) => {
    return actionCodes.reduce((acc, code) => {
      acc[code] = hasPermission(code)
      return acc
    }, {})
  }

  /**
   * Check if user can perform CRUD operations
   * Common shorthand functions for typical CRUD operations
   */
  const canCreate = (scopeValueId = null) => hasPermission('create', scopeValueId)
  const canRead = (scopeValueId = null) => hasPermission('read', scopeValueId) || hasPermission('list', scopeValueId)
  const canUpdate = (scopeValueId = null) => hasPermission('update', scopeValueId) || hasPermission('edit', scopeValueId)
  const canDelete = (scopeValueId = null) => hasPermission('delete', scopeValueId)
  const canList = (scopeValueId = null) => hasPermission('list', scopeValueId)
  const canView = (scopeValueId = null) => hasPermission('view', scopeValueId)

  /**
   * Check if user has access to a system
   * @param {string} systemId - System UUID
   * @returns {boolean}
   */
  const canAccessSystem = (systemId) => {
    if (!permissions) return false
    return hasSystemAccess(permissions, systemId)
  }

  /**
   * Get detailed action access info
   * @param {string} systemId - System UUID
   * @param {string} sectionId - Section UUID
   * @param {string} actionId - Action UUID
   * @returns {Object} { hasAccess, effect, scopes, allowedScopes, deniedScopes }
   */
  const getActionAccess = (systemId, sectionId, actionId) => {
    if (!permissions) return { hasAccess: false, effect: 'NONE', scopes: [] }
    return hasActionAccess(permissions, systemId, sectionId, actionId)
  }

  /**
   * Get all accessible systems
   * @returns {Array} Array of systems with access information
   */
  const accessibleSystems = useMemo(() => {
    if (!permissions) return []
    return getAccessibleSystems(permissions)
  }, [permissions])

  /**
   * Check if user has ALL specified permissions
   * @param {string[]} actionCodes - Array of required action codes
   * @returns {boolean}
   */
  const hasAllPermissions = (actionCodes) => {
    return actionCodes.every(code => hasPermission(code))
  }

  /**
   * Check if user has ANY of the specified permissions
   * @param {string[]} actionCodes - Array of action codes
   * @returns {boolean}
   */
  const hasAnyPermission = (actionCodes) => {
    return actionCodes.some(code => hasPermission(code))
  }

  return {
    // State
    permissions,
    isLoading,
    error,
    
    // Basic permission checks
    hasPermission,
    hasPermissions,
    hasAllPermissions,
    hasAnyPermission,
    
    // CRUD shortcuts
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canList,
    canView,
    
    // Advanced checks
    canAccessSystem,
    getActionAccess,
    accessibleSystems,
    
    // Permission checker object (for advanced usage)
    checker,
  }
}

export default usePermissions

