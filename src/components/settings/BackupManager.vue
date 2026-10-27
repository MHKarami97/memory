<template>
  <div class="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 space-y-6 transition-colors">
    <div>
      <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Database class="w-4 h-4 text-indigo-500" />
        <span>پشتیبان‌گیری و بازیابی رمزگذاری‌شده</span>
      </h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
        پشتیبان شامل متن خاطرات، برچسب‌ها، تنظیمات و تمام تصاویر است. فایل با استاندارد AES-GCM و PBKDF2 رمزگذاری می‌شود.
      </p>
    </div>

    <!-- Actions Section -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Create Backup Card -->
      <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
        <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <DownloadCloud class="w-4 h-4 text-indigo-600" />
          <span>تهیه فایل پشتیبان (Backup)</span>
        </h4>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          برای خروجی گرفتن، یک رمز امن تعیین کنید. این رمز برای بازیابی مجدد فایل الزامی است.
        </p>

        <div class="space-y-2">
          <input
            v-model="backupPassword"
            type="password"
            placeholder="رمز عبور فایل پشتیبان (حداقل ۴ نویسه)"
            class="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none text-slate-900 dark:text-slate-100"
          />

          <button
            type="button"
            :disabled="backupPassword.length < 4 || isCreatingBackup"
            class="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            @click="handleCreateBackup"
          >
            <Lock class="w-3.5 h-3.5" />
            <span>{{ isCreatingBackup ? 'در حال رمزنگاری...' : 'دانلود فایل پشتیبان رمزگذاری‌شده' }}</span>
          </button>
        </div>
      </div>

      <!-- Restore Backup Card -->
      <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
        <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <UploadCloud class="w-4 h-4 text-emerald-600" />
          <span>بازیابی فایل پشتیبان (Restore)</span>
        </h4>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          فایل پشتیبان را انتخاب کنید تا پیش‌نمایش و تعداد خاطرات به شما نمایش داده شود.
        </p>

        <input
          ref="fileInputRef"
          type="file"
          accept=".json,.khatereh"
          class="hidden"
          @change="onFileSelected"
        />

        <button
          type="button"
          class="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          @click="fileInputRef?.click()"
        >
          <FolderOpen class="w-3.5 h-3.5" />
          <span>انتخاب فایل پشتیبان از دستگاه</span>
        </button>
      </div>
    </div>

    <!-- Plain JSON Export with Security Warning -->
    <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
      <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <AlertTriangle class="w-4 h-4 text-amber-500 shrink-0" />
        <span>خروجی متنی JSON ساده (بدون رمزنگاری - با احتیاط استفاده شود)</span>
      </div>

      <button
        type="button"
        class="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
        @click="handlePlainExport"
      >
        دانلود JSON خام
      </button>
    </div>

    <!-- Restore Preview Modal -->
    <Teleport to="body">
      <div
        v-if="isPreviewModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      >
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Eye class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">پیش‌نمایش اطلاعات فایل پشتیبان</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">مشخصات فایل قبل از اعمال بررسی شد.</p>
            </div>
          </div>

          <!-- Preview Info Card -->
          <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
            <div class="flex justify-between">
              <span class="text-slate-500">نوع فایل:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">{{ previewData?.isEncrypted ? 'رمزگذاری‌شده (AES-GCM)' : 'متن ساده JSON' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">تعداد تقریبی خاطرات:</span>
              <span class="font-bold text-indigo-600 dark:text-indigo-400">{{ toPersianDigits(previewData?.memoriesCount) }} خاطره</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">تاریخ ساخت بکاپ:</span>
              <span class="font-medium text-slate-700 dark:text-slate-300">{{ formatJalaliFull(previewData?.exportedAt || '') }}</span>
            </div>
          </div>

          <!-- Password Prompt for Encrypted Backup -->
          <div v-if="previewData?.isEncrypted" class="space-y-2">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300">رمز عبور فایل پشتیبان را وارد کنید:</label>
            <input
              v-model="restorePassword"
              type="password"
              placeholder="رمز تعیین‌شده هنگام تهیه بکاپ"
              class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
            />
            <p v-if="restoreError" class="text-xs text-rose-500 font-medium">{{ restoreError }}</p>
          </div>

          <!-- Restore Mode Option -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300">روش بازیابی داده‌ها:</label>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <label class="flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer" :class="restoreMode === 'merge' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-800'">
                <input v-model="restoreMode" type="radio" value="merge" class="text-indigo-600" />
                <span class="font-semibold text-slate-800 dark:text-slate-200">ادغام با خاطرات فعلی</span>
              </label>

              <label class="flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer" :class="restoreMode === 'replace' ? 'border-rose-600 bg-rose-50/50 dark:bg-rose-950/30' : 'border-slate-200 dark:border-slate-800'">
                <input v-model="restoreMode" type="radio" value="replace" class="text-rose-600" />
                <span class="font-semibold text-rose-600 dark:text-rose-400">جایگزینی کامل همه داده‌ها</span>
              </label>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              @click="closePreview"
            >
              انصراف
            </button>

            <button
              type="button"
              :disabled="isRestoring || (previewData?.isEncrypted && !restorePassword)"
              class="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              @click="executeRestore"
            >
              <div v-if="isRestoring" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{{ isRestoring ? 'در حال بازیابی...' : 'تأیید و بازیابی خاطرات' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Database,
  DownloadCloud,
  UploadCloud,
  FolderOpen,
  Lock,
  AlertTriangle,
  Eye,
} from 'lucide-vue-next'
import { backupService, type BackupPreview } from '@/services/BackupService'
import { useMemoryStore } from '@/stores/memoryStore'
import { useToast } from '@/composables/useToast'
import { toPersianDigits } from '@/utils/format'
import { formatJalaliFull } from '@/utils/jalali'

const memoryStore = useMemoryStore()
const { showToast } = useToast()

const backupPassword = ref('')
const isCreatingBackup = ref(false)

const fileInputRef = ref<HTMLInputElement | null>(null)
const isPreviewModalOpen = ref(false)
const selectedFileContent = ref('')
const previewData = ref<BackupPreview | null>(null)
const restorePassword = ref('')
const restoreMode = ref<'merge' | 'replace'>('merge')
const isRestoring = ref(false)
const restoreError = ref('')

async function handleCreateBackup() {
  if (backupPassword.value.length < 4) return
  isCreatingBackup.value = true
  try {
    var blob = await backupService.createEncryptedBackup(backupPassword.value)
    var dateShort = new Date().toISOString().slice(0, 10)
    backupService.downloadBlob(blob, `khatereh_backup_${dateShort}.khatereh`)
    showToast({ type: 'success', message: 'فایل پشتیبان رمزگذاری‌شده با موفقیت ساخته شد.' })
    backupPassword.value = ''
  } catch (err: any) {
    showToast({ type: 'error', message: 'خطا در ایجاد پشتیبان: ' + err.message })
  } finally {
    isCreatingBackup.value = false
  }
}

async function handlePlainExport() {
  if (confirm('هشدار امنیتی: این فایل بدون رمزنگاری است و هر فردی می‌تواند متن خاطرات شما را بخواند. آیا ادامه می‌دهید؟')) {
    var blob = await backupService.createPlainBackup()
    var dateShort = new Date().toISOString().slice(0, 10)
    backupService.downloadBlob(blob, `khatereh_unencrypted_${dateShort}.json`)
    showToast({ type: 'info', message: 'خروجی بدون رمزنگاری دانلود شد.' })
  }
}

async function onFileSelected(e: Event) {
  var target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  var file = target.files[0]

  var text = await file.text()
  selectedFileContent.value = text

  var preview = await backupService.inspectBackupFile(text)
  if (!preview.isValid) {
    showToast({ type: 'error', message: preview.errorMessage || 'فایل نامعتبر است.' })
    target.value = ''
    return
  }

  previewData.value = preview
  restorePassword.value = ''
  restoreError.value = ''
  isPreviewModalOpen.value = true
  target.value = ''
}

function closePreview() {
  isPreviewModalOpen.value = false
  previewData.value = null
  selectedFileContent.value = ''
  restorePassword.value = ''
  restoreError.value = ''
}

async function executeRestore() {
  if (!previewData.value) return
  isRestoring.value = true
  restoreError.value = ''

  try {
    var payload = previewData.value.payload
    if (previewData.value.isEncrypted) {
      payload = await backupService.decryptAndLoadBackup(
        selectedFileContent.value,
        restorePassword.value
      )
    }

    if (!payload) throw new Error('محتوای پشتیبان در دسترس نیست.')

    var { restoredCount } = await backupService.restoreBackup(payload, restoreMode.value)
    await memoryStore.loadMemories()

    showToast({
      type: 'success',
      message: `${toPersianDigits(restoredCount)} خاطره با موفقیت بازیابی شد.`,
    })

    closePreview()
  } catch (err: any) {
    restoreError.value = err.message || 'خطا در بازیابی اطلاعات'
  } finally {
    isRestoring.value = false
  }
}
</script>
