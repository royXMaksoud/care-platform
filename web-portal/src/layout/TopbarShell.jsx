import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import AppearanceSettings from '@/components/AppearanceSettings'

export default function TopbarShell({ modules = [], user, onLogout, children }) {
  const { t } = useTranslation()
  
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <div className="font-semibold">{t('nav.portal')}</div>
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
            <Link to="/" className="text-sm font-medium text-foreground/80 hover:text-foreground">{t('nav.home')}</Link>
            <AppearanceSettings />
            <LanguageSwitcher />
            <Button variant="outline" size="sm" onClick={onLogout}>{t('nav.logout')}</Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
    </div>
  )
}
