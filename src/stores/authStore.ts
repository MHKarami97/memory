import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettingsStore } from './settingsStore'
import { encryptionService } from '@/services/EncryptionService'
import { biometricService } from '@/services/BiometricService'

export const useAuthStore = defineStore('auth', () => {
  var settingsStore = useSettingsStore()

  var isUnlocked = ref(false)
  var failedAttempts = ref(0)
  var cooldownUntil = ref<number | null>(null)
  var unlockedIndividualMemories = ref<Set<string>>(new Set())

  var isSecurityEnabled = computed(() => settingsStore.settings.securityEnabled)
  var hasPasscode = computed(() => !!settingsStore.settings.passcodeHash)
  var isBiometricEnabled = computed(() => settingsStore.settings.biometricEnabled)

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

  async function checkInitialLock() {
    if (!isSecurityEnabled.value) {
      isUnlocked.value = true
    } else {
      isUnlocked.value = false
    }
  }

  async function unlockWithPasscode(passcode: string): Promise<boolean> {
    if (isCooldownActive.value) {
      throw new Error(`لطفاً ${remainingCooldownSeconds.value} ثانیه دیگر دوباره امتحان کنید.`)
    }

    var hash = settingsStore.settings.passcodeHash
    var salt = settingsStore.settings.passcodeSalt

    if (!hash || !salt) {
      // No passcode set yet
      isUnlocked.value = true
      return true
    }

    var valid = await encryptionService.verifyUserPasscode(passcode, hash, salt)
    if (valid) {
      isUnlocked.value = true
      failedAttempts.value = 0
      cooldownUntil.value = null
      return true
    } else {
      failedAttempts.value++
      if (failedAttempts.value >= 3) {
        // Cooldown for 30 seconds
        cooldownUntil.value = Date.now() + 30000
      }
      return false
    }
  }

  async function unlockWithBiometric(): Promise<boolean> {
    if (!isBiometricEnabled.value) return false
    var credId = settingsStore.settings.biometricCredentialId
    var verified = await biometricService.verifyBiometric(credId)
    if (verified) {
      isUnlocked.value = true
      failedAttempts.value = 0
      cooldownUntil.value = null
      return true
    }
    return false
  }

  async function setPasscode(newPasscode: string) {
    var { hash, salt } = await encryptionService.hashUserPasscode(newPasscode)
    await settingsStore.updateSetting('passcodeHash', hash)
    await settingsStore.updateSetting('passcodeSalt', salt)
    await settingsStore.updateSetting('hasPasscode', true)
    await settingsStore.updateSetting('securityEnabled', true)
    isUnlocked.value = true
  }

  async function removePasscode() {
    await settingsStore.updateSetting('passcodeHash', undefined)
    await settingsStore.updateSetting('passcodeSalt', undefined)
    await settingsStore.updateSetting('hasPasscode', false)
    await settingsStore.updateSetting('securityEnabled', false)
    await settingsStore.updateSetting('biometricEnabled', false)
    isUnlocked.value = true
  }

  async function enableBiometric(): Promise<boolean> {
    try {
      var { credentialId } = await biometricService.registerBiometric()
      await settingsStore.updateSetting('biometricCredentialId', credentialId)
      await settingsStore.updateSetting('biometricEnabled', true)
      return true
    } catch (err: any) {
      throw new Error(err.message || 'ثبت بیومتریک انجام نشد.')
    }
  }

  async function disableBiometric() {
    await settingsStore.updateSetting('biometricCredentialId', undefined)
    await settingsStore.updateSetting('biometricEnabled', false)
  }

  function lockApp() {
    if (isSecurityEnabled.value) {
      isUnlocked.value = false
      unlockedIndividualMemories.value.clear()
    }
  }

  // Individual locked memories
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
