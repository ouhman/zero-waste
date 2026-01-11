import { ref, onUnmounted, getCurrentInstance } from 'vue'

/**
 * Debounce composable for delaying function execution
 * Automatically cleans up timers on component unmount
 *
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns Object with debounced function and cancel method
 *
 * @example
 * const { debounced, cancel } = useDebounce((query: string) => {
 *   console.log('Search:', query)
 * }, 500)
 *
 * debounced('test') // Will execute after 500ms
 * cancel() // Cancel pending execution
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
) {
  let timer: ReturnType<typeof setTimeout> | null = null
  const isPending = ref(false)

  /**
   * Debounced version of the function
   * Cancels previous pending calls and schedules a new one
   */
  function debounced(...args: Parameters<T>): void {
    cancel()
    isPending.value = true
    timer = setTimeout(() => {
      isPending.value = false
      fn(...args)
      timer = null
    }, delay)
  }

  /**
   * Cancel any pending debounced function call
   */
  function cancel(): void {
    if (timer) {
      clearTimeout(timer)
      timer = null
      isPending.value = false
    }
  }

  /**
   * Execute the function immediately, canceling any pending call
   */
  function flush(...args: Parameters<T>): void {
    cancel()
    fn(...args)
  }

  // Auto-cleanup on component unmount (only if in component context)
  if (getCurrentInstance()) {
    onUnmounted(() => {
      cancel()
    })
  }

  return {
    debounced,
    cancel,
    flush,
    isPending
  }
}
