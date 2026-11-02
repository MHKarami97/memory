import type { BackupPayload, EncryptedBackupContainer } from '@/models/Backup'
import type { BackupFingerprint } from '@/models/CloudSync'
import type { BackupService } from '@/services/BackupService'
import { hashSha256 } from '@/utils/crypto'
import { decryptWithKey, deriveKey, encryptWithKey, stableStringify } from '@/utils/cloudCrypto'
import { CLOUD_CONFIG } from '@/config/cloudConfig'
import { CloudSyncError } from './CloudSyncError'
import type { CloudKeyVault } from './CloudKeyVault'

export interface LocalSnapshot {
  payload: BackupPayload
  fingerprint: BackupFingerprint
}

export class CloudBackupCodec {
  constructor(
    private readonly backup: BackupService,
    private readonly vault: CloudKeyVault
  ) {}

  async snapshotLocal(): Promise<LocalSnapshot> {
    var payload = await this.backup.buildPayload({ excludeDeviceSettings: true })
    return { payload, fingerprint: await this.fingerprintOf(payload) }
  }

  async fingerprintOf(payload: BackupPayload): Promise<BackupFingerprint> {
    var memories = [...payload.memories].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    var contentHash = await hashSha256(stableStringify({ memories, settings: payload.settings }))
    return { contentHash, memoriesCount: payload.memories.length }
  }

  async serialize(snapshot: LocalSnapshot, encrypt: boolean): Promise<string> {
    var json = JSON.stringify(snapshot.payload)
    if (!encrypt) return json

    var record = await this.vault.getKey()
    if (!record) {
      throw new CloudSyncError('KEY_MISSING', 'کلید رمزنگاری روی این دستگاه موجود نیست؛ رمزنگاری را دوباره فعال کنید.')
    }

    var encrypted = await encryptWithKey(json, record.key)
    var container: EncryptedBackupContainer = {
      format: 'khatereh-encrypted-backup',
      version: '1.0',
      algorithm: 'AES-GCM',
      kdf: 'PBKDF2',
      iterations: record.iterations,
      salt: record.saltHex,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
      checksum: await hashSha256(json),
      meta: {
        createdAt: snapshot.payload.exportedAt,
        approxMemoryCount: snapshot.payload.memoriesCount,
        contentHash: snapshot.fingerprint.contentHash,
        source: 'cloud',
      },
    }
    return JSON.stringify(container)
  }

  async open(content: string, passphrase?: string): Promise<BackupPayload> {
    var parsed: any
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new CloudSyncError('INVALID_BACKUP', 'فایل پشتیبان ابری آسیب دیده است.')
    }

    if (parsed.format !== 'khatereh-encrypted-backup') {
      if (Array.isArray(parsed.memories)) return parsed as BackupPayload
      throw new CloudSyncError('INVALID_BACKUP', 'فرمت فایل پشتیبان ابری معتبر نیست.')
    }

    var container = parsed as EncryptedBackupContainer
    var json = await this.decrypt(container, passphrase)
    if ((await hashSha256(json)) !== container.checksum) {
      throw new CloudSyncError('INVALID_BACKUP', 'یکپارچگی فایل پشتیبان ابری تأیید نشد.')
    }
    return JSON.parse(json) as BackupPayload
  }

  private async decrypt(container: EncryptedBackupContainer, passphrase?: string): Promise<string> {
    if (!passphrase) {
      var record = await this.vault.getKey()
      var matches = !!record && record.saltHex === container.salt && record.iterations === container.iterations
      if (!record || !matches) {
        throw new CloudSyncError('PASSPHRASE_REQUIRED', 'برای باز کردن این پشتیبان، رمز عبور آن را وارد کنید.')
      }
      try {
        return await decryptWithKey(container.ciphertext, container.iv, record.key)
      } catch {
        throw new CloudSyncError('PASSPHRASE_REQUIRED', 'برای باز کردن این پشتیبان، رمز عبور آن را وارد کنید.')
      }
    }

    if (passphrase.length < CLOUD_CONFIG.minPassphraseLength) {
      throw new CloudSyncError('PASSPHRASE_INVALID', 'رمز عبور وارد شده کوتاه‌تر از حد مجاز است.')
    }

    var key = await deriveKey(passphrase, container.salt, container.iterations)
    try {
      var json = await decryptWithKey(container.ciphertext, container.iv, key)
      await this.vault.saveKey(key, container.salt, container.iterations)
      return json
    } catch {
      throw new CloudSyncError('PASSPHRASE_INVALID', 'رمز عبور اشتباه است یا فایل پشتیبان دستکاری شده است.')
    }
  }
}
