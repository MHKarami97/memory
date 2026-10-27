import { memoryRepository } from '@/repositories/MemoryRepository'
import { getTodayIso } from '@/utils/jalali'

export class NotificationService {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window
  }

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied'
    try {
      return Notification.permission
    } catch {
      return 'denied'
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false

    try {
      if (Notification.permission === 'granted') return true

      // Handle both Promise-based and callback-based requestPermission
      var result: NotificationPermission
      var promise = Notification.requestPermission((p) => {
        result = p
      })
      if (promise && typeof promise.then === 'function') {
        result = await promise
      }
      return result! === 'granted'
    } catch (e) {
      console.warn('Error requesting notification permission:', e)
      return false
    }
  }

  async sendNotification(title: string, options: NotificationOptions = {}): Promise<boolean> {
    var defaultOptions: NotificationOptions = {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-48.png',
      dir: 'rtl',
      lang: 'fa',
      ...options,
    }

    // Try through active ServiceWorker registration first (required for PWAs)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        var reg = await navigator.serviceWorker.getRegistration()
        if (reg && reg.showNotification) {
          await reg.showNotification(title, defaultOptions)
          return true
        }
      } catch (e) {
        console.warn('SW showNotification failed, trying window Notification:', e)
      }
    }

    // Fallback to window.Notification
    if (this.isSupported() && this.getPermission() === 'granted') {
      try {
        new Notification(title, defaultOptions)
        return true
      } catch (e) {
        console.warn('window.Notification failed:', e)
      }
    }

    return false
  }

  async sendTestNotification(): Promise<boolean> {
    return this.sendNotification('خاطره‌نامه | اعلان آزمایشی', {
      body: 'این یک اعلان آزمایشی است. یادآور روزانه ثبت خاطره با موفقیت کار می‌کند!',
      tag: 'test-reminder',
    })
  }

  async checkAndSendDailyReminder(): Promise<boolean> {
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

    return this.sendNotification('خاطره‌نامه | یادآور روزانه', {
      body: 'امروز چه اتفاقاتی افتاد؟ چند لحظه برای ثبت خاطرات و احساسات امروزت وقت بگذار.',
      tag: 'daily-memory-reminder',
    })
  }
}

export const notificationService = new NotificationService()

