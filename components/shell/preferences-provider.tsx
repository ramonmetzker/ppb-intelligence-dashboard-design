'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DICTIONARIES, type Dictionary, type Language } from '@/lib/i18n'
import { COOKIES, USER, type Preferences, type ThemeId } from '@/lib/preferences'

type PreferencesContext = Preferences & {
  t: Dictionary
  user: typeof USER
  setTheme: (theme: ThemeId) => void
  setLanguage: (language: Language) => void
  setKnoxAlerts: (enabled: boolean) => void
  userDialogOpen: boolean
  setUserDialogOpen: (open: boolean) => void
}

const Context = createContext<PreferencesContext | null>(null)

const ONE_YEAR = 60 * 60 * 24 * 365

function saveCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; samesite=lax`
}

export function PreferencesProvider({
  initial,
  children,
}: {
  initial: Preferences
  children: ReactNode
}) {
  const [theme, setThemeState] = useState(initial.theme)
  const [language, setLanguageState] = useState(initial.language)
  const [knoxAlerts, setKnoxState] = useState(initial.knoxAlerts)
  const [userDialogOpen, setUserDialogOpen] = useState(false)

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next)
    document.documentElement.dataset.theme = next
    saveCookie(COOKIES.theme, next)
  }, [])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    document.documentElement.lang = next
    saveCookie(COOKIES.language, next)
  }, [])

  const setKnoxAlerts = useCallback((enabled: boolean) => {
    setKnoxState(enabled)
    saveCookie(COOKIES.knox, enabled ? '1' : '0')
  }, [])

  const value = useMemo<PreferencesContext>(
    () => ({
      theme,
      language,
      knoxAlerts,
      t: DICTIONARIES[language],
      user: USER,
      setTheme,
      setLanguage,
      setKnoxAlerts,
      userDialogOpen,
      setUserDialogOpen,
    }),
    [theme, language, knoxAlerts, setTheme, setLanguage, setKnoxAlerts, userDialogOpen],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function usePreferences() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('usePreferences must be used inside PreferencesProvider')
  return ctx
}
