<template>
  <div class="max-w-6xl mx-auto p-4 sm:p-6 pb-24 md:pb-12 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CalendarIcon class="w-6 h-6 text-indigo-500" />
          <span>تقویم شمسی خاطرات</span>
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          مشاهده و مرور روز به روز خاطرات در گاه‌شمار خورشیدی
        </p>
      </div>

      <router-link
        to="/new"
        class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
      >
        <Plus class="w-4 h-4" />
        <span>ثبت خاطره جدید</span>
      </router-link>
    </div>

    <!-- Responsive Layout: 2 Columns on Desktop, Stacked on Mobile -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left Column: Shamsi Calendar (lg: col-span-7) -->
      <div class="lg:col-span-7 space-y-4">
        <ShamsiCalendar
          v-model="selectedDate"
          @select-date="onDateSelected"
        />
      </div>

      <!-- Right Column: Memories of Selected Day (lg: col-span-5) -->
      <div class="lg:col-span-5 space-y-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 transition-colors">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">
                خاطرات {{ formatJalaliFull(selectedDate) }}
              </h3>
              <span class="text-[11px] text-slate-500 dark:text-slate-400">
                {{ toPersianDigits(dayMemories.length) }} خاطره ثبت شده
              </span>
            </div>

            <router-link
              to="/new"
              class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>ثبت برای این روز</span>
            </router-link>
          </div>

          <!-- Empty state for day -->
          <div v-if="dayMemories.length === 0" class="py-8 text-center text-xs text-slate-400 space-y-3">
            <BookOpen class="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p>در این روز خاطره‌ای ثبت نکرده‌اید.</p>
          </div>

          <!-- List of Day Memories -->
          <div v-else class="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            <MemoryCard
              v-for="m in dayMemories"
              :key="m.id"
              :memory="m"
              @select="goToMemory(m.id)"
            />
          </div>
        </div>

        <!-- چنین روزی: خاطرات سال‌های گذشته در همین روز -->
        <div
          v-if="pastYearsSameDayMemories.length > 0"
          class="bg-gradient-to-br from-amber-50/70 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-3xl p-5 space-y-4 shadow-sm transition-colors"
        >
          <div class="flex items-center justify-between border-b border-amber-200/60 dark:border-amber-900/40 pb-3">
            <div class="flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <h3 class="text-sm font-bold text-amber-900 dark:text-amber-200">
                  چنین روزی در سال‌های پیش
                </h3>
                <span class="text-[11px] text-amber-700/80 dark:text-amber-400">
                  {{ toPersianDigits(pastYearsSameDayMemories.length) }} خاطره از سال‌های گذشته در همین تاریخ
                </span>
              </div>
            </div>
          </div>

          <div class="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            <div
              v-for="m in pastYearsSameDayMemories"
              :key="m.id"
              class="relative"
            >
              <div class="text-[10px] font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1">
                <span>⏳ {{ toPersianDigits(getYearsDifference(m.date)) }} سال پیش:</span>
              </div>
              <MemoryCard
                :memory="m"
                @select="goToMemory(m.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar as CalendarIcon, Plus, BookOpen, Sparkles } from 'lucide-vue-next'
import { useMemoryStore } from '@/stores/memoryStore'
import { getTodayIso, formatJalaliFull, isoToJalali } from '@/utils/jalali'
import { toPersianDigits } from '@/utils/format'
import ShamsiCalendar from '@/components/calendar/ShamsiCalendar.vue'
import MemoryCard from '@/components/memory/MemoryCard.vue'

const router = useRouter()
const memoryStore = useMemoryStore()
const selectedDate = ref(getTodayIso())

const dayMemories = computed(() => {
  return memoryStore.memories.filter(
    (m) => m.date.slice(0, 10) === selectedDate.value.slice(0, 10)
  )
})

// خاطرات سال‌های پیش در همین روز و ماه شمسی
const pastYearsSameDayMemories = computed(() => {
  var selectedJalali = isoToJalali(selectedDate.value)
  return memoryStore.memories.filter((m) => {
    var j = isoToJalali(m.date)
    return j.jm === selectedJalali.jm && j.jd === selectedJalali.jd && j.jy < selectedJalali.jy
  })
})

function getYearsDifference(isoDate: string): number {
  var target = isoToJalali(isoDate)
  var sel = isoToJalali(selectedDate.value)
  return sel.jy - target.jy
}

function onDateSelected(date: string) {
  selectedDate.value = date
}

function goToMemory(id: string) {
  memoryStore.selectMemory(id)
  router.push(`/memory/${id}`)
}
</script>
