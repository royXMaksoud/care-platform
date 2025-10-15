import { createContext, useContext, useState, useEffect } from 'react'

const AppearanceContext = createContext()

// Font sizes configuration
export const FONT_SIZES = {
  small: {
    name: 'Small',
    base: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
    '2xl': 'text-lg',
    '3xl': 'text-xl',
    '4xl': 'text-2xl',
    table: 'text-xs',
    tableHeader: 'text-xs'
  },
  medium: {
    name: 'Medium',
    base: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    '2xl': 'text-xl',
    '3xl': 'text-2xl',
    '4xl': 'text-3xl',
    table: 'text-sm',
    tableHeader: 'text-sm'
  },
  large: {
    name: 'Large',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    table: 'text-base',
    tableHeader: 'text-base'
  },
  xlarge: {
    name: 'Extra Large',
    base: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl',
    '3xl': 'text-4xl',
    '4xl': 'text-5xl',
    table: 'text-lg',
    tableHeader: 'text-lg'
  }
}

// Theme colors configuration
export const THEMES = {
  default: {
    name: 'Default',
    primary: 'hsl(250 100% 60%)',
    success: 'hsl(142 76% 36%)',
    warning: 'hsl(38 92% 50%)',
    destructive: 'hsl(0 84% 60%)'
  },
  blue: {
    name: 'Ocean Blue',
    primary: 'hsl(210 100% 50%)',
    success: 'hsl(142 76% 36%)',
    warning: 'hsl(38 92% 50%)',
    destructive: 'hsl(0 84% 60%)'
  },
  green: {
    name: 'Forest Green',
    primary: 'hsl(142 76% 40%)',
    success: 'hsl(142 76% 36%)',
    warning: 'hsl(38 92% 50%)',
    destructive: 'hsl(0 84% 60%)'
  },
  purple: {
    name: 'Royal Purple',
    primary: 'hsl(270 100% 60%)',
    success: 'hsl(142 76% 36%)',
    warning: 'hsl(38 92% 50%)',
    destructive: 'hsl(0 84% 60%)'
  },
  orange: {
    name: 'Sunset Orange',
    primary: 'hsl(25 95% 53%)',
    success: 'hsl(142 76% 36%)',
    warning: 'hsl(38 92% 50%)',
    destructive: 'hsl(0 84% 60%)'
  }
}

export function AppearanceProvider({ children }) {
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('app-font-size')
    return saved || 'large' // Default to large
  })

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme')
    return saved || 'default'
  })

  // Apply font size to document
  useEffect(() => {
    localStorage.setItem('app-font-size', fontSize)
    document.documentElement.setAttribute('data-font-size', fontSize)
  }, [fontSize])

  // Apply theme colors to document
  useEffect(() => {
    localStorage.setItem('app-theme', theme)
    const colors = THEMES[theme]
    
    if (colors) {
      const root = document.documentElement
      root.style.setProperty('--color-primary', colors.primary)
      root.style.setProperty('--primary', colors.primary)
      root.style.setProperty('--color-success', colors.success)
      root.style.setProperty('--color-warning', colors.warning)
      root.style.setProperty('--color-destructive', colors.destructive)
      root.style.setProperty('--destructive', colors.destructive)
    }
  }, [theme])

  const value = {
    fontSize,
    setFontSize,
    fontClasses: FONT_SIZES[fontSize],
    theme,
    setTheme,
    themeColors: THEMES[theme]
  }

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  )
}

export function useAppearance() {
  const context = useContext(AppearanceContext)
  if (!context) {
    throw new Error('useAppearance must be used within AppearanceProvider')
  }
  return context
}

