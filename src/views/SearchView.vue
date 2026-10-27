<template>
  <div class="max-w-6xl mx-auto p-4 sm:p-6 pb-24 md:pb-12 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Search class="w-6 h-6 text-indigo-500" />
          <span>جست‌وجو و دسته‌بندی خاطرات</span>
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          فیلتر زنده بر اساس واژگان، افراد، برچسب‌ها، مکان و بازه‌های زمانی
        </p>
      </div>

      <button
        v-if="hasActiveFilter"
        type="button"
        class="text-xs text-rose-500 hover:underline font-semibold"
        @click="resetAllFilters"
      >
        حذف تمام فیلترها
      </button>
    </div>

    <!-- Search Box -->
    <div class="relative">
      <Search class="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="جست‌وجوی آنی در عنوان، متن، اشخاص، برچسب‌ها و مکان..."
        class="w-full pr-12 pl-4 py-3 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 shadow-sm"
      />
    </div>

    <!-- 2 Column Layout for Desktop (Filters in Sidebar, Results on Main) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Filter Sidebar / Controls (lg: col-span-4) -->
      <div class="lg:col-span-4 space-y-4">
        <!-- Quick Period Tabs -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3 transition-colors">
          <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200">دوره‌های زمانی ویژه</h3>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              class="p-2.5 rounded-xl border font-semibold flex items-center justify-between transition-all"
              :class="activePeriod === 'today' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'"
              @click="setPeriod('today')"
            >
              <span>امروز</span>
              <span class="text-[10px] opacity-80">({{ toPersianDigits(memoryStore.todayMemories.length) }})</span>
            </button>

            <button
              type="button"
              class="p-2.5 rounded-xl border font-semibold flex items-center justify-between transition-all"
              :class="activePeriod === 'month' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'"
              @click="setPeriod('month')"
            >
              <span>این ماه</span>
              <span class="text-[10px] opacity-80">({{ toPersianDigits(memoryStore.thisMonthMemories.length) }})</span>
            </button>

            <button
              type="button"
              class="p-2.5 rounded-xl border font-semibold flex items-center justify-between transition-all"
              :class="activePeriod === 'year' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'"
              @click="setPeriod('year')"
            >
              <span>امسال</span>
              <span class="text-[10px] opacity-80">({{ toPersianDigits(memoryStore.thisYearMemories.length) }})</span>
            </button>

            <button
              type="button"
              class="p-2.5 rounded-xl border font-semibold flex items-center justify-between transition-all"
              :class="activePeriod === 'flashback' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'"
              @click="setPeriod('flashback')"
            >
              <span>سال‌های گذشته</span>
              <span class="text-[10px] opacity-80">({{ toPersianDigits(memoryStore.flashbackMemories.length) }})</span>
            </button>
          </div>
        </div>

        <!-- Tags Filter Card -->
        <div v-if="memoryStore.availableTags.length > 0" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3 transition-colors">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Tag class="w-3.5 h-3.5 text-indigo-500" />
              <span>برچسب‌ها</span>
            </h3>
            <span class="text-[10px] text-slate-400">{{ toPersianDigits(memoryStore.availableTags.length) }} مورد</span>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              v-for="tag in memoryStore.availableTags"
              :key="tag"
              type="button"
              class="px-2.5 py-1 rounded-xl text-xs font-medium transition-all"
              :class="selectedTag === tag ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'"
              @click="toggleTag(tag)"
            >
              #{{ tag }}
            </button>
          </div>
        </div>

        <!-- People Filter Card -->
        <div v-if="memoryStore.availablePeople.length > 0" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3 transition-colors">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Users class="w-3.5 h-3.5 text-amber-500" />
              <span>افراد مرتبط</span>
            </h3>
            <span class="text-[10px] text-slate-400">{{ toPersianDigits(memoryStore.availablePeople.length) }} نفر</span>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              v-for="person in memoryStore.availablePeople"
              :key="person"
              type="button"
              class="px-2.5 py-1 rounded-xl text-xs font-medium transition-all"
              :class="selectedPerson === person ? 'bg-amber-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'"
              @click="togglePerson(person)"
            >
              👤 {{ person }}
            </button>
          </div>
        </div>

        <!-- Year / Month Memory Distribution -->
        <div v-if="Object.keys(memoryStore.stats.memoriesByYear).length > 0" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3 transition-colors">
          <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200">توزیع خاطرات در سال‌ها</h3>
          <div class="space-y-1.5 text-xs">
            <div
              v-for="(count, year) in memoryStore.stats.memoriesByYear"
              :key="year"
              class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40"
            >
              <span class="text-slate-600 dark:text-slate-400">سال {{ toPersianDigits(year) }}</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">{{ toPersianDigits(count) }} خاطره</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Results Column (lg: col-span-8) -->
      <div class="lg:col-span-8 space-y-4">
        <!-- Results Header -->
        <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>نتایج جست‌وجو: {{ toPersianDigits(filteredResults.length) }} خاطره پیدا شد</span>
        </div>

        <!-- Empty state -->
        <EmptyState
          v-if="filteredResults.length === 0"
          title="موردی یافت نشد"
          description="با عبارت یا فیلترهای انتخاب شده هیچ خاطره‌ای مطابقت نداشت."
        />

        <!-- Results List -->
        <div v-else class="space-y-3">
          <MemoryCard
            v-for="m in filteredResults"
            :key="m.id"
            :memory="m"
            @select="goToMemory(m.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Tag, Users } from 'lucide-vue-next'
