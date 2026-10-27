<template>
  <div class="flex flex-col items-center justify-center p-8 space-y-3">
    <div class="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
    <span v-if="text" class="text-xs text-slate-500 dark:text-slate-400 font-medium">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text?: string
}>()
</script>
