import type { UserDictionaryEntry } from '@/models/UserDictionary'
import { db } from '@/repositories/DexieDatabase'

export interface IUserDictionaryRepository {
  getAll(): Promise<UserDictionaryEntry[]>
  put(entry: UserDictionaryEntry): Promise<void>
  bulkPut(entries: UserDictionaryEntry[]): Promise<void>
  remove(id: string): Promise<void>
  clear(): Promise<void>
}

export class UserDictionaryRepository implements IUserDictionaryRepository {
  getAll(): Promise<UserDictionaryEntry[]> {
    return db.userWords.orderBy('createdAt').toArray()
  }

  async put(entry: UserDictionaryEntry): Promise<void> {
    await db.userWords.put(entry)
  }

  async bulkPut(entries: UserDictionaryEntry[]): Promise<void> {
    await db.userWords.bulkPut(entries)
  }

  async remove(id: string): Promise<void> {
    await db.userWords.delete(id)
  }

  async clear(): Promise<void> {
    await db.userWords.clear()
  }
}
