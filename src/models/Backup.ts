import type { Memory } from './Memory'
import type { AppSettings } from './Settings'

export interface BackupPayload {
  version: string
  exportedAt: string // ISO
  memoriesCount: number
  memories: Memory[]
  settings: Partial<AppSettings>
}

export interface EncryptedBackupContainer {
  format: 'khatereh-encrypted-backup'
  version: '1.0'
  algorithm: 'AES-GCM'
  kdf: 'PBKDF2'
  iterations: number
  salt: string // hex
  iv: string // hex
  ciphertext: string // hex or base64
  checksum: string // SHA-256 hex
  meta: {
    createdAt: string
    approxMemoryCount: number
  }
}
