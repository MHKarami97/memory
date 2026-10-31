import { ProtectedTextGuard } from '@/services/enhancement/ProtectedTextGuard'
import {
  ArabicCharacterStage,
  EnglishTypoStage,
  HalfSpaceStage,
  LexiconTypoStage,
  PunctuationStage,
  SmartMarkdownStage,
  type TextStage,
} from '@/services/enhancement/PersianTextStages'
import { userDictionaryService } from '@/services/UserDictionaryService'

export interface EnhanceOptions {
  spellCheck?: boolean
  autoFormat?: boolean
}

/**
 * Deterministic, fully offline Persian text cleanup.
 * Code blocks, URLs, e-mails and words from the user's personal dictionary are
 * locked before any stage runs, so they can never be rewritten.
 */
export class TextEnhancementService {
  private readonly spellingStages: readonly TextStage[] = [
    new ArabicCharacterStage(),
    new HalfSpaceStage(),
    new LexiconTypoStage(),
    new EnglishTypoStage(),
    new PunctuationStage(),
  ]
  private readonly formattingStages: readonly TextStage[] = [new SmartMarkdownStage()]

  correctSpellingAndTypography(text: string): string {
    return this.runGuarded(text, this.spellingStages)
  }

  formatSmartMarkdown(text: string): string {
    return this.runGuarded(text, this.formattingStages)
  }

  enhance(text: string, options: EnhanceOptions = { spellCheck: true, autoFormat: true }): string {
    var stages: TextStage[] = []
    if (options.spellCheck) stages.push(...this.spellingStages)
    if (options.autoFormat) stages.push(...this.formattingStages)
    return this.runGuarded(text, stages)
  }

  private runGuarded(text: string, stages: readonly TextStage[]): string {
    if (!text) return ''

    var guard = new ProtectedTextGuard()
    var current = guard.protect(text, userDictionaryService.snapshot())
    for (var stage of stages) {
      current = stage.apply(current)
    }
    return guard.restore(current)
  }
}

export const textEnhancementService = new TextEnhancementService()
