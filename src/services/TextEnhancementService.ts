/**
 * TextEnhancementService
 * Client-side Persian & English Spell Checking, Typo Auto-Correction,
 * Half-Space (نیم‌فاصله) Orthography, and Smart Markdown Auto-Formatting.
 * 100% Client-side, zero server dependencies.
 */

// Common English spelling errors dictionary
const ENGLISH_TYPOS: Record<string, string> = {
  teh: 'the',
  recieve: 'receive',
  recieved: 'received',
  recieving: 'receiving',
  seperate: 'separate',
  seperated: 'separated',
  definately: 'definitely',
  definitly: 'definitely',
  occured: 'occurred',
  occuring: 'occurring',
  untill: 'until',
  alot: 'a lot',
  truely: 'truly',
  wierd: 'weird',
  beleive: 'believe',
  beleived: 'believed',
  acheive: 'achieve',
  acheived: 'achieved',
  tommorrow: 'tomorrow',
  tomorow: 'tomorrow',
  calender: 'calendar',
  accomodate: 'accommodate',
  accross: 'across',
  neccessary: 'necessary',
  necesary: 'necessary',
  embarass: 'embarrass',
  suprise: 'surprise',
  suprised: 'surprised',
  refered: 'referred',
  writting: 'writing',
  goverment: 'government',
  enviorment: 'environment',
  enviroment: 'environment',
  adress: 'address',
  begining: 'beginning',
  existance: 'existence',
  foreward: 'forward',
  greatful: 'grateful',
  garantee: 'guarantee',
  harrass: 'harass',
  hight: 'height',
  independant: 'independent',
  knowlege: 'knowledge',
  millenium: 'millennium',
  noticable: 'noticeable',
  possession: 'possession',
  priviledge: 'privilege',
  recommand: 'recommend',
  rythm: 'rhythm',
  succesful: 'successful',
}

// Common Persian spelling errors dictionary
const PERSIAN_TYPOS: Record<string, string> = {
  'اصلا': 'اصلاً',
  'اصلن': 'اصلاً',
  'حتما': 'حتماً',
  'حتمن': 'حتماً',
  'مثلا': 'مثلاً',
  'مثلن': 'مثلاً',
  'دقیقا': 'دقیقاً',
  'دقیقن': 'دقیقاً',
  'واقعا': 'واقعاً',
  'واقعن': 'واقعاً',
  'تقریبا': 'تقریباً',
  'تقریبن': 'تقریباً',
  'معمولا': 'معمولاً',
  'معمولن': 'معمولاً',
  'نسبتا': 'نسبتاً',
  'نسبتن': 'نسبتاً',
  'احتمالا': 'احتمالاً',
  'احتمالن': 'احتمالاً',
  'مسلما': 'مسلماً',
  'مسلمن': 'مسلماً',
  'عمدا': 'عمداً',
  'عمدن': 'عمداً',
  'سهوا': 'سهواً',
  'سهون': 'سهواً',
  'شخصا': 'شخصاً',
  'شخصن': 'شخصاً',
  'مجددا': 'مجدداً',
  'مجددن': 'مجدداً',
  'ظاهرا': 'ظاهراً',
  'ظاهرن': 'ظاهراً',
  'باطنا': 'باطناً',
  'حتا': 'حتی',
  'خاهش': 'خواهش',
  'خاستن': 'خواستن',
  'خاستم': 'خواستم',
  'خاستی': 'خواستی',
  'خاست': 'خواست',
  'خاستند': 'خواستند',
  'خاهر': 'خواهر',
  'خاهرم': 'خواهرم',
  'خاهرت': 'خواهرت',
  'خاهرش': 'خواهرش',
  'خاهرانه': 'خواهرانه',
  'خاب': 'خواب',
  'خابیدم': 'خوابیدم',
  'خابید': 'خوابید',
  'خاب آلود': 'خواب‌آلود',
  'خاهم': 'خواهم',
  'خاهد': 'خواهد',
  'راجب': 'راجع‌به',
  'راجعبه': 'راجع‌به',
  'انظباط': 'انضباط',
  'سپاسگذار': 'سپاسگزار',
  'سپاسگذاری': 'سپاسگزاری',
  'شکرگذار': 'شکرگزار',
  'شکرگذاری': 'شکرگزاری',
  'نمازگذار': 'نمازگزار',
  'قانون گزار': 'قانون‌گذار',
  'قانون گزاری': 'قانون‌گذاری',
  'مساله': 'مسئله',
  'مسول': 'مسئول',
  'مسولیت': 'مسئولیت',
  'مسولان': 'مسئولان',
  'جرئت': 'جرأت',
  'جرات': 'جرأت',
  'توجیح': 'توجیه',
  'اطاق': 'اتاق',
  'اطاق‌ها': 'اتاق‌ها',
  'اطو': 'اتو',
  'بلیط': 'بلیت',
  'باطری': 'باتری',
  'ذغالسنگ': 'زغال‌سنگ',
  'ذغال': 'زغال',
  'گذارش': 'گزارش',
  'گذارش‌ها': 'گزارش‌ها',
}

