import type { Language } from '@/lib/i18n'

export type ThemeId = 'blue' | 'green' | 'pink' | 'purple' | 'terracotta'

export const THEMES: {
  id: ThemeId
  swatch: { brand: string; deep: string; soft: string; sidebar: string }
  chrome: string
}[] = [
  {
    id: 'blue',
    swatch: { brand: '#2457e6', deep: '#14308f', soft: '#e8eeff', sidebar: '#0b1330' },
    chrome: '#ebebed',
  },
  {
    id: 'green',
    swatch: { brand: '#0f7a55', deep: '#0a4d37', soft: '#e0f3ea', sidebar: '#0a2018' },
    chrome: '#ebebed',
  },
  {
    id: 'pink',
    swatch: { brand: '#c2255c', deep: '#8a1640', soft: '#fde6ee', sidebar: '#2b0f1c' },
    chrome: '#ebebed',
  },
  {
    id: 'purple',
    swatch: { brand: '#6d3fd6', deep: '#43238f', soft: '#eee8fd', sidebar: '#170d36' },
    chrome: '#ebebed',
  },
  {
    id: 'terracotta',
    swatch: { brand: '#c2542d', deep: '#8a3418', soft: '#fbeae1', sidebar: '#2a150c' },
    chrome: '#ebebed',
  },
]

export const LANGUAGES: { id: Language; native: string; code: string }[] = [
  { id: 'en', native: 'English', code: 'EN' },
  { id: 'pt-BR', native: 'Português (Brasil)', code: 'PT' },
  { id: 'ko', native: '한국어', code: 'KO' },
]

export type Preferences = {
  theme: ThemeId
  language: Language
  knoxAlerts: boolean
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'blue',
  language: 'en',
  knoxAlerts: true,
}

export const COOKIES = {
  theme: 'ppb-theme',
  language: 'ppb-language',
  knox: 'ppb-knox',
} as const

export function parseTheme(value: string | undefined): ThemeId {
  return THEMES.some((theme) => theme.id === value) ? (value as ThemeId) : DEFAULT_PREFERENCES.theme
}

export function parseLanguage(value: string | undefined): Language {
  return LANGUAGES.some((language) => language.id === value)
    ? (value as Language)
    : DEFAULT_PREFERENCES.language
}

export function parseKnox(value: string | undefined): boolean {
  return value === undefined ? DEFAULT_PREFERENCES.knoxAlerts : value === '1'
}

type CookieReader = { get: (name: string) => { value: string } | undefined }

export function readPreferences(store: CookieReader): Preferences {
  return {
    theme: parseTheme(store.get(COOKIES.theme)?.value),
    language: parseLanguage(store.get(COOKIES.language)?.value),
    knoxAlerts: parseKnox(store.get(COOKIES.knox)?.value),
  }
}

// Comes from the corporate directory. Read-only in the app.
export const USER = {
  fullName: 'Rafael Alves',
  knoxId: 'rafael.alves',
  department: 'PPB Planning, MX Supply Chain',
  initials: 'RA',
}
