<template>
  <div class="max-w-7xl mx-auto p-4 sm:p-6 pb-28 md:pb-12 space-y-6">
    <!-- Header with controls -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Trees class="w-6 h-6 text-emerald-500" />
          <span>باغ خاطرات و درخت هفتگی</span>
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          هر خاطره در هفته یک میوه بر شاخه‌های درخت می‌نشاند؛ هر ماه ۴ درخت و هر سال یک باغ سرسبز و بارور پدید می‌آورد.
        </p>
      </div>

      <!-- Year Selector & Zoom Controls -->
      <div class="flex items-center gap-2">
        <!-- Year Select -->
        <select
          v-model="selectedYear"
          class="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none font-bold shadow-sm"
        >
          <option v-for="y in availableYears" :key="y" :value="y">
            باغ سال {{ toPersianDigits(y) }}
          </option>
        </select>

        <!-- Zoom Controls -->
        <div class="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 shadow-sm">
          <button
            type="button"
            class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="بزرگ‌نمایی (Zoom In)"
            @click="zoomIn"
          >
            <ZoomIn class="w-4 h-4" />
          </button>
          <span class="px-2 text-[11px] font-bold text-slate-500">
            {{ toPersianDigits(Math.round(zoomScale * 100)) }}٪
          </span>
          <button
            type="button"
            class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="کوچک‌نمایی (Zoom Out)"
            @click="zoomOut"
          >
            <ZoomOut class="w-4 h-4" />
          </button>
          <button
            type="button"
            class="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-[10px] font-semibold"
            title="بازنشانی اندازه"
            @click="resetZoom"
          >
            1x
          </button>
        </div>
      </div>
    </div>

    <!-- Garden Overview Stats Banner -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-4 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-900/60 space-y-1">
        <span class="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
          <Trees class="w-4 h-4 text-emerald-500" />
          <span>تعداد درخت‌ها:</span>
        </span>
        <div class="text-xl font-black text-emerald-900 dark:text-emerald-100">
          {{ toPersianDigits(totalTreesCount) }} درخت
        </div>
      </div>

      <div class="p-4 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-1">
        <span class="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
          <Apple class="w-4 h-4 text-amber-500" />
          <span>میوه‌های چیده‌شده:</span>
        </span>
        <div class="text-xl font-black text-amber-900 dark:text-amber-100">
          {{ toPersianDigits(totalFruitsCount) }} میوه
        </div>
      </div>

      <div class="p-4 rounded-3xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/30 border border-sky-200/80 dark:border-sky-900/60 space-y-1">
        <span class="text-[11px] font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1">
          <Sparkles class="w-4 h-4 text-sky-500" />
          <span>پربارترین ماه:</span>
        </span>
        <div class="text-sm font-bold text-sky-900 dark:text-sky-100 truncate">
          {{ mostProductiveMonthName || 'هنوز ثبت نشده' }}
        </div>
      </div>

      <div class="p-4 rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-1">
        <span class="text-[11px] font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1">
          <Sun class="w-4 h-4 text-purple-500" />
          <span>باغ سال:</span>
        </span>
        <div class="text-xl font-black text-purple-900 dark:text-purple-100">
          {{ toPersianDigits(selectedYear) }} خورشیدی
        </div>
      </div>
    </div>

    <!-- Zoomable Interactive Garden Container -->
    <div
      class="border border-slate-200 dark:border-slate-800 rounded-3xl bg-gradient-to-b from-emerald-50/20 via-slate-50 to-amber-50/20 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-4 sm:p-8 overflow-auto min-h-[500px] transition-colors relative"
    >
      <div
        class="transition-transform duration-200 origin-top-right mx-auto"
        :style="{ transform: `scale(${zoomScale})`, width: `${100 / zoomScale}%` }"
      >
        <!-- 12 Months of the Year (Each month has 4 trees) -->
        <div class="space-y-10">
          <div
            v-for="monthData in yearMonthsData"
            :key="monthData.monthNumber"
            class="space-y-4 p-5 rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800 shadow-sm"
          >
            <!-- Month Header -->
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h3 class="text-base font-extrabold text-slate-800 dark:text-slate-100">
                  ماه {{ monthData.monthName }} ({{ toPersianDigits(monthData.monthNumber) }})
                </h3>
              </div>

              <span class="text-xs font-bold text-slate-500 dark:text-slate-400">
                {{ toPersianDigits(monthData.totalMemories) }} خاطره در این ماه
              </span>
            </div>

            <!-- 4 Trees Grid (One for each week of the month) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                v-for="weekTree in monthData.weeks"
                :key="weekTree.weekIndex"
                class="rounded-2xl border p-4 flex flex-col items-center justify-between min-h-[220px] transition-all relative overflow-hidden"
                :class="[
                  weekTree.memories.length > 0
                    ? 'border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900 shadow-sm'
                    : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 opacity-70',
                ]"
              >
                <!-- Week Label -->
                <div class="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                  <span>هفته {{ toPersianDigits(weekTree.weekIndex) }}</span>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px]"
                    :class="weekTree.memories.length > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'"
                  >
                    {{ toPersianDigits(weekTree.memories.length) }} میوه
                  </span>
                </div>

                <!-- Tree SVG Graphic with Interactive Fruits -->
                <div class="relative w-36 h-36 flex items-center justify-center my-2">
                  <!-- Tree Leaves Canopy SVG -->
                  <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-sm select-none">
                    <!-- Tree Trunk -->
                    <path
                      d="M 44,70 L 46,95 L 54,95 L 56,70 Z"
                      class="fill-amber-800 dark:fill-amber-900"
                    />
                    <!-- Branches -->
                    <path
                      d="M 50,65 Q 40,55 30,50 M 50,65 Q 60,55 70,50 M 50,55 L 50,35"
                      stroke="#854d0e"
                      stroke-width="3"
                      stroke-linecap="round"
                      fill="none"
                    />
                    <!-- Foliage Clouds -->
                    <circle cx="50" cy="40" r="26" :class="weekTree.memories.length > 0 ? 'fill-emerald-500/80 dark:fill-emerald-600/80' : 'fill-slate-300 dark:fill-slate-700'" />
                    <circle cx="35" cy="46" r="18" :class="weekTree.memories.length > 0 ? 'fill-emerald-600/90 dark:fill-emerald-700/90' : 'fill-slate-300 dark:fill-slate-700'" />
                    <circle cx="65" cy="46" r="18" :class="weekTree.memories.length > 0 ? 'fill-emerald-600/90 dark:fill-emerald-700/90' : 'fill-slate-300 dark:fill-slate-700'" />
                    <circle cx="50" cy="28" r="16" :class="weekTree.memories.length > 0 ? 'fill-emerald-400 dark:fill-emerald-500' : 'fill-slate-300 dark:fill-slate-700'" />
                  </svg>

                  <!-- Fruit Icons on Tree -->
                  <div class="absolute inset-0 pointer-events-auto">
                    <button
                      v-for="(fruit, fIdx) in weekTree.memories.slice(0, 7)"
                      :key="fruit.id"
                      type="button"
                      class="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md transition-transform hover:scale-125 z-10 cursor-pointer"
                      :style="getFruitPosition(fIdx)"
                      :class="getFruitColor(fruit)"
                      :title="`${fruit.title || 'خاطره'}: ${formatJalaliFull(fruit.date)}`"
                      @click="openMemoryDetail(fruit.id)"
                    >
                      <span>{{ getFruitEmoji(fruit) }}</span>
                    </button>

                    <!-- Extra fruits overflow badge -->
                    <div
                      v-if="weekTree.memories.length > 7"
                      class="absolute bottom-2 left-2 bg-amber-500 text-white font-extrabold text-[9px] rounded-full px-1.5 py-0.5 shadow-sm"
                    >
                      +{{ toPersianDigits(weekTree.memories.length - 7) }}
                    </div>
                  </div>
                </div>

                <!-- Footer Summary of the Week -->
                <div class="w-full text-center text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {{ weekTree.memories.length > 0 ? `درخت شکوفا شده با ${toPersianDigits(weekTree.memories.length)} خاطره` : 'هنوز میوه‌ای نروییده' }}
                </div>
              </div>
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
import {
  Trees,
  Apple,
  Sparkles,
  Sun,
  ZoomIn,
  ZoomOut,
} from 'lucide-vue-next'
import { useMemoryStore } from '@/stores/memoryStore'
import { toPersianDigits } from '@/utils/format'
import { getTodayJalali, isoToJalali, JALALI_MONTH_NAMES, formatJalaliFull } from '@/utils/jalali'
import { MOOD_DEFINITIONS, type Memory } from '@/models/Memory'

