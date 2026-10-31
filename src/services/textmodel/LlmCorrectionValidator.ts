import { normalizeDictionaryWord } from '@/utils/persianText'

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

export class LlmCorrectionValidator {
  private static readonly MIN_LENGTH_RATIO = 0.75
  private static readonly MAX_LENGTH_RATIO = 1.35
  private static readonly MIN_WORD_RATIO = 0.8
  private static readonly MAX_WORD_RATIO = 1.25
  private static readonly FOREIGN_SCRIPT = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\u0400-\u04ff]/

  isAcceptable(original: string, corrected: string, protectedWords: readonly string[]): boolean {
    if (!corrected.trim()) return false
    if (/<\/?think>/i.test(corrected)) return false
    if (!this.hasSimilarSize(original, corrected)) return false
    if (LlmCorrectionValidator.FOREIGN_SCRIPT.test(corrected) && !LlmCorrectionValidator.FOREIGN_SCRIPT.test(original)) {
      return false
    }
    if (!this.sameTokens(this.digitRuns(original), this.digitRuns(corrected))) return false
    if (!this.sameTokens(this.latinWords(original), this.latinWords(corrected))) return false
    return this.keepsProtectedWords(original, corrected, protectedWords)
  }

  private hasSimilarSize(original: string, corrected: string): boolean {
    var lengthRatio = corrected.length / Math.max(1, original.length)
    var wordRatio = this.wordCount(corrected) / Math.max(1, this.wordCount(original))
    return (
      lengthRatio >= LlmCorrectionValidator.MIN_LENGTH_RATIO &&
      lengthRatio <= LlmCorrectionValidator.MAX_LENGTH_RATIO &&
      wordRatio >= LlmCorrectionValidator.MIN_WORD_RATIO &&
      wordRatio <= LlmCorrectionValidator.MAX_WORD_RATIO
    )
  }

  private wordCount(text: string): number {
    return text.split(/\s+/).filter(Boolean).length
  }

  private digitRuns(text: string): string[] {
    var ascii = text.replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit))).replace(/[٠-٩]/g, (digit) => {
      return String(ARABIC_DIGITS.indexOf(digit))
    })
    return ascii.match(/\d+/g) ?? []
  }

  private latinWords(text: string): string[] {
    return (text.match(/[A-Za-z]+/g) ?? []).map((word) => word.toLowerCase())
  }

  private sameTokens(left: string[], right: string[]): boolean {
    if (left.length !== right.length) return false
    var sortedLeft = left.slice().sort()
    var sortedRight = right.slice().sort()
    return sortedLeft.every((token, index) => token === sortedRight[index])
  }

  private keepsProtectedWords(original: string, corrected: string, protectedWords: readonly string[]): boolean {
    var normalizedOriginal = normalizeDictionaryWord(original)
    var normalizedCorrected = normalizeDictionaryWord(corrected)
    return protectedWords.every((word) => {
      return this.occurrences(normalizedCorrected, word) >= this.occurrences(normalizedOriginal, word)
    })
  }

  private occurrences(text: string, word: string): number {
    if (!word) return 0
    return text.split(word).length - 1
  }
}
