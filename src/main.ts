import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import { router } from './router'
import { usePwaStore } from './stores/pwaStore'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')

// Register PWA Service Worker with user prompt on update
const pwaStore = usePwaStore()
const updateSW = registerSW({
  onNeedRefresh() {
    pwaStore.setUpdateHandler(async () => {
      await updateSW(true)
    })
  },
  onOfflineReady() {
    console.log('خاطره‌نامه برای استفاده کاملاً آفلاین آماده است.')
  },
})