export class TextEnhancementService {
  /**
   * Correct spelling, typography, Arabic characters, and Persian half-spaces.
   */
  correctSpellingAndTypography(text: string): string {
    if (!text) return ''

    var res = text

    // 1. Normalize Arabic characters to Persian
    res = res.replace(/ي/g, 'ی')
    res = res.replace(/ك/g, 'ک')
    res = res.replace(/ة\b/g, 'ه')

    // 2. Persian Half-Space (نیم‌فاصله) rules
    const ZWNJ = '\u200c'

    // Prefixes: می / نمی
    res = res.replace(/\b(ن?می)\s+([آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی])/gu, `$1${ZWNJ}$2`)

    // Plural suffixes: ها / های / هایی
    res = res.replace(/([آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی])\s+(ها|های|هایی|هایم|هایت|هایش|هایمان|هایتان|هایشان)\b/gu, `$1${ZWNJ}$2`)

    // Comparative suffixes: تر / ترین / تری
    res = res.replace(/([آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی])\s+(تر|ترین|تری)\b/gu, `$1${ZWNJ}$2`)

    // Postfix possessive & personal pronouns after 'ه'
    res = res.replace(/([هة])\s+(ای|ام|ات|اش|مان|تان|شان)\b/gu, `$1${ZWNJ}$2`)

    // Common compound prepositions & phrases
    const compounds: [RegExp, string][] = [
      [/\bبه\s+عنوان\b/gu, `به${ZWNJ}عنوان`],
      [/\bبه\s+صورت\b/gu, `به${ZWNJ}صورت`],
      [/\bبه\s+ویژه\b/gu, `به${ZWNJ}ویژه`],
      [/\bدست\s+کم\b/gu, `دست${ZWNJ}کم`],
      [/\bفوق\s+العاده\b/gu, `فوق${ZWNJ}العاده`],
      [/\bعلاقه\s+مند\b/gu, `علاقه${ZWNJ}مند`],
      [/\bعلاقه\s+مندی\b/gu, `علاقه${ZWNJ}مندی`],
      [/\bگفت\s+و\s+گو\b/gu, `گفت${ZWNJ}و${ZWNJ}گو`],
      [/\bرفت\s+و\s+آمد\b/gu, `رفت${ZWNJ}و${ZWNJ}آمد`],
      [/\bجست\s+و\s+جو\b/gu, `جست${ZWNJ}و${ZWNJ}جو`],
      [/\bخوش\s+حال\b/gu, `خوش${ZWNJ}حال`],
      [/\bخوش\s+آمدید\b/gu, `خوش${ZWNJ}آمدید`],
      [/\bبی\s+دلیل\b/gu, `بی${ZWNJ}دلیل`],
      [/\bبی\s+نهایت\b/gu, `بی${ZWNJ}نهایت`],
      [/\bبی\s+فایده\b/gu, `بی${ZWNJ}فایده`],
      [/\bرو\s+به\s+رو\b/gu, `رو${ZWNJ}به${ZWNJ}رو`],
    ]

    for (var [pattern, replacement] of compounds) {
      res = res.replace(pattern, replacement)
    }

    // 3. Persian dictionary typo replacement
    for (var typo in PERSIAN_TYPOS) {
      var fix = PERSIAN_TYPOS[typo]
      var regex = new RegExp(`(^|\\s|«|"|\\()${typo}(?=$|\\s|»|"|\\)|[،.؛!؟])`, 'gu')
      res = res.replace(regex, `$1${fix}`)
    }

    // 4. English dictionary typo replacement
    for (var engTypo in ENGLISH_TYPOS) {
      var engFix = ENGLISH_TYPOS[engTypo]
      var engRegex = new RegExp(`\\b${engTypo}\\b`, 'gi')
      res = res.replace(engRegex, (match) => {
        // preserve case
        if (match[0] === match[0].toUpperCase()) {
          return engFix.charAt(0).toUpperCase() + engFix.slice(1)
        }
        return engFix
      })
    }

    // 5. Persian Punctuation Normalization
    // Question marks and commas
    res = res.replace(/([آ-ی])\s*\?/gu, '$1؟')
    res = res.replace(/([آ-ی])\s*,(?!\d)/gu, '$1،')
    res = res.replace(/([آ-ی])\s*;/gu, '$1؛')

    // Clean space before punctuation
    res = res.replace(/\s+([!؟،؛:.])/gu, '$1')

    // Ensure space after punctuation (except if followed by newline or closing quote)
    res = res.replace(/([!؟،؛:.])([آ-یA-Za-z])/gu, '$1 $2')

    // Clean duplicate punctuation (e.g. !! -> !, ؟؟ -> ؟)
    res = res.replace(/!{2,}/g, '!')
    res = res.replace(/؟{2,}/g, '؟')
    res = res.replace(/،{2,}/g, '،')

    return res
  }

