import { db } from '@/repositories/DexieDatabase'

export interface StorageBreakdown {
  totalBytes: number
  memoriesTextBytes: number
  photosBytes: number
  voiceBytes: number
  attachmentsBytes: number
  systemQuotaBytes?: number
  systemUsageBytes?: number
}

export class StorageService {
  async getStorageUsage(): Promise<StorageBreakdown> {
    var memories = await db.memories.toArray()
    var textBytes = 0
    var photosBytes = 0
    var voiceBytes = 0
    var attachmentsBytes = 0

    var encoder = new TextEncoder()

    for (var m of memories) {
      // Content & metadata
      var textData = (m.title || '') + (m.content || '') + (m.location || '') + m.tags.join('') + m.people.join('')
      textBytes += encoder.encode(textData).length

      // Photos
      if (m.photos) {
        for (var p of m.photos) {
          photosBytes += p.compressedSize || (p.dataUrl ? p.dataUrl.length : 0)
        }
      }

      // Voice
      if (m.voice) {
        voiceBytes += m.voice.size || (m.voice.audioUrl ? m.voice.audioUrl.length : 0)
      }

      // Attachments
      if (m.attachments) {
        for (var a of m.attachments) {
          attachmentsBytes += a.size || 0
        }
      }
    }

    var totalBytes = textBytes + photosBytes + voiceBytes + attachmentsBytes

    var systemQuotaBytes: number | undefined
    var systemUsageBytes: number | undefined

    if (navigator.storage && navigator.storage.estimate) {
      try {
        var estimate = await navigator.storage.estimate()
        systemQuotaBytes = estimate.quota
        systemUsageBytes = estimate.usage
      } catch {
        // Ignore fallback
      }
    }

    return {
      totalBytes,
      memoriesTextBytes: textBytes,
      photosBytes,
      voiceBytes,
      attachmentsBytes,
      systemQuotaBytes,
      systemUsageBytes,
    }
  }

  async clearAllStorage(): Promise<void> {
    await db.memories.clear()
    await db.drafts.clear()
    await db.models.clear()
    // Retain only basic non-sensitive UI settings or clear all
  }
}

export const storageService = new StorageService()
