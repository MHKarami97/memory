<template>
  <div class="flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto my-6 space-y-4">
    <div class="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
      <slot name="icon">
        <component :is="iconComponent || BookOpen" class="w-8 h-8" />
      </slot>
    </div>
    <div class="space-y-1">
      <h3 class="text-base font-bold text-slate-800 dark:text-slate-200">{{ title }}</h3>
      <p v-if="description" class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{{ description }}</p>
    </div>
    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
import { BookOpen } from 'lucide-vue-next'
import type { Component } from 'vue'

defineProps<{
  title: string
  description?: string
  iconComponent?: Component
}>()
</script>
