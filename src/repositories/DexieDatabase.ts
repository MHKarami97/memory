import Dexie, { type EntityTable } from 'dexie'
import type { Memory } from '@/models/Memory'
import type { AppSettings } from '@/models/Settings'
import type { LocalSpeechModel } from '@/models/SpeechModel'
import type { UserDictionaryEntry } from '@/models/UserDictionary'

export interface MemoryDraft {
  id: string // 'current-draft' or memory.id
  title: string
  content: string
  date: string
  time: string
  tags: string[]
  people: string[]
  location?: string
  isImportant: boolean
  isLocked: boolean
  updatedAt: string
  mood?: string
  lifeChapter?: string
  activities?: string[]
  eventType?: string
  gratitude?: string
  dailyLesson?: string
  goals?: string[]
  relatedMemoryIds?: string[]
}

export interface StoredModelCache {
  id: string
  name: string
  sizeBytes: number
  cachedAt: string
  modelData?: Blob | ArrayBuffer
  variant?: string // text models: "device:dtype" that was cached on download
}

export class KhaterehDatabase extends Dexie {
  memories!: EntityTable<Memory, 'id'>
  drafts!: EntityTable<MemoryDraft, 'id'>
  settings!: EntityTable<{ id: string; value: any }, 'id'>
  models!: EntityTable<StoredModelCache, 'id'>
  userWords!: EntityTable<UserDictionaryEntry, 'id'>

  constructor() {
    super('KhaterehNamehDB')
    this.version(1).stores({
      memories: 'id, date, isImportant, isLocked, createdAt, updatedAt, *tags, *people',
      drafts: 'id, updatedAt',
      settings: 'id',
      models: 'id, cachedAt',
    })
    this.version(2).stores({
      memories: 'id, date, isImportant, isLocked, createdAt, updatedAt, mood, lifeChapter, eventType, *tags, *people, *activities, *goals',
      drafts: 'id, updatedAt',
      settings: 'id',
      models: 'id, cachedAt',
    })
    this.version(3).stores({
      memories: 'id, date, isImportant, isLocked, createdAt, updatedAt, mood, lifeChapter, eventType, *tags, *people, *activities, *goals',
      drafts: 'id, updatedAt',
      settings: 'id',
      models: 'id, cachedAt',
      userWords: 'id, createdAt',
    })
  }
}

export const db = new KhaterehDatabase()
