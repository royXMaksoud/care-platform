import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'portal:fast_access_shortcuts'
const STORAGE_LIMIT = 8

const normalizeShortcut = (shortcut) => {
  if (!shortcut || typeof shortcut !== 'object') return null
  const { path, title, badge, module } = shortcut
  if (!path || !title) return null
  return {
    path,
    title,
    badge: badge || null,
    module: module || null,
  }
}

const readFromStorage = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalizeShortcut)
      .filter(Boolean)
      .slice(0, STORAGE_LIMIT)
  } catch (error) {
    console.warn('[FastAccess] Failed to read shortcuts from storage', error)
    return []
  }
}

export function useFastAccessShortcuts() {
  const [shortcuts, setShortcuts] = useState(() => {
    if (typeof window === 'undefined') return []
    return readFromStorage()
  })

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY) {
        setShortcuts(readFromStorage())
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const persist = useCallback((nextShortcuts) => {
    setShortcuts(nextShortcuts)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextShortcuts))
    } catch (error) {
      console.warn('[FastAccess] Failed to persist shortcuts', error)
    }
  }, [])

  const isPinned = useCallback(
    (path) => shortcuts.some((shortcut) => shortcut.path === path),
    [shortcuts],
  )

  const toggleShortcut = useCallback(
    (shortcut) => {
      const normalized = normalizeShortcut(shortcut)
      if (!normalized) return

      setShortcuts((prev) => {
        const exists = prev.some((item) => item.path === normalized.path)
        const next = exists
          ? prev.filter((item) => item.path !== normalized.path)
          : [normalized, ...prev].slice(0, STORAGE_LIMIT)

        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch (error) {
          console.warn('[FastAccess] Failed to persist shortcuts', error)
        }

        return next
      })
    },
    [],
  )

  const clearShortcuts = useCallback(() => {
    persist([])
  }, [persist])

  const orderedShortcuts = useMemo(
    () =>
      shortcuts.slice().sort((a, b) => {
        const titleA = a.title.toLowerCase()
        const titleB = b.title.toLowerCase()
        if (titleA < titleB) return -1
        if (titleA > titleB) return 1
        return 0
      }),
    [shortcuts],
  )

  return {
    shortcuts: orderedShortcuts,
    toggleShortcut,
    isPinned,
    clearShortcuts,
  }
}


