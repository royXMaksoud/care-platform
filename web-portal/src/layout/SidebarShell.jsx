import { useLocation, Link, NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LayoutDashboard } from 'lucide-react'

export default function SidebarShell({ modules = [], user, onLogout, children }) {
  const { pathname } = useLocation()
  return (
    <div className="min-h-dvh grid grid-cols-1 lg:grid-cols-[260px_1fr] bg-background text-foreground">
      {/* Sidebar */}
      <aside className="border-r bg-background">
        <div className="h-14 flex items-center gap-2 px-4 border-b">
          <LayoutDashboard className="h-5 w-5" />
          <span className="font-semibold">Portal</span>
        </div>
        <nav className="p-3 grid gap-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              [
                'rounded-md px-3 py-2 text-sm transition-colors',
                (isActive || pathname === '/') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              ].join(' ')
            }
          >
            Home
          </NavLink>

          {modules.map((m, idx) => (
            <NavLink
              key={m.path || `${m.name}-${idx}`}
              to={m.path}
              className={({ isActive }) =>
                [
                  'rounded-md px-3 py-2 text-sm transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                ].join(' ')
              }
            >
              {m.name}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto p-3 hidden lg:block">
          <Button variant="outline" className="w-full" onClick={onLogout}>Logout</Button>
        </div>
      </aside>

      {/* Content + topbar (mobile actions) */}
      <div className="flex flex-col">
        <header className="lg:hidden sticky top-0 z-10 border-b bg-background/70 backdrop-blur">
          <div className="mx-auto flex h-14 w-full items-center justify-between px-4">
            <span className="font-semibold">Portal</span>
            <div className="flex items-center gap-2">
              <Link to="/" className="text-sm text-foreground/80 hover:text-foreground">Home</Link>
              <Button variant="outline" size="sm" onClick={onLogout}>Logout</Button>
            </div>
          </div>
        </header>
        <main className="px-4 py-6">{children}</main>
      </div>
    </div>
  )
}
