import { useMemo } from 'react'
import { usePermissionsContext } from '@/contexts/PermissionsContext'

/**
 * Hook to extract scopeValueIds from a specific system section
 * Also determines if user has access (scoped or global)
 *
 * @param {string} systemSectionId - The systemSectionId to filter by (e.g., '22d028fe-c2da-4ed3-a41d-812f69bda468')
 * @returns {Object} { scopeValueIds: string[], hasAccess: boolean, isGlobalAccess: boolean, isLoading: boolean, error: any }
 *
 * @example
 * const { scopeValueIds, hasAccess } = useSystemSectionScopes('22d028fe-c2da-4ed3-a41d-812f69bda468')
 */
export function useSystemSectionScopes(systemSectionId) {
  const { permissionsData, isLoading, error } = usePermissionsContext()

  // Memoize the result to prevent infinite loops in useEffect dependencies
  // Only recalculate when permissionsData or systemSectionId actually changes
  const result = useMemo(() => {
    if (!permissionsData?.systems || !systemSectionId) {
      return {
        scopeValueIds: [],
        hasAccess: false,
        isGlobalAccess: false,
      }
    }

    const scopeValueIds = new Set()
    let hasAccess = false
    let isGlobalAccess = false

    // Find the section with matching systemSectionId
    permissionsData.systems.forEach(system => {
      system.sections?.forEach(section => {
        // Only process sections that match the provided systemSectionId
        if (section.systemSectionId === systemSectionId) {
          // Check all actions in this section
          section.actions?.forEach(action => {
            // If action has effect: ALLOW at action level (not scoped)
            if (action.effect === 'ALLOW') {
              hasAccess = true
              isGlobalAccess = true
            }

            // Extract scopes from actions (these override/supplement action-level permission)
            if (action.scopes && action.scopes.length > 0) {
              action.scopes.forEach(scope => {
                // Include ALLOW scopes with valid scopeValueId
                if (scope.effect === 'ALLOW' && scope.scopeValueId) {
                  scopeValueIds.add(scope.scopeValueId)
                  hasAccess = true
                  // If we found scope-based access, it's not global access
                  if (!isGlobalAccess) {
                    isGlobalAccess = false
                  }
                }
              })
            }
          })
        }
      })
    })

    return {
      scopeValueIds: Array.from(scopeValueIds),
      hasAccess,
      isGlobalAccess,
    }
  }, [permissionsData, systemSectionId])

  return {
    scopeValueIds: result.scopeValueIds,
    hasAccess: result.hasAccess,
    isGlobalAccess: result.isGlobalAccess,
    isLoading,
    error,
  }
}

export default useSystemSectionScopes
