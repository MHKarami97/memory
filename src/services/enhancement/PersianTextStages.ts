import { ENGLISH_TYPOS, PERSIAN_TYPOS } from '@/services/enhancement/lexicons'
import { PERSIAN_RANGE, WORD_END, WORD_START, ZWNJ, escapeRegExp } from '@/utils/persianText'

export interface TextStage {
  readonly name: string
  apply(text: string): string
}

export class ArabicCharacterStage implements TextStage {
  readonly name = 'arabic-characters'

  apply(text: string): string {
    return text
      .replace(/\u064A/g, '\u06CC')
      .replace(/\u0643/g, '\u06A9')
      .replace(/\u0629(?![\p{L}\p{N}\u200c])/gu, '\u0647')
      .replace(/\u200c{2,}/g, ZWNJ)
      .replace(/\u200c+([ \t\n])/g, '$1')
      .replace(/([ \t\n])\u200c+/g, '$1')
  }
}

export class HalfSpaceStage implements TextStage {
  readonly name = 'half-space'

  private readonly verbPrefix = new RegExp(`${WORD_START}(ن?می)[ \\t]+(?=\\p{L})`, 'gu')
  private readonly pluralSuffix = new RegExp(
    `([${PERSIAN_RANGE}])[ \\t]+(ها|های|هایی|هایم|هایت|هایش|هایمان|هایتان|هایشان)${WORD_END}`,
    'gu'
  )
  private readonly comparativeSuffix = new RegExp(`([${PERSIAN_RANGE}])[ \\t]+(تر|ترین)${WORD_END}`, 'gu')
  private readonly possessiveSuffix = new RegExp(`(ه)[ \\t]+(ای|ام|ات|اش|مان|تان|شان)${WORD_END}`, 'gu')
  private readonly compounds: RegExp
  private static readonly COMPOUND_PHRASES = [
    'به عنوان',
    'به صورت',
    'به ویژه',
    'دست کم',
    'فوق العاده',
    'علاقه مند',
    'علاقه مندی',
    'گفت و گو',
    'رفت و آمد',
    'جست و جو',
    'خوش حال',
    'بی دلیل',
    'بی نهایت',
    'بی فایده',
    'رو به رو',
  ]

  constructor() {
    var alternatives = HalfSpaceStage.COMPOUND_PHRASES.slice()
      .sort((left, right) => right.length - left.length)
      .map((phrase) => escapeRegExp(phrase).replace(/ /g, '[ \\t]+'))
      .join('|')
    this.compounds = new RegExp(`${WORD_START}(${alternatives})${WORD_END}`, 'gu')
  }

  apply(text: string): string {
    return text
      .replace(this.verbPrefix, `$1$2${ZWNJ}`)
      .replace(this.pluralSuffix, `$1${ZWNJ}$2`)
      .replace(this.comparativeSuffix, `$1${ZWNJ}$2`)
      .replace(this.possessiveSuffix, `$1${ZWNJ}$2`)
      .replace(this.compounds, (_match, prefix: string, phrase: string) => prefix + phrase.replace(/[ \t]+/g, ZWNJ))
  }
}

export class LexiconTypoStage implements TextStage {
  readonly name = 'persian-typos'

  private readonly lexicon: ReadonlyMap<string, string>
  private readonly pattern: RegExp | null

  constructor(lexicon: Readonly<Record<string, string>> = PERSIAN_TYPOS) {
    this.lexicon = new Map(Object.entries(lexicon))
    var alternatives = Array.from(this.lexicon.keys())
      .sort((left, right) => right.length - left.length)
      .map((key) => escapeRegExp(key).replace(/ /g, '[ \\t]+'))
      .join('|')
    this.pattern = alternatives ? new RegExp(`${WORD_START}(${alternatives})${WORD_END}`, 'gu') : null
  }

  apply(text: string): string {
    if (!this.pattern) return text
    return text.replace(this.pattern, (_match, prefix: string, word: string) => {
      return prefix + (this.lexicon.get(word.replace(/[ \t]+/g, ' ')) ?? word)
    })
  }
}

export class EnglishTypoStage implements TextStage {
  readonly name = 'english-typos'

  private readonly lexicon: ReadonlyMap<string, string>
  private readonly pattern: RegExp

  constructor(lexicon: Readonly<Record<string, string>> = ENGLISH_TYPOS) {
    this.lexicon = new Map(Object.entries(lexicon))
    var alternatives = Array.from(this.lexicon.keys()).map(escapeRegExp).join('|')
    this.pattern = new RegExp(`\\b(?:${alternatives})\\b`, 'gi')
  }

  apply(text: string): string {
    return text.replace(this.pattern, (match) => {
      var fix = this.lexicon.get(match.toLowerCase()) ?? match
      return match[0] === match[0].toUpperCase() ? fix.charAt(0).toUpperCase() + fix.slice(1) : fix
    })
  }
}

export class PunctuationStage implements TextStage {
  readonly name = 'punctuation'

  apply(text: string): string {
    var persian = `[${PERSIAN_RANGE}]`
    return text
      .replace(new RegExp(`(${persian})[ \\t]*\\?`, 'g'), '$1؟')
      .replace(new RegExp(`(${persian})[ \\t]*,(?!\\d)`, 'g'), '$1،')
      .replace(new RegExp(`(${persian})[ \\t]*;`, 'g'), '$1؛')
      .replace(/[ \t]+([!؟،؛:.])/g, '$1')
      .replace(new RegExp(`(${persian})([.!:])(?=${persian})`, 'g'), '$1$2 ')
      .replace(new RegExp(`([؟،؛])(?=[${PERSIAN_RANGE}A-Za-z])`, 'g'), '$1 ')
      .replace(/!{2,}/g, '!')
      .replace(/؟{2,}/g, '؟')
      .replace(/،{2,}/g, '،')
  }
}

export class SmartMarkdownStage implements TextStage {
  readonly name = 'smart-markdown'

  private static readonly EMPHASIS_KEYWORDS = [
    'نکته مهم:',
    'نکته:',
    'یادآوری:',
    'توجه:',
    'مهم:',
    'نتیجه:',
    'هدف:',
    'موضوع:',
    'هشدار:',
    'توصیه:',
    'خلاصه:',
    'Note:',
    'Important:',
    'Warning:',
    'Tip:',
    'Reminder:',
  ]

  apply(text: string): string {
    if (!text) return ''

    var lines = text.split('\n').map((line) => this.formatLine(line))
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  }

  private formatLine(line: string): string {
    if (!line.trim()) return ''

    var processed = this.normalizeListMarker(line)
    return this.emphasizeKeyword(processed).trimEnd()
  }

  private normalizeListMarker(line: string): string {
    var match = line.trim().match(/^([۰-۹0-9]+[)\-]|[-•*])\s+(.+)$/)
    if (!match) return line

    var marker = match[1]
    var content = match[2]
    return /^[۰-۹0-9]+[)\-]/.test(marker) ? `${marker.replace(/[)\-]/, '')}. ${content}` : `- ${content}`
  }

  private emphasizeKeyword(line: string): string {
    var trimmed = line.trim()
    for (var keyword of SmartMarkdownStage.EMPHASIS_KEYWORDS) {
      if (trimmed.startsWith(keyword) && !trimmed.startsWith(`**${keyword}**`)) {
        return `**${keyword}** ${trimmed.substring(keyword.length).trim()}`
      }
    }
    return line
  }
}
