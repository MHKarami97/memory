import nspell from 'nspell'
import type { SpellRequest, SpellResponse, UnknownWord } from '@/services/spell/spellProtocol'

const ZWNJ = '\u200c'

type SpellEngine = ReturnType<typeof nspell>

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<SpellRequest>) => void) | null
  postMessage(message: SpellResponse): void
}

var engine: SpellEngine | null = null

function isCorrect(checker: SpellEngine, word: string): boolean {
  if (checker.correct(word)) return true
  if (!word.includes(ZWNJ)) return false

  var parts = word.split(ZWNJ).filter(Boolean)
  return parts.every((part) => checker.correct(part)) || checker.correct(parts.join(''))
}

function findUnknown(checker: SpellEngine, words: string[], maxSuggestionWords: number, perWord: number): UnknownWord[] {
  var unknown: UnknownWord[] = []
  for (var word of words) {
    if (isCorrect(checker, word)) continue
    var suggestions = unknown.length < maxSuggestionWords ? checker.suggest(word).slice(0, perWord) : []
    unknown.push({ word, suggestions })
  }
  return unknown
}

scope.onmessage = (event) => {
  var request = event.data
  try {
    if (request.type === 'init') {
      engine = nspell(request.aff, request.dic)
      scope.postMessage({ id: request.id, ok: true })
      return
    }

    if (!engine) throw new Error('Spell engine is not initialised.')
    var unknown = findUnknown(engine, request.words, request.maxSuggestionWords, request.suggestionsPerWord)
    scope.postMessage({ id: request.id, ok: true, unknown })
  } catch (error) {
    scope.postMessage({ id: request.id, ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}
