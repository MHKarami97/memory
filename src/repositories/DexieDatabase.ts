import Dexie, { type EntityTable } from 'dexie'
import type { Memory } from '@/models/Memory'
import type { AppSettings } from '@/models/Settings'
import type { LocalSpeechModel } from '@/models/SpeechModel'

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
}

export interface StoredModelCache {
  id: string
  name: string
  sizeBytes: number
  cachedAt: string
  modelData?: Blob | ArrayBuffer
}

export class KhaterehDatabase extends Dexie {
  memories!: EntityTable<Memory, 'id'>
  drafts!: EntityTable<MemoryDraft, 'id'>
  settings!: EntityTable<{ id: string; value: any }, 'id'>
  models!: EntityTable<StoredModelCache, 'id'>

  constructor() {
    super('KhaterehNamehDB')
    this.version(1).stores({
      memories: 'id, date, isImportant, isLocked, createdAt, updatedAt, *tags, *people',
      drafts: 'id, updatedAt',
      settings: 'id',
      models: 'id, cachedAt',
    })
  }
}

export const db = new KhaterehDatabase()
