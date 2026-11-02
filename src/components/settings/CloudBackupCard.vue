<template>
  <div class="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 space-y-5 transition-colors">
    <div>
      <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Cloud class="w-4 h-4 text-sky-500" />
        <span>پشتیبان‌گیری خودکار در Google Drive</span>
      </h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
        نسخه‌ی پشتیبان در پوشه‌ی مخفی همین برنامه در Google Drive خودتان ذخیره می‌شود و فقط همین برنامه به آن دسترسی دارد.
        پس از هر تغییر، پشتیبان‌گیری خودکار انجام می‌شود و در دستگاه جدید می‌توانید آن را بازیابی کنید.
      </p>
    </div>

    <!-- Status -->
    <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1">
      <div class="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
        <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="dotClass"></span>
        <span>{{ store.statusText }}</span>
      </div>
      <p v-if="store.isConnected && store.lastSuccessText" class="text-[11px] text-slate-500 dark:text-slate-400 pr-4">
        آخرین پشتیبان موفق: {{ toPersianDigits(store.lastSuccessText) }}
      </p>
      <p
        v-if="store.isConnected && snapshot.status !== 'error' && snapshot.lastError"
        class="text-[11px] text-rose-500 pr-4"
      >
        {{ snapshot.lastError }}
      </p>
    </div>

    <!-- Actions -->
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-if="!store.isConnected"
        type="button"
        :disabled="isWorking"
        class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
        @click="handleConnect"
      >
        <Link class="w-3.5 h-3.5" />
        <span>اتصال به Google Drive</span>
      </button>

      <template v-else>
        <button
          v-if="snapshot.status === 'needs-reconnect' || snapshot.status === 'error'"
          type="button"
          :disabled="isWorking"
          class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          @click="handleConnect"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span>اتصال دوباره</span>
        </button>
        <button
          v-if="snapshot.decision && snapshot.decision.dismissed"
          type="button"
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all"
          @click="store.reopenDecision()"
        >
          بررسی نسخه‌ی ابری
        </button>
        <button
          type="button"
          :disabled="isWorking || store.isBusy || !!snapshot.decision"
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          @click="handleBackupNow"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="store.isBusy ? 'animate-spin' : ''" />
          <span>پشتیبان‌گیری همین حالا</span>
        </button>
        <button
          type="button"
          :disabled="isWorking"
          class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          @click="handleDisconnect"
        >
          <Unlink class="w-3.5 h-3.5" />
          <span>قطع اتصال</span>
        </button>
      </template>
    </div>

    <!-- Encryption -->
    <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
      <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
        <Lock class="w-4 h-4 text-indigo-500" />
        <span>رمزنگاری پشتیبان ابری (اختیاری)</span>
      </h4>

      <template v-if="snapshot.encryptionEnabled">
        <p class="text-[11px] text-emerald-600 dark:text-emerald-400 leading-relaxed">
          رمزنگاری فعال است؛ پشتیبان‌ها پیش از ارسال با AES-GCM روی همین دستگاه رمز می‌شوند.
        </p>
        <button
          type="button"
          :disabled="isWorking"
          class="text-[11px] text-rose-500 hover:underline font-medium disabled:opacity-50"
          @click="handleDisableEncryption"
        >
          غیرفعال‌سازی رمزنگاری
        </button>
      </template>

      <template v-else>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          بدون رمزنگاری، محتوای خاطرات به‌صورت خوانا در Google Drive شما ذخیره می‌شود. با رمزنگاری، فقط کسی که رمز را بداند
          می‌تواند آن را بخواند.
          <span class="font-bold text-rose-500">رمز قابل بازیابی نیست؛ با فراموشی آن، پشتیبان ابری برای همیشه باز نمی‌شود.</span>
          در همه‌ی دستگاه‌ها از همین رمز استفاده کنید.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            v-model="passphrase"
            type="password"
            autocomplete="new-password"
            :placeholder="`رمز (حداقل ${toPersianDigits(minLength)} نویسه)`"
            class="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none text-slate-900 dark:text-slate-100"
          />
          <input
            v-model="passphraseConfirm"
            type="password"
            autocomplete="new-password"
            placeholder="تکرار رمز"
            class="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none text-slate-900 dark:text-slate-100"
          />
        </div>
        <button
          type="button"
          :disabled="isWorking || passphrase.length < minLength || passphrase !== passphraseConfirm"
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          @click="handleEnableEncryption"
        >
          {{ isWorking ? 'در حال آماده‌سازی کلید...' : 'فعال‌سازی رمزنگاری' }}
        </button>
      </template>
    </div>

    <!-- Preferences / rollback -->
    <div class="space-y-3">
      <label class="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          class="mt-0.5 rounded"
          :checked="snapshot.notifyFailures"
          @change="store.setNotifyFailures(($event.target as HTMLInputElement).checked)"
        />
        <span>نمایش پیام در پایین صفحه وقتی همگام‌سازی انجام نشد (فقط در حالت آنلاین)</span>
      </label>

      <div
        v-if="snapshot.hasRollbackSnapshot"
        class="flex items-center justify-between gap-3 flex-wrap p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900"
      >
        <p class="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
          پیش از آخرین بازیابی ابری، از دیتای این دستگاه یک نسخه‌ی محلی گرفته شده است.
        </p>
        <button
          type="button"
          :disabled="isWorking"
          class="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold flex items-center gap-1.5 disabled:opacity-50"
          @click="handleRollback"
        >
          <Undo2 class="w-3.5 h-3.5" />
          <span>بازگرداندن به قبل از بازیابی</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Cloud, Link, Lock, RefreshCw, Undo2, Unlink } from 'lucide-vue-next'
