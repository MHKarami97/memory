import { spellCheckService, type SpellIssue } from '@/services/spell/SpellCheckService'
import { textEnhancementService } from '@/services/TextEnhancementService'
import { userDictionaryService } from '@/services/UserDictionaryService'

export interface SpellCheckOutcome {
  issues: SpellIssue[]
  errorMessage: string | null
}

export interface SmartEditAnalysis extends SpellCheckOutcome {
  rulesText: string
}

export interface IssueResolution {
  text: string
  issues: SpellIssue[]
}

export class SmartEditService {
  async analyze(text: string, options: { autoFormat: boolean }): Promise<SmartEditAnalysis> {
    await userDictionaryService.ensureLoaded()

    var rulesText = textEnhancementService.enhance(text, { spellCheck: true, autoFormat: options.autoFormat })
    var spelling = await this.checkSpelling(rulesText)
    return { rulesText, ...spelling }
  }

  async checkSpelling(text: string): Promise<SpellCheckOutcome> {
    try {
      var issues = await spellCheckService.findIssues(text, (word) => userDictionaryService.has(word))
      return { issues, errorMessage: null }
    } catch (error) {
      return { issues: [], errorMessage: error instanceof Error ? error.message : 'بررسی املایی در دسترس نیست.' }
    }
  }

  resolveIssue(text: string, issues: SpellIssue[], target: SpellIssue, replacement: string): IssueResolution {
    var delta = replacement.length - (target.end - target.start)

    var nextText = text.slice(0, target.start) + replacement + text.slice(target.end)
    var nextIssues = issues
      .filter((issue) => issue.id !== target.id)
      .map((issue) => (issue.start > target.start ? { ...issue, start: issue.start + delta, end: issue.end + delta } : issue))

    return { text: nextText, issues: nextIssues }
  }

  dismissWord(issues: SpellIssue[], word: string): SpellIssue[] {
    return issues.filter((issue) => issue.word !== word)
  }
}

export const smartEditService = new SmartEditService()
