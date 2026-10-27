<template>
  <div
    v-if="pwaStore.isOffline"
    class="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-300 px-3 py-1.5 text-xs flex items-center justify-center gap-2 font-medium"
  >
    <WifiOff class="w-3.5 h-3.5 shrink-0" />
    <span>آفلاین هستید، اما خاطره‌نامه به طور کامل و بدون نقص کار می‌کند.</span>
  </div>
</template>

<script setup lang="ts">
import { WifiOff } from 'lucide-vue-next'
import { usePwaStore } from '@/stores/pwaStore'

const pwaStore = usePwaStore()
</script>
