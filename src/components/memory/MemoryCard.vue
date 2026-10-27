<template>
  <div
    class="relative group rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-4 sm:p-5"
    :class="[
      isSelected
        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm',
    ]"
    @click="$emit('select', memory.id)"
  >
    <!-- Header with Date & Badges -->
    <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
      <div class="flex items-center gap-2 text-xs">
        <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
          <Calendar class="w-3.5 h-3.5 text-indigo-500" />
          <span>{{ formatJalaliFull(memory.date) }}</span>
        </span>

        <span v-if="memory.time" class="text-slate-400 text-[11px]">
          {{ toPersianDigits(memory.time) }}
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <Star
          v-if="memory.isImportant"
          class="w-4 h-4 fill-amber-400 text-amber-400 shrink-0"
        />

        <Lock
          v-if="memory.isLocked"
          class="w-3.5 h-3.5 text-rose-500 shrink-0"
        />

        <span
          v-if="relativeLabel"
          class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
        >
          {{ relativeLabel }}
        </span>
      </div>
    </div>

    <!-- Title -->
    <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
      {{ memory.title || 'خاطره بدون عنوان' }}
    </h3>

    <!-- Content Excerpt or Locked Mask -->
    <div v-if="memory.isLocked && !isUnlocked" class="py-3 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-500 flex items-center gap-2 my-2">
      <Lock class="w-4 h-4 text-slate-400" />
      <span>این خاطره قفل شده است. برای مشاهده روی آن کلیک کنید.</span>
    </div>
    <p v-else class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
      {{ excerpt }}
    </p>

    <!-- Thumbnail Photos Preview (if any) -->
    <div
      v-if="(!memory.isLocked || isUnlocked) && memory.photos && memory.photos.length > 0"
      class="flex items-center gap-2 mb-3 overflow-x-auto pb-1"
    >
      <div
        v-for="ph in memory.photos.slice(0, 4)"
        :key="ph.id"
        class="w-16 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800"
      >
        <img
          :src="ph.thumbnailUrl || ph.dataUrl"
          :alt="ph.name"
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div
        v-if="memory.photos.length > 4"
        class="w-10 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0 border border-slate-200 dark:border-slate-800"
      >
        +{{ toPersianDigits(memory.photos.length - 4) }}
      </div>
    </div>

    <!-- Footer: Tags, People, Location -->
    <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800/60 gap-2 flex-wrap">
      <div class="flex items-center gap-1.5 flex-wrap">
        <span
          v-for="t in memory.tags.slice(0, 3)"
          :key="t"
          class="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
        >
          #{{ t }}
        </span>

        <span
          v-for="p in memory.people.slice(0, 2)"
          :key="p"
          class="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
        >
          👤 {{ p }}
        </span>
      </div>

      <div class="flex items-center gap-2 text-slate-400 text-[11px]">
        <span v-if="memory.voice" class="flex items-center gap-1" title="دارای ویس">
          <Mic class="w-3.5 h-3.5 text-rose-500" />
        </span>
        <span v-if="memory.location" class="flex items-center gap-0.5 truncate max-w-[100px]">
          <MapPin class="w-3 h-3 text-slate-400 shrink-0" />
          <span class="truncate">{{ memory.location }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar, Star, Lock, MapPin, Mic } from 'lucide-vue-next'
import type { Memory } from '@/models/Memory'
import { formatJalaliFull, getRelativeDateLabel } from '@/utils/jalali'
import { toPersianDigits, extractExcerpt } from '@/utils/format'
import { useAuthStore } from '@/stores/authStore'

const props = defineProps<{
  memory: Memory
  isSelected?: boolean
}>()

defineEmits<{
  (e: 'select', id: string): void
}>()

const authStore = useAuthStore()

const isUnlocked = computed(() => {
  return authStore.isMemoryUnlocked(props.memory.id) || !props.memory.isLocked
})

const excerpt = computed(() => {
  return extractExcerpt(props.memory.content, 120) || 'بدون متن...'
})

const relativeLabel = computed(() => {
  return getRelativeDateLabel(props.memory.date)
})
</script>
