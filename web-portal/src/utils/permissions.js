/**
 * Permissions Utility
 * Helper functions to check user permissions across systems, sections, actions, and scopes
 */

/**
 * Check if user has ANY permission on a system
 * @param {Object} permissionsData - Full permissions tree from /auth/me/permissions
 * @param {string} systemId - UUID of the system
 * @returns {boolean}
 */
export function hasSystemAccess(permissionsData, systemId) {
  if (!permissionsData?.systems) return false
  return permissionsData.systems.some(sys => sys.systemId === systemId)
}

/**
 * Check if user has permission on a specific action
 * @param {Object} permissionsData - Full permissions tree
 * @param {string} systemId - UUID of the system
 * @param {string} sectionId - UUID of the section
 * @param {string} actionId - UUID of the action
 * @returns {Object} { hasAccess: boolean, effect: 'ALLOW'|'DENY'|'NONE', scopes: [] }
 */
export function hasActionAccess(permissionsData, systemId, sectionId, actionId) {
  const system = permissionsData?.systems?.find(s => s.systemId === systemId)
  if (!system) return { hasAccess: false, effect: 'NONE', scopes: [] }

  const section = system.sections?.find(s => s.systemSectionId === sectionId)
  if (!section) return { hasAccess: false, effect: 'NONE', scopes: [] }

  const action = section.actions?.find(a => a.systemSectionActionId === actionId)
  if (!action) return { hasAccess: false, effect: 'NONE', scopes: [] }

  // Check if it's an action-level permission (no scopes)
  // DENY or NONE means no access
  if (action.effect === 'DENY' || action.effect === 'NONE') {
    return {
      hasAccess: false,
      effect: action.effect,
      scopes: []
    }
  }
  
  if (action.effect === 'ALLOW') {
    return {
      hasAccess: true,
      effect: action.effect,
      scopes: []
    }
  }

  // Check scope-level permissions
  const allowedScopes = action.scopes?.filter(s => s.effect === 'ALLOW') || []
  const deniedScopes = action.scopes?.filter(s => s.effect === 'DENY') || []

  return {
    hasAccess: allowedScopes.length > 0,
    effect: allowedScopes.length > 0 ? 'ALLOW' : 'NONE',
    scopes: action.scopes || [],
    allowedScopes,
    deniedScopes
  }
}

/**
 * Check if user has permission on a specific scope value
 * @param {Object} permissionsData - Full permissions tree
 * @param {string} actionId - UUID of the action
 * @param {string} scopeValueId - UUID of the scope value
 * @returns {Object} { hasAccess: boolean, effect: 'ALLOW'|'DENY'|'NONE' }
 */
export function hasScopeAccess(permissionsData, actionId, scopeValueId) {
  // Find the action across all systems/sections
  for (const system of permissionsData?.systems || []) {
    for (const section of system.sections || []) {
      const action = section.actions?.find(a => a.systemSectionActionId === actionId)
      if (action) {
        const scope = action.scopes?.find(s => s.scopeValueId === scopeValueId)
        if (scope) {
          return {
            hasAccess: scope.effect === 'ALLOW',
            effect: scope.effect || 'NONE'
          }
        }
      }
    }
  }
  return { hasAccess: false, effect: 'NONE' }
}

/**
 * Get all systems user has access to
 * @param {Object} permissionsData - Full permissions tree
 * @returns {Array} Array of systems with access info
 */
export function getAccessibleSystems(permissionsData) {
  if (!permissionsData?.systems) return []
  
  return permissionsData.systems.map(system => {
    const totalActions = system.sections?.reduce((acc, s) => acc + (s.actions?.length || 0), 0) || 0
    const allowedActions = system.sections?.reduce((acc, section) => {
      const allowed = section.actions?.filter(action => {
        // Ignore DENY or NONE effects
        if (action.effect === 'DENY') return false
        if (action.effect === 'NONE') return false
        
        // Action-level permission
        if (action.effect === 'ALLOW') return true
        
        // Scope-level permission
        return action.scopes?.some(s => s.effect === 'ALLOW')
      }).length || 0
      return acc + allowed
    }, 0) || 0

    return {
      systemId: system.systemId,
      systemName: system.name,
      totalSections: system.sections?.length || 0,
      totalActions,
      allowedActions,
      hasFullAccess: allowedActions === totalActions && totalActions > 0,
      hasPartialAccess: allowedActions > 0 && allowedActions < totalActions,
      hasNoAccess: allowedActions === 0
    }
  }).filter(sys => sys.allowedActions > 0) // Only return systems with at least one permission
}

/**
 * Get detailed permissions for a specific action
 * @param {Object} permissionsData - Full permissions tree
 * @param {string} actionId - UUID of the action
 * @returns {Object|null} Detailed action permission info
 */
export function getActionDetails(permissionsData, actionId) {
  for (const system of permissionsData?.systems || []) {
    for (const section of system.sections || []) {
      const action = section.actions?.find(a => a.systemSectionActionId === actionId)
      if (action) {
        return {
          systemId: system.systemId,
          systemName: system.name,
          sectionId: section.systemSectionId,
          sectionName: section.name,
          actionId: action.systemSectionActionId,
          actionName: action.name,
          actionCode: action.code,
          effect: action.effect,
          scopes: action.scopes || [],
          hasScopes: (action.scopes?.length || 0) > 0,
          allowedScopes: action.scopes?.filter(s => s.effect === 'ALLOW') || [],
          deniedScopes: action.scopes?.filter(s => s.effect === 'DENY') || []
        }
      }
    }
  }
  return null
}

/**
 * Check if user can perform a specific action with optional scope
 * This is the main function to use in components
 * @param {Object} permissionsData - Full permissions tree
 * @param {string} actionCode - Code of the action (e.g., 'CREATE_USER')
 * @param {string} [scopeValueId] - Optional scope value ID
 * @returns {boolean}
 */
export function canPerformAction(permissionsData, actionCode, scopeValueId = null) {
  // Find action by code
  for (const system of permissionsData?.systems || []) {
    for (const section of system.sections || []) {
      const action = section.actions?.find(a => a.code === actionCode)
      if (action) {
        // If no scope specified and action has action-level permission
        if (!scopeValueId && action.effect === 'ALLOW') return true
        
        // If scope specified, check scope permission
        if (scopeValueId) {
          const scope = action.scopes?.find(s => s.scopeValueId === scopeValueId)
          return scope?.effect === 'ALLOW'
        }
        
        // If no scope specified but action has scopes, check if ANY scope is allowed
        if (!scopeValueId && action.scopes?.length > 0) {
          return action.scopes.some(s => s.effect === 'ALLOW')
        }
      }
    }
  }
  return false
}

/**
 * Create a permission checker function bound to specific permissions data
 * Useful for passing to child components or using in multiple places
 * @param {Object} permissionsData - Full permissions tree
 * @returns {Function} Checker function
 */
export function createPermissionChecker(permissionsData) {
  return {
    hasSystemAccess: (systemId) => hasSystemAccess(permissionsData, systemId),
    hasActionAccess: (systemId, sectionId, actionId) => hasActionAccess(permissionsData, systemId, sectionId, actionId),
    hasScopeAccess: (actionId, scopeValueId) => hasScopeAccess(permissionsData, actionId, scopeValueId),
    canPerformAction: (actionCode, scopeValueId) => canPerformAction(permissionsData, actionCode, scopeValueId),
    getActionDetails: (actionId) => getActionDetails(permissionsData, actionId),
    getAccessibleSystems: () => getAccessibleSystems(permissionsData)
  }
}

