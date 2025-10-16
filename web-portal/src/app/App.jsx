import { Link, Routes, Route, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { lazy, Suspense } from 'react'                  // NEW

import { Card } from '@/components/ui/card'
import ShellSwitcher from '@/layout/ShellSwitcher'
import HomeCare from '@/pages/home/HomeCare'
// lazy-load CMS module
const CMSRoutes = lazy(() => import('@/modules/cms/routes'))
// lazy-load DAS module
const DASRoutes = lazy(() => import('@/modules/das/routes'))  



import { useAuth } from '@/auth/useAuth'
import { useMyModules } from '@/hooks/useMyModules'
import LanguageSwitcher from '@/shared/components/LanguageSwitcher'

import '@/index.css'

function Placeholder({ title }) {
  return (
    <div className="p-6">
      <h2 className="mb-2 text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">
        This page is a placeholder. Wire your real module here.
      </p>
    </div>
  )
}

export default function App() {
  const { logout } = useAuth()
  
  const { modules, isLoading, isError } = useMyModules()
  

  if (isLoading) return <div className="p-6">Loading…</div>
  if (isError) return <div className="p-6 text-red-600">Failed to load permissions.</div>

  return (
    
    <div className="min-h-dvh bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <Link
              to="/"
              className="text-sm font-medium text-foreground/80 hover:text-foreground"
            >
               <div className="font-semibold" >Portal</div>
               </Link>
          <nav className="flex items-center gap-4">
            {modules.map((m, idx) => (
              <Link
                key={m.path || `${m.name}-${idx}`}
                to={m.path}
                className="text-sm font-medium text-foreground/80 hover:text-foreground"
              >
                {m.name}
              </Link>
            ))}
            <Link
              to="/"
              className="text-sm font-medium text-foreground/80 hover:text-foreground"
            >
              Home
            </Link>

            <LanguageSwitcher />

            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </nav>
        </div>
      </header>
      

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <Routes>
          <Route path="/" element={<HomeCare />} />
          <Route
            path="/cms/*"
            element={
              <Suspense fallback={<div className="p-6">Loading…</div>}>
                <CMSRoutes />
              </Suspense>
            }
          />
          <Route
            path="/das/*"
            element={
              <Suspense fallback={<div className="p-6">Loading…</div>}>
                <DASRoutes />
              </Suspense>
            }
          />

          {modules
          .filter(m => m.path !== '/cms' && m.path !== '/das')
          .map((m, idx) => (
            <Route
              key={m.path || `${m.name}-${idx}`}
              path={m.path}
              element={<Placeholder title={m.name} />}
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