import { CLOUD_CONFIG } from '@/config/cloudConfig'
import { toUserMessage } from '@/services/cloud/CloudSyncError'
import { useCloudSyncStore } from '@/stores/cloudSyncStore'
import { useToast } from '@/composables/useToast'
import { toPersianDigits } from '@/utils/format'

const store = useCloudSyncStore()
const { showToast } = useToast()

const minLength = CLOUD_CONFIG.minPassphraseLength
const snapshot = computed(() => store.snapshot)
const passphrase = ref('')
const passphraseConfirm = ref('')
const isWorking = ref(false)

onMounted(() => store.preload())

const dotClass = computed(() => {
  switch (snapshot.value.status) {
    case 'success':
    case 'idle':
      return snapshot.value.connected ? 'bg-emerald-500' : 'bg-slate-400'
    case 'syncing':
      return 'bg-sky-500 animate-pulse'
    case 'needs-reconnect':
    case 'decision-pending':
      return 'bg-amber-500'
    case 'error':
      return 'bg-rose-500'
    default:
      return 'bg-slate-400'
  }
})

async function run(action: () => Promise<void>, successMessage?: string) {
  isWorking.value = true
  try {
    await action()
    if (successMessage) showToast({ type: 'success', message: successMessage })
  } catch (error) {
    showToast({ type: 'error', message: toUserMessage(error) })
  } finally {
    isWorking.value = false
  }
}

function handleConnect() {
  return run(() => store.connect())
}

function handleBackupNow() {
  return run(() => store.backupNow())
}

async function handleDisconnect() {
  if (!confirm('اتصال به Google Drive قطع شود؟ پشتیبان‌گیری خودکار متوقف می‌شود.')) return
  var removeRemote = confirm('نسخه‌های پشتیبان موجود در Google Drive هم حذف شوند؟\nتأیید = حذف شوند، لغو = بمانند')
  await run(() => store.disconnect(removeRemote), 'اتصال قطع شد.')
}

async function handleEnableEncryption() {
  await run(async () => {
    await store.enableEncryption(passphrase.value)
    passphrase.value = ''
    passphraseConfirm.value = ''
  }, 'رمزنگاری فعال شد.')
}

async function handleDisableEncryption() {
  if (!confirm('از این پس پشتیبان‌های ابری بدون رمزنگاری ذخیره می‌شوند. ادامه می‌دهید؟')) return
  await run(() => store.disableEncryption(), 'رمزنگاری غیرفعال شد.')
}

async function handleRollback() {
  if (!confirm('دیتای این دستگاه به وضعیت قبل از آخرین بازیابی ابری برمی‌گردد. ادامه می‌دهید؟')) return
  await run(() => store.rollbackLastRestore(), 'دیتا به وضعیت قبل از بازیابی برگشت.')
}
</script>
