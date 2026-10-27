<template>
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
    <!-- Offline Alert Banner -->
    <OfflineBadge />

    <!-- PWA Update Notification Toast / Banner -->
    <div
      v-if="pwaStore.needRefresh"
      class="bg-indigo-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-lg z-50 sticky top-0"
    >
      <div class="flex items-center gap-2">
        <Sparkles class="w-4 h-4 shrink-0" />
        <span>نسخه جدید خاطره‌نامه آماده است! برای بارگذاری تغییرات جدید دکمه بروزرسانی را بزنید.</span>
      </div>
      <button
        type="button"
        class="px-3 py-1 bg-white text-indigo-600 rounded-lg font-bold hover:bg-slate-100 transition-colors shadow-sm"
        @click="pwaStore.applyUpdate()"
      >
        به‌روزرسانی اکنون
      </button>
    </div>

    <!-- Main App Header -->
    <AppHeader />

    <!-- Core Layout with Sidebar on Desktop & Viewport Content -->
    <div class="flex-1 flex w-full max-w-[1600px] mx-auto">
      <AppSidebar />

      <main class="flex-1 min-w-0">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- Mobile Bottom Navigation -->
    <BottomNav />

    <!-- Security Lock Screen Modal (Passcode & Biometrics) -->
    <LockScreenModal />

    <!-- Global Toast Notifications & Undo Container -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Sparkles } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { useMemoryStore } from '@/stores/memoryStore'
import { usePwaStore } from '@/stores/pwaStore'
import { notificationService } from '@/services/NotificationService'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import LockScreenModal from '@/components/auth/LockScreenModal.vue'
import OfflineBadge from '@/components/common/OfflineBadge.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'

const router = useRouter()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const memoryStore = useMemoryStore()
const pwaStore = usePwaStore()

onMounted(async () => {
  await settingsStore.loadSettings()
  await authStore.checkInitialLock()
  await memoryStore.loadMemories()

  // Check daily reminder if enabled
  if (settingsStore.settings.dailyReminderEnabled) {
    await notificationService.checkAndSendDailyReminder()
  }
})

useKeyboardShortcuts({
  onNewMemory: () => {
    router.push('/new')
  },
  onSearch: () => {
    router.push('/search')
  },
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
