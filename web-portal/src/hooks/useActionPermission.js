import { useMemo } from 'react'
import { usePermissionsContext } from '@/contexts/PermissionsContext'

/**
 * Low-level helper to evaluate whether a permission action entry allows access.
 */
function isActionAllowed(action, { scopeValueId, requireScope = false } = {}) {
  if (!action) return false
  const effect = (action.effect || '').toUpperCase()

  if (effect === 'DENY' || effect === 'NONE') {
    return false
  }

  if (effect === 'ALLOW' && (!requireScope || !scopeValueId)) {
    return true
  }

  const scopes = Array.isArray(action.scopes) ? action.scopes : []

  if (scopeValueId) {
    return scopes.some(
      (scope) => scope.scopeValueId === scopeValueId && scope.effect === 'ALLOW'
    )
  }

  if (requireScope) {
    return false
  }

  return scopes.some((scope) => scope.effect === 'ALLOW')
}

/**
 * Shared utility to check an action permission entry stored in permissionMaps.
 */
export function checkActionPermissionById(
  permissionMaps,
  actionId,
  {
    scopeValueId,
    requireScope = false,
    systemId,
    systemName,
    sectionId,
    sectionName,
  } = {}
) {
  if (!permissionMaps || !actionId) return false
  const normalizedId = actionId.toLowerCase()

  const entry =
    permissionMaps.byActionId.get(actionId) ||
    permissionMaps.byActionId.get(normalizedId)

  if (!entry) return false

  const { system, section, action } = entry

  if (
    (systemId && system?.systemId !== systemId) ||
    (systemName &&
      system?.name?.toLowerCase() !== systemName.toString().toLowerCase())
  ) {
    return false
  }

  if (
    (sectionId && section?.systemSectionId !== sectionId) ||
    (sectionName &&
      section?.name?.toLowerCase() !== sectionName.toString().toLowerCase())
  ) {
    return false
  }

  return isActionAllowed(action, { scopeValueId, requireScope })
}

/**
 * Hook that returns whether the current user can execute a specific action
 * identified by its systemSectionActionId.
 */
export function useActionPermission(
  actionId,
  options = {}
) {
  const { permissionMaps, isLoading } = usePermissionsContext()
  const {
    scopeValueId = undefined,
    requireScope = false,
    systemId = undefined,
    systemName = undefined,
    sectionId = undefined,
    sectionName = undefined,
  } = options

  return useMemo(() => {
    if (!actionId || isLoading) return false
    return checkActionPermissionById(permissionMaps, actionId, {
      scopeValueId,
      requireScope,
      systemId,
      systemName,
      sectionId,
      sectionName,
    })
  }, [
    actionId,
    permissionMaps,
    isLoading,
    scopeValueId,
    requireScope,
    systemId,
    systemName,
    sectionId,
    sectionName,
  ])
}

export default useActionPermission


