<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors">
    <div class="flex items-center justify-around max-w-md mx-auto relative">
      <!-- Timeline -->
      <router-link
        to="/"
        class="flex flex-col items-center gap-1 text-[10px] font-medium transition-colors"
        :class="route.path === '/' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'"
      >
        <BookOpen class="w-5 h-5" />
        <span>خاطرات</span>
      </router-link>

      <!-- Calendar -->
      <router-link
        to="/calendar"
        class="flex flex-col items-center gap-1 text-[10px] font-medium transition-colors"
        :class="route.path.startsWith('/calendar') ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'"
      >
        <Calendar class="w-5 h-5" />
        <span>تقویم</span>
      </router-link>

      <!-- Central Floating Plus Action Button -->
      <router-link
        to="/new"
        class="flex items-center justify-center w-12 h-12 -mt-6 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-transform"
        title="ثبت خاطره جدید"
      >
        <Plus class="w-6 h-6 stroke-[2.5]" />
      </router-link>

      <!-- Search -->
      <router-link
        to="/search"
        class="flex flex-col items-center gap-1 text-[10px] font-medium transition-colors"
        :class="route.path.startsWith('/search') ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'"
      >
        <Search class="w-5 h-5" />
        <span>جست‌وجو</span>
      </router-link>

      <!-- Settings -->
      <router-link
        to="/settings"
        class="flex flex-col items-center gap-1 text-[10px] font-medium transition-colors"
        :class="route.path.startsWith('/settings') ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'"
      >
        <Settings class="w-5 h-5" />
        <span>تنظیمات</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { BookOpen, Calendar, Plus, Search, Settings } from 'lucide-vue-next'

const route = useRoute()
</script>
