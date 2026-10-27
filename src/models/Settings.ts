export type ThemeMode = 'light' | 'dark' | 'system'
export type FontSize = 'sm' | 'base' | 'lg'
export type PhotoQuality = 'high' | 'medium' | 'low'
export type SpeechEngine = 'system' | 'local'

export interface AppSettings {
  themeMode: ThemeMode
  fontSize: FontSize
  photoQuality: PhotoQuality
  photoMaxWidth: number
  speechEngine: SpeechEngine
  defaultLocalModelId: string
  dailyReminderEnabled: boolean
  dailyReminderTime: string // HH:mm
  securityEnabled: boolean
  hasPasscode: boolean
  passcodeHash?: string
  passcodeSalt?: string
  biometricEnabled: boolean
  biometricCredentialId?: string
  autoLockDelayMinutes: number // 0 for immediate, 5, 15, etc.
}

export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  fontSize: 'base',
  photoQuality: 'medium',
  photoMaxWidth: 1600,
  speechEngine: 'system',
  defaultLocalModelId: 'whisper-tiny-fa',
  dailyReminderEnabled: false,
  dailyReminderTime: '21:00',
  securityEnabled: false,
  hasPasscode: false,
  biometricEnabled: false,
  autoLockDelayMinutes: 5,
}
