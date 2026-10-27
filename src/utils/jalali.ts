import jalaali from 'jalaali-js'
import { toPersianDigits } from './format'

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

export const PERSIAN_WEEKDAYS = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
]

export const PERSIAN_WEEKDAYS_ORDERED = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
]

export interface JalaliDate {
  jy: number
  jm: number
  jd: number
}

export function isoToJalali(isoString: string): JalaliDate {
  if (!isoString) {
    return getTodayJalali()
  }
  var d = new Date(isoString)
  if (isNaN(d.getTime())) {
    d = new Date()
  }
  var res = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  return { jy: res.jy, jm: res.jm, jd: res.jd }
}

export function jalaliToIso(jy: number, jm: number, jd: number): string {
  var g = jalaali.toGregorian(jy, jm, jd)
  var mm = String(g.gm).padStart(2, '0')
  var dd = String(g.gd).padStart(2, '0')
  return `${g.gy}-${mm}-${dd}`
}

export function getTodayIso(): string {
  var now = new Date()
  var y = now.getFullYear()
  var m = String(now.getMonth() + 1).padStart(2, '0')
  var d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getCurrentTime(): string {
  var now = new Date()
  var h = String(now.getHours()).padStart(2, '0')
  var m = String(now.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function getTodayJalali(): JalaliDate {
  var now = new Date()
  var res = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate())
  return { jy: res.jy, jm: res.jm, jd: res.jd }
}

export function formatJalaliFull(isoString: string): string {
  if (!isoString) return ''
  var d = new Date(isoString)
  if (isNaN(d.getTime())) return ''
  var j = isoToJalali(isoString)
  var weekday = PERSIAN_WEEKDAYS[d.getDay()]
  var monthName = JALALI_MONTH_NAMES[j.jm - 1]
  return `${weekday}، ${toPersianDigits(j.jd)} ${monthName} ${toPersianDigits(j.jy)}`
}

export function formatJalaliShort(isoString: string): string {
  if (!isoString) return ''
  var j = isoToJalali(isoString)
  var jm = String(j.jm).padStart(2, '0')
  var jd = String(j.jd).padStart(2, '0')
  return toPersianDigits(`${j.jy}/${jm}/${jd}`)
}

export function formatJalaliMonthYear(jy: number, jm: number): string {
  var monthName = JALALI_MONTH_NAMES[jm - 1] || ''
  return `${monthName} ${toPersianDigits(jy)}`
}

export function getMonthDaysCount(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm)
}

export interface CalendarDayItem {
  jy: number
  jm: number
  jd: number
  isoDate: string
  isCurrentMonth: boolean
  isToday: boolean
}

/**
 * Returns 35-42 days representing the monthly calendar grid starting on Shanbeh (Saturday).
 */
export function getMonthCalendarGrid(jy: number, jm: number): CalendarDayItem[] {
  var firstDayIso = jalaliToIso(jy, jm, 1)
  var firstDayDate = new Date(firstDayIso)
  // JS getDay(): 0 is Sunday, 6 is Saturday
  // In Persian calendar, Shanbeh (Saturday) is index 0
  var dayOfWeek = firstDayDate.getDay() // 6=Sat, 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
  var shanbehOffset = (dayOfWeek + 1) % 7 // Sat->0, Sun->1, Mon->2, ... Fri->6

  var daysCount = getMonthDaysCount(jy, jm)
  var todayIso = getTodayIso()
  var grid: CalendarDayItem[] = []

  // Prev month padding
  var prevY = jm === 1 ? jy - 1 : jy
  var prevM = jm === 1 ? 12 : jm - 1
  var prevMonthDays = getMonthDaysCount(prevY, prevM)

  for (var p = shanbehOffset - 1; p >= 0; p--) {
    var pDay = prevMonthDays - p
    var pIso = jalaliToIso(prevY, prevM, pDay)
    grid.push({
      jy: prevY,
      jm: prevM,
      jd: pDay,
      isoDate: pIso,
      isCurrentMonth: false,
      isToday: pIso === todayIso,
    })
  }

  // Current month
  for (var c = 1; c <= daysCount; c++) {
    var cIso = jalaliToIso(jy, jm, c)
    grid.push({
      jy,
      jm,
      jd: c,
      isoDate: cIso,
      isCurrentMonth: true,
      isToday: cIso === todayIso,
    })
  }

  // Next month padding to complete rows of 7
  var remaining = 7 - (grid.length % 7)
  if (remaining < 7) {
    var nextY = jm === 12 ? jy + 1 : jy
    var nextM = jm === 12 ? 1 : jm + 1
    for (var n = 1; n <= remaining; n++) {
      var nIso = jalaliToIso(nextY, nextM, n)
      grid.push({
        jy: nextY,
        jm: nextM,
        jd: n,
        isoDate: nIso,
        isCurrentMonth: false,
        isToday: nIso === todayIso,
      })
    }
  }

  return grid
}

export function isYearsAgoToday(isoDate: string): boolean {
  if (!isoDate) return false
  var target = isoToJalali(isoDate)
  var today = getTodayJalali()
  return target.jm === today.jm && target.jd === today.jd && target.jy < today.jy
}

export function getYearsAgoCount(isoDate: string): number {
  if (!isoDate) return 0
  var target = isoToJalali(isoDate)
  var today = getTodayJalali()
  return today.jy - target.jy
}

export function isSameDay(iso1: string, iso2: string): boolean {
  if (!iso1 || !iso2) return false
  return iso1.slice(0, 10) === iso2.slice(0, 10)
}

export function getRelativeDateLabel(isoDate: string): string {
  if (!isoDate) return ''
  var targetDate = new Date(isoDate.slice(0, 10) + 'T00:00:00')
  var now = new Date()
  var todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  var diffDays = Math.round((todayDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'امروز'
  if (diffDays === 1) return 'دیروز'
  if (diffDays === 2) return 'پریروز'
  if (diffDays === -1) return 'فردا'
  if (diffDays > 2 && diffDays <= 7) return `${toPersianDigits(diffDays)} روز پیش`
  if (diffDays < -1 && diffDays >= -7) return `${toPersianDigits(Math.abs(diffDays))} روز دیگر`

  return formatJalaliShort(isoDate)
}
