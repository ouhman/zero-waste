import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useFeedback } from '../useFeedback'

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useFeedback', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default state', () => {
    const { isSubmitting, error, rateLimitExceeded, rateLimitRemaining } = useFeedback()

    expect(isSubmitting.value).toBe(false)
    expect(error.value).toBe(null)
    expect(rateLimitExceeded.value).toBe(false)
    expect(rateLimitRemaining.value).toBe(0)
  })

  it('should submit feedback successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    })

    const { submitFeedback, isSubmitting, error } = useFeedback()

    const result = await submitFeedback('This is a test message')

    expect(result.success).toBe(true)
    expect(isSubmitting.value).toBe(false)
    expect(error.value).toBe(null)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.supabase.co/functions/v1/send-feedback',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'test-anon-key',
        },
        body: JSON.stringify({ message: 'This is a test message' }),
      }
    )

    // Should store timestamp in localStorage
    expect(localStorage.getItem('lastFeedbackSubmit')).toBeTruthy()
  })

  it('should submit feedback with email', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    })

    const { submitFeedback } = useFeedback()

    await submitFeedback('Test message', 'test@example.com')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.supabase.co/functions/v1/send-feedback',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'test-anon-key',
        },
        body: JSON.stringify({
          message: 'Test message',
          email: 'test@example.com',
        }),
      }
    )
  })

  it('should handle validation error (400)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Message is required' }),
    })

    const { submitFeedback, error } = useFeedback()

    const result = await submitFeedback('')

    expect(result.success).toBe(false)
    expect(error.value).toBe('Message is required')
  })

  it('should handle rate limit error (429)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Rate limit exceeded' }),
    })

    const { submitFeedback, error, rateLimitExceeded } = useFeedback()

    const result = await submitFeedback('Test message')

    expect(result.success).toBe(false)
    expect(error.value).toBe('Rate limit exceeded')
    expect(rateLimitExceeded.value).toBe(true)
  })

  it('should handle server error (500)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    })

    const { submitFeedback, error } = useFeedback()

    const result = await submitFeedback('Test message')

    expect(result.success).toBe(false)
    expect(error.value).toBe('Internal server error')
  })

  it('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { submitFeedback, error } = useFeedback()

    const result = await submitFeedback('Test message')

    expect(result.success).toBe(false)
    expect(error.value).toBe('Network error')
  })

  it('should check rate limit and return false if not rate limited', () => {
    const { checkRateLimit, rateLimitExceeded, rateLimitRemaining } = useFeedback()

    const isRateLimited = checkRateLimit()

    expect(isRateLimited).toBe(false)
    expect(rateLimitExceeded.value).toBe(false)
    expect(rateLimitRemaining.value).toBe(0)
  })

  it('should check rate limit and return true if rate limited', () => {
    // Set lastFeedbackSubmit to 1 minute ago (within 4 minute window)
    const oneMinuteAgo = Date.now() - 60 * 1000
    localStorage.setItem('lastFeedbackSubmit', oneMinuteAgo.toString())

    const { checkRateLimit, rateLimitExceeded, rateLimitRemaining } = useFeedback()

    const isRateLimited = checkRateLimit()

    expect(isRateLimited).toBe(true)
    expect(rateLimitExceeded.value).toBe(true)
    // Should have approximately 180 seconds remaining (240 - 60)
    expect(rateLimitRemaining.value).toBeGreaterThan(170)
    expect(rateLimitRemaining.value).toBeLessThanOrEqual(180)
  })

  it('should not be rate limited after 4 minutes', () => {
    // Set lastFeedbackSubmit to 5 minutes ago (outside 4 minute window)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    localStorage.setItem('lastFeedbackSubmit', fiveMinutesAgo.toString())

    const { checkRateLimit, rateLimitExceeded, rateLimitRemaining } = useFeedback()

    const isRateLimited = checkRateLimit()

    expect(isRateLimited).toBe(false)
    expect(rateLimitExceeded.value).toBe(false)
    expect(rateLimitRemaining.value).toBe(0)
  })

  it('should update rateLimitRemaining correctly', () => {
    // Set lastFeedbackSubmit to 100 seconds ago
    const hundredSecondsAgo = Date.now() - 100 * 1000
    localStorage.setItem('lastFeedbackSubmit', hundredSecondsAgo.toString())

    const { checkRateLimit, rateLimitRemaining } = useFeedback()

    checkRateLimit()

    // Should have approximately 140 seconds remaining (240 - 100)
    expect(rateLimitRemaining.value).toBeGreaterThan(130)
    expect(rateLimitRemaining.value).toBeLessThanOrEqual(140)
  })

  it('should not store timestamp if submission fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    })

    const { submitFeedback } = useFeedback()

    await submitFeedback('Test message')

    // Should NOT store timestamp on failure
    expect(localStorage.getItem('lastFeedbackSubmit')).toBe(null)
  })

  it('should handle malformed JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Invalid JSON')
      },
    })

    const { submitFeedback, error } = useFeedback()

    const result = await submitFeedback('Test message')

    expect(result.success).toBe(false)
    expect(error.value).toBe('Failed to send feedback')
  })

  it('should handle missing environment variables', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')

    const { submitFeedback, error } = useFeedback()

    const result = await submitFeedback('Test message')

    expect(result.success).toBe(false)
    expect(error.value).toBe('Supabase URL not configured')
    expect(mockFetch).not.toHaveBeenCalled()

    // Restore for other tests
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
  })

  it('should set loading state correctly during submission', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    mockFetch.mockReturnValueOnce(promise as any)

    const { submitFeedback, isSubmitting } = useFeedback()

    expect(isSubmitting.value).toBe(false)

    const submitPromise = submitFeedback('Test message')
    expect(isSubmitting.value).toBe(true)

    resolvePromise!({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    })

    await submitPromise
    expect(isSubmitting.value).toBe(false)
  })

  it('should reset error state on new submission', async () => {
    // First submission fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    })

    const { submitFeedback, error } = useFeedback()

    await submitFeedback('Test message')
    expect(error.value).toBe('Server error')

    // Second submission succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    })

    await submitFeedback('Another message')
    expect(error.value).toBe(null)
  })
})
