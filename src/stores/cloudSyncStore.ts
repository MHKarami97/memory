import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { CloudRestoreMode, CloudSyncSnapshot } from '@/models/CloudSync'
import { cloudSyncService } from '@/services/cloud'
import { usePwaStore } from './pwaStore'
import { useSettingsStore } from './settingsStore'
import { useMemoryStore } from './memoryStore'
import { formatDateTimeFa } from '@/utils/cloudFormat'

export const useCloudSyncStore = defineStore('cloudSync', () => {
  var pwaStore = usePwaStore()
  var settingsStore = useSettingsStore()
  var memoryStore = useMemoryStore()

  var snapshot = ref<CloudSyncSnapshot>(cloudSyncService.getSnapshot())
  cloudSyncService.subscribe((next) => {
    snapshot.value = next
  })
  cloudSyncService.setDataRestoredHandler(async () => {
    await settingsStore.loadSettings()
    await memoryStore.loadMemories()
  })

  var isConnected = computed(() => snapshot.value.connected)
  var isBusy = computed(() => snapshot.value.status === 'syncing')
  var lastSuccessText = computed(() => formatDateTimeFa(snapshot.value.lastSuccessAt))

  var statusText = computed(() => {
    switch (snapshot.value.status) {
      case 'disconnected':
        return 'متصل نیست'
      case 'syncing':
        return 'در حال همگام‌سازی...'
      case 'needs-reconnect':
        return 'اتصال به Google نیاز به تأیید دوباره دارد'
      case 'error':
        return snapshot.value.lastError || 'همگام‌سازی ناموفق بود'
      case 'decision-pending':
        return 'نسخه‌ی ابری منتظر تصمیم شماست'
      case 'success':
        return 'همگام و به‌روز است'
      default:
        return snapshot.value.lastSuccessAt ? 'همگام و به‌روز است' : 'متصل است؛ هنوز پشتیبانی گرفته نشده'
    }
  })

  // Failures are only surfaced while online: offline is a normal state for this app.
  var showFailureBar = computed(() => {
    var status = snapshot.value.status
    return (
      snapshot.value.connected &&
      snapshot.value.notifyFailures &&
      (status === 'error' || status === 'needs-reconnect') &&
      !pwaStore.isOffline
    )
  })

  var failureBarMessage = computed(() =>
    snapshot.value.status === 'needs-reconnect'
      ? 'دیتا همگام‌سازی نشد؛ اتصال به Google Drive نیاز به تأیید دوباره دارد.'
      : `دیتا همگام‌سازی نشد. ${snapshot.value.lastError || ''}`.trim()
  )

  return {
    snapshot,
    isConnected,
    isBusy,
    statusText,
    lastSuccessText,
    showFailureBar,
    failureBarMessage,
    start: () => cloudSyncService.start(),
    preload: () => cloudSyncService.preload(),
    connect: () => cloudSyncService.connect(),
    disconnect: (deleteRemote: boolean) => cloudSyncService.disconnect(deleteRemote),
    backupNow: () => cloudSyncService.backupNow('manual'),
    resolveRestore: (mode: CloudRestoreMode, passphrase?: string) => cloudSyncService.resolveRestore(mode, passphrase),
    resolveKeepLocal: () => cloudSyncService.resolveKeepLocal(),
    dismissDecision: () => cloudSyncService.dismissDecision(),
    reopenDecision: () => cloudSyncService.reopenDecision(),
    rollbackLastRestore: () => cloudSyncService.rollbackLastRestore(),
    enableEncryption: (passphrase: string) => cloudSyncService.enableEncryption(passphrase),
    disableEncryption: () => cloudSyncService.disableEncryption(),
    setNotifyFailures: (value: boolean) => cloudSyncService.setNotifyFailures(value),
  }
})
