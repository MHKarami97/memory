import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppSettings, ThemeMode, FontSize, PhotoQuality, SpeechEngine } from '@/models/Settings'
import { DEFAULT_SETTINGS } from '@/models/Settings'
import { db } from '@/repositories/DexieDatabase'

export const useSettingsStore = defineStore('settings', () => {
  var settings = ref<AppSettings>({ ...DEFAULT_SETTINGS })
  var isLoaded = ref(false)

  async function loadSettings() {
    try {
      var records = await db.settings.toArray()
      if (records.length > 0) {
        var map: any = {}
        records.forEach((r) => (map[r.id] = r.value))
        settings.value = {
          ...DEFAULT_SETTINGS,
          ...map,
          editorFields: {
            ...DEFAULT_SETTINGS.editorFields,
            ...(map.editorFields || {}),
          },
        }
      }
      applyTheme(settings.value.themeMode)
      applyFontSize(settings.value.fontSize)
      isLoaded.value = true
    } catch (e) {
      console.error('Failed to load settings from DB:', e)
      isLoaded.value = true
    }
  }

  async function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    settings.value[key] = value
    await db.settings.put({ id: key as string, value })

    if (key === 'themeMode') {
      applyTheme(value as ThemeMode)
    }
    if (key === 'fontSize') {
      applyFontSize(value as FontSize)
    }
  }

  function applyTheme(mode: ThemeMode) {
    localStorage.setItem('khatereh-theme-mode', mode)
    var resolvedTheme = mode
    if (mode === 'system') {
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      resolvedTheme = prefersDark ? 'dark' : 'light'
    }

    document.documentElement.setAttribute('data-theme', resolvedTheme)
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function applyFontSize(size: FontSize) {
    document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg')
    if (size === 'sm') document.documentElement.classList.add('text-sm')
    else if (size === 'lg') document.documentElement.classList.add('text-lg')
    else document.documentElement.classList.add('text-base')
  }

  // Listen to system dark mode preference change
  if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (settings.value.themeMode === 'system') {
        applyTheme('system')
      }
    })
  }

  var isDark = computed(() => {
    if (settings.value.themeMode === 'system') {
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return settings.value.themeMode === 'dark'
  })

  function toggleTheme() {
    var nextMode: ThemeMode = isDark.value ? 'light' : 'dark'
    updateSetting('themeMode', nextMode)
  }

  return {
    settings,
    isLoaded,
    isDark,
    toggleTheme,
    loadSettings,
    updateSetting,
    applyTheme,
  }
})
