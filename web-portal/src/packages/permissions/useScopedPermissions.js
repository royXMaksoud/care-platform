import { api } from '@/lib/axios'

/**
 * Extract authorized scope values from user permissions
 *
 * This function traverses the entire permissions structure (systems -> sections -> actions -> scopes)
 * and extracts all scopeValueIds with ALLOW effect.
 *
 * @param {string} sectionId - Optional section ID to filter scopes. If not provided, extracts from ALL sections
 * @returns {Promise<Array<string>>} Array of scopeValueIds (UUIDs)
 * @throws {Error} If permissions endpoint fails
 *
 * @example
 * // Get all authorized branch IDs
 * const branchIds = await extractScopedValues()
 *
 * @example
 * // Get branch IDs from specific section
 * const branchIds = await extractScopedValues('holiday-management')
 */
export async function extractScopedValues(sectionId = null) {
  try {
    const permRes = await api.get('/auth/me/permissions')
    const permissionsData = permRes?.data || {}
    const scopeValues = new Set()

    // Traverse: systems -> sections -> actions -> scopes
    if (permissionsData?.systems) {
      permissionsData.systems.forEach(system => {
        system.sections?.forEach(section => {
          // If sectionId is provided, only process matching sections
          if (sectionId && section.sectionId !== sectionId) {
            return
          }

          section.actions?.forEach(action => {
            action.scopes?.forEach(scope => {
              // Only include ALLOW scopes with valid scopeValueId
              if (scope.effect === 'ALLOW' && scope.scopeValueId) {
                scopeValues.add(scope.scopeValueId)
              }
            })
          })
        })
      })
    }

    return Array.from(scopeValues)
  } catch (err) {
    console.error('Failed to extract scoped values:', err)
    return []
  }
}

/**
 * Build a fixed filter for scope-based access control
 *
 * Extracts scope values and formats them as a filter criteria
 * to be sent in the POST body (fixedFilters) of list requests.
 *
 * @param {string} columnName - The database column name to filter on (e.g., 'organizationBranchId')
 * @param {string} sectionId - Optional section ID to filter scopes
 * @returns {Promise<Array>} Array containing the filter object, or empty array if no scopes found
 *
 * @example
 * const filters = await buildScopedFilter('organizationBranchId')
 * setFixedFilters(filters)
 */
export async function buildScopedFilter(columnName, sectionId = null) {
  const scopeValues = await extractScopedValues(sectionId)

  if (scopeValues.length === 0) {
    return []
  }

  return [
    {
      key: columnName,
      operator: 'IN',
      value: scopeValues,
      dataType: 'UUID'
    }
  ]
}
