import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDebounce } from '@/composables/useDebounce'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('debounces function calls', () => {
    const mockFn = vi.fn()
    const { debounced } = useDebounce(mockFn, 500)

    debounced('test1')
    debounced('test2')
    debounced('test3')

    // Should not be called immediately
    expect(mockFn).not.toHaveBeenCalled()

    // Fast-forward time
    vi.advanceTimersByTime(500)

    // Should only be called once with the last argument
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('test3')
  })

  test('uses default delay of 300ms', () => {
    const mockFn = vi.fn()
    const { debounced } = useDebounce(mockFn)

    debounced('test')

    vi.advanceTimersByTime(299)
    expect(mockFn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  test('cancel stops pending execution', () => {
    const mockFn = vi.fn()
    const { debounced, cancel } = useDebounce(mockFn, 500)

    debounced('test')
    cancel()

    vi.advanceTimersByTime(500)
    expect(mockFn).not.toHaveBeenCalled()
  })

  test('flush executes immediately', () => {
    const mockFn = vi.fn()
    const { debounced, flush } = useDebounce(mockFn, 500)

    debounced('pending')
    flush('immediate')

    // Should be called immediately with flush argument
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('immediate')

    // Pending call should be cancelled
    vi.advanceTimersByTime(500)
    expect(mockFn).toHaveBeenCalledTimes(1) // Still only called once
  })

  test('isPending reflects debounce state', () => {
    const mockFn = vi.fn()
    const { debounced, isPending } = useDebounce(mockFn, 500)

    expect(isPending.value).toBe(false)

    debounced('test')
    expect(isPending.value).toBe(true)

    vi.advanceTimersByTime(500)
    expect(isPending.value).toBe(false)
  })

  test('isPending is false after cancel', () => {
    const mockFn = vi.fn()
    const { debounced, cancel, isPending } = useDebounce(mockFn, 500)

    debounced('test')
    expect(isPending.value).toBe(true)

    cancel()
    expect(isPending.value).toBe(false)
  })

  test('handles multiple arguments', () => {
    const mockFn = vi.fn()
    const { debounced } = useDebounce(mockFn, 300)

    debounced('arg1', 'arg2', 'arg3')

    vi.advanceTimersByTime(300)

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
  })

  test('cleans up timer on component unmount', async () => {
    const mockFn = vi.fn()

    const TestComponent = defineComponent({
      setup() {
        const { debounced } = useDebounce(mockFn, 500)
        debounced('test')
        return {}
      },
      template: '<div>Test</div>'
    })

    const wrapper = mount(TestComponent)

    // Timer should be pending
    vi.advanceTimersByTime(250)
    expect(mockFn).not.toHaveBeenCalled()

    // Unmount component
    wrapper.unmount()

    // Timer should be cancelled, function should not execute
    vi.advanceTimersByTime(500)
    expect(mockFn).not.toHaveBeenCalled()
  })

  test('works outside component context (no auto-cleanup)', () => {
    const mockFn = vi.fn()
    const { debounced } = useDebounce(mockFn, 500)

    debounced('test')

    vi.advanceTimersByTime(500)

    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('test')
  })

  test('cancels previous timer when debounced is called again', () => {
    const mockFn = vi.fn()
    const { debounced } = useDebounce(mockFn, 500)

    debounced('first')
    vi.advanceTimersByTime(300)

    debounced('second')
    vi.advanceTimersByTime(300)

    // First call should be cancelled
    expect(mockFn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)

    // Only second call should execute
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('second')
  })

  test('supports zero delay for synchronous execution', () => {
    const mockFn = vi.fn()
    const { debounced } = useDebounce(mockFn, 0)

    debounced('test')

    // Should not be called immediately
    expect(mockFn).not.toHaveBeenCalled()

    // Should be called after event loop
    vi.advanceTimersByTime(0)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})
