import { TranscriptDeduplicator } from '@/services/TranscriptDeduplicator'

export interface DictationCallbacks {
  onResult?: (fullText: string, isFinal: boolean) => void
  onSegment?: (newFinalSegment: string) => void
  onInterim?: (interimText: string) => void
  onError?: (error: string) => void
  onEnd?: () => void
}

type SpeechRecognitionConstructor = new () => any

const FATAL_ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'دسترسی به میکروفون رد شد. لطفاً در تنظیمات مرورگر دسترسی به میکروفون را فعال کنید.',
  'service-not-allowed': 'سرویس تشخیص گفتار در این مرورگر یا دستگاه مجاز نیست.',
  'audio-capture': 'میکروفون در دسترس نیست یا توسط برنامه دیگری استفاده می‌شود.',
  'language-not-supported': 'زبان فارسی توسط سرویس تشخیص گفتار این دستگاه پشتیبانی نمی‌شود.',
}

const IGNORED_ERRORS = ['no-speech', 'aborted']

export class DictationSession {
  private static readonly RESTART_DELAY_MS = 150
  private static readonly MAX_BACKOFF_MS = 2000
  private static readonly FAST_FAILURE_MS = 500
  private static readonly MAX_FAST_FAILURES = 8
  private static readonly STOP_GRACE_MS = 1500

  private readonly dedupe = new TranscriptDeduplicator()
  private readonly recognitionConstructor: SpeechRecognitionConstructor
  private readonly callbacks: DictationCallbacks
  private readonly language: string

  private recognition: any = null
  private restartTimer: ReturnType<typeof setTimeout> | null = null
  private stopGraceTimer: ReturnType<typeof setTimeout> | null = null
  private isStopped = false
  private hasFinished = false
  private committedText = ''
  private instanceStartedAt = 0
  private instanceProducedResult = false
  private fastFailures = 0

  constructor(
    recognitionConstructor: SpeechRecognitionConstructor,
    callbacks: DictationCallbacks,
    language: string = 'fa-IR'
  ) {
    this.recognitionConstructor = recognitionConstructor
    this.callbacks = callbacks
    this.language = language
  }

  start(): void {
    this.launchInstance()
  }

  stop(): void {
    if (this.isStopped) return
    this.isStopped = true
    this.clearRestartTimer()

    var current = this.recognition
    if (!current) {
      this.finish()
      return
    }

    // The final results of the current utterance arrive before `onend`, so keep the instance attached.
    this.stopGraceTimer = setTimeout(() => this.finish(), DictationSession.STOP_GRACE_MS)
    try {
      current.stop()
    } catch {
      this.finish()
    }
  }

  private launchInstance(): void {
    if (this.isStopped) return

    var recognition = new this.recognitionConstructor()
    recognition.lang = this.language
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    // Events from a replaced or finished instance must never reach the session.
    recognition.onresult = (event: any) => {
      if (recognition === this.recognition) this.handleResult(event)
    }
    recognition.onerror = (event: any) => {
      if (recognition === this.recognition) this.handleError(event)
    }
    recognition.onend = () => {
      if (recognition === this.recognition) this.handleEnd()
    }

    this.recognition = recognition
    this.dedupe.startNewInstance()
    this.instanceStartedAt = Date.now()
    this.instanceProducedResult = false

    try {
      recognition.start()
    } catch {
      this.recognition = null
      this.scheduleRestart()
    }
  }

  private handleResult(event: any): void {
    this.instanceProducedResult = true
    this.fastFailures = 0

    var interim = ''
    for (var i = event.resultIndex; i < event.results.length; i++) {
      var result = event.results[i]
      var transcript: string = result[0]?.transcript ?? ''

      if (result.isFinal) {
        this.commitSegment(this.dedupe.accept(i, transcript))
      } else {
        interim += transcript
      }
    }

    var cleanInterim = this.dedupe.trimInterim(interim)
    this.callbacks.onInterim?.(cleanInterim)
    this.callbacks.onResult?.(TranscriptDeduplicator.join(this.committedText, cleanInterim), !cleanInterim)
  }

  private commitSegment(segment: string): void {
    if (!segment) return
    this.committedText = TranscriptDeduplicator.join(this.committedText, segment)
    this.callbacks.onSegment?.(segment)
  }

  private handleError(event: any): void {
    var code: string = event?.error ?? 'unknown'
    if (IGNORED_ERRORS.includes(code)) return

    var fatalMessage = FATAL_ERROR_MESSAGES[code]
    if (fatalMessage) {
      this.isStopped = true
      this.clearRestartTimer()
      this.callbacks.onError?.(fatalMessage)
      this.abortCurrentInstance()
      this.finish()
      return
    }

    console.warn('Speech recognition notice:', code)
  }

  private abortCurrentInstance(): void {
    try {
      this.recognition?.abort()
    } catch {
      // the instance is already closed
    }
  }

  private handleEnd(): void {
    this.recognition = null

    if (this.isStopped) {
      this.finish()
      return
    }

    var livedMs = Date.now() - this.instanceStartedAt
    var failedFast = !this.instanceProducedResult && livedMs < DictationSession.FAST_FAILURE_MS
    this.fastFailures = failedFast ? this.fastFailures + 1 : 0

    if (this.fastFailures >= DictationSession.MAX_FAST_FAILURES) {
      this.isStopped = true
      this.callbacks.onError?.('تشخیص گفتار به‌طور مکرر قطع می‌شود. اتصال اینترنت و دسترسی میکروفون را بررسی کنید.')
      this.finish()
      return
    }

    this.scheduleRestart()
  }

  private scheduleRestart(): void {
    if (this.isStopped || this.restartTimer) return

    var backoff = DictationSession.RESTART_DELAY_MS * Math.pow(2, this.fastFailures)
    var delay = Math.min(DictationSession.MAX_BACKOFF_MS, backoff)

    this.restartTimer = setTimeout(() => {
      this.restartTimer = null
      this.launchInstance()
    }, delay)
  }

  private clearRestartTimer(): void {
    if (!this.restartTimer) return
    clearTimeout(this.restartTimer)
    this.restartTimer = null
  }

  private finish(): void {
    if (this.hasFinished) return
    this.hasFinished = true
    this.clearRestartTimer()

    if (this.stopGraceTimer) clearTimeout(this.stopGraceTimer)
    this.stopGraceTimer = null

    this.recognition = null
    this.callbacks.onEnd?.()
  }
}
