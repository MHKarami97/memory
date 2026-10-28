import type { LocalSpeechModel } from '@/models/SpeechModel'
import { AVAILABLE_SPEECH_MODELS } from '@/models/SpeechModel'
import { db } from '@/repositories/DexieDatabase'

export type SpeechRecognitionState = 'idle' | 'listening' | 'transcribing' | 'error'

export interface SpeechRecognitionCallbacks {
  onResult?: (fullText: string, isFinal: boolean) => void
  onSegment?: (newFinalSegment: string) => void
  onInterim?: (interimText: string) => void
  onError?: (error: string) => void
  onEnd?: () => void
}

export interface ModelProgressInfo {
  status: 'init' | 'downloading' | 'ready' | 'error'
  percent: number
  loadedBytes?: number
  totalBytes?: number
  file?: string
  message?: string
}

// Global cached pipelines in memory
var transcriberInstances: Record<string, any> = {}

export class SpeechRecognitionService {
  private activeRecognition: any = null
  private isSystemSupported = false

  constructor() {
    var SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null
    this.isSystemSupported = !!SpeechRec
  }

  isWebSpeechSupported(): boolean {
    return this.isSystemSupported
  }

  /**
   * Start real-time speech dictation using browser native Web Speech API (fa-IR).
   * Robust keep-alive loop: Automatically restarts upon silence pauses or browser timeouts
   * until explicitly stopped by the user. Emits both clean incremental segments and full text.
   */
  startLiveSystemDictation(callbacks: SpeechRecognitionCallbacks): { stop: () => void } {
    var SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null

    if (!SpeechRec) {
      callbacks.onError?.('مرورگر شما از Web Speech API پشتیبانی نمی‌کند. در مرورگرهای Chrome یا Edge تست نمایید.')
      return { stop: () => {} }
    }

    var isExplicitlyStopped = false
    var recognition: any = null
    var finalAccumulated = ''
    var restartTimer: any = null

    var startInstance = () => {
      if (isExplicitlyStopped) return

      try {
        if (this.activeRecognition) {
          try {
            this.activeRecognition.stop()
          } catch {
            // ignore
          }
          this.activeRecognition = null
        }

        recognition = new SpeechRec()
        recognition.lang = 'fa-IR'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onresult = (event: any) => {
          var interimTranscript = ''
          for (var i = event.resultIndex; i < event.results.length; ++i) {
            var item = event.results[i]
            var transcript = item[0]?.transcript || ''
            if (item.isFinal) {
              var cleanSegment = transcript.trim()
              if (cleanSegment) {
                finalAccumulated += (finalAccumulated ? ' ' : '') + cleanSegment
                callbacks.onSegment?.(cleanSegment)
              }
            } else {
              interimTranscript += transcript
            }
          }

          var fullText = finalAccumulated + (interimTranscript ? ' ' + interimTranscript.trim() : '')
          callbacks.onInterim?.(interimTranscript.trim())
          callbacks.onResult?.(fullText.trim(), !interimTranscript)
        }

        recognition.onerror = (event: any) => {
          // 'no-speech' or 'aborted' are natural pauses or timeouts; DO NOT kill the dictation!
          if (event.error === 'no-speech' || event.error === 'aborted') {
            return
          }

          if (event.error === 'not-allowed') {
            isExplicitlyStopped = true
            callbacks.onError?.('دسترسی به میکروفون رد شد. لطفاً در تنظیمات مرورگر دسترسی به میکروفون را فعال کنید.')
            return
          }

          if (event.error === 'audio-capture') {
            isExplicitlyStopped = true
            callbacks.onError?.('میکروفون در دسترس نیست یا توسط برنامه دیگری استفاده می‌شود.')
            return
          }

          console.warn('Speech recognition notice:', event.error)
        }

        recognition.onend = () => {
          // If user did not explicitly stop dictation, keep alive seamlessly!
          if (!isExplicitlyStopped) {
            restartTimer = setTimeout(() => {
              if (!isExplicitlyStopped) {
                startInstance()
              }
            }, 100)
          } else {
            this.activeRecognition = null
            callbacks.onEnd?.()
          }
        }

        recognition.start()
        this.activeRecognition = recognition
      } catch (err: any) {
        if (!isExplicitlyStopped) {
          restartTimer = setTimeout(() => {
            if (!isExplicitlyStopped) startInstance()
          }, 300)
        }
      }
    }

    startInstance()

    return {
      stop: () => {
        isExplicitlyStopped = true
        if (restartTimer) clearTimeout(restartTimer)
        if (recognition) {
          try {
            recognition.stop()
          } catch {
            // Ignore
          }
        }
        this.activeRecognition = null
        callbacks.onEnd?.()
      },
    }
  }

  // --- Local Models Management & Transformers.js Integration ---

  async getAvailableModels(): Promise<LocalSpeechModel[]> {
    var cachedList = await db.models.toArray()
    var cachedMap = new Map(cachedList.map((m) => [m.id, m]))

    return AVAILABLE_SPEECH_MODELS.map((model) => {
      var cached = cachedMap.get(model.id)
      return {
        ...model,
        isDownloaded: !!cached,
        downloadStatus: cached ? 'ready' : 'idle',
      }
    })
  }

