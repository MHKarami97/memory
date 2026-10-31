export const ZWNJ = '\u200c'

const LETTER_DIGIT_ZWNJ = '\\p{L}\\p{N}\\u200c'

export const PERSIAN_RANGE = '\\u0600-\\u06FF'
export const WORD_START = `(^|[^${LETTER_DIGIT_ZWNJ}])`
export const WORD_END = `(?![${LETTER_DIGIT_ZWNJ}])`

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function normalizeArabicVariants(text: string): string {
  return text.replace(/\u064A/g, '\u06CC').replace(/\u0643/g, '\u06A9')
}

export function normalizeDictionaryWord(raw: string): string {
  return normalizeArabicVariants(raw.normalize('NFC'))
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function hasLetter(value: string): boolean {
  return /\p{L}/u.test(value)
}
