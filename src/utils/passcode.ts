export const PASSCODE_MIN_LENGTH = 4
export const PASSCODE_MAX_LENGTH = 8

const PERSIAN_ZERO = 0x06f0
const ARABIC_ZERO = 0x0660

export function normalizeDigits(value: string): string {
  var result = ''
  for (var char of value) {
    var code = char.charCodeAt(0)
    if (code >= PERSIAN_ZERO && code <= PERSIAN_ZERO + 9) {
      result += String(code - PERSIAN_ZERO)
    } else if (code >= ARABIC_ZERO && code <= ARABIC_ZERO + 9) {
      result += String(code - ARABIC_ZERO)
    } else if (code >= 48 && code <= 57) {
      result += char
    }
  }
  return result
}

export function sanitizePasscode(value: string): string {
  return normalizeDigits(value).slice(0, PASSCODE_MAX_LENGTH)
}

export function isValidPasscode(value: string): boolean {
  return value.length >= PASSCODE_MIN_LENGTH && value.length <= PASSCODE_MAX_LENGTH
}
