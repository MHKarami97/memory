import type { Memory, MemoryFilter, MemoryStats } from '@/models/Memory'
import type { MemoryDraft } from './DexieDatabase'

export interface IMemoryRepository {
  getAll(): Promise<Memory[]>
  getById(id: string): Promise<Memory | undefined>
  query(filter: MemoryFilter): Promise<Memory[]>
  create(memory: Memory): Promise<string>
  update(memory: Memory): Promise<void>
  delete(id: string): Promise<void>
  count(): Promise<number>
  getStats(): Promise<MemoryStats>
  getAllTags(): Promise<string[]>
  getAllPeople(): Promise<string[]>
  getAllLocations(): Promise<string[]>
  
  // Drafts
  saveDraft(draft: MemoryDraft): Promise<void>
  getDraft(id?: string): Promise<MemoryDraft | undefined>
  deleteDraft(id?: string): Promise<void>

  // Bulk
  bulkInsert(memories: Memory[]): Promise<void>
  clearAll(): Promise<void>
}
