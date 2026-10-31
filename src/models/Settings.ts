export type ThemeMode = 'light' | 'dark' | 'system'
export type FontSize = 'sm' | 'base' | 'lg'
export type PhotoQuality = 'high' | 'medium' | 'low'
export type SpeechEngine = 'system' | 'local'

export interface EditorFieldVisibility {
  mood: boolean
  lifeChapter: boolean
  activities: boolean
  eventType: boolean
  location: boolean
  people: boolean
  tags: boolean
  gratitude: boolean
  dailyLesson: boolean
  goals: boolean
  relatedMemories: boolean
  guidedPrompts: boolean
}

export interface AppSettings {
  themeMode: ThemeMode
  fontSize: FontSize
  photoQuality: PhotoQuality
  photoMaxWidth: number
  speechEngine: SpeechEngine
  defaultLocalModelId: string
  defaultTextModelId: string
  dailyReminderEnabled: boolean
  dailyReminderTime: string // 'HH:mm'
  securityEnabled: boolean
  hasPasscode: boolean
  passcodeHash?: string
  passcodeSalt?: string
  passcodeLength: number // 0 = unknown (passcode created before this field existed)
  biometricEnabled: boolean
  biometricCredentialId?: string
  autoLockDelayMinutes: number // 0 for immediate, 5, 15, etc.
  autoSpellCheck: boolean
  autoFormatting: boolean
  editorFields: EditorFieldVisibility
}

export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  fontSize: 'base',
  photoQuality: 'medium',
  photoMaxWidth: 1600,
  speechEngine: 'system',
  defaultLocalModelId: 'whisper-tiny-fa',
  defaultTextModelId: 'qwen3-0.6b',
  dailyReminderEnabled: false,
  dailyReminderTime: '21:00',
  securityEnabled: false,
  hasPasscode: false,
  passcodeLength: 0,
  biometricEnabled: false,
  autoLockDelayMinutes: 5,
  autoSpellCheck: true,
  autoFormatting: true,
  editorFields: {
    mood: true,
    lifeChapter: true,
    activities: true,
    eventType: true,
    location: true,
    people: true,
    tags: true,
    gratitude: true,
    dailyLesson: true,
    goals: true,
    relatedMemories: true,
    guidedPrompts: true,
  },
}
