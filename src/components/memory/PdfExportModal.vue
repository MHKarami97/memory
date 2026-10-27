<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      @click.self="$emit('close')"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <FileDown class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">خروجی PDF خاطره</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ساخت فایل استاندارد، فارسی و RTL کاملاً سمت کاربر</p>
          </div>
        </div>

        <!-- Options -->
        <div class="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <label class="flex items-center justify-between text-xs font-medium cursor-pointer">
            <span class="text-slate-700 dark:text-slate-300">گنجاندن عکس‌ها در فایل PDF</span>
            <input
              v-model="includePhotos"
              type="checkbox"
              class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
          </label>

          <p class="text-[11px] text-slate-400 leading-relaxed">
            هیچ داده‌ای به سرور ارسال نمی‌شود و PDF مستقیماً روی مرورگر شما ساخته خواهد شد.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            class="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            :disabled="isGenerating"
            @click="$emit('close')"
          >
            انصراف
          </button>

          <button
            type="button"
            class="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            :disabled="isGenerating"
            @click="generateAndExport"
          >
            <div v-if="isGenerating" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <Share2 v-else class="w-3.5 h-3.5" />
            <span>{{ isGenerating ? 'در حال ساخت PDF...' : 'دانلود و اشتراک' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FileDown, Share2 } from 'lucide-vue-next'
import type { Memory } from '@/models/Memory'
import { pdfExportService } from '@/services/PdfExportService'
import { formatJalaliShort } from '@/utils/jalali'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  memory: Memory
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { showToast } = useToast()
const includePhotos = ref(true)
const isGenerating = ref(false)

async function generateAndExport() {
  isGenerating.value = true
  try {
    var blob = await pdfExportService.exportMemoryToPdf(props.memory, {
      includePhotos: includePhotos.value,
    })

    var safeTitle = (props.memory.title || 'خاطره').replace(/[\\/:*?"<>|]/g, '')
    var dateShort = formatJalaliShort(props.memory.date).replace(/\//g, '-')
    var filename = `${safeTitle}_${dateShort}.pdf`

    await pdfExportService.shareOrDownloadPdf(blob, filename)
    showToast({ type: 'success', message: 'فایل PDF با موفقیت آماده شد.' })
    emit('close')
  } catch (err: any) {
    showToast({ type: 'error', message: 'خطا در ساخت PDF: ' + err.message })
  } finally {
    isGenerating.value = false
  }
}
</script>
