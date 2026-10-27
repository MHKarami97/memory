import { ref } from 'vue'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title?: string
  message: string
  duration?: number
  actionText?: string
  onAction?: () => void
}

var toasts = ref<ToastMessage[]>([])

export function useToast() {
  function showToast(toast: Omit<ToastMessage, 'id'>) {
    var id = 'toast_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
    var item: ToastMessage = { ...toast, id }
    toasts.value.push(item)

    var duration = toast.duration ?? (toast.actionText ? 7000 : 4000)
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    showToast,
    removeToast,
  }
}
