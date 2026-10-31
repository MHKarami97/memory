import { WORD_END, WORD_START, escapeRegExp, normalizeDictionaryWord } from '@/utils/persianText'

const SLOT_OPEN = '\uE000'
const SLOT_CLOSE = '\uE001'
const SLOT_PATTERN = /\uE000(\d+)\uE001/g

const LOCKED_SOURCE =
  '```[\\s\\S]*?```|`[^`\\n]+`|https?:\\/\\/[^\\s)]+|[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+|\\bwww\\.[^\\s)]+'

export interface LockedRegion {
  start: number
  end: number
}

export class LockedRegionFinder {
  static find(text: string): LockedRegion[] {
    var regions: LockedRegion[] = []
    for (var match of text.matchAll(new RegExp(LOCKED_SOURCE, 'g'))) {
      regions.push({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length })
    }
    return regions
  }
}

export class ProtectedTextGuard {
  private slots: string[] = []
  private static cachedKey = ''
  private static cachedPattern: RegExp | null = null

  protect(text: string, words: readonly string[]): string {
    this.slots = []

    var locked = text.replace(new RegExp(LOCKED_SOURCE, 'g'), (match) => this.store(match))
    var pattern = ProtectedTextGuard.wordPattern(words)
    if (!pattern) return locked

    return locked.replace(new RegExp(pattern.source, pattern.flags), (_match, prefix: string, word: string) => {
      return prefix + this.store(word)
    })
  }

  restore(text: string): string {
    return text.replace(SLOT_PATTERN, (_match, index: string) => this.slots[Number(index)] ?? '')
  }

  private store(value: string): string {
    this.slots.push(value)
    return SLOT_OPEN + (this.slots.length - 1) + SLOT_CLOSE
  }

  private static wordPattern(words: readonly string[]): RegExp | null {
    var normalized = Array.from(new Set(words.map(normalizeDictionaryWord).filter(Boolean)))
    if (normalized.length === 0) return null

    var key = normalized.join('\u0000')
    if (key === ProtectedTextGuard.cachedKey) return ProtectedTextGuard.cachedPattern

    var alternatives = normalized
      .sort((left, right) => right.length - left.length)
      .map((word) => escapeRegExp(word).replace(/ /g, '[ \\t]+'))
      .join('|')

    ProtectedTextGuard.cachedKey = key
    ProtectedTextGuard.cachedPattern = new RegExp(`${WORD_START}(${alternatives})${WORD_END}`, 'giu')
    return ProtectedTextGuard.cachedPattern
  }
}
