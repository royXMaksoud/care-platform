// src/hooks/useMyModules.js
import { useQuery } from '@tanstack/react-query'
import { fetchMyPermissions } from '@/api/permissions.api'
import { resolveModulePath } from '@/config/module-routes'




export function useMyModules() {
  const q = useQuery({
    queryKey: ['me', 'permissions'],
    queryFn: () => fetchMyPermissions(),
    staleTime: 5 * 60 * 1000,
  })

  const systems = q.data?.systems ?? []

  // Only include systems that actually have at least one action
  const modules = systems
    .filter((sys) =>
      (sys.sections ?? []).some((sec) => (sec.actions ?? []).length > 0)
    )
    .map((sys) => ({
      id: sys.id,
      name: sys.name || 'Module',
      path: resolveModulePath(sys),
    }))

  return { ...q, modules }
}
