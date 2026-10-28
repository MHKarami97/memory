<template>
  <aside class="w-64 shrink-0 hidden md:flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 min-h-[calc(100vh-61px)]">
    <div class="space-y-6">
      <!-- Quick Record Button -->
      <router-link
        to="/new"
        class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all"
      >
        <PlusCircle class="w-5 h-5" />
        <span>ثبت خاطره جدید</span>
      </router-link>

      <!-- Nav Links -->
      <nav class="space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group"
          :class="isCurrentRoute(item.to) ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'"
        >
          <div class="flex items-center gap-3">
            <component :is="item.icon" class="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
            <span>{{ item.label }}</span>
          </div>

          <span
            v-if="item.badge !== undefined"
            class="px-2 py-0.5 rounded-full text-[10px] font-bold"
            :class="isCurrentRoute(item.to) ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
          >
            {{ toPersianDigits(item.badge) }}
          </span>
        </router-link>
      </nav>

      <!-- Today's check-in status card -->
      <div class="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-emerald-50/30 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200/60 dark:border-slate-800 space-y-2">
        <div class="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          <CheckCircle2 v-if="hasMemoryToday" class="w-4 h-4 text-emerald-500" />
          <Clock v-else class="w-4 h-4 text-amber-500" />
          <span>{{ hasMemoryToday ? 'خاطره امروز ثبت شد' : 'خاطره امروز ثبت نشده' }}</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {{ hasMemoryToday ? 'آفرین! یک روز خاطره‌انگیز دیگر را ثبت کردی.' : 'امروز هنوز خاطره‌ای ننوشته‌ای. روزت چطور گذشت؟' }}
        </p>
      </div>
    </div>

    <!-- Storage & App Info Footer -->
    <div class="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
      <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span class="flex items-center gap-1.5">
          <Database class="w-3.5 h-3.5 text-indigo-500" />
          <span>کل خاطرات:</span>
        </span>
        <span class="font-bold text-slate-700 dark:text-slate-300">{{ toPersianDigits(memoryStore.memories.length) }}</span>
      </div>

      <div class="flex items-center justify-between text-[10px] text-slate-400">
        <span>نسخه ۱.۰ (آفلاین ۱۰۰٪)</span>
        <span class="text-emerald-500 font-medium">امن و محلی</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  BookOpen,
  Calendar,
  Search,
  Settings,
  PlusCircle,
  CheckCircle2,
  Clock,
  Database,
  Trees,
} from 'lucide-vue-next'
import { useMemoryStore } from '@/stores/memoryStore'
import { toPersianDigits } from '@/utils/format'

const route = useRoute()
const memoryStore = useMemoryStore()

const hasMemoryToday = computed(() => {
  return memoryStore.todayMemories.length > 0
})

const navItems = computed(() => [
  { to: '/', label: 'خط زمانی خاطرات', icon: BookOpen, badge: memoryStore.memories.length },
  { to: '/calendar', label: 'تقویم شمسی', icon: Calendar },
  { to: '/garden', label: 'باغ خاطرات', icon: Trees },
  { to: '/search', label: 'جست‌وجو و دسته‌ها', icon: Search },
  { to: '/settings', label: 'تنظیمات و امنیت', icon: Settings },
])

function isCurrentRoute(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
