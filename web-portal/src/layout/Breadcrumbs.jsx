import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

function titleCase(s = '') {
  return s
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function findModuleLabel(firstSeg, modules = []) {
  // match the first path segment against modules list to get pretty name
  for (const m of modules) {
    const seg = String(m.path || '').replace(/^\//, '').split('/')[0]
    if (seg === firstSeg) return m.name || titleCase(firstSeg)
  }
  return titleCase(firstSeg)
}

export default function Breadcrumbs({ modules = [] }) {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)

  // Build crumbs
  const crumbs = [{ label: 'Home', to: '/' }]
  let acc = ''
  parts.forEach((seg, idx) => {
    acc += '/' + seg
    const isFirst = idx === 0
    const label = isFirst ? findModuleLabel(seg, modules) : titleCase(seg)
    crumbs.push({ label, to: acc })
  })

  // Don't render when we're exactly on Home
  if (crumbs.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-foreground/70">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <li key={c.to + i} className="flex items-center">
              {last ? (
                <span className="font-medium text-foreground">{c.label}</span>
              ) : (
                <Link to={c.to} className="hover:text-foreground underline-offset-4 hover:underline">
                  {c.label}
                </Link>
              )}
              {!last && <ChevronRight className="mx-2 h-4 w-4 opacity-60" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
