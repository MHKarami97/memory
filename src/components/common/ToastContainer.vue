<template>
  <div class="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none max-w-sm w-full px-4">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-medium w-full transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
      :class="{
        'bg-slate-900 text-white border-slate-800 dark:bg-white dark:text-slate-900': toast.type === 'info',
        'bg-emerald-600 text-white border-emerald-500': toast.type === 'success',
        'bg-rose-600 text-white border-rose-500': toast.type === 'error',
        'bg-amber-600 text-white border-amber-500': toast.type === 'warning',
      }"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 v-if="toast.type === 'success'" class="w-4 h-4 shrink-0" />
        <AlertCircle v-else-if="toast.type === 'error'" class="w-4 h-4 shrink-0" />
        <AlertTriangle v-else-if="toast.type === 'warning'" class="w-4 h-4 shrink-0" />
        <Info v-else class="w-4 h-4 shrink-0" />
        <span>{{ toast.message }}</span>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="toast.actionText && toast.onAction"
          type="button"
          class="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold transition-colors"
          @click="toast.onAction"
        >
          {{ toast.actionText }}
        </button>
        <button
          type="button"
          class="opacity-70 hover:opacity-100 p-1"
          @click="removeToast(toast.id)"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()
</script>
