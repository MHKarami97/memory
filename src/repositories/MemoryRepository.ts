import type { IMemoryRepository } from './IMemoryRepository'
import type { Memory, MemoryFilter, MemoryStats } from '@/models/Memory'
import { db, type MemoryDraft } from './DexieDatabase'
import { isoToJalali } from '@/utils/jalali'

export class MemoryRepository implements IMemoryRepository {
  async getAll(): Promise<Memory[]> {
    return db.memories.orderBy('date').reverse().toArray()
  }

  async getById(id: string): Promise<Memory | undefined> {
    return db.memories.get(id)
  }

  async query(filter: MemoryFilter): Promise<Memory[]> {
    var collection = db.memories.orderBy('date').reverse()
    var items = await collection.toArray()

    return items.filter((m) => {
      // Search query (title, content, people, tags, location)
      if (filter.query) {
        var q = filter.query.trim().toLowerCase()
        var matchTitle = m.title ? m.title.toLowerCase().includes(q) : false
        var matchContent = m.content ? m.content.toLowerCase().includes(q) : false
        var matchTags = m.tags.some((t) => t.toLowerCase().includes(q))
        var matchPeople = m.people.some((p) => p.toLowerCase().includes(q))
        var matchLocation = m.location ? m.location.toLowerCase().includes(q) : false
        if (!matchTitle && !matchContent && !matchTags && !matchPeople && !matchLocation) {
          return false
        }
      }

      // Tag filter
      if (filter.tag && !m.tags.includes(filter.tag)) {
        return false
      }

      // Person filter
      if (filter.person && !m.people.includes(filter.person)) {
        return false
      }

      // Location filter
      if (filter.location && m.location !== filter.location) {
        return false
      }

      // Life Chapter filter
      if (filter.lifeChapter && m.lifeChapter !== filter.lifeChapter) {
        return false
      }

      // Event Type filter
      if (filter.eventType && m.eventType !== filter.eventType) {
        return false
      }

      // Activity filter
      if (filter.activity && (!m.activities || !m.activities.includes(filter.activity))) {
        return false
      }

      // Mood filter
      if (filter.mood && m.mood !== filter.mood) {
        return false
      }

      // Has Goals filter
      if (filter.hasGoals && (!m.goals || m.goals.length === 0)) {
        return false
      }

      // Has Gratitude filter
      if (filter.hasGratitude && (!m.gratitude || !m.gratitude.trim())) {
        return false
      }

      // Has Lesson filter
      if (filter.hasLesson && (!m.dailyLesson || !m.dailyLesson.trim())) {
        return false
      }

      // Important filter
      if (filter.isImportant !== undefined && m.isImportant !== filter.isImportant) {
        return false
      }

      // Locked filter
      if (filter.isLocked !== undefined && m.isLocked !== filter.isLocked) {
        return false
      }

      // Has photos
      if (filter.hasPhotos && (!m.photos || m.photos.length === 0)) {
        return false
      }

      // Has voice
      if (filter.hasVoice && !m.voice) {
        return false
      }

      // Date range
      if (filter.startDate && m.date < filter.startDate) {
        return false
      }
      if (filter.endDate && m.date > filter.endDate) {
        return false
      }

      return true
    }).sort((a, b) => {
      if (filter.sortBy === 'oldest') {
        return a.date.localeCompare(b.date)
      }
      if (filter.sortBy === 'important') {
        if (a.isImportant !== b.isImportant) {
          return a.isImportant ? -1 : 1
        }
        return b.date.localeCompare(a.date)
      }
      // default: newest
      return b.date.localeCompare(a.date)
    })
  }

  async create(memory: Memory): Promise<string> {
    var rawMemory = JSON.parse(JSON.stringify(memory))
    await db.memories.add(rawMemory)
    return memory.id
  }

  async update(memory: Memory): Promise<void> {
    memory.updatedAt = new Date().toISOString()
    var rawMemory = JSON.parse(JSON.stringify(memory))
    await db.memories.put(rawMemory)
  }

  async delete(id: string): Promise<void> {
    await db.memories.delete(id)
  }

  async count(): Promise<number> {
    return db.memories.count()
  }

