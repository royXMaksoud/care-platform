import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMyPermissions } from '@/api/permissions.api'
import { resolveModulePath } from '@/config/module-routes'
import { extraPages } from './SearchPages'

const typeWeight = { system: 1, section: 2, action: 3, page: 4 }

function norm(s = '') { return String(s).toLowerCase().trim() }
function slug(s = '') { return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }

export function useGlobalSearchIndex() {
  const { data } = useQuery({ queryKey: ['me', 'permissions'], queryFn: fetchMyPermissions, staleTime: 5*60*1000 })

  const items = useMemo(() => {
    const res = []
    const systems = data?.systems ?? []

    for (const sys of systems) {
      const base = resolveModulePath(sys)
      const sysName = sys.name || 'System'
      const sysId = sys.id || slug(sysName)

      // system item
      res.push({
        id: `sys:${sysId}`,
        type: 'system',
        title: sysName,
        subtitle: null,
        breadcrumbs: [],
        path: base,
        hay: [sysName],
        icon: 'desktop',
        sections: sys.sections?.length ?? 0,
        actionsCount: (sys.sections ?? []).reduce((a, s) => a + (s.actions?.length || 0), 0),
      })

      // sections + actions
      for (const sec of sys.sections ?? []) {
        const secName = sec.name || 'Section'
        res.push({
          id: `sec:${sysId}:${sec.id || slug(secName)}`,
          type: 'section',
          title: secName,
          subtitle: null,
          breadcrumbs: [sysName],
          path: base, // change if you have a route per section
          hay: [secName, sysName],
          icon: 'folder',
        })

        for (const act of sec.actions ?? []) {
          const actTitle = act.name || act.code || 'Action'
          res.push({
            id: `act:${sysId}:${act.id || slug(actTitle)}`,
            type: 'action',
            title: actTitle,
            subtitle: `${sysName} > ${secName}`,
            breadcrumbs: [sysName, secName],
            path: base, // change if you have a route per action
            hay: [actTitle, act.code, secName, sysName].filter(Boolean),
            icon: 'play',
          })
        }
      }
    }

    for (const p of extraPages) {
      res.push({
        id: `page:${p.path}`,
        type: 'page',
        title: p.title,
        subtitle: p.path,
        breadcrumbs: [],
        path: p.path,
        hay: [p.title, p.path, ...(p.keywords || [])],
        icon: 'link',
      })
    }

    return res
  }, [data])

  function search(qRaw) {
    const q = norm(qRaw)
    if (!q) return []

    return items
      .map((it) => {
        const hay = (it.hay || []).map(norm).join(' | ')
        let score = 999
        const idx = hay.indexOf(q)
        if (idx === 0) score = 0
        else if (idx > 0) score = 1
        else if (q.split(/\s+/).every(tok => hay.includes(tok))) score = 2

        return { it, score }
      })
      .filter(x => x.score < 999)
      .sort((a, b) => (a.score - b.score) || (typeWeight[a.it.type] - typeWeight[b.it.type]) || a.it.title.localeCompare(b.it.title))
      .slice(0, 50)
      .map(x => x.it)
  }

  return { items, search }
}
