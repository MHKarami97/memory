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
        <div class="flex justify-center items-center gap-3 py-2">
          <div
            v-for="i in 4"
            :key="i"
            class="w-4 h-4 rounded-full border-2 transition-all duration-150"
            :class="passcode.length >= i ? 'bg-indigo-500 border-indigo-400 scale-110 shadow-md shadow-indigo-500/50' : 'border-slate-600 bg-transparent'"
          ></div>
        </div>

        <!-- Keypad (0-9) -->
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="digit in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
            :key="digit"
            type="button"
            :disabled="authStore.isCooldownActive"
            class="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-indigo-600 text-white text-xl font-bold border border-slate-700/50 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            @click="appendDigit(digit)"
          >
            {{ toPersianDigits(digit) }}
          </button>

          <!-- Biometric Trigger Button -->
          <button
            type="button"
            :disabled="!authStore.isBiometricEnabled || authStore.isCooldownActive"
            class="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-indigo-400 border border-slate-700/40 flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-95"
            title="ورود با اثر انگشت یا چهره"
            @click="triggerBiometric"
          >
            <Fingerprint class="w-6 h-6" />
          </button>

          <!-- 0 -->
          <button
            type="button"
            :disabled="authStore.isCooldownActive"
            class="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-indigo-600 text-white text-xl font-bold border border-slate-700/50 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            @click="appendDigit(0)"
          >
            {{ toPersianDigits(0) }}
          </button>

          <!-- Backspace / Clear -->
          <button
            type="button"
            :disabled="passcode.length === 0 || authStore.isCooldownActive"
            class="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-300 border border-slate-700/40 flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-95"
            @click="deleteDigit"
          >
            <Delete class="w-5 h-5" />
          </button>
        </div>

        <p v-if="errorText" class="text-xs text-rose-400 animate-pulse font-medium">{{ errorText }}</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Lock, Fingerprint, Delete } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { toPersianDigits } from '@/utils/format'

const authStore = useAuthStore()
const passcode = ref('')
const errorText = ref('')

function appendDigit(d: number) {
  if (passcode.value.length < 8) {
    passcode.value += String(d)
    errorText.value = ''
    if (passcode.value.length >= 4) {
      verify()
    }
  }
}

function deleteDigit() {
  passcode.value = passcode.value.slice(0, -1)
  errorText.value = ''
}

async function verify() {
  try {
    var success = await authStore.unlockWithPasscode(passcode.value)
    if (success) {
      passcode.value = ''
      errorText.value = ''
    } else {
      errorText.value = 'رمز اشتباه است.'
      passcode.value = ''
    }
  } catch (err: any) {
    errorText.value = err.message || 'خطا در احراز هویت'
    passcode.value = ''
  }
}

async function triggerBiometric() {
  errorText.value = ''
  var success = await authStore.unlockWithBiometric()
  if (!success) {
    errorText.value = 'احراز هویت بیومتریک ناموفق بود.'
  }
}
</script>