const router = useRouter()
const memoryStore = useMemoryStore()

const todayJalali = getTodayJalali()
const selectedYear = ref(todayJalali.jy)
const zoomScale = ref(1)

function zoomIn() {
  if (zoomScale.value < 1.8) {
    zoomScale.value = Math.round((zoomScale.value + 0.15) * 100) / 100
  }
}

function zoomOut() {
  if (zoomScale.value > 0.5) {
    zoomScale.value = Math.round((zoomScale.value - 0.15) * 100) / 100
  }
}

function resetZoom() {
  zoomScale.value = 1
}

const availableYears = computed(() => {
  var years = new Set<number>()
  years.add(todayJalali.jy)
  memoryStore.memories.forEach((m) => {
    var j = isoToJalali(m.date)
    years.add(j.jy)
  })
  return Array.from(years).sort((a, b) => b - a)
})

interface WeekTreeData {
  weekIndex: number // 1 to 4
  memories: Memory[]
}

interface MonthGardenData {
  monthNumber: number // 1 to 12
  monthName: string
  totalMemories: number
  weeks: WeekTreeData[]
}

const yearMonthsData = computed<MonthGardenData[]>(() => {
  var result: MonthGardenData[] = []

  for (var m = 1; m <= 12; m++) {
    var monthMemories = memoryStore.memories.filter((mem) => {
      var j = isoToJalali(mem.date)
      return j.jy === selectedYear.value && j.jm === m
    })

    // 4 weeks per month: 1-7, 8-14, 15-21, 22-end
    var w1: Memory[] = []
    var w2: Memory[] = []
    var w3: Memory[] = []
    var w4: Memory[] = []

    monthMemories.forEach((mem) => {
      var j = isoToJalali(mem.date)
      if (j.jd <= 7) w1.push(mem)
      else if (j.jd <= 14) w2.push(mem)
      else if (j.jd <= 21) w3.push(mem)
      else w4.push(mem)
    })

    result.push({
      monthNumber: m,
      monthName: JALALI_MONTH_NAMES[m - 1],
      totalMemories: monthMemories.length,
      weeks: [
        { weekIndex: 1, memories: w1 },
        { weekIndex: 2, memories: w2 },
        { weekIndex: 3, memories: w3 },
        { weekIndex: 4, memories: w4 },
      ],
    })
  }

  return result
})

