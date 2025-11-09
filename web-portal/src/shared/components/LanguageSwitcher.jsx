import { useTranslation } from 'react-i18next'
import { Languages, ChevronDown } from 'lucide-react'
import { LOCALES } from '../../config/constants'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <div className="relative inline-flex items-center rounded-full border border-white/15 bg-white/90 px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm backdrop-blur">
      <Languages className="h-4 w-4 text-blue-600" />
      <select
        className="appearance-none bg-transparent pl-2 pr-6 text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
      >
        {LOCALES.map((locale) => (
          <option key={locale} value={locale}>
            {locale.toUpperCase()}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-slate-500" />
    </div>
  )
}
