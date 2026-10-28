import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettingsStore } from './settingsStore'
import { encryptionService } from '@/services/EncryptionService'
import { biometricService } from '@/services/BiometricService'
import { unlockSessionService } from '@/services/UnlockSessionService'

const COOLDOWN_THRESHOLD = 3
const COOLDOWN_MS = 30000

export const useAuthStore = defineStore('auth', () => {
  var settingsStore = useSettingsStore()

  var isUnlocked = ref(unlockSessionService.isActive())
  var failedAttempts = ref(0)
  var cooldownUntil = ref<number | null>(null)
  var unlockedIndividualMemories = ref<Set<string>>(new Set())

  var isSecurityEnabled = computed(() => settingsStore.settings.securityEnabled)
  var hasPasscode = computed(() => !!settingsStore.settings.passcodeHash)
  var isBiometricEnabled = computed(() => settingsStore.settings.biometricEnabled)
  var passcodeLength = computed(() => settingsStore.settings.passcodeLength || 0)

  var isLocked = computed(() => {
    if (!isSecurityEnabled.value) return false
    return !isUnlocked.value
  })

  var isCooldownActive = computed(() => {
    if (!cooldownUntil.value) return false
    return Date.now() < cooldownUntil.value
  })

  var remainingCooldownSeconds = computed(() => {
    if (!cooldownUntil.value) return 0
    var diff = Math.ceil((cooldownUntil.value - Date.now()) / 1000)
    return diff > 0 ? diff : 0
  })

  function markUnlocked() {
    isUnlocked.value = true
    failedAttempts.value = 0
    cooldownUntil.value = null
    unlockSessionService.start()
  }

  async function checkInitialLock() {
    isUnlocked.value = !isSecurityEnabled.value || unlockSessionService.isActive()
  }

  async function unlockWithPasscode(passcode: string): Promise<boolean> {
    if (isCooldownActive.value) {
      throw new Error(`تلاش‌های ناموفق بیش از حد؛ ${remainingCooldownSeconds.value} ثانیه صبر کنید.`)
    }

    var hash = settingsStore.settings.passcodeHash
    var salt = settingsStore.settings.passcodeSalt
    if (!hash || !salt) {
      markUnlocked()
      return true
    }

    var valid = await encryptionService.verifyUserPasscode(passcode, hash, salt)
    if (valid) {
      markUnlocked()
      if (!settingsStore.settings.passcodeLength) {
        await settingsStore.updateSetting('passcodeLength', passcode.length)
      }
      return true
    }

    failedAttempts.value++
    if (failedAttempts.value >= COOLDOWN_THRESHOLD) {
      cooldownUntil.value = Date.now() + COOLDOWN_MS
    }
    return false
  }

  async function unlockWithBiometric(): Promise<boolean> {
    if (!isBiometricEnabled.value) return false

    var credId = settingsStore.settings.biometricCredentialId
    var verified = await biometricService.verifyBiometric(credId)
    if (verified) {
      markUnlocked()
      return true
    }
    return false
  }

  async function setPasscode(newPasscode: string) {
    var { hash, salt } = await encryptionService.hashUserPasscode(newPasscode)
    await settingsStore.updateSetting('passcodeHash', hash)
    await settingsStore.updateSetting('passcodeSalt', salt)
    await settingsStore.updateSetting('passcodeLength', newPasscode.length)
    await settingsStore.updateSetting('hasPasscode', true)
    await settingsStore.updateSetting('securityEnabled', true)
    markUnlocked()
  }

  async function removePasscode() {
    await settingsStore.updateSetting('passcodeHash', undefined)
    await settingsStore.updateSetting('passcodeSalt', undefined)
    await settingsStore.updateSetting('passcodeLength', 0)
    await settingsStore.updateSetting('hasPasscode', false)
    await settingsStore.updateSetting('securityEnabled', false)
    await settingsStore.updateSetting('biometricEnabled', false)
    isUnlocked.value = true
    unlockSessionService.end()
  }

  async function enableBiometric(): Promise<boolean> {
    try {
      var credentialId = await biometricService.registerBiometric()
      await settingsStore.updateSetting('biometricCredentialId', credentialId)
      await settingsStore.updateSetting('biometricEnabled', true)
      return true
    } catch (err: any) {
      throw new Error(err.message || 'ثبت بیومتریک ناموفق بود.')
    }
  }

  async function disableBiometric() {
    await settingsStore.updateSetting('biometricCredentialId', undefined)
    await settingsStore.updateSetting('biometricEnabled', false)
  }

  function lockApp() {
    if (isSecurityEnabled.value) {
      isUnlocked.value = false
      unlockSessionService.end()
      unlockedIndividualMemories.value.clear()
    }
  }

  function isMemoryUnlocked(id: string): boolean {
    return unlockedIndividualMemories.value.has(id)
  }

  function unlockMemory(id: string) {
    unlockedIndividualMemories.value.add(id)
  }

  return {
    isUnlocked,
    isLocked,
    isSecurityEnabled,
    hasPasscode,
    isBiometricEnabled,
    passcodeLength,
    isCooldownActive,
    remainingCooldownSeconds,
    failedAttempts,
    checkInitialLock,
    unlockWithPasscode,
    unlockWithBiometric,
    setPasscode,
    removePasscode,
    enableBiometric,
    disableBiometric,
    lockApp,
    isMemoryUnlocked,
    unlockMemory,
  }
})
