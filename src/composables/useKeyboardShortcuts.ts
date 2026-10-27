import { onMounted, onUnmounted } from 'vue'

export interface ShortcutHandlers {
  onNewMemory?: () => void
  onSave?: () => void
  onSearch?: () => void
  onEscape?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  function handleKeyDown(e: KeyboardEvent) {
    var isCtrlOrCmd = e.ctrlKey || e.metaKey

    if (isCtrlOrCmd && (e.key === 'n' || e.key === 'N')) {
      e.preventDefault()
      handlers.onNewMemory?.()
    } else if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
      e.preventDefault()
      handlers.onSave?.()
    } else if (isCtrlOrCmd && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault()
      handlers.onSearch?.()
    } else if (e.key === 'Escape') {
      handlers.onEscape?.()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })
}
