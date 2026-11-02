import type { Memory } from '@/models/Memory'
import type { BackupPayload, EncryptedBackupContainer } from '@/models/Backup'
import { memoryRepository } from '@/repositories/MemoryRepository'
import { db } from '@/repositories/DexieDatabase'
import { encryptAesGcm, decryptAesGcm, hashSha256 } from '@/utils/crypto'
import { CLOUD_CONFIG } from '@/config/cloudConfig'

export interface BackupPreview {
  isValid: boolean
  isEncrypted: boolean
  memoriesCount: number
  exportedAt: string
  payload?: BackupPayload
  errorMessage?: string
}

export class BackupService {
  async createEncryptedBackup(password: string): Promise<Blob> {
    if (!password || password.length < 4) {
      throw new Error('رمز عبور پشتیبان باید حداقل ۴ کاراکتر باشد.')
    }

    var memories = await memoryRepository.getAll()
    var settingsRecords = await db.settings.toArray()
    var settingsMap: Record<string, any> = {}
    settingsRecords.forEach((s) => (settingsMap[s.id] = s.value))

    // Don't include passcode hashes in backup for extra safety
    delete settingsMap.passcodeHash
    delete settingsMap.passcodeSalt

    var payload: BackupPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      memoriesCount: memories.length,
      memories,
      settings: settingsMap,
    }

    var jsonString = JSON.stringify(payload)
    var checksum = await hashSha256(jsonString)

    var { ciphertext, salt, iv, iterations } = await encryptAesGcm(jsonString, password)

    var container: EncryptedBackupContainer = {
      format: 'khatereh-encrypted-backup',
      version: '1.0',
      algorithm: 'AES-GCM',
      kdf: 'PBKDF2',
      iterations,
      salt,
      iv,
      ciphertext,
      checksum,
      meta: {
        createdAt: payload.exportedAt,
        approxMemoryCount: payload.memoriesCount,
      },
    }

    var blob = new Blob([JSON.stringify(container, null, 2)], { type: 'application/json' })
    return blob
  }

  async createPlainBackup(): Promise<Blob> {
    var memories = await memoryRepository.getAll()
    var settingsRecords = await db.settings.toArray()
    var settingsMap: Record<string, any> = {}
    settingsRecords.forEach((s) => (settingsMap[s.id] = s.value))
    delete settingsMap.passcodeHash
    delete settingsMap.passcodeSalt

    var payload: BackupPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      memoriesCount: memories.length,
      memories,
      settings: settingsMap,
    }

    return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  }

  async inspectBackupFile(fileContent: string): Promise<BackupPreview> {
    try {
      var parsed = JSON.parse(fileContent)
      if (parsed.format === 'khatereh-encrypted-backup') {
        return {
          isValid: true,
          isEncrypted: true,
          memoriesCount: parsed.meta?.approxMemoryCount || 0,
          exportedAt: parsed.meta?.createdAt || new Date().toISOString(),
        }
      } else if (parsed.memories && Array.isArray(parsed.memories)) {
        return {
          isValid: true,
          isEncrypted: false,
          memoriesCount: parsed.memories.length,
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          payload: parsed,
        }
      }
      return {
        isValid: false,
        isEncrypted: false,
        memoriesCount: 0,
        exportedAt: '',
        errorMessage: 'فرمت فایل بکاپ معتبر نیست.',
      }
    } catch {
      return {
        isValid: false,
        isEncrypted: false,
        memoriesCount: 0,
        exportedAt: '',
        errorMessage: 'فایل بکاپ آسیب دیده یا ساختار JSON نادرست است.',
      }
    }
  }

  async decryptAndLoadBackup(fileContent: string, password: string): Promise<BackupPayload> {
    var parsed: EncryptedBackupContainer = JSON.parse(fileContent)
    if (parsed.format !== 'khatereh-encrypted-backup') {
      throw new Error('فرمت فایل پشتیبان رمزگذاری‌شده نامعتبر است.')
    }

    try {
      var decryptedJson = await decryptAesGcm(
        parsed.ciphertext,
        password,
        parsed.salt,
        parsed.iv,
        parsed.iterations
      )

      var checksum = await hashSha256(decryptedJson)
      if (checksum !== parsed.checksum) {
        throw new Error('یکپارچگی فایل تأیید نشد (چک‌سام مغایرت دارد).')
      }

      var payload: BackupPayload = JSON.parse(decryptedJson)
      return payload
    } catch (err: any) {
      if (err.message && err.message.includes('چک‌سام')) {
        throw err
      }
      throw new Error('رمز عبور اشتباه است یا فایل پشتیبان دستکاری شده است.')
    }
  }

  async restoreBackup(payload: BackupPayload, mode: 'replace' | 'merge'): Promise<{ restoredCount: number }> {
    if (!payload.memories || !Array.isArray(payload.memories)) {
      throw new Error('هیچ خاطره‌ای در این فایل پشتیبان یافت نشد.')
    }

    if (mode === 'replace') {
      await db.memories.clear()
    }

    // Merge or put
    await db.memories.bulkPut(payload.memories)

    // Restore settings if present
    if (payload.settings) {
      for (var key of Object.keys(payload.settings)) {
        await db.settings.put({ id: key, value: (payload.settings as any)[key] })
      }
    }

    return { restoredCount: payload.memories.length }
  }

  async buildPayload(options: { excludeDeviceSettings?: boolean } = {}): Promise<BackupPayload> {
    var memories = await memoryRepository.getAll()
    var settingsRecords = await db.settings.toArray()
    var settingsMap: Record<string, any> = {}
    settingsRecords.forEach((s) => (settingsMap[s.id] = s.value))

    delete settingsMap.passcodeHash
    delete settingsMap.passcodeSalt
    if (options.excludeDeviceSettings) {
      CLOUD_CONFIG.deviceSettingKeys.forEach((key) => delete settingsMap[key])
    }

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      memoriesCount: memories.length,
      memories,
      settings: settingsMap,
    }
  }

  async restoreCloudPayload(payload: BackupPayload, mode: 'replace' | 'merge'): Promise<{ restoredCount: number }> {
    if (!payload.memories || !Array.isArray(payload.memories)) {
      throw new Error('هیچ خاطره‌ای در این فایل پشتیبان یافت نشد.')
    }

    var incoming = payload.memories
    var settings: Record<string, any> = { ...(payload.settings as Record<string, any>) }
    CLOUD_CONFIG.deviceSettingKeys.forEach((key) => delete settings[key])

    await db.transaction('rw', db.memories, db.settings, async () => {
      if (mode === 'replace') {
        await db.memories.clear()
        await db.memories.bulkPut(incoming)
      } else {
        var current = await db.memories.bulkGet(incoming.map((memory) => memory.id))
        var newer = incoming.filter((memory, index) => {
          var existing = current[index]
          return !existing || (memory.updatedAt || '') > (existing.updatedAt || '')
        })
        await db.memories.bulkPut(newer)
      }

      for (var key of Object.keys(settings)) {
        await db.settings.put({ id: key, value: settings[key] })
      }
    })

    return { restoredCount: incoming.length }
  }

  downloadBlob(blob: Blob, filename: string) {
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

export const backupService = new BackupService()