  /**
   * Smart Markdown auto-formatting:
   * - Detects informal lists (1-, ۱-, •, *) and converts to Markdown lists (- item)
   * - Detects key emphasis phrases (نکته:, یادآوری:, Note:) and bolds them
   * - Cleans duplicate empty lines and trailing spaces
   */
  formatSmartMarkdown(text: string): string {
    if (!text) return ''

    var lines = text.split('\n')
    var formattedLines: string[] = []

    // Emphasis keywords to automatically bold
    var emphasisKeywords = [
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

    for (var line of lines) {
      var trimmed = line.trim()

      if (!trimmed) {
        formattedLines.push('')
        continue
      }

      var processedLine = line

      // 1. Detect informal lists: e.g. "۱- متن", "1- متن", "• متن", "* متن"
      var listMatch = trimmed.match(/^([۰-۹0-9]+[)\-]|[-•*])\s+(.+)$/)
      if (listMatch) {
        var prefix = listMatch[1]
        var content = listMatch[2]

        // If numbered like "1-" or "۱-", convert to standard numbered or bullet list
        if (/^[۰-۹0-9]+[)\-]/.test(prefix)) {
          var num = prefix.replace(/[)\-]/, '')
          processedLine = `${num}. ${content}`
        } else {
          processedLine = `- ${content}`
        }
      }

      // 2. Detect and bold emphasis keywords at beginning of line
      for (var kw of emphasisKeywords) {
        if (processedLine.trim().startsWith(kw) && !processedLine.trim().startsWith(`**${kw}**`)) {
          var after = processedLine.trim().substring(kw.length).trim()
          processedLine = `**${kw}** ${after}`
          break
        }
      }

      formattedLines.push(processedLine.trimEnd())
    }

    // 3. Normalize multiple empty lines to max 1 empty line
    var result = formattedLines.join('\n')
    result = result.replace(/\n{3,}/g, '\n\n')

    return result.trim()
  }

  /**
   * Full enhancement pipeline combining spell-checking and smart formatting.
   */
  enhance(
    text: string,
    options: { spellCheck?: boolean; autoFormat?: boolean } = { spellCheck: true, autoFormat: true }
  ): string {
    var output = text
    if (options.spellCheck) {
      output = this.correctSpellingAndTypography(output)
    }
    if (options.autoFormat) {
      output = this.formatSmartMarkdown(output)
    }
    return output
  }
}

export const textEnhancementService = new TextEnhancementService()
