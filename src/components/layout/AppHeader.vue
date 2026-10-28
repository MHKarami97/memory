<template>
  <header class="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 transition-colors">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <!-- Logo / Title -->
      <router-link to="/" class="flex items-center gap-2.5 group">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
          <BookHeart class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">خاطره‌نامه</h1>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium -mt-0.5 hidden xs:block">دفترچه خاطرات محرمانه و آفلاین</p>
        </div>
      </router-link>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <!-- New memory button on tablet/desktop -->
        <router-link
          to="/new"
          class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus class="w-4 h-4" />
          <span>ثبت خاطره جدید</span>
        </router-link>

        <!-- Lock app button if passcode is set -->
        <button
          v-if="authStore.isSecurityEnabled && authStore.isUnlocked"
          type="button"
          class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="قفل کردن فوری برنامه"
          @click="authStore.lockApp()"
        >
          <Lock class="w-4 h-4" />
        </button>
        
        <router-link
          type="button"
          class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="تنظیمات"
          to="/settings"
          >
          <Settings class="w-4 h-4 text-slate-600" />
        </router-link>

        <!-- Theme Toggle -->
        <button
          type="button"
          class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          :title="settingsStore.isDark ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'"
          @click="settingsStore.toggleTheme"
        >
          <Sun v-if="settingsStore.isDark" class="w-4 h-4 text-amber-400" />
          <Moon v-else class="w-4 h-4 text-slate-600" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { BookHeart, Plus, Lock, Sun, Moon, Settings } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
</script>
