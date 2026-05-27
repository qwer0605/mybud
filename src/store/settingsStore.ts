import { create } from 'zustand'
import type { AppSettings } from '@/types'
import { LOCAL_STORAGE_KEYS } from '@/utils/constants'

function loadSettings(): AppSettings {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS)
    if (data) return JSON.parse(data) as AppSettings
  } catch {
    // ignore
  }
  return {
    theme: 'system',
    currency: 'KRW',
    language: 'ko',
    useFirebase: false,
  }
}

function applyTheme(theme: AppSettings['theme']): void {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
}

interface SettingsState {
  settings: AppSettings
  updateSettings: (settings: Partial<AppSettings>) => void
  toggleTheme: () => void
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const initial = loadSettings()
  // 초기 테마 적용
  applyTheme(initial.theme)

  return {
    settings: initial,

    updateSettings: (newSettings) => {
      const settings = { ...get().settings, ...newSettings }
      if (newSettings.theme) {
        applyTheme(newSettings.theme)
      }
      localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
      set({ settings })
    },

    toggleTheme: () => {
      const current = get().settings.theme
      const isDark = document.documentElement.classList.contains('dark')
      const next = isDark ? 'light' : 'dark'
      applyTheme(next)
      const settings = { ...get().settings, theme: next as AppSettings['theme'] }
      localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
      set({ settings })
    },
  }
})
