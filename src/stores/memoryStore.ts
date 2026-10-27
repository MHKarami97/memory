import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Memory, MemoryFilter, MemoryStats } from '@/models/Memory'
import type { MemoryDraft } from '@/repositories/DexieDatabase'
import { memoryRepository } from '@/repositories/MemoryRepository'
import { getTodayIso, isYearsAgoToday, isoToJalali, getTodayJalali } from '@/utils/jalali'

export const useMemoryStore = defineStore('memory', () => {
  var memories = ref<Memory[]>([])
  var isLoading = ref(false)
  var selectedMemoryId = ref<string | null>(null)

  // Filter & Search state
  var filter = ref<MemoryFilter>({
    query: '',
    sortBy: 'newest',
  })

  // All known tags, people, locations
  var availableTags = ref<string[]>([])
  var availablePeople = ref<string[]>([])
  var availableLocations = ref<string[]>([])

  // Stats
  var stats = ref<MemoryStats>({
    totalCount: 0,
    importantCount: 0,
    photosCount: 0,
    voiceCount: 0,
    tagsCount: 0,
    peopleCount: 0,
    memoriesByMonth: {},
    memoriesByYear: {},
  })

  // Draft
  var activeDraft = ref<MemoryDraft | null>(null)

  // Undo delete buffer
  var lastDeletedMemory = ref<Memory | null>(null)
  var undoTimeoutId = ref<any>(null)

  var selectedMemory = computed(() => {
    if (!selectedMemoryId.value) return null
    return memories.value.find((m) => m.id === selectedMemoryId.value) || null
  })

  // Filtered memories
  var filteredMemories = computed(() => {
    var list = [...memories.value]
    var q = filter.value.query ? filter.value.query.trim().toLowerCase() : ''

    return list.filter((m) => {
      if (q) {
        var matchTitle = m.title ? m.title.toLowerCase().includes(q) : false
        var matchContent = m.content ? m.content.toLowerCase().includes(q) : false
        var matchTags = m.tags ? m.tags.some((t) => t.toLowerCase().includes(q)) : false
        var matchPeople = m.people ? m.people.some((p) => p.toLowerCase().includes(q)) : false
        var matchLocation = m.location ? m.location.toLowerCase().includes(q) : false
        if (!matchTitle && !matchContent && !matchTags && !matchPeople && !matchLocation) {
          return false
        }
      }

      if (filter.value.tag && (!m.tags || !m.tags.includes(filter.value.tag))) {
        return false
      }

      if (filter.value.person && (!m.people || !m.people.includes(filter.value.person))) {
        return false
      }

      if (filter.value.location && m.location !== filter.value.location) {
        return false
      }

      if (filter.value.isImportant !== undefined && m.isImportant !== filter.value.isImportant) {
        return false
      }

      if (filter.value.hasPhotos && (!m.photos || m.photos.length === 0)) {
        return false
      }

      if (filter.value.hasVoice && !m.voice) {
        return false
      }

      if (filter.value.startDate && m.date < filter.value.startDate) {
        return false
      }

      if (filter.value.endDate && m.date > filter.value.endDate) {
        return false
      }

      return true
    }).sort((a, b) => {
      if (filter.value.sortBy === 'oldest') {
        return a.date.localeCompare(b.date)
      }
      if (filter.value.sortBy === 'important') {
        if (a.isImportant !== b.isImportant) {
          return a.isImportant ? -1 : 1
        }
        return b.date.localeCompare(a.date)
      }
      return b.date.localeCompare(a.date)
    })
  })

  // Flashback: on this day in previous Jalali years
  var flashbackMemories = computed(() => {
    return memories.value.filter((m) => isYearsAgoToday(m.date))
  })

  // Period helpers
  var todayMemories = computed(() => {
    var todayIso = getTodayIso()
    return memories.value.filter((m) => m.date === todayIso)
  })

  var thisMonthMemories = computed(() => {
    var today = getTodayJalali()
    return memories.value.filter((m) => {
      var j = isoToJalali(m.date)
      return j.jy === today.jy && j.jm === today.jm
    })
  })

  var thisYearMemories = computed(() => {
    var today = getTodayJalali()
    return memories.value.filter((m) => {
      var j = isoToJalali(m.date)
      return j.jy === today.jy
    })
  })

  async function loadMemories() {
    isLoading.value = true
    try {
      memories.value = await memoryRepository.getAll()
      await refreshMetadata()

      // Select first memory by default on tablet/desktop if none selected
      if (!selectedMemoryId.value && memories.value.length > 0) {
        selectedMemoryId.value = memories.value[0].id
      }
    } finally {
      isLoading.value = false
    }
  }

  async function refreshMetadata() {
    var [tags, people, locations, st] = await Promise.all([
      memoryRepository.getAllTags(),
      memoryRepository.getAllPeople(),
      memoryRepository.getAllLocations(),
      memoryRepository.getStats(),
    ])
    availableTags.value = tags
    availablePeople.value = people
    availableLocations.value = locations
    stats.value = st
  }

  async function addMemory(memory: Memory): Promise<string> {
    var plain = JSON.parse(JSON.stringify(memory))
    var id = await memoryRepository.create(plain)
    memories.value.unshift(plain)
    selectedMemoryId.value = id
    await refreshMetadata()
    return id
  }

  async function updateMemory(memory: Memory) {
    var plain = JSON.parse(JSON.stringify(memory))
    await memoryRepository.update(plain)
    var index = memories.value.findIndex((m) => m.id === plain.id)
    if (index !== -1) {
      memories.value[index] = plain
    }
    await refreshMetadata()
  }

  async function deleteMemory(id: string) {
    var found = memories.value.find((m) => m.id === id)
    if (found) {
      lastDeletedMemory.value = { ...found }
      if (undoTimeoutId.value) clearTimeout(undoTimeoutId.value)
      undoTimeoutId.value = setTimeout(() => {
        lastDeletedMemory.value = null
      }, 7000)
    }

    await memoryRepository.delete(id)
    memories.value = memories.value.filter((m) => m.id !== id)

    if (selectedMemoryId.value === id) {
      selectedMemoryId.value = memories.value[0]?.id || null
    }

    await refreshMetadata()
  }

  async function undoDelete() {
    if (!lastDeletedMemory.value) return
    var mem = lastDeletedMemory.value
    await memoryRepository.create(mem)
    memories.value.unshift(mem)
    selectedMemoryId.value = mem.id
    lastDeletedMemory.value = null
    if (undoTimeoutId.value) clearTimeout(undoTimeoutId.value)
    await refreshMetadata()
  }

  function selectMemory(id: string | null) {
    selectedMemoryId.value = id
  }

  function setFilter(newFilter: Partial<MemoryFilter>) {
    filter.value = { ...filter.value, ...newFilter }
  }

  function resetFilter() {
    filter.value = {
      query: '',
      sortBy: 'newest',
    }
  }

  // Draft operations
  async function saveDraft(draft: MemoryDraft) {
    activeDraft.value = draft
    await memoryRepository.saveDraft(draft)
  }

  async function loadDraft(id: string = 'current-draft'): Promise<MemoryDraft | undefined> {
    var draft = await memoryRepository.getDraft(id)
    activeDraft.value = draft || null
    return draft
  }

  async function clearDraft(id: string = 'current-draft') {
    activeDraft.value = null
    await memoryRepository.deleteDraft(id)
  }

  return {
    memories,
    isLoading,
    selectedMemoryId,
    selectedMemory,
    filter,
    filteredMemories,
    availableTags,
    availablePeople,
    availableLocations,
    stats,
    flashbackMemories,
    todayMemories,
    thisMonthMemories,
    thisYearMemories,
    activeDraft,
    lastDeletedMemory,
    loadMemories,
    refreshMetadata,
    addMemory,
    updateMemory,
    deleteMemory,
    undoDelete,
    selectMemory,
    setFilter,
    resetFilter,
    saveDraft,
    loadDraft,
    clearDraft,
  }
})
