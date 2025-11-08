/**
 * Helper functions for extracting and working with permissions and scopes
 */

/**
 * Extract scope value IDs for a specific system section from user permissions
 * 
 * @param {Object} permissions - The permissions object from /auth/me/permissions
 * @param {string} systemSectionId - The system section ID to filter by
 * @param {string} [codeTableName] - Optional: filter by specific code table name (e.g., "Organization Branch")
 * @returns {string[]} Array of scope value IDs that the user has access to
 * 
 * @example
 * // Get all branch IDs user can access for Schedule Management section
 * const branchIds = getScopeValueIds(permissions, "22d028fe-c2da-4ed3-a41d-812f69bda468", "Organization Branch")
 * // Returns: ["7df356fb-f1db-4075-a31b-ba20bc5aad15", "39d4039f-dfd6-4ddb-9b73-5424b5b2d59e"]
 */
export function getScopeValueIds(permissions, systemSectionId, codeTableName = null) {
  if (!permissions || !permissions.systems || !systemSectionId) {
    return []
  }

  const scopeValueIds = new Set()

  // Iterate through systems
  for (const system of permissions.systems) {
    if (!system.sections) continue

    // Iterate through sections
    for (const section of system.sections) {
      // Match the target section
      if (section.systemSectionId !== systemSectionId) continue

      if (!section.actions) continue

      // Iterate through actions in the section
      for (const action of section.actions) {
        if (!action.scopes || action.scopes.length === 0) continue

        // Iterate through scopes
        for (const scope of action.scopes) {
          // Skip if effect is not ALLOW
          if (scope.effect !== 'ALLOW') continue

          // Filter by code table name if provided
          if (codeTableName && scope.tableName !== codeTableName) continue

          // Add scope value ID
          if (scope.scopeValueId) {
            scopeValueIds.add(scope.scopeValueId)
          }
        }
      }
    }
  }

  return Array.from(scopeValueIds)
}

/**
 * Get all scopes for a specific system section, grouped by code table
 * 
 * @param {Object} permissions - The permissions object from /auth/me/permissions
 * @param {string} systemSectionId - The system section ID to filter by
 * @returns {Object} Object with code table names as keys and arrays of scope value IDs as values
 * 
 * @example
 * // Get all scopes grouped by table
 * const scopesByTable = getScopesByTable(permissions, "22d028fe-c2da-4ed3-a41d-812f69bda468")
 * // Returns: {
 * //   "Organization Branch": ["7df356fb-...", "39d4039f-..."],
 * //   "Country": ["country-id-1", "country-id-2"]
 * // }
 */
export function getScopesByTable(permissions, systemSectionId) {
  if (!permissions || !permissions.systems || !systemSectionId) {
    return {}
  }

  const scopesByTable = {}

  // Iterate through systems
  for (const system of permissions.systems) {
    if (!system.sections) continue

    // Iterate through sections
    for (const section of system.sections) {
      // Match the target section
      if (section.systemSectionId !== systemSectionId) continue

      if (!section.actions) continue

      // Iterate through actions in the section
      for (const action of section.actions) {
        if (!action.scopes || action.scopes.length === 0) continue

        // Iterate through scopes
        for (const scope of action.scopes) {
          // Skip if effect is not ALLOW
          if (scope.effect !== 'ALLOW') continue

          const tableName = scope.tableName || 'Unknown'
          
          if (!scopesByTable[tableName]) {
            scopesByTable[tableName] = []
          }

          if (scope.scopeValueId && !scopesByTable[tableName].includes(scope.scopeValueId)) {
            scopesByTable[tableName].push(scope.scopeValueId)
          }
        }
      }
    }
  }

  return scopesByTable
}

/**
 * Check if user has any scopes defined for a system section
 * If no scopes are defined, user has access to all data (no filtering needed)
 * 
 * @param {Object} permissions - The permissions object from /auth/me/permissions
 * @param {string} systemSectionId - The system section ID to check
 * @returns {boolean} True if scopes are defined, false otherwise
 */
export function hasScopesDefined(permissions, systemSectionId) {
  if (!permissions || !permissions.systems || !systemSectionId) {
    return false
  }

  // Iterate through systems
  for (const system of permissions.systems) {
    if (!system.sections) continue

    // Iterate through sections
    for (const section of system.sections) {
      // Match the target section
      if (section.systemSectionId !== systemSectionId) continue

      if (!section.actions) continue

      // Check if any action has scopes
      for (const action of section.actions) {
        if (action.scopes && action.scopes.length > 0) {
          return true
        }
      }
    }
  }

  return false
}

/**
 * Build filter criterion for scoped access
 * 
 * @param {string[]} scopeValueIds - Array of scope value IDs
 * @param {string} fieldKey - The field key to filter on (e.g., "organizationBranchId")
 * @param {string} [dataType="UUID"] - Data type of the field (UUID, STRING, NUMBER, etc.)
 * @returns {Object|null} Filter criterion object or null if no filtering needed
 * 
 * @example
 * const criterion = buildScopeCriterion(["id1", "id2"], "organizationBranchId")
 * // Returns: { key: "organizationBranchId", operator: "IN", value: ["id1", "id2"], dataType: "UUID" }
 * 
 * @example
 * // For string IDs (non-UUID)
 * const criterion = buildScopeCriterion(["code1", "code2"], "countryCode", "STRING")
 */
export function buildScopeCriterion(scopeValueIds, fieldKey, dataType = 'UUID') {
  if (!scopeValueIds || scopeValueIds.length === 0) {
    return null
  }

  return {
    key: fieldKey,
    operation: 'IN',  // Use 'operation' to match SearchCriteria field name
    value: scopeValueIds,
    dataType: dataType
  }
}

