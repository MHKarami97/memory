import { LockedRegionFinder } from '@/services/enhancement/ProtectedTextGuard'
import type { SpellRequest, SpellResponse, UnknownWord } from '@/services/spell/spellProtocol'
import { normalizeDictionaryWord } from '@/utils/persianText'

export interface SpellIssue {
  id: string
  word: string
  start: number
  end: number
  suggestions: string[]
}

type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never

interface PendingRequest {
  resolve: (response: SpellResponse) => void
  reject: (error: Error) => void
}

export class SpellCheckService {
  private static readonly TOKEN_PATTERN = /[\p{L}\p{M}\u200c]+/gu
  private static readonly PERSIAN_ONLY = /^[\u0600-\u06FF\u200c]+$/
  private static readonly IDLE_DISPOSE_MS = 120_000
  private static readonly MAX_ISSUES = 300
  private static readonly MAX_SUGGESTION_WORDS = 80
  private static readonly SUGGESTIONS_PER_WORD = 5

  private worker: Worker | null = null
  private ready: Promise<void> | null = null
  private nextRequestId = 1
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private readonly pending = new Map<number, PendingRequest>()

  async findIssues(text: string, shouldIgnore: (normalizedWord: string) => boolean): Promise<SpellIssue[]> {
    await this.ensureReady()

    var occurrences = this.collectOccurrences(text, shouldIgnore)
    if (occurrences.size === 0) return []

    var response = await this.send({
      type: 'check',
      words: Array.from(occurrences.keys()),
      maxSuggestionWords: SpellCheckService.MAX_SUGGESTION_WORDS,
      suggestionsPerWord: SpellCheckService.SUGGESTIONS_PER_WORD,
    })
    this.scheduleIdleDispose()

    return this.buildIssues(response.unknown ?? [], occurrences)
  }

  dispose(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = null
    this.worker?.terminate()
    this.worker = null
    this.ready = null
    this.pending.forEach((request) => request.reject(new Error('Spell checker was disposed.')))
    this.pending.clear()
  }

  ensureReady(): Promise<void> {
    if (!this.ready) {
      this.ready = this.initialise().catch((error) => {
        this.dispose()
        throw error
      })
    }
    return this.ready
  }

  private async initialise(): Promise<void> {
    var base = `${import.meta.env.BASE_URL}dictionaries/fa/`
    var [aff, dic] = await Promise.all([this.fetchDictionaryFile(`${base}fa.aff`), this.fetchDictionaryFile(`${base}fa.dic`)])

    if (!/^\s*\d+/.test(dic)) {
      throw new Error('فایل دیکشنری املایی نامعتبر است. دستور prepare:dictionary را اجرا کنید.')
    }

    this.worker = new Worker(new URL('./spell.worker.ts', import.meta.url), { type: 'module' })
    this.worker.onmessage = (event: MessageEvent<SpellResponse>) => this.handleMessage(event.data)
    this.worker.onerror = (event) => this.failAll(new Error(event.message || 'Spell worker failed.'))

    await this.send({ type: 'init', aff, dic })
  }

  private async fetchDictionaryFile(url: string): Promise<string> {
    var response = await fetch(url)
    if (!response.ok) throw new Error('دیکشنری املایی فارسی پیدا نشد. دستور prepare:dictionary را اجرا کنید.')
    return response.text()
  }

  private send(payload: DistributiveOmit<SpellRequest, 'id'>): Promise<Extract<SpellResponse, { ok: true }>> {
    var worker = this.worker
    if (!worker) return Promise.reject(new Error('Spell worker is not available.'))

    var id = this.nextRequestId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, {
        resolve: (response) => (response.ok ? resolve(response) : reject(new Error(response.error))),
        reject,
      })
      worker.postMessage({ ...payload, id })
    })
  }

  private handleMessage(response: SpellResponse): void {
    var request = this.pending.get(response.id)
    if (!request) return
    this.pending.delete(response.id)
    request.resolve(response)
  }

  private failAll(error: Error): void {
    this.pending.forEach((request) => request.reject(error))
    this.pending.clear()
  }

  private scheduleIdleDispose(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = setTimeout(() => this.dispose(), SpellCheckService.IDLE_DISPOSE_MS)
  }

  private collectOccurrences(text: string, shouldIgnore: (normalizedWord: string) => boolean) {
    var locked = LockedRegionFinder.find(text)
    var lockedIndex = 0
    var occurrences = new Map<string, Array<{ start: number; end: number }>>()

    for (var match of text.matchAll(SpellCheckService.TOKEN_PATTERN)) {
      var start = match.index ?? 0
      var end = start + match[0].length

      while (lockedIndex < locked.length && locked[lockedIndex].end <= start) lockedIndex++
      if (lockedIndex < locked.length && locked[lockedIndex].start < end) continue

      var trimmedStart = start + (match[0].length - match[0].replace(/^\u200c+/, '').length)
      var word = match[0].replace(/^\u200c+|\u200c+$/g, '')
      var trimmedEnd = trimmedStart + word.length

      if (word.length < 2 || !SpellCheckService.PERSIAN_ONLY.test(word)) continue
      if (shouldIgnore(normalizeDictionaryWord(word))) continue

      var list = occurrences.get(word) ?? []
      list.push({ start: trimmedStart, end: trimmedEnd })
      occurrences.set(word, list)
    }
    return occurrences
  }

  private buildIssues(unknown: UnknownWord[], occurrences: Map<string, Array<{ start: number; end: number }>>) {
    var issues: SpellIssue[] = []
    for (var entry of unknown) {
      for (var range of occurrences.get(entry.word) ?? []) {
        if (issues.length >= SpellCheckService.MAX_ISSUES) break
        issues.push({
          id: `${range.start}:${entry.word}`,
          word: entry.word,
          start: range.start,
          end: range.end,
          suggestions: entry.suggestions,
        })
      }
    }
    return issues.sort((left, right) => left.start - right.start)
  }
}

export const spellCheckService = new SpellCheckService()
