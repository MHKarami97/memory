export interface MemoryAttachment {
  id: string
  name: string
  type: string // e.g. 'application/pdf', 'audio/mpeg'
  size: number
  dataUrl?: string // base64 or objectUrl
  blob?: Blob
  createdAt: string
}

export interface MemoryPhoto {
  id: string
  name: string
  originalSize: number
  compressedSize: number
  thumbnailUrl: string // base64 lightweight data URL for timeline/grid
  dataUrl: string // compressed base64 or blob URL
  width?: number
  height?: number
  createdAt: string
}

export interface MemoryVoice {
  id: string
  duration: number // in seconds
  audioUrl: string // base64 data url
  size: number
  transcript?: string
  transcribedAt?: string
  transcriptionEngine?: 'system' | 'local-whisper'
  createdAt: string
}

export type MemoryMood =
  | 'happy' // عالی و شاد (سبز/زرد روشن)
  | 'calm' // آرام و دلنشین (آبی/فیروزه‌ای)
  | 'neutral' // معمولی و خنثی (خاکستری/نقره‌ای)
  | 'sad' // دلگیر و غمگین (آبی تیره/بنفش)
  | 'anxious' // پرتنش یا نگران (نارنجی)
  | 'angry' // عصبانی یا کلافه (قرمز)
  | 'grateful' // سپاسگزار و پرانرژی (صورتی/زرشکی)

export interface MoodConfig {
  id: MemoryMood
  label: string
  emoji: string
  bgColor: string // Tailwind bg class for badge
  textColor: string // Tailwind text class
  borderColor: string
  ringColor: string
}

export const MOOD_DEFINITIONS: MoodConfig[] = [
  { id: 'happy', label: 'عالی و خوشحال', emoji: '😊', bgColor: 'bg-emerald-50 dark:bg-emerald-950/60', textColor: 'text-emerald-700 dark:text-emerald-300', borderColor: 'border-emerald-300 dark:border-emerald-800', ringColor: 'ring-emerald-500' },
  { id: 'calm', label: 'آرام و آسوده', emoji: '😌', bgColor: 'bg-sky-50 dark:bg-sky-950/60', textColor: 'text-sky-700 dark:text-sky-300', borderColor: 'border-sky-300 dark:border-sky-800', ringColor: 'ring-sky-500' },
  { id: 'grateful', label: 'سپاسگزار و باانگیزه', emoji: '✨', bgColor: 'bg-amber-50 dark:bg-amber-950/60', textColor: 'text-amber-700 dark:text-amber-300', borderColor: 'border-amber-300 dark:border-amber-800', ringColor: 'ring-amber-500' },
  { id: 'neutral', label: 'معمولی و یکنواخت', emoji: '😐', bgColor: 'bg-slate-100 dark:bg-slate-800', textColor: 'text-slate-700 dark:text-slate-300', borderColor: 'border-slate-300 dark:border-slate-700', ringColor: 'ring-slate-400' },
  { id: 'anxious', label: 'پرتنش یا کلافه', emoji: '😰', bgColor: 'bg-orange-50 dark:bg-orange-950/60', textColor: 'text-orange-700 dark:text-orange-300', borderColor: 'border-orange-300 dark:border-orange-800', ringColor: 'ring-orange-500' },
  { id: 'sad', label: 'غمگین و دلگیر', emoji: '😔', bgColor: 'bg-indigo-50 dark:bg-indigo-950/60', textColor: 'text-indigo-700 dark:text-indigo-300', borderColor: 'border-indigo-300 dark:border-indigo-800', ringColor: 'ring-indigo-500' },
  { id: 'angry', label: 'خشمگین و عصبانی', emoji: '😡', bgColor: 'bg-rose-50 dark:bg-rose-950/60', textColor: 'text-rose-700 dark:text-rose-300', borderColor: 'border-rose-300 dark:border-rose-800', ringColor: 'ring-rose-500' },
]

export interface Memory {
  id: string
  title?: string
  content: string // Markdown
  date: string // ISO date string (YYYY-MM-DD or full ISO), Gregorian in DB
  time: string // HH:mm format
  tags: string[]
  people: string[]
  location?: string
  photos: MemoryPhoto[]
  attachments: MemoryAttachment[]
  voice?: MemoryVoice
  isImportant: boolean
  isLocked: boolean
  createdAt: string // ISO
  updatedAt: string // ISO

  // Newly requested extended fields
  mood?: MemoryMood // حال‌وهوا
  lifeChapter?: string // فصل زندگی (دانشگاه، ازدواج، سفر و...)
  activities?: string[] // فعالیت‌ها (ورزش، مطالعه، خرید و...)
  eventType?: string // نوع رویداد (جشن، سفر، جلسه، یادگیری و...)
  gratitude?: string // سپاسگزاری روز
  dailyLesson?: string // نتیجه گرفته شده از روز
  goals?: string[] // اهداف گرفته شده
  relatedMemoryIds?: string[] // خاطره‌های مرتبط
}

export interface MemoryFilter {
  query?: string
  tag?: string
  person?: string
  location?: string
  lifeChapter?: string
  activity?: string
  eventType?: string
  mood?: MemoryMood
  isImportant?: boolean
  isLocked?: boolean
  startDate?: string // ISO
  endDate?: string // ISO
  hasVoice?: boolean
  hasPhotos?: boolean
  hasGoals?: boolean
  hasGratitude?: boolean
  hasLesson?: boolean
  sortBy?: 'newest' | 'oldest' | 'important'
}

export interface MemoryStats {
  totalCount: number
  importantCount: number
  photosCount: number
  voiceCount: number
  tagsCount: number
  peopleCount: number
  chaptersCount: number
  goalsCount: number
  memoriesByMonth: Record<string, number> // '1403-08': 5
  memoriesByYear: Record<string, number> // '1403': 20
  moodDistribution: Record<string, number>
}
