import { useState, useRef, useEffect } from 'react'
import { useAppearance, FONT_SIZES, THEMES } from '@/contexts/AppearanceContext'
import { Settings, Type, Palette, Check } from 'lucide-react'

export default function AppearanceSettings() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { fontSize, setFontSize, theme, setTheme } = useAppearance()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
        aria-label="Appearance settings"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Appearance</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-scale-in">
          {/* Font Size Section */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Font Size</h3>
            </div>
            <div className="space-y-2">
              {Object.entries(FONT_SIZES).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFontSize(key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    fontSize === key
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="text-sm">{config.name}</span>
                  {fontSize === key && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Section */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Theme Color</h3>
            </div>
            <div className="space-y-2">
              {Object.entries(THEMES).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    theme === key
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full border-2 border-border"
                      style={{ backgroundColor: config.primary }}
                    />
                    <span className="text-sm">{config.name}</span>
                  </div>
                  {theme === key && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Info Footer */}
          <div className="px-4 py-3 bg-muted/30 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Settings are saved automatically
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

