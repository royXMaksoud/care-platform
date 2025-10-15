import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, LayoutDashboard, LogOut, Globe, User, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

// Clean sidebar navigation component
function SidebarNav({ modules = [], onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-white">
      {/* Logo Section */}
      <div className="p-6 border-b">
        <Link to="/" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-sm">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">Portal</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {/* Home Link */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
            onClick={onNavigate}
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </NavLink>

          {/* Modules */}
          {modules.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Systems
              </div>
              {modules.map((m) => (
                <NavLink
                  key={m.path}
                  to={m.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-gray-900 text-white shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                  onClick={onNavigate}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="truncate">{m.name}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <p className="text-xs text-gray-500 text-center">
          © {new Date().getFullYear()} Care Portal
        </p>
      </div>
    </div>
  )
}

// Main layout component
export default function PortalLayout({ children, modules = [], user = null, onLogout }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="h-screen w-full bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 border-r border-gray-200 bg-white z-10">
        <SidebarNav modules={modules} />
      </aside>

      {/* Mobile Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarNav modules={modules} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 backdrop-blur-sm bg-white/95">
          <div className="flex h-16 items-center justify-between px-6">
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setOpen(true)}
                className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Logo */}
            <Link to="/" className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
                <LayoutDashboard className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-gray-900">Portal</span>
            </Link>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Language"
                  >
                    <Globe className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem className="cursor-pointer">English</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">العربية</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">Deutsch</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">Français</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">{user?.email ?? 'User'}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <Separator className="my-1" />
                  <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)] p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