import { useMemoryStore } from '@/stores/memoryStore'
import { toPersianDigits } from '@/utils/format'
import { getTodayIso, getTodayJalali, isoToJalali } from '@/utils/jalali'
import MemoryCard from '@/components/memory/MemoryCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()
const memoryStore = useMemoryStore()

const searchQuery = ref('')
const selectedTag = ref('')
const selectedPerson = ref('')
const activePeriod = ref<string | null>(null)

const hasActiveFilter = computed(() => {
  return !!searchQuery.value || !!selectedTag.value || !!selectedPerson.value || !!activePeriod.value
})

const filteredResults = computed(() => {
  var list = [...memoryStore.memories]
  var q = searchQuery.value.trim().toLowerCase()

  return list.filter((m) => {
    // Query search
    if (q) {
      var matchTitle = m.title ? m.title.toLowerCase().includes(q) : false
      var matchContent = m.content ? m.content.toLowerCase().includes(q) : false
      var matchTags = m.tags.some((t) => t.toLowerCase().includes(q))
      var matchPeople = m.people.some((p) => p.toLowerCase().includes(q))
      var matchLocation = m.location ? m.location.toLowerCase().includes(q) : false
      if (!matchTitle && !matchContent && !matchTags && !matchPeople && !matchLocation) {
        return false
      }
    }

    // Tag
    if (selectedTag.value && !m.tags.includes(selectedTag.value)) {
      return false
    }

    // Person
    if (selectedPerson.value && !m.people.includes(selectedPerson.value)) {
      return false
    }

    // Period
    if (activePeriod.value === 'today') {
      if (m.date !== getTodayIso()) return false
    } else if (activePeriod.value === 'month') {
      var today = getTodayJalali()
      var j = isoToJalali(m.date)
      if (j.jy !== today.jy || j.jm !== today.jm) return false
    } else if (activePeriod.value === 'year') {
      var today = getTodayJalali()
      var j = isoToJalali(m.date)
      if (j.jy !== today.jy) return false
    } else if (activePeriod.value === 'flashback') {
      var today = getTodayJalali()
      var j = isoToJalali(m.date)
      if (!(j.jm === today.jm && j.jd === today.jd && j.jy < today.jy)) return false
    }

    return true
  })
})

function toggleTag(tag: string) {
  selectedTag.value = selectedTag.value === tag ? '' : tag
}

function togglePerson(person: string) {
  selectedPerson.value = selectedPerson.value === person ? '' : person
}

function setPeriod(period: string) {
  activePeriod.value = activePeriod.value === period ? null : period
}

function resetAllFilters() {
  searchQuery.value = ''
  selectedTag.value = ''
  selectedPerson.value = ''
  activePeriod.value = null
}

function goToMemory(id: string) {
  memoryStore.selectMemory(id)
  router.push(`/memory/${id}`)
}
</script>
