export interface SpellInitRequest {
  id: number
  type: 'init'
  aff: string
  dic: string
}

export interface SpellCheckRequest {
  id: number
  type: 'check'
  words: string[]
  maxSuggestionWords: number
  suggestionsPerWord: number
}

export type SpellRequest = SpellInitRequest | SpellCheckRequest

export interface UnknownWord {
  word: string
  suggestions: string[]
}

export type SpellResponse =
  | { id: number; ok: true; unknown?: UnknownWord[] }
  | { id: number; ok: false; error: string }
