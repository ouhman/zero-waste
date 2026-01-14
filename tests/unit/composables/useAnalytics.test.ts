import { describe, test, expect, beforeEach, vi } from 'vitest'
import { useAnalytics, initAnalytics } from '@/composables/useAnalytics'

// Mock the consent composable
vi.mock('@/composables/useConsent', () => ({
  useConsent: () => ({
    consentState: {
      value: {
        analytics: false,
        timestamp: null,
        version: 1,
      },
    },
  }),
}))

describe('useAnalytics', () => {
  beforeEach(() => {
    // Reset module state between tests
    vi.resetModules()

    // Mock environment variables
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_GA_MEASUREMENT_ID: undefined,
          DEV: false,
        },
      },
    })
  })

  test('provides typed tracking methods', () => {
    const analytics = useAnalytics()

    expect(analytics).toHaveProperty('trackMapRendered')
    expect(analytics).toHaveProperty('trackLocationDetailView')
    expect(analytics).toHaveProperty('trackShareClick')
    expect(analytics).toHaveProperty('trackSubmissionStarted')
    expect(analytics).toHaveProperty('trackSubmissionCompleted')
    expect(analytics).toHaveProperty('trackEditSuggestionSubmitted')
    expect(analytics).toHaveProperty('trackPageView')
    expect(analytics).toHaveProperty('trackEvent')
    expect(analytics).toHaveProperty('isReady')
  })

  test('all tracking methods are functions', () => {
    const analytics = useAnalytics()

    expect(typeof analytics.trackMapRendered).toBe('function')
    expect(typeof analytics.trackLocationDetailView).toBe('function')
    expect(typeof analytics.trackShareClick).toBe('function')
    expect(typeof analytics.trackSubmissionStarted).toBe('function')
    expect(typeof analytics.trackSubmissionCompleted).toBe('function')
    expect(typeof analytics.trackEditSuggestionSubmitted).toBe('function')
    expect(typeof analytics.trackPageView).toBe('function')
    expect(typeof analytics.trackEvent).toBe('function')
    expect(typeof analytics.isReady).toBe('function')
  })

  test('tracking methods do not throw when called', () => {
    const analytics = useAnalytics()

    expect(() => analytics.trackMapRendered()).not.toThrow()
    expect(() => analytics.trackLocationDetailView('test-slug')).not.toThrow()
    expect(() => analytics.trackLocationDetailView('test-slug', 'repair-cafe')).not.toThrow()
    expect(() => analytics.trackShareClick('facebook', 'test-slug')).not.toThrow()
    expect(() => analytics.trackSubmissionStarted('google_maps')).not.toThrow()
    expect(() => analytics.trackSubmissionCompleted('pin_on_map')).not.toThrow()
    expect(() => analytics.trackEditSuggestionSubmitted('test-slug')).not.toThrow()
    expect(() => analytics.trackPageView('/test-path')).not.toThrow()
    expect(() => analytics.trackPageView('/test-path', 'Test Title')).not.toThrow()
    expect(() => analytics.trackEvent('custom_event')).not.toThrow()
    expect(() => analytics.trackEvent('custom_event', { foo: 'bar' })).not.toThrow()
  })

  test('isReady returns boolean', () => {
    const analytics = useAnalytics()
    const ready = analytics.isReady()

    expect(typeof ready).toBe('boolean')
  })

  test('initAnalytics completes without error', async () => {
    await expect(initAnalytics()).resolves.toBeUndefined()
  })

  test('can call useAnalytics multiple times without error', () => {
    const analytics1 = useAnalytics()
    const analytics2 = useAnalytics()

    // Both should have same methods available (from the same singleton provider)
    expect(typeof analytics1.trackMapRendered).toBe('function')
    expect(typeof analytics2.trackMapRendered).toBe('function')

    // Both should report same ready state (same singleton provider)
    expect(analytics1.isReady()).toBe(analytics2.isReady())
  })
})
