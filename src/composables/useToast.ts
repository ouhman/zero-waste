import { ref } from 'vue'

interface ToastOptions {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface Toast extends ToastOptions {
  id: number
  show: boolean
}

const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
  function show(options: ToastOptions) {
    const id = nextId++
    const duration = options.duration ?? 5000 // Default 5 seconds
    const toast: Toast = {
      id,
      message: options.message,
      type: options.type || 'info',
      duration,
      show: true
    }

    toasts.value.push(toast)

    // Auto-remove after duration
    setTimeout(() => {
      remove(id)
    }, duration + 500) // Extra time for animation
  }

  function success(message: string, duration?: number) {
    show({ message, type: 'success', duration })
  }

  function error(message: string, duration?: number) {
    show({ message, type: 'error', duration })
  }

  function warning(message: string, duration?: number) {
    show({ message, type: 'warning', duration })
  }

  function info(message: string, duration?: number) {
    show({ message, type: 'info', duration })
  }

  function remove(id: number) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  return {
    toasts,
    show,
    success,
    error,
    warning,
    info,
    remove
  }
}
