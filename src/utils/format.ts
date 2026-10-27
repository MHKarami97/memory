const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

export function toPersianDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  var str = String(value)
  return str.replace(/[0-9]/g, (w) => PERSIAN_DIGITS[parseInt(w, 10)])
    .replace(/[٠-٩]/g, (w) => PERSIAN_DIGITS[ARABIC_DIGITS.indexOf(w)])
}

export function toEnglishDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  var str = String(value)
  return str.replace(/[۰-۹]/g, (w) => String(PERSIAN_DIGITS.indexOf(w)))
    .replace(/[٠-٩]/g, (w) => String(ARABIC_DIGITS.indexOf(w)))
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return toPersianDigits(0) + ' بایت'
  var units = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت']
  var i = Math.floor(Math.log(bytes) / Math.log(1024))
  if (i < 0) i = 0
  if (i >= units.length) i = units.length - 1
  var val = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)
  return toPersianDigits(val) + ' ' + units[i]
}

export function formatDuration(seconds: number): string {
  var total = Math.floor(seconds || 0)
  var mins = Math.floor(total / 60)
  var secs = total % 60
  var formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  return toPersianDigits(formatted)
}

export function extractExcerpt(markdown: string, maxLength: number = 140): string {
  if (!markdown) return ''
  // Strip Markdown markers
  var plain = markdown
    .replace(/^#+\s+/gm, '') // headings
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // images
    .replace(/`{1,3}[^`\n]*`{1,3}/g, '') // code
    .replace(/>\s+/gm, '') // blockquotes
    .replace(/[-*+]\s+/gm, '') // lists
    .replace(/\n+/g, ' ') // newlines
    .trim()

  if (plain.length <= maxLength) return plain
  return plain.slice(0, maxLength) + '...'
}
