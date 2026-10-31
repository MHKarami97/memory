<template>
  <div class="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 space-y-3 transition-colors">
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1">
        <div class="flex items-center gap-2 flex-wrap">
          <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ model.name }}</h4>
          <span
            v-if="isDefault"
            class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
          >
            پیش‌فرض
          </span>
          <span
            v-if="model.isDownloaded"
            class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1"
          >
            <Check class="w-3 h-3" />
            <span>آماده استفاده آفلاین</span>
          </span>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{{ model.description }}</p>
      </div>
      <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
        حدود {{ toPersianDigits(model.approxSizeMb) }} مگابایت
      </span>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
      <div>
        <span class="text-slate-400 block">سرعت:</span>
        <span class="font-semibold">{{ model.speedRating }}</span>
      </div>
      <div>
        <span class="text-slate-400 block">زبان فارسی:</span>
        <span class="font-semibold">{{ model.persianSupport }}</span>
      </div>
      <div>
        <span class="text-slate-400 block">مصرف رم:</span>
        <span class="font-semibold">حدود {{ toPersianDigits(model.ramUsageMb) }}MB</span>
      </div>
      <div>
        <span class="text-slate-400 block">مناسب برای:</span>
        <span class="font-semibold">{{ model.recommendedFor }}</span>
      </div>
    </div>

    <div v-if="isDownloading" class="space-y-2 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
      <div class="flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
        <span class="truncate">{{ statusText }}</span>
        <span class="font-bold shrink-0 mr-2">{{ toPersianDigits(progress) }}٪</span>
      </div>
      <div class="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div class="h-full bg-indigo-600 rounded-full transition-all duration-300" :style="{ width: `${progress}%` }"></div>
      </div>
    </div>

    <div class="flex items-center justify-between gap-2 flex-wrap">
      <div class="flex items-center gap-2">
        <button
          v-if="!model.isDownloaded && !isDownloading"
          type="button"
          class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          @click="startDownload"
        >
          <DownloadCloud class="w-3.5 h-3.5" />
          <span>دانلود مدل</span>
        </button>

        <button
          v-if="model.isDownloaded && !isDefault"
          type="button"
          class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
          @click="$emit('setDefault', model.id)"
        >
          انتخاب به عنوان پیش‌فرض
        </button>
      </div>

      <button
        v-if="model.isDownloaded"
        type="button"
        class="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-medium transition-colors"
        @click="$emit('delete', model.id)"
      >
        <Trash2 class="w-3.5 h-3.5" />
        <span>حذف مدل</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Check, DownloadCloud, Trash2 } from 'lucide-vue-next'
import type { LocalTextModel } from '@/models/TextModel'
import { localTextModelService } from '@/services/textmodel/LocalTextModelService'
import { toPersianDigits } from '@/utils/format'

const props = defineProps<{
  model: LocalTextModel
  isDefault?: boolean
}>()

const emit = defineEmits<{
  (e: 'downloaded', modelId: string): void
  (e: 'setDefault', modelId: string): void
  (e: 'delete', modelId: string): void
}>()

const isDownloading = ref(false)
const progress = ref(0)
const statusText = ref('')

async function startDownload() {
  isDownloading.value = true
  progress.value = 0
  statusText.value = 'در حال برقراری ارتباط...'

  try {
    await localTextModelService.downloadModel(props.model.id, (info) => {
      progress.value = info.percent
      statusText.value = info.message || ''
    })
    emit('downloaded', props.model.id)
  } catch (error) {
    alert('خطا در دانلود مدل: ' + (error instanceof Error ? error.message : String(error)))
  } finally {
    isDownloading.value = false
  }
}
</script>
