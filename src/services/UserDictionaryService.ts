import type { UserDictionaryEntry } from '@/models/UserDictionary'
import { UserDictionaryRepository, type IUserDictionaryRepository } from '@/repositories/UserDictionaryRepository'
import { hasLetter, normalizeDictionaryWord } from '@/utils/persianText'

export type AddWordResult = 'added' | 'exists' | 'invalid'

export class UserDictionaryService {
  private static readonly MAX_WORD_LENGTH = 60

  private readonly repository: IUserDictionaryRepository
  private readonly entries = new Map<string, UserDictionaryEntry>()
  private readonly listeners = new Set<() => void>()
  private loading: Promise<void> | null = null
  private protectedWords: string[] = []

  constructor(repository: IUserDictionaryRepository = new UserDictionaryRepository()) {
    this.repository = repository
  }

  ensureLoaded(): Promise<void> {
    if (!this.loading) {
      this.loading = this.repository
        .getAll()
        .then((stored) => {
          stored.forEach((entry) => this.entries.set(entry.id, entry))
          this.refreshSnapshot()
        })
        .catch((error) => {
          this.loading = null
          throw error
        })
    }
    return this.loading
  }

  list(): UserDictionaryEntry[] {
    return Array.from(this.entries.values()).sort((left, right) => left.word.localeCompare(right.word, 'fa'))
  }

  /** Synchronous view used by the text pipeline; empty until `ensureLoaded` has resolved. */
  snapshot(): readonly string[] {
    return this.protectedWords
  }

  has(word: string): boolean {
    return this.entries.has(normalizeDictionaryWord(word))
  }

  async add(raw: string): Promise<AddWordResult> {
    await this.ensureLoaded()
    var entry = this.createEntry(raw)
    if (!entry) return 'invalid'
    if (this.entries.has(entry.id)) return 'exists'

    await this.repository.put(entry)
    this.entries.set(entry.id, entry)
    this.commitChange()
    return 'added'
  }

  async addMany(rawWords: string[]): Promise<number> {
    await this.ensureLoaded()
    var fresh = new Map<string, UserDictionaryEntry>()
    for (var raw of rawWords) {
      var entry = this.createEntry(raw)
      if (entry && !this.entries.has(entry.id)) fresh.set(entry.id, entry)
    }
    if (fresh.size === 0) return 0

    await this.repository.bulkPut(Array.from(fresh.values()))
    fresh.forEach((entry, id) => this.entries.set(id, entry))
    this.commitChange()
    return fresh.size
  }

  async remove(word: string): Promise<void> {
    await this.ensureLoaded()
    var id = normalizeDictionaryWord(word)
    if (!this.entries.delete(id)) return

    await this.repository.remove(id)
    this.commitChange()
  }

  async clear(): Promise<void> {
    await this.repository.clear()
    this.entries.clear()
    this.commitChange()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private createEntry(raw: string): UserDictionaryEntry | null {
    var id = normalizeDictionaryWord(raw)
    if (!id || id.length > UserDictionaryService.MAX_WORD_LENGTH || !hasLetter(id)) return null
    return { id, word: id, createdAt: new Date().toISOString() }
  }

  private commitChange(): void {
    this.refreshSnapshot()
    this.listeners.forEach((listener) => listener())
  }

  private refreshSnapshot(): void {
    this.protectedWords = Array.from(this.entries.keys())
  }
}

export const userDictionaryService = new UserDictionaryService()
