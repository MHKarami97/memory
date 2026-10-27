<template>
  <div class="h-full flex flex-col md:flex-row min-h-[calc(100vh-65px)]">
    <!-- Center/Main: Timeline / Memory List -->
    <div
      class="flex-1 flex flex-col border-l border-slate-200/80 dark:border-slate-800/80 overflow-y-auto"
      :class="isDesktop ? 'max-w-xl' : 'w-full'"
    >
      <!-- Top Bar: Search & Sort Filters -->
      <div class="sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md p-4 border-b border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <div class="flex items-center gap-2">
          <!-- Search input -->
          <div class="relative flex-1">
            <Search class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="جست‌وجو در عنوان، متن، برچسب‌ها..."
              class="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 shadow-sm"
              @input="onSearchInput"
            />
          </div>

          <!-- Sort dropdown -->
          <select
            v-model="memoryStore.filter.sortBy"
            class="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none cursor-pointer shadow-sm"
          >
            <option value="newest">جدیدترین</option>
            <option value="oldest">قدیمی‌ترین</option>
            <option value="important">مهم‌ترین‌ها</option>
          </select>
        </div>

        <!-- Filter chips: Important, Has Photos, Has Voice -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1"
            :class="memoryStore.filter.isImportant ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'"
            @click="toggleImportantFilter"
          >
            <Star class="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>خاطرات مهم</span>
          </button>

          <button
            type="button"
            class="px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1"
            :class="memoryStore.filter.hasPhotos ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'"
            @click="togglePhotosFilter"
          >
            <ImageIcon class="w-3 h-3 text-indigo-500" />
            <span>دارای عکس</span>
          </button>

          <button
            type="button"
            class="px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1"
            :class="memoryStore.filter.hasVoice ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'"
            @click="toggleVoiceFilter"
          >
            <Mic class="w-3 h-3 text-rose-500" />
            <span>دارای ویس</span>
          </button>

          <button
            v-if="hasActiveFilter"
            type="button"
            class="px-2 py-1 text-slate-400 hover:text-slate-600 text-[11px] underline shrink-0"
            @click="clearFilters"
          >
            پاک کردن فیلترها
          </button>
        </div>
      </div>

      <!-- Flashback Banner (On this day in previous Jalali years) -->
      <div
        v-if="memoryStore.flashbackMemories.length > 0 && !hasActiveFilter"
        class="m-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200/80 dark:border-amber-900/60 space-y-2 shadow-sm"
      >
        <div class="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
          <Sparkles class="w-4 h-4 text-amber-500 shrink-0" />
          <span>چند سال پیش در چنین روزی...</span>
        </div>
        <p class="text-[11px] text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
          شما در این روز از سال‌های گذشته {{ toPersianDigits(memoryStore.flashbackMemories.length) }} خاطره ثبت کرده‌اید. برای یادآوری آن دوران نگاهی به آن بیندازید!
        </p>
      </div>

      <!-- Loading State -->
      <LoadingSpinner v-if="memoryStore.isLoading" text="در حال بارگذاری خاطرات شما..." />

      <!-- Empty State -->
      <EmptyState
        v-else-if="memoryStore.filteredMemories.length === 0"
        title="خاطره‌ای یافت نشد"
        :description="hasActiveFilter ? 'با فیلترهای انتخابی موردی پیدا نشد. فیلترها را بررسی کنید.' : 'هنوز خاطره‌ای ثبت نکرده‌اید. با فشردن دکمه ثبت خاطره، اولین برگ از دفترچه خاطراتت را بنویس!'"
      >
        <template #action>
          <router-link
            v-if="!hasActiveFilter"
            to="/new"
            class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            ثبت اولین خاطره
          </router-link>
        </template>
      </EmptyState>

      <!-- Vertical Timeline List -->
      <div v-else class="p-4 space-y-3.5 pb-24 md:pb-6">
        <MemoryCard
          v-for="memory in memoryStore.filteredMemories"
          :key="memory.id"
          :memory="memory"
          :is-selected="isTabletOrDesktop && memory.id === memoryStore.selectedMemoryId"
          @select="handleSelectMemory"
        />
      </div>
    </div>

    <!-- Right Side Detail Panel (Tablet / Desktop Split View) -->
    <div
      v-if="isTabletOrDesktop"
      class="flex-1 p-6 overflow-y-auto hidden md:block max-w-3xl"
    >
      <MemoryDetail :memory="memoryStore.selectedMemory" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  Star,
  Image as ImageIcon,
  Mic,
  Sparkles,
} from 'lucide-vue-next'
import { useMemoryStore } from '@/stores/memoryStore'
import { useDevice } from '@/composables/useDevice'
import { toPersianDigits } from '@/utils/format'
import MemoryCard from '@/components/memory/MemoryCard.vue'
import MemoryDetail from '@/components/memory/MemoryDetail.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()
const memoryStore = useMemoryStore()
const { isMobile, isDesktop, isTablet } = useDevice()

const searchQuery = ref(memoryStore.filter.query || '')

const isTabletOrDesktop = computed(() => isTablet.value || isDesktop.value)

const hasActiveFilter = computed(() => {
  return (
    !!memoryStore.filter.query ||
    !!memoryStore.filter.tag ||
    !!memoryStore.filter.person ||
    memoryStore.filter.isImportant !== undefined ||
    memoryStore.filter.hasPhotos ||
    memoryStore.filter.hasVoice
  )
})

function onSearchInput() {
  memoryStore.setFilter({ query: searchQuery.value })
}

function toggleImportantFilter() {
  var current = memoryStore.filter.isImportant
  memoryStore.setFilter({ isImportant: current ? undefined : true })
}

function togglePhotosFilter() {
  var current = memoryStore.filter.hasPhotos
  memoryStore.setFilter({ hasPhotos: !current })
}

function toggleVoiceFilter() {
  var current = memoryStore.filter.hasVoice
  memoryStore.setFilter({ hasVoice: !current })
}

function clearFilters() {
  searchQuery.value = ''
  memoryStore.resetFilter()
}

function handleSelectMemory(id: string) {
  memoryStore.selectMemory(id)
  if (isMobile.value) {
    router.push(`/memory/${id}`)
  }
}
</script>
