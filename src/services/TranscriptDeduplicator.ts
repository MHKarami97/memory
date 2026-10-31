export class TranscriptDeduplicator {
  private static readonly REPEAT_WINDOW_MS = 1500
  private static readonly MIN_OVERLAP_WORDS = 3

  private readonly committedByIndex = new Map<number, string>()
  private instanceText = ''
  private lastEmitted = ''
  private lastEmittedAt = 0

  startNewInstance(): void {
    this.committedByIndex.clear()
    this.instanceText = ''
  }

  accept(resultIndex: number, rawText: string, now: number = Date.now()): string {
    var text = TranscriptDeduplicator.normalize(rawText)
    if (!text) return ''

    var previous = this.committedByIndex.get(resultIndex)
    var fresh = previous === undefined ? this.stripCommittedPart(text) : this.stripPrefix(text, previous)

    if (previous === undefined || fresh) {
      this.committedByIndex.set(resultIndex, text)
    }

    if (!fresh || this.isQuickRepeat(fresh, now)) return ''

    this.instanceText = TranscriptDeduplicator.join(this.instanceText, fresh)
    this.lastEmitted = fresh
    this.lastEmittedAt = now
    return fresh
  }

  trimInterim(rawText: string): string {
    return this.stripCommittedPart(TranscriptDeduplicator.normalize(rawText))
  }

  static normalize(text: string): string {
    return text.replace(/\s+/g, ' ').trim()
  }

  static join(left: string, right: string): string {
    if (!left) return right
    if (!right) return left
    return left + ' ' + right
  }

  private stripCommittedPart(text: string): string {
    var committed = this.instanceText
    if (!committed || !text) return text

    if (text === committed || TranscriptDeduplicator.endsWithWords(committed, text)) return ''
    if (TranscriptDeduplicator.startsWithWords(text, committed)) return this.stripPrefix(text, committed)

    return this.stripWordOverlap(committed, text)
  }

  private stripPrefix(text: string, prefix: string): string {
    if (text === prefix) return ''
    return TranscriptDeduplicator.startsWithWords(text, prefix) ? text.slice(prefix.length).trim() : ''
  }

  private stripWordOverlap(committed: string, text: string): string {
    var committedWords = committed.split(' ')
    var textWords = text.split(' ')
    var maxOverlap = Math.min(committedWords.length, textWords.length - 1)

    for (var size = maxOverlap; size >= TranscriptDeduplicator.MIN_OVERLAP_WORDS; size--) {
      var tail = committedWords.slice(committedWords.length - size).join(' ')
      var head = textWords.slice(0, size).join(' ')
      if (tail === head) return textWords.slice(size).join(' ')
    }

    return text
  }

  private isQuickRepeat(fresh: string, now: number): boolean {
    return fresh === this.lastEmitted && now - this.lastEmittedAt < TranscriptDeduplicator.REPEAT_WINDOW_MS
  }

  private static startsWithWords(text: string, prefix: string): boolean {
    return text === prefix || text.startsWith(prefix + ' ')
  }

  private static endsWithWords(text: string, suffix: string): boolean {
    return text === suffix || text.endsWith(' ' + suffix)
  }
}