  async getStats(): Promise<MemoryStats> {
    var memories = await db.memories.toArray()
    var importantCount = 0
    var photosCount = 0
    var voiceCount = 0
    var goalsCount = 0
    var tagsSet = new Set<string>()
    var peopleSet = new Set<string>()
    var chaptersSet = new Set<string>()
    var memoriesByMonth: Record<string, number> = {}
    var memoriesByYear: Record<string, number> = {}
    var moodDistribution: Record<string, number> = {}

    for (var m of memories) {
      if (m.isImportant) importantCount++
      if (m.photos) photosCount += m.photos.length
      if (m.voice) voiceCount++
      if (m.goals && m.goals.length > 0) goalsCount += m.goals.length
      if (m.mood) {
        moodDistribution[m.mood] = (moodDistribution[m.mood] || 0) + 1
      }
      if (m.lifeChapter?.trim()) {
        chaptersSet.add(m.lifeChapter.trim())
      }

      m.tags?.forEach((t) => tagsSet.add(t))
      m.people?.forEach((p) => peopleSet.add(p))

      var j = isoToJalali(m.date)
      var yearKey = String(j.jy)
      var monthKey = `${j.jy}-${String(j.jm).padStart(2, '0')}`

      memoriesByYear[yearKey] = (memoriesByYear[yearKey] || 0) + 1
      memoriesByMonth[monthKey] = (memoriesByMonth[monthKey] || 0) + 1
    }

    return {
      totalCount: memories.length,
      importantCount,
      photosCount,
      voiceCount,
      tagsCount: tagsSet.size,
      peopleCount: peopleSet.size,
      chaptersCount: chaptersSet.size,
      goalsCount,
      memoriesByMonth,
      memoriesByYear,
      moodDistribution,
    }
  }

  async getAllTags(): Promise<string[]> {
    var memories = await db.memories.toArray()
    var tags = new Set<string>()
    memories.forEach((m) => m.tags?.forEach((t) => tags.add(t)))
    return Array.from(tags).sort()
  }

  async getAllPeople(): Promise<string[]> {
    var memories = await db.memories.toArray()
    var people = new Set<string>()
    memories.forEach((m) => m.people?.forEach((p) => people.add(p)))
    return Array.from(people).sort()
  }

  async getAllLocations(): Promise<string[]> {
    var memories = await db.memories.toArray()
    var locations = new Set<string>()
    memories.forEach((m) => {
      if (m.location?.trim()) locations.add(m.location.trim())
    })
    return Array.from(locations).sort()
  }

  async getAllLifeChapters(): Promise<string[]> {
    var memories = await db.memories.toArray()
    var chapters = new Set<string>()
    memories.forEach((m) => {
      if (m.lifeChapter?.trim()) chapters.add(m.lifeChapter.trim())
    })
    return Array.from(chapters).sort()
  }

  async getAllActivities(): Promise<string[]> {
    var memories = await db.memories.toArray()
    var acts = new Set<string>()
    memories.forEach((m) => m.activities?.forEach((a) => acts.add(a.trim())))
    return Array.from(acts).filter(Boolean).sort()
  }

  async getAllEventTypes(): Promise<string[]> {
    var memories = await db.memories.toArray()
    var evs = new Set<string>()
    memories.forEach((m) => {
      if (m.eventType?.trim()) evs.add(m.eventType.trim())
    })
    return Array.from(evs).sort()
  }

  async getAllGoals(): Promise<string[]> {
    var memories = await db.memories.toArray()
    var goals = new Set<string>()
    memories.forEach((m) => m.goals?.forEach((g) => goals.add(g.trim())))
    return Array.from(goals).filter(Boolean).sort()
  }

  async saveDraft(draft: MemoryDraft): Promise<void> {
    var rawDraft = JSON.parse(JSON.stringify(draft))
    await db.drafts.put(rawDraft)
  }

  async getDraft(id: string = 'current-draft'): Promise<MemoryDraft | undefined> {
    return db.drafts.get(id)
  }

  async deleteDraft(id: string = 'current-draft'): Promise<void> {
    await db.drafts.delete(id)
  }

  async bulkInsert(memories: Memory[]): Promise<void> {
    var rawList = JSON.parse(JSON.stringify(memories))
    await db.memories.bulkPut(rawList)
  }

  async clearAll(): Promise<void> {
    await db.memories.clear()
    await db.drafts.clear()
  }
}

export const memoryRepository = new MemoryRepository()
