import { AVAILABLE_TEXT_MODELS, type LocalTextModel } from '@/models/TextModel'
import { db } from '@/repositories/DexieDatabase'
import { LlmCorrectionValidator } from '@/services/textmodel/LlmCorrectionValidator'
import { ParagraphChunker } from '@/services/textmodel/ParagraphChunker'
import type {
  ChatMessage,
  DownloadProgress,
  ModelAttempt,
  TextModelResponse,
} from '@/services/textmodel/textModelProtocol'

export interface TextModelProgressInfo {
  status: 'init' | 'downloading' | 'ready' | 'error'
  percent: number
  loadedBytes?: number
  totalBytes?: number
  file?: string
  message?: string
}

export interface AiCorrectionResult {
  text: string
  totalChunks: number
  changedChunks: number
  rejectedChunks: number
}

interface PendingRequest {
  resolve: (data: unknown) => void
  reject: (error: Error) => void
  onProgress?: (data: DownloadProgress) => void
}

export class LocalTextModelService {
  private static readonly SYSTEM_PROMPT =
    'You are a careful Persian (Farsi) proofreader. Fix ONLY spelling mistakes, typos, wrong letters, missing half-spaces (ZWNJ) and punctuation. ' +
    'Never rephrase, summarize, translate, add or remove sentences. Keep numbers, English words, names, URLs, emojis and Markdown symbols exactly as they are. ' +
    'Output only the corrected text, nothing else.'
  private static readonly MARKDOWN_PREFIX = /^(\s*(?:#{1,6}|>|[-*•]|\d+[.)])\s+)/
  private static readonly CACHE_NAME_HINT = 'transformers'

  private worker: Worker | null = null
  private nextRequestId = 1
  private readonly pending = new Map<number, PendingRequest>()
  private readonly validator = new LlmCorrectionValidator()
  private readonly chunker = new ParagraphChunker()

  isWebGpuAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator
  }

  async getAvailableModels(): Promise<LocalTextModel[]> {
    var cached = new Map((await db.models.toArray()).map((entry) => [entry.id, entry]))
    return AVAILABLE_TEXT_MODELS.map((model) => {
      var entry = cached.get(model.id)
      return { ...model, isDownloaded: !!entry, downloadStatus: entry ? 'ready' : 'idle', variant: entry?.variant }
    })
  }

  async isModelReady(modelId: string): Promise<boolean> {
    return !!(await db.models.get(modelId))
  }

  async downloadModel(modelId: string, onProgress: (info: TextModelProgressInfo) => void): Promise<void> {
    var model = this.requireModel(modelId)
    onProgress({ status: 'init', percent: 3, message: 'در حال اتصال به مخزن مدل...' })

    try {
      var loaded = await this.load(model, true, (data) => {
        onProgress({
          status: 'downloading',
          percent: data.percent,
          loadedBytes: data.loadedBytes,
          totalBytes: data.totalBytes,
          file: data.file,
          message: `در حال دریافت فایل‌های مدل: ${data.percent}٪`,
        })
      })

      await db.models.put({
        id: model.id,
        name: model.name,
        sizeBytes: model.approxSizeMb * 1024 * 1024,
        cachedAt: new Date().toISOString(),
        variant: `${loaded.device}:${loaded.dtype}`,
      })
      onProgress({ status: 'ready', percent: 100, message: 'مدل روی دستگاه ذخیره شد و آفلاین قابل استفاده است.' })
    } catch (error) {
      onProgress({ status: 'error', percent: 0, message: error instanceof Error ? error.message : 'خطا در دانلود مدل' })
      throw error
    } finally {
      this.dispose()
    }
  }

  async deleteModel(modelId: string): Promise<void> {
    var model = this.requireModel(modelId)
    await db.models.delete(modelId)

    if (typeof caches === 'undefined') return
    try {
      for (var cacheName of await caches.keys()) {
        if (!cacheName.includes(LocalTextModelService.CACHE_NAME_HINT)) continue
        var cache = await caches.open(cacheName)
        for (var request of await cache.keys()) {
          if (request.url.includes(`/${model.huggingFaceRepo}/`)) await cache.delete(request)
        }
      }
    } catch {
      // cache cleanup is best-effort
    }
  }

  async correct(
    text: string,
    modelId: string,
    protectedWords: readonly string[],
    onProgress?: (percent: number, message: string) => void
  ): Promise<AiCorrectionResult> {
    var model = this.requireModel(modelId)
    if (!(await this.isModelReady(modelId))) {
      throw new Error('مدل هنوز دانلود نشده است. ابتدا از تنظیمات آن را دانلود کنید.')
    }

    onProgress?.(0, 'در حال بارگذاری مدل از حافظه دستگاه...')
    await this.load(model, false)

    var chunks = this.chunker.split(text)
    var correctable = chunks.filter((chunk) => chunk.isCorrectable).length
    var done = 0
    var changed = 0
    var rejected = 0
    var parts: string[] = []

    for (var chunk of chunks) {
      if (!chunk.isCorrectable) {
        parts.push(chunk.text)
        continue
      }

      var corrected = await this.correctChunk(model, chunk.text, protectedWords)
      if (corrected === null) rejected++
      else if (corrected !== chunk.text) changed++
      parts.push(corrected ?? chunk.text)

      done++
      onProgress?.(Math.round((done / Math.max(1, correctable)) * 100), `در حال بررسی بخش ${done} از ${correctable}...`)
    }

    return { text: parts.join(''), totalChunks: correctable, changedChunks: changed, rejectedChunks: rejected }
  }

  dispose(): void {
    this.worker?.terminate()
    this.worker = null
    this.pending.forEach((request) => request.reject(new Error('پردازش لغو شد.')))
    this.pending.clear()
  }

  private async correctChunk(model: LocalTextModel, chunk: string, protectedWords: readonly string[]): Promise<string | null> {
    var leading = chunk.match(/^\s*/)?.[0] ?? ''
    var trailing = chunk.match(/\s*$/)?.[0] ?? ''
    var core = chunk.trim()

    var markdownPrefix = core.match(LocalTextModelService.MARKDOWN_PREFIX)?.[1] ?? ''
    var body = core.slice(markdownPrefix.length)

    var raw = await this.send<string>({
      type: 'generate',
      messages: this.buildMessages(model, body, protectedWords),
      maxNewTokens: Math.min(1024, body.length + 64),
    })

    var cleaned = this.cleanOutput(raw)
    if (!this.validator.isAcceptable(body, cleaned, protectedWords)) return null
    return leading + markdownPrefix + cleaned + trailing
  }

  private buildMessages(model: LocalTextModel, body: string, protectedWords: readonly string[]): ChatMessage[] {
    var keep = protectedWords.length > 0 ? `Words that must stay exactly as written: ${protectedWords.slice(0, 200).join(', ')}\n\n` : ''
    var switchOff = model.supportsThinkingSwitch ? '/no_think\n' : ''
    return [
      { role: 'system', content: LocalTextModelService.SYSTEM_PROMPT },
      { role: 'user', content: `${switchOff}${keep}Text:\n${body}` },
    ]
  }

  private cleanOutput(raw: string): string {
    return raw
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^\s*(?:Text|Corrected text|متن)\s*:\s*/i, '')
      .trim()
  }

