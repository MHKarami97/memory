<template>
  <div class="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 space-y-4 transition-colors">
    <!-- Header -->
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

      <div class="text-left shrink-0">
        <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{{ toPersianDigits(model.approxSizeMb) }} مگابایت</span>
      </div>
    </div>

    <!-- Specs Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
      <div>
        <span class="text-slate-400 block">سرعت پردازش:</span>
        <span class="font-semibold">{{ model.speedRating }}</span>
      </div>
      <div>
        <span class="text-slate-400 block">کیفیت فارسی:</span>
        <span class="font-semibold">{{ model.qualityRating }}</span>
      </div>
      <div>
        <span class="text-slate-400 block">مصرف رم:</span>
        <span class="font-semibold">حدود {{ toPersianDigits(model.ramUsageMb) }}MB</span>
      </div>
      <div>
        <span class="text-slate-400 block">توصیه شده برای:</span>
        <span class="font-semibold truncate block">{{ model.recommendedFor }}</span>
      </div>
    </div>

    <!-- Download Progress Bar -->
    <div v-if="isDownloading" class="space-y-1.5">
      <div class="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
        <span>در حال دانلود مدل محلی روی دستگاه...</span>
        <span>{{ toPersianDigits(downloadProgress) }}٪</span>
      </div>
      <div class="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          class="h-full bg-indigo-600 rounded-full transition-all duration-200"
          :style="{ width: `${downloadProgress}%` }"
        ></div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between gap-2 pt-1 flex-wrap">
      <div class="flex items-center gap-2">
        <button
          v-if="!model.isDownloaded && !isDownloading"
          type="button"
          class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          @click="startDownload"
        >
          <DownloadCloud class="w-3.5 h-3.5" />
          <span>دانلود مدل ({{ toPersianDigits(model.approxSizeMb) }}MB)</span>
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
        <span>حذف مدل و آزادسازی فضا</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Check, DownloadCloud, Trash2 } from 'lucide-vue-next'
import type { LocalSpeechModel } from '@/models/SpeechModel'
import { toPersianDigits } from '@/utils/format'
import { speechRecognitionService } from '@/services/SpeechRecognitionService'

const props = defineProps<{
  model: LocalSpeechModel
  isDefault?: boolean
}>()

const emit = defineEmits<{
  (e: 'downloaded', modelId: string): void
  (e: 'setDefault', modelId: string): void
  (e: 'delete', modelId: string): void
}>()

const isDownloading = ref(false)
const downloadProgress = ref(0)

async function startDownload() {
  isDownloading.value = true
  downloadProgress.value = 0
  try {
    await speechRecognitionService.downloadModel(props.model.id, (p) => {
      downloadProgress.value = p
    })
    emit('downloaded', props.model.id)
  } catch (err: any) {
    alert('خطا در دانلود مدل: ' + err.message)
  } finally {
    isDownloading.value = false
  }
}
</script>
