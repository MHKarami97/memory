<template>
  <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 transition-colors">
    <!-- Calendar Navigation Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">
          {{ formatJalaliMonthYear(currentJy, currentJm) }}
        </h2>
        <button
          type="button"
          class="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors"
          @click="goToToday"
        >
          امروز
        </button>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="ماه قبل"
          @click="prevMonth"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="ماه بعد"
          @click="nextMonth"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Weekday Labels (Shanbeh to Jomeh) -->
    <div class="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 py-1 border-b border-slate-100 dark:border-slate-800">
      <div v-for="wd in PERSIAN_WEEKDAYS_ORDERED" :key="wd" class="py-1">
        {{ wd.slice(0, 3) }}
      </div>
    </div>

    <!-- Calendar Days Grid -->
    <div class="grid grid-cols-7 gap-1.5 text-center">
      <div
        v-for="cell in calendarDays"
        :key="cell.isoDate"
        class="relative min-h-[52px] sm:min-h-[64px] p-1.5 rounded-2xl flex flex-col items-center justify-between cursor-pointer transition-all border"
        :class="[
          cell.isoDate === selectedDate
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
            : cell.isCurrentMonth
            ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
            : 'bg-transparent border-transparent text-slate-400/60 dark:text-slate-600',
          cell.isToday && cell.isoDate !== selectedDate ? 'border-indigo-500/80 font-black' : '',
        ]"
        @click="selectDate(cell.isoDate)"
      >
        <!-- Day Number -->
        <span
          class="text-xs sm:text-sm font-semibold"
          :class="cell.isToday && cell.isoDate !== selectedDate ? 'text-indigo-600 dark:text-indigo-400' : ''"
        >
          {{ toPersianDigits(cell.jd) }}
        </span>

        <!-- Memory Indicator Count Dot / Badge -->
        <div v-if="getMemoriesCountForDate(cell.isoDate) > 0" class="flex items-center gap-1">
          <span
            class="px-1.5 py-0.2 rounded-full text-[9px] font-bold"
            :class="cell.isoDate === selectedDate ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white'"
          >
            {{ toPersianDigits(getMemoriesCountForDate(cell.isoDate)) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronRight, ChevronLeft } from 'lucide-vue-next'
import {
  getTodayJalali,
  getMonthCalendarGrid,
  formatJalaliMonthYear,
  PERSIAN_WEEKDAYS_ORDERED,
  getTodayIso,
} from '@/utils/jalali'
import { toPersianDigits } from '@/utils/format'
import { useMemoryStore } from '@/stores/memoryStore'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', date: string): void
  (e: 'selectDate', date: string): void
}>()

const memoryStore = useMemoryStore()
const today = getTodayJalali()
const currentJy = ref(today.jy)
const currentJm = ref(today.jm)

const selectedDate = computed({
  get: () => props.modelValue || getTodayIso(),
  set: (val: string) => emit('update:modelValue', val),
})

const calendarDays = computed(() => {
  return getMonthCalendarGrid(currentJy.value, currentJm.value)
})

function prevMonth() {
  if (currentJm.value === 1) {
    currentJy.value--
    currentJm.value = 12
  } else {
    currentJm.value--
  }
}

function nextMonth() {
  if (currentJm.value === 12) {
    currentJy.value++
    currentJm.value = 1
  } else {
    currentJm.value++
  }
}

function goToToday() {
  var t = getTodayJalali()
  currentJy.value = t.jy
  currentJm.value = t.jm
  selectDate(getTodayIso())
}

function selectDate(isoDate: string) {
  selectedDate.value = isoDate
  emit('selectDate', isoDate)
}

function getMemoriesCountForDate(isoDate: string): number {
  return memoryStore.memories.filter((m) => m.date.slice(0, 10) === isoDate.slice(0, 10)).length
}
</script>
