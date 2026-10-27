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
}

export interface MemoryFilter {
  query?: string
  tag?: string
  person?: string
  location?: string
  isImportant?: boolean
  isLocked?: boolean
  startDate?: string // ISO
  endDate?: string // ISO
  hasVoice?: boolean
  hasPhotos?: boolean
  sortBy?: 'newest' | 'oldest' | 'important'
}

export interface MemoryStats {
  totalCount: number
  importantCount: number
  photosCount: number
  voiceCount: number
  tagsCount: number
  peopleCount: number
  memoriesByMonth: Record<string, number> // '1403-08': 5
  memoriesByYear: Record<string, number> // '1403': 20
}
