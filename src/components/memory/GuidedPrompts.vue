<template>
  <div class="rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20 p-3.5 space-y-2.5 transition-colors">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Sparkles class="w-4 h-4 text-amber-500" />
        <span class="text-xs font-bold text-slate-800 dark:text-slate-200">
          نمی‌دانی چه بنویسی؟ از این پرسش‌ها ایده بگیر:
        </span>
      </div>

      <button
        type="button"
        class="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
        @click="shufflePrompts"
      >
        <RotateCw class="w-3 h-3" />
        <span>پرسش‌های دیگر</span>
      </button>
    </div>

    <!-- Chips / Prompts -->
    <div class="flex items-center gap-2 flex-wrap">
      <button
        v-for="p in visiblePrompts"
        :key="p"
        type="button"
        class="text-right px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm transition-all text-[11px] font-medium"
        @click="insertPrompt(p)"
      >
        💡 {{ p }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Sparkles, RotateCw } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'select-prompt', prompt: string): void
}>()

const ALL_PROMPTS = [
  'بهترین اتفاق یا لحظه‌ای که امروز لبخند روی لبت آورد چی بود؟',
  'امروز چه چالش یا درسی داشتی که باعث رشدت شد؟',
  'بابت کدام اتفاق یا حضور چه کسی امروز سپاسگزاری؟',
  'امروز چه گفت‌وگو یا دیداری با دیگران داشتی که در ذهنت مانده؟',
  'اگر امروز یک عنوان فیلم بود، اسمش را چی می‌گذاشتی؟',
  'امروز برای آینده یا هدف مهمت چه قدم کوچکی برداشتی؟',
  'حال درونی و ذهنی‌ات در طول روز چطور گذشت؟',
  'یک چیز جدید که امروز متوجه شدی یا یاد گرفتی چی بود؟',
  'امروز هوای شهرت یا غذایی که خوردی چطور بود؟',
  'چه چیزی امروز در دلت هست که می‌خواهی همین الان روی کاغذ بیاوری؟',
  'امروز از چه چیزی شگفت‌زده شدی یا تعجب کردی؟',
  'برای فردا چه برنامه‌ای داری تا روز بهتری بسازی؟',
]

const currentIndex = ref(0)
const pageSize = 3

const visiblePrompts = computed(() => {
  return ALL_PROMPTS.slice(currentIndex.value, currentIndex.value + pageSize)
})

function shufflePrompts() {
  var next = currentIndex.value + pageSize
  if (next >= ALL_PROMPTS.length) {
    currentIndex.value = 0
  } else {
    currentIndex.value = next
  }
}

function insertPrompt(prompt: string) {
  emit('select-prompt', prompt)
}
</script>
