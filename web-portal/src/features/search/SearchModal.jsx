import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGlobalSearchIndex } from './useGlobalSearch'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Search, Play, Folder, Link as LinkIcon, Monitor } from 'lucide-react'

function IconFor({ type }) {
  if (type === 'system') return <Monitor className="h-4 w-4" />
  if (type === 'section') return <Folder className="h-4 w-4" />
  if (type === 'action') return <Play className="h-4 w-4" />
  return <LinkIcon className="h-4 w-4" />
}

export default function SearchModal({ open, onClose }) {
  const { search } = useGlobalSearchIndex()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const [results, setResults] = useState([])
  const nav = useNavigate()
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setResults([])
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => {
    setResults(q ? search(q) : [])
    setActive(0)
  }, [q, search])

  useEffect(() => {
    function onKey(e) {
      if (!open) return
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0))) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
      else if (e.key === 'Enter') {
        const pick = results[active]
        if (pick) { onClose(); nav(pick.path) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, active, nav, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-24">
      <div className="w-full max-w-3xl rounded-3xl border bg-white p-4 shadow-2xl">
        {/* header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="font-semibold text-slate-700 flex items-center gap-2">
            Search <Search className="h-4 w-4" />
          </div>
          <Button variant="ghost" className="h-8 px-2" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* input */}
        <div className="mb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
            <Input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search systems, sections, actions…"
              className="pl-9"
            />
          </div>
        </div>

        {/* results */}
        {q.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Start typing to search
            <div className="mt-1 text-xs">Search across all systems, sections, and actions</div>
          </div>
        ) : results.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">No results</div>
        ) : (
          <ul className="max-h-[50vh] overflow-auto divide-y">
            {results.map((r, idx) => (
              <li
                key={r.id}
                onMouseEnter={() => setActive(idx)}
                onClick={() => { onClose(); nav(r.path) }}
                className={[
                  'cursor-pointer px-3 py-3 flex items-start gap-3 transition-colors',
                  idx === active ? 'bg-sky-50' : 'hover:bg-slate-50'
                ].join(' ')}
              >
                <div className="mt-1 text-slate-600"><IconFor type={r.type} /></div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-slate-800 truncate">{r.title}</div>
                    {r.type === 'system' && (
                      <>
                        <Badge className="bg-sky-50 text-sky-800 border-sky-100">{r.sections} sections</Badge>
                        {typeof r.actionsCount === 'number' && <Badge variant="outline">{r.actionsCount} actions</Badge>}
                      </>
                    )}
                    {r.type !== 'system' && (
                      <Badge variant="outline" className="capitalize">{r.type}</Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 truncate">
                    {r.subtitle || (r.breadcrumbs?.length ? r.breadcrumbs.join(' > ') : null)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
