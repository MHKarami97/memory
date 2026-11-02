<template>
  <Teleport to="body">
    <div
      v-if="decision && !decision.dismissed && !authStore.isLocked"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm"
    >
      <div
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <CloudDownload class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">{{ title }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{{ description }}</p>
          </div>
        </div>

        <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
          <div class="flex justify-between gap-3">
            <span class="text-slate-500">آخرین نسخه‌ی ابری</span>
            <span class="font-semibold text-slate-800 dark:text-slate-200">{{ toPersianDigits(formatDateTimeFa(decision.remote.modifiedTime)) }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-slate-500">تعداد خاطرات ابری</span>
            <span class="font-bold text-indigo-600 dark:text-indigo-400">{{ toPersianDigits(decision.remoteMemoriesCount) }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-slate-500">تعداد خاطرات این دستگاه</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">{{ toPersianDigits(decision.localMemoriesCount) }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-slate-500">رمزنگاری</span>
            <span class="font-semibold text-slate-800 dark:text-slate-200">{{ decision.remoteEncrypted ? 'AES-GCM' : 'ندارد' }}</span>
          </div>
        </div>

        <div v-if="needsPassphrase" class="space-y-1.5">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300">رمز پشتیبان ابری</label>
          <input
            v-model="passphrase"
            type="password"
            autocomplete="current-password"
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
          />
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300">روش بازیابی</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label
              class="flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer"
              :class="mode === 'merge' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-800'"
            >
              <input v-model="mode" type="radio" value="merge" class="mt-0.5" />
              <span>
                <span class="block font-semibold text-slate-800 dark:text-slate-200">ادغام</span>
                <span class="block text-[11px] text-slate-500">نسخه‌ی جدیدتر هر خاطره می‌ماند؛ حذف‌ها منتقل نمی‌شوند.</span>
              </span>
            </label>
            <label
              class="flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer"
              :class="mode === 'replace' ? 'border-rose-600 bg-rose-50/50 dark:bg-rose-950/30' : 'border-slate-200 dark:border-slate-800'"
            >
              <input v-model="mode" type="radio" value="replace" class="mt-0.5" />
              <span>
                <span class="block font-semibold text-rose-600 dark:text-rose-400">جایگزینی کامل</span>
                <span class="block text-[11px] text-slate-500">دیتای این دستگاه با نسخه‌ی ابری عوض می‌شود.</span>
              </span>
            </label>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            پیش از بازیابی از دیتای فعلی یک نسخه‌ی محلی گرفته می‌شود و از تنظیمات قابل بازگشت است.
          </p>
        </div>

        <p v-if="errorText" class="text-xs text-rose-500 font-medium">{{ errorText }}</p>

        <div class="flex flex-col sm:flex-row-reverse gap-2 pt-1">
          <button
            type="button"
            :disabled="isWorking || (needsPassphrase && passphrase.length === 0)"
            class="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            @click="handleRestore"
          >
            {{ isWorking ? 'در حال بازیابی...' : 'بازیابی از Google Drive' }}
          </button>
          <button
            v-if="decision.localMemoriesCount > 0"
            type="button"
            :disabled="isWorking"
            class="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
            @click="handleKeepLocal"
          >
            نگه‌داشتن دیتای این دستگاه
          </button>
          <button
            type="button"
            :disabled="isWorking"
            class="px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
            @click="store.dismissDecision()"
          >
            بعداً
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CloudDownload } from 'lucide-vue-next'
import type { CloudRestoreMode } from '@/models/CloudSync'
import { CloudSyncError, toUserMessage } from '@/services/cloud/CloudSyncError'
import { useAuthStore } from '@/stores/authStore'
import { useCloudSyncStore } from '@/stores/cloudSyncStore'
import { useToast } from '@/composables/useToast'
import { formatDateTimeFa } from '@/utils/cloudFormat'
import { toPersianDigits } from '@/utils/format'

const store = useCloudSyncStore()
const authStore = useAuthStore()
const { showToast } = useToast()

const decision = computed(() => store.snapshot.decision)
const mode = ref<CloudRestoreMode>('replace')
const passphrase = ref('')
const errorText = ref('')
const isWorking = ref(false)
const passphraseRequested = ref(false)

const needsPassphrase = computed(
  () => passphraseRequested.value || (!!decision.value?.remoteEncrypted && !store.snapshot.encryptionEnabled)
)

const title = computed(() => {
  switch (decision.value?.kind) {
    case 'conflict':
      return 'تفاوت بین دیتای این دستگاه و Google Drive'
    case 'remote-only':
      return 'پشتیبان ابری پیدا شد'
    default:
      return 'نسخه‌ی جدیدتری در Google Drive هست'
  }
})

const description = computed(() => {
  switch (decision.value?.kind) {
    case 'conflict':
      return 'هم این دستگاه و هم نسخه‌ی ابری از آخرین همگام‌سازی تغییر کرده‌اند. یکی را انتخاب کنید.'
    case 'remote-only':
      return 'این دستگاه خاطره‌ای ندارد، اما در Google Drive پشتیبانی هست. می‌خواهید بازیابی شود؟'
    default:
      return 'دیتای این دستگاه تغییری نکرده است و نسخه‌ی ابری (احتمالاً از دستگاه دیگر) جدیدتر است.'
  }
})

watch(
  () => decision.value?.remote.id,
  () => {
    mode.value = decision.value?.kind === 'conflict' ? 'merge' : 'replace'
    passphrase.value = ''
    errorText.value = ''
    passphraseRequested.value = false
  },
  { immediate: true }
)

async function handleRestore() {
  errorText.value = ''
  isWorking.value = true
  try {
    await store.resolveRestore(mode.value, needsPassphrase.value ? passphrase.value : undefined)
    showToast({ type: 'success', message: 'دیتا از Google Drive بازیابی شد.' })
  } catch (error) {
    if (error instanceof CloudSyncError && (error.code === 'PASSPHRASE_REQUIRED' || error.code === 'PASSPHRASE_INVALID')) {
      passphraseRequested.value = true
      errorText.value = error.message
    } else {
      errorText.value = toUserMessage(error)
    }
  } finally {
    isWorking.value = false
  }
}

async function handleKeepLocal() {
  errorText.value = ''
  isWorking.value = true
  try {
    await store.resolveKeepLocal()
    showToast({ type: 'success', message: 'دیتای این دستگاه در Google Drive ذخیره شد.' })
  } catch (error) {
    errorText.value = toUserMessage(error)
  } finally {
    isWorking.value = false
  }
}
</script>
