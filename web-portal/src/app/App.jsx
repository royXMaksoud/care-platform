import { Link, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { LogOut, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import ShellSwitcher from '@/layout/ShellSwitcher'
import HomeCare from '@/pages/home/HomeCare'
// lazy-load CMS module
const CMSRoutes = lazy(() => import('@/modules/cms/routes'))
// lazy-load DAS module
const DASRoutes = lazy(() => import('@/modules/das/routes'))
// lazy-load Appointment module
const AppointmentRoutes = lazy(() => import('@/modules/appointment/routes'))  



import { useAuth } from '@/auth/useAuth'
import authStorage from '@/auth/authStorage'
import { api } from '@/lib/axios'
import { useMyModules } from '@/hooks/useMyModules'
import LanguageSwitcher from '@/shared/components/LanguageSwitcher'
import SessionTimeoutWatcher from '@/shared/components/SessionTimeoutWatcher'

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
  const { t } = useTranslation()
  const { logout, claims } = useAuth()
  const storedUser = authStorage.getUser()
  const sessionTimeoutMinutes = storedUser?.sessionTimeoutMinutes ?? null
  const tenantLogo = storedUser?.tenantLogo ?? authStorage.getTenantLogo()

  // Debug: log data from storage
  console.log('📱 App.jsx loaded', {
    storedUser,
    sessionTimeoutMinutes,
    tenantLogo,
    allLocalStorage: {
      user: localStorage.getItem('portal:user'),
      logo: localStorage.getItem('portal:tenant_logo'),
      timeout: localStorage.getItem('portal:session_timeout_minutes'),
    }
  })

  const userId =
    claims?.userId ||
    claims?.uid ||
    claims?.id ||
    claims?.sub ||
    null

  const { data: currentUser } = useQuery({
    queryKey: ['me', 'profile', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data } = await api.get(`/auth/api/users/${userId}`)
      return data
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })

  const currentUserName = useMemo(() => {
    if (!currentUser) return ''
    if (currentUser.fullName) return currentUser.fullName
    const nameParts = [
      currentUser.firstName,
      currentUser.fatherName,
      currentUser.surName,
    ].filter(Boolean)
    if (nameParts.length) return nameParts.join(' ')
    return currentUser.emailAddress || ''
  }, [currentUser])

  const fallbackName =
    claims?.fullName ||
    claims?.name ||
    claims?.given_name ||
    claims?.preferred_username ||
    claims?.email ||
    ''

  const displayName = currentUserName || fallbackName
  const userInitials = useMemo(() => {
    if (!displayName) return ''
    return displayName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [displayName])
  
  const { modules, isLoading, isError } = useMyModules()
  

  if (isLoading) return <div className="p-6">Loading…</div>
  if (isError) return <div className="p-6 text-red-600">Failed to load permissions.</div>

  const handleLogout = () => {
    toast.warning(t('nav.logoutConfirm'), {
      description: t('nav.logoutHint'),
      duration: 6000,
      action: {
        label: t('nav.logoutAction'),
        onClick: () => logout(),
      },
    })
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SessionTimeoutWatcher timeoutMinutes={sessionTimeoutMinutes} onExpire={logout} />
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-gradient-to-r from-slate-100 via-white to-slate-100 text-slate-900 shadow-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="group flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-300 hover:bg-slate-100 hover:-translate-y-0.5"
            >
              {tenantLogo ? (
                <>
                  <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white">
                    <img
                      src={tenantLogo}
                      alt={t('nav.portal')}
                      className="h-full w-full object-contain"
                    />
                  </span>
                  <span className="sr-only">{t('nav.portal')}</span>
                </>
              ) : (
                <>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  {t('nav.portal')}
                </>
              )}
            </Link>
            {displayName && (
              <span className="hidden md:inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-[0.65rem] font-semibold">
                  {userInitials}
                </span>
                {t('nav.welcome', { name: displayName })}
              </span>
            )}
          </div>
          <nav className="flex items-center gap-3">
            {modules.map((m, idx) => (
              <Link
                key={m.path || `${m.name}-${idx}`}
                to={m.path}
                className="group relative text-sm font-medium text-slate-600 transition-all duration-200 hover:text-slate-900 hover:-translate-y-0.5"
              >
                {m.name}
                <span className="pointer-events-none absolute left-1/2 top-full h-0.5 w-0 bg-blue-500 transition-all duration-200 group-hover:left-0 group-hover:w-full" />
              </Link>
            ))}
            <Link
              to="/"
              className="group relative text-sm font-medium text-slate-600 transition-all duration-200 hover:text-slate-900 hover:-translate-y-0.5"
            >
              {t('nav.home')}
              <span className="pointer-events-none absolute left-1/2 top-full h-0.5 w-0 bg-blue-500 transition-all duration-200 group-hover:left-0 group-hover:w-full" />
            </Link>

            <LanguageSwitcher />

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-rose-400/40 transition-all duration-200 hover:from-rose-600 hover:to-rose-700 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2 focus:ring-offset-slate-100"
            >
              <LogOut className="h-4 w-4" />
              {t('nav.logout')}
            </button>
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
          <Route
            path="/appointment/*"
            element={
              <Suspense fallback={<div className="p-6">Loading…</div>}>
                <AppointmentRoutes />
              </Suspense>
            }
          />
          <Route
            path="/appointments/*"
            element={
              <Suspense fallback={<div className="p-6">Loading…</div>}>
                <AppointmentRoutes />
              </Suspense>
            }
          />

          {modules
          .filter(m => m.path !== '/cms' && m.path !== '/das' && m.path !== '/appointment' && m.path !== '/appointments')
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