  private async load(model: LocalTextModel, allowRemote: boolean, onProgress?: (data: DownloadProgress) => void) {
    this.dispose()
    this.worker = new Worker(new URL('./llm.worker.ts', import.meta.url), { type: 'module' })
    this.worker.onmessage = (event: MessageEvent<TextModelResponse>) => this.handleMessage(event.data)
    this.worker.onerror = (event) => this.failAll(new Error(event.message || 'Text model worker failed.'))

    var preferred = (await db.models.get(model.id))?.variant
    return this.send<ModelAttempt>(
      { type: 'load', repo: model.huggingFaceRepo, attempts: this.buildAttempts(model, preferred), allowRemote },
      onProgress
    )
  }

  private buildAttempts(model: LocalTextModel, preferredVariant?: string): ModelAttempt[] {
    var attempts: ModelAttempt[] = []
    if (this.isWebGpuAvailable()) {
      model.webGpuDtypes.forEach((dtype) => attempts.push({ device: 'webgpu', dtype }))
    }
    model.wasmDtypes.forEach((dtype) => attempts.push({ device: 'wasm', dtype }))

    if (!preferredVariant) return attempts
    var [device, dtype] = preferredVariant.split(':')
    var preferred = attempts.filter((attempt) => attempt.device === device && attempt.dtype === dtype)
    var others = attempts.filter((attempt) => !(attempt.device === device && attempt.dtype === dtype))
    return [...preferred, ...others]
  }

  private send<T>(payload: object, onProgress?: (data: DownloadProgress) => void): Promise<T> {
    var worker = this.worker
    if (!worker) return Promise.reject(new Error('پردازشگر مدل در دسترس نیست.'))

    var id = this.nextRequestId++
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (data: unknown) => void, reject, onProgress })
      worker.postMessage({ ...payload, id })
    })
  }

  private handleMessage(response: TextModelResponse): void {
    var request = this.pending.get(response.id)
    if (!request) return

    if (response.kind === 'progress') {
      request.onProgress?.(response.data)
      return
    }

    this.pending.delete(response.id)
    if (response.kind === 'error') request.reject(new Error(response.message))
    else request.resolve(response.data)
  }

  private failAll(error: Error): void {
    this.pending.forEach((request) => request.reject(error))
    this.pending.clear()
  }

  private requireModel(modelId: string): LocalTextModel {
    var model = AVAILABLE_TEXT_MODELS.find((candidate) => candidate.id === modelId)
    if (!model) throw new Error('مدل انتخابی یافت نشد.')
    return model
  }
}

export const localTextModelService = new LocalTextModelService()
