import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePwaStore = defineStore('pwa', () => {
  var isOffline = ref(!navigator.onLine)
  var needRefresh = ref(false)
  var updateSW: (() => Promise<void>) | null = null

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      isOffline.value = false
    })
    window.addEventListener('offline', () => {
      isOffline.value = true
    })
  }

  function setUpdateHandler(handler: () => Promise<void>) {
    updateSW = handler
    needRefresh.value = true
  }

  async function applyUpdate() {
    if (updateSW) {
      await updateSW()
    }
  }

  return {
    isOffline,
    needRefresh,
    setUpdateHandler,
    applyUpdate,
  }
})
