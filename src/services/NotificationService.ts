import { memoryRepository } from '@/repositories/MemoryRepository'
import { getTodayIso } from '@/utils/jalali'

export class NotificationService {
  isSupported(): boolean {
    return 'Notification' in window
  }

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied'
    return Notification.permission
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false
    var perm = await Notification.requestPermission()
    return perm === 'granted'
  }

  async checkAndSendDailyReminder(): Promise<boolean> {
    if (!this.isSupported() || this.getPermission() !== 'granted') {
      return false
    }

    // Check if user already recorded a memory today
    var todayIso = getTodayIso()
    var memoriesToday = await memoryRepository.query({
      startDate: todayIso,
      endDate: todayIso,
    })

    if (memoriesToday.length > 0) {
      // User has already written a memory today! No reminder needed.
      return false
    }

    try {
      new Notification('خاطره‌نامه | یادآور روزانه', {
        body: 'امروز چه اتفاقاتی افتاد؟ چند لحظه برای ثبت خاطرات و احساسات امروزت وقت بگذار.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-48.png',
        dir: 'rtl',
        lang: 'fa',
        tag: 'daily-memory-reminder',
      })
      return true
    } catch (e) {
      console.warn('Could not display notification:', e)
      return false
    }
  }
}

export const notificationService = new NotificationService()