const totalTreesCount = computed(() => 12 * 4) // 48 trees in a year garden

const totalFruitsCount = computed(() => {
  return yearMonthsData.value.reduce((acc, m) => acc + m.totalMemories, 0)
})

const mostProductiveMonthName = computed(() => {
  var max = -1
  var name = ''
  yearMonthsData.value.forEach((m) => {
    if (m.totalMemories > max && m.totalMemories > 0) {
      max = m.totalMemories
      name = `${m.monthName} (${toPersianDigits(max)} میوه)`
    }
  })
  return name
})

// Pre-defined visual positions for fruits on tree foliage
const FRUIT_POSITIONS = [
  { top: '30%', left: '50%' },
  { top: '45%', left: '32%' },
  { top: '42%', left: '68%' },
  { top: '22%', left: '38%' },
  { top: '24%', left: '62%' },
  { top: '56%', left: '46%' },
  { top: '36%', left: '52%' },
]

function getFruitPosition(idx: number) {
  var pos = FRUIT_POSITIONS[idx % FRUIT_POSITIONS.length]
  return { top: pos.top, left: pos.left }
}

function getFruitColor(memory: Memory): string {
  if (memory.mood) {
    var m = MOOD_DEFINITIONS.find((x) => x.id === memory.mood)
    if (m) return `${m.bgColor} ${m.borderColor} border`
  }
  return 'bg-amber-400 text-amber-950 border border-amber-300'
}

function getFruitEmoji(memory: Memory): string {
  if (memory.mood) {
    var m = MOOD_DEFINITIONS.find((x) => x.id === memory.mood)
    if (m) return m.emoji
  }
  return '🍎'
}

function openMemoryDetail(id: string) {
  memoryStore.selectMemory(id)
  router.push(`/memory/${id}`)
}
</script>
