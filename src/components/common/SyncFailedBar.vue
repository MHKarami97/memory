<template>
  <transition name="fade">
    <div
      v-if="isVisible"
      role="status"
      class="fixed inset-x-0 z-40 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-0 bg-amber-500 text-white shadow-[0_-4px_16px_rgba(0,0,0,0.15)]"
    >
      <div class="max-w-[1600px] mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-semibold">
        <div class="flex items-center gap-2 min-w-0">
          <CloudOff class="w-4 h-4 shrink-0" />
          <span class="leading-relaxed">{{ store.failureBarMessage }}</span>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            :disabled="isRetrying"
            class="px-3 py-1 rounded-lg bg-white text-amber-700 font-bold hover:bg-amber-50 transition-colors disabled:opacity-60"
            @click="retry"
          >
            {{ isRetrying ? 'در حال تلاش...' : 'تلاش دوباره' }}
          </button>
          <button type="button" class="p-1 opacity-80 hover:opacity-100" title="بستن" @click="dismiss">
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { CloudOff, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { useCloudSyncStore } from '@/stores/cloudSyncStore'

const store = useCloudSyncStore()
const authStore = useAuthStore()

const dismissedKey = ref('')
const isRetrying = ref(false)

const currentKey = computed(() => `${store.snapshot.status}|${store.snapshot.lastError ?? ''}`)
const isVisible = computed(
  () => store.showFailureBar && !authStore.isLocked && dismissedKey.value !== currentKey.value
)

function dismiss() {
  dismissedKey.value = currentKey.value
}

async function retry() {
  isRetrying.value = true
  try {
    await store.connect()
  } catch {
    // The failure bar stays visible; the store already holds the latest error.
  } finally {
    isRetrying.value = false
  }
}
</script>
