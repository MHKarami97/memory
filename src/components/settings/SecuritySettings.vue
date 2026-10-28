<template>
  <div class="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 space-y-6 transition-colors">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck class="w-4 h-4 text-indigo-500" />
          <span>امنیت و قفل برنامه</span>
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          برای حفظ حریم خصوصی، می‌توانید برای ورود به اپلیکیشن رمز عبور یا اثر انگشت تعیین کنید.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <span
          class="px-2.5 py-1 rounded-full text-[11px] font-bold"
          :class="authStore.isSecurityEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'"
        >
          {{ authStore.isSecurityEnabled ? 'قفل فعال' : 'بدون رمز' }}
        </span>
      </div>
    </div>

    <!-- Security Options -->
    <div class="space-y-4">
      <!-- Set Passcode -->
      <div v-if="!authStore.hasPasscode" class="space-y-3">
        <div class="flex items-center gap-2 flex-wrap">
          <input
            v-model="newPasscode"
            type="password"
            inputmode="numeric"
            autocomplete="new-password"
            :maxlength="PASSCODE_MAX_LENGTH"
            placeholder="رمز عبور عددی جدید (۴ تا ۸ رقم)"
            class="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 w-60 max-w-full"
          />
          <button
            type="button"
            :disabled="!isPasscodeValid"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            @click="handleSetPasscode"
          >
            فعال‌سازی رمز ورود
          </button>
        </div>
      </div>

      <div v-else class="space-y-3">
        <div class="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
            @click="isChangingPasscode = !isChangingPasscode"
          >
            {{ isChangingPasscode ? 'انصراف از تغییر رمز' : 'تغییر رمز عبور' }}
          </button>

          <button
            type="button"
            class="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium transition-colors"
            @click="handleRemovePasscode"
          >
            غیرفعال‌سازی قفل برنامه
          </button>
        </div>

        <!-- Change passcode inputs -->
        <div v-if="isChangingPasscode" class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3 max-w-sm">
          <input
            v-model="newPasscode"
            type="password"
            inputmode="numeric"
            autocomplete="new-password"
            :maxlength="PASSCODE_MAX_LENGTH"
            placeholder="رمز عبور جدید (۴ تا ۸ رقم)"
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
          />
          <button
            type="button"
            :disabled="!isPasscodeValid"
            class="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50"
            @click="handleChangePasscode"
          >
            ثبت رمز جدید
          </button>
        </div>
      </div>

      <!-- Biometric Authentication (WebAuthn) -->
      <div class="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div>
          <span class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Fingerprint class="w-4 h-4 text-indigo-500" />
            <span>ورود بیومتریک (اثر انگشت / Face ID)</span>
          </span>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            استفاده از سنسور اثر انگشت یا قفل صفحه گوشی بدون نیاز به تایپ رمز
          </p>
        </div>

        <button
          type="button"
          :disabled="!authStore.hasPasscode"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
          :class="authStore.isBiometricEnabled ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'"
          @click="toggleBiometric"
        >
          {{ authStore.isBiometricEnabled ? 'غیرفعال‌سازی' : 'فعال‌سازی' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ShieldCheck, Fingerprint } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { PASSCODE_MAX_LENGTH, sanitizePasscode, isValidPasscode } from '@/utils/passcode'

const authStore = useAuthStore()
const { showToast } = useToast()

const newPasscode = ref('')
const isChangingPasscode = ref(false)

const isPasscodeValid = computed(() => isValidPasscode(newPasscode.value))

watch(newPasscode, (value) => {
  var cleaned = sanitizePasscode(value)
  if (cleaned !== value) newPasscode.value = cleaned
})

async function handleSetPasscode() {
  if (!isPasscodeValid.value) return
  await authStore.setPasscode(newPasscode.value)
  newPasscode.value = ''
  showToast({ type: 'success', message: 'رمز عبور با موفقیت فعال شد.' })
}

async function handleChangePasscode() {
  if (!isPasscodeValid.value) return
  await authStore.setPasscode(newPasscode.value)
  newPasscode.value = ''
  isChangingPasscode.value = false
  showToast({ type: 'success', message: 'رمز عبور جدید ثبت شد.' })
}

async function handleRemovePasscode() {
  if (confirm('آیا از حذف رمز عبور و غیرفعال‌سازی قفل برنامه مطمئن هستید؟')) {
    await authStore.removePasscode()
    showToast({ type: 'info', message: 'قفل برنامه غیرفعال شد.' })
  }
}

async function toggleBiometric() {
  if (authStore.isBiometricEnabled) {
    await authStore.disableBiometric()
    showToast({ type: 'info', message: 'ورود بیومتریک غیرفعال شد.' })
  } else {
    try {
      await authStore.enableBiometric()
      showToast({ type: 'success', message: 'ورود بیومتریک با موفقیت متصل شد.' })
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'خطا در ثبت بیومتریک' })
    }
  }
}
</script>