  /**
   * Real on-device model download via @huggingface/transformers.
   * Downloads ONNX weights & tokenizer and caches into browser CacheStorage.
   */
  async downloadModel(
    modelId: string,
    onProgress: (info: ModelProgressInfo) => void
  ): Promise<void> {
    var model = AVAILABLE_SPEECH_MODELS.find((m) => m.id === modelId)
    if (!model) throw new Error('مدل انتخابی یافت نشد.')

    var repo = model.huggingFaceRepo || 'onnx-community/whisper-tiny'

    onProgress({
      status: 'init',
      percent: 5,
      message: 'در حال اتصال به مخزن مدل و دریافت اطلاعات وزن‌ها...',
    })

    try {
      // Dynamically import @huggingface/transformers to keep initial bundle tiny
      var { pipeline, env } = await import('@huggingface/transformers')

      env.allowLocalModels = false
      env.useBrowserCache = true

      // Track individual file progress
      var fileProgresses: Record<string, { loaded: number; total: number }> = {}

      var pipe = await pipeline('automatic-speech-recognition', repo, {
        dtype: 'q8',
        progress_callback: (item: any) => {
          if (item && item.status === 'progress' && item.file) {
            fileProgresses[item.file] = {
              loaded: item.loaded || 0,
              total: item.total || 0,
            }

            var sumLoaded = 0
            var sumTotal = 0
            for (var f in fileProgresses) {
              sumLoaded += fileProgresses[f].loaded
              sumTotal += fileProgresses[f].total
            }

            var pct = sumTotal > 0 ? Math.min(99, Math.round((sumLoaded / sumTotal) * 100)) : 10

            onProgress({
              status: 'downloading',
              percent: pct,
              loadedBytes: sumLoaded,
              totalBytes: sumTotal,
              file: item.file,
              message: `در حال دریافت فایل‌های مدل: ${pct}٪`,
            })
          }
        },
      })

      transcriberInstances[model.id] = pipe

      // Persist metadata in IndexedDB
      await db.models.put({
        id: model.id,
        name: model.name,
        sizeBytes: model.approxSizeMb * 1024 * 1024,
        cachedAt: new Date().toISOString(),
      })

      onProgress({
        status: 'ready',
        percent: 100,
        message: 'مدل با موفقیت روی دستگاه ذخیره شد و آماده استفاده آفلاین است.',
      })
    } catch (err: any) {
      onProgress({
        status: 'error',
        percent: 0,
        message: err.message || 'خطا در دانلود فایل‌های مدل',
      })
      throw err
    }
  }

  async deleteModel(modelId: string): Promise<void> {
    // Remove from in-memory cache
    delete transcriberInstances[modelId]

    // Remove from Dexie
    await db.models.delete(modelId)

    // Clear HuggingFace transformers browser cache if supported
    if (typeof caches !== 'undefined') {
      try {
        var keys = await caches.keys()
        for (var k of keys) {
          if (k.includes('transformers') || k.includes('onnx')) {
            await caches.delete(k)
          }
        }
      } catch {
        // ignore
      }
    }
  }

  async isModelReady(modelId: string): Promise<boolean> {
    var cached = await db.models.get(modelId)
    return !!cached
  }

  /**
   * Transcribe an audio Blob using the local Whisper ONNX pipeline.
   * Decodes audio to 16kHz PCM Float32Array in browser AudioContext.
   */
  async transcribeWithLocalModel(
    audioBlob: Blob,
    modelId: string,
    onProgress?: (statusText: string) => void
  ): Promise<string> {
    var isReady = await this.isModelReady(modelId)
    if (!isReady) {
      throw new Error('مدل هنوز دانلود نشده است. لطفاً ابتدا در تنظیمات مدل را دانلود کنید.')
    }

    var model = AVAILABLE_SPEECH_MODELS.find((m) => m.id === modelId)
    var repo = model?.huggingFaceRepo || 'onnx-community/whisper-tiny'

    onProgress?.('در حال آماده‌سازی پردازشگر هوش مصنوعی محلی...')

    var pipe = transcriberInstances[modelId]
    if (!pipe) {
      var { pipeline, env } = await import('@huggingface/transformers')
      env.allowLocalModels = false
      env.useBrowserCache = true

      pipe = await pipeline('automatic-speech-recognition', repo, {
        dtype: 'q8',
      })
      transcriberInstances[modelId] = pipe
    }

    onProgress?.('در حال استخراج امواج صوتی و تبدیل فرکانس به ۱۶ کیلوهرتز...')

    // Convert audio Blob to 16kHz Float32Array PCM samples
    var audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 16000,
    })

    try {
      var arrayBuffer = await audioBlob.arrayBuffer()
      var audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      var channelData = audioBuffer.getChannelData(0) // Float32Array

      onProgress?.('در حال شناسایی و پردازش گفتار فارسی با مدل محلی...')

      var output = await pipe(channelData, {
        language: 'persian',
        task: 'transcribe',
      })

      var resultText = ''
      if (typeof output === 'string') {
        resultText = output
      } else if (output && typeof output.text === 'string') {
        resultText = output.text
      } else if (Array.isArray(output) && output[0]?.text) {
        resultText = output[0].text
      }

      await audioCtx.close()
      return resultText.trim()
    } catch (err: any) {
      try {
        await audioCtx.close()
      } catch {
        // ignore
      }
      throw new Error('خطا در رمزگشایی یا پردازش صدا: ' + (err.message || 'خطای نامشخص'))
    }
  }
}

export const speechRecognitionService = new SpeechRecognitionService()

