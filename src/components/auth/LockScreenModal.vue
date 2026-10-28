<template>
  <Teleport to="body">
    <div
      v-if="authStore.isLocked"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
    >
      <div class="max-w-xs w-full text-center space-y-6">
        <!-- Lock Icon & Header -->
        <div class="flex flex-col items-center space-y-2">
          <div class="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-600/10">
            <Lock class="w-8 h-8" />
          </div>
          <h2 class="text-xl font-extrabold text-white">خاطره‌نامه قفل است</h2>
          <p class="text-xs text-slate-400">برای مشاهده خاطرات، رمز عبور را وارد کنید</p>
        </div>

        <!-- Cooldown Warning -->
        <div v-if="authStore.isCooldownActive" class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
          تلاش‌های ناموفق بیش از حد! لطفاً {{ toPersianDigits(authStore.remainingCooldownSeconds) }} ثانیه منتظر بمانید.
        </div>

        <!-- Passcode Dots -->
        <div class="flex justify-center items-center gap-3 py-2" dir="ltr">
          <div
            v-for="i in dotCount"
            :key="i"
            class="w-4 h-4 rounded-full border-2 transition-all duration-150"
            :class="passcode.length >= i ? 'bg-indigo-500 border-indigo-400 scale-110 shadow-md shadow-indigo-500/50' : 'border-slate-600 bg-transparent'"
          ></div>
        </div>

        <!-- Keypad: forced LTR so 1-2-3 starts at the left like a phone dialer -->
        <div class="grid grid-cols-3 gap-3" dir="ltr">
          <button
            v-for="digit in DIGITS"
            :key="digit"
            type="button"
            :disabled="isInputBlocked"
            class="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-indigo-600 text-white text-xl font-bold border border-slate-700/50 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            @click="appendDigit(digit)"
          >
            {{ toPersianDigits(digit) }}
          </button>

          <!-- Biometric Trigger Button -->
          <button
            type="button"
            :disabled="!authStore.isBiometricEnabled || authStore.isCooldownActive || isBiometricBusy"
            class="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-indigo-400 border border-slate-700/40 flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-95"
            title="ورود با اثر انگشت یا چهره"
            @click="onBiometricClick"
          >
            <Fingerprint class="w-6 h-6" />
          </button>

          <!-- 0 -->
          <button
            type="button"
            :disabled="isInputBlocked"
            class="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-indigo-600 text-white text-xl font-bold border border-slate-700/50 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            @click="appendDigit(0)"
          >
            {{ toPersianDigits(0) }}
          </button>

          <!-- Backspace -->
          <button
            type="button"
            :disabled="passcode.length === 0 || authStore.isCooldownActive"
            class="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-300 border border-slate-700/40 flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-95"
            @click="deleteDigit"
          >
            <Delete class="w-5 h-5" />
          </button>
        </div>

        <!-- Manual confirm: only for passcodes created before the length was stored -->
        <button
          v-if="!isLengthKnown"
          type="button"
          :disabled="passcode.length < PASSCODE_MIN_LENGTH || isInputBlocked"
          class="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
          @click="verify"
        >
          تأیید
        </button>

        <p v-if="errorText" class="text-xs text-rose-400 animate-pulse font-medium">{{ errorText }}</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Lock, Fingerprint, Delete } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { toPersianDigits } from '@/utils/format'
import { PASSCODE_MIN_LENGTH, PASSCODE_MAX_LENGTH } from '@/utils/passcode'

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const authStore = useAuthStore()
const passcode = ref('')
const errorText = ref('')
const isVerifying = ref(false)
const isBiometricBusy = ref(false)

const isLengthKnown = computed(() => authStore.passcodeLength > 0)
const dotCount = computed(() =>
  isLengthKnown.value ? authStore.passcodeLength : Math.max(PASSCODE_MIN_LENGTH, passcode.value.length)
)
const isInputBlocked = computed(() => authStore.isCooldownActive || isVerifying.value)

function appendDigit(d: number) {
  if (isInputBlocked.value || passcode.value.length >= PASSCODE_MAX_LENGTH) return

  passcode.value += String(d)
  errorText.value = ''

  if (isLengthKnown.value && passcode.value.length === authStore.passcodeLength) {
    verify()
  }
}

function deleteDigit() {
  passcode.value = passcode.value.slice(0, -1)
  errorText.value = ''
}

async function verify() {
  if (isVerifying.value || passcode.value.length < PASSCODE_MIN_LENGTH) return

  isVerifying.value = true
  try {
    var success = await authStore.unlockWithPasscode(passcode.value)
    errorText.value = success ? '' : 'رمز اشتباه است.'
  } catch (err: any) {
    errorText.value = err.message || 'خطا در احراز هویت'
  } finally {
    passcode.value = ''
    isVerifying.value = false
  }
}

async function runBiometric(isAutomatic: boolean) {
  if (isBiometricBusy.value) return

  isBiometricBusy.value = true
  errorText.value = ''
  try {
    var success = await authStore.unlockWithBiometric()
    if (!success && !isAutomatic) {
      errorText.value = 'احراز هویت بیومتریک ناموفق بود.'
    }
  } finally {
    isBiometricBusy.value = false
  }
}

function onBiometricClick() {
  runBiometric(false)
}

watch(
  () => authStore.isLocked && authStore.isBiometricEnabled && !authStore.isCooldownActive,
  (shouldPrompt) => {
    if (shouldPrompt) runBiometric(true)
  },
  { immediate: true }
)
</script>
