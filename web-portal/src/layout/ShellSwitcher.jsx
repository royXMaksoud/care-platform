import TopbarShell from './TopbarShell'
import SidebarShell from './SidebarShell'
import CareShell from './CareShell'

export default function ShellSwitcher({ modules = [], user = null, onLogout, children }) {
  const mode = (import.meta.env.VITE_SHELL || 'sidebar').toLowerCase()
  if (mode === 'care')  return <CareShell  modules={modules} user={user} onLogout={onLogout}>{children}</CareShell>
  if (mode === 'topbar') return <TopbarShell modules={modules} user={user} onLogout={onLogout}>{children}</TopbarShell>
  return <SidebarShell modules={modules} user={user} onLogout={onLogout}>{children}</SidebarShell>
}
