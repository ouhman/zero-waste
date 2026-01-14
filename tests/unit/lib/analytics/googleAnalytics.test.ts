import { describe, test, expect, beforeEach, vi } from 'vitest'
import { GoogleAnalyticsProvider } from '@/lib/analytics/googleAnalytics'

describe('GoogleAnalyticsProvider', () => {
  let provider: GoogleAnalyticsProvider

  beforeEach(() => {
    provider = new GoogleAnalyticsProvider()

    // Mock document.createElement for script loading
    const mockScript = {
      async: false,
      src: '',
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
    }

    vi.spyOn(document, 'createElement').mockReturnValue(mockScript as unknown as HTMLScriptElement)
    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      // Trigger onload immediately in tests
      if ((node as typeof mockScript).onload) {
        setTimeout(() => (node as typeof mockScript).onload?.(), 0)
      }
      return node
    })
  })

  test('initializes gtag with consent denied by default', async () => {
    await provider.init({
      measurementId: 'G-TEST123',
      debug: false,
      anonymizeIp: true,
      sendPageView: false,
    })

    // Check dataLayer for consent default call
    const consentCall = window.dataLayer.find((call: unknown) => {
      const arr = call as unknown[]
      return arr[0] === 'consent' && arr[1] === 'default'
    }) as unknown[]

    expect(consentCall).toBeDefined()
    expect(consentCall[2]).toMatchObject({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })

    // Check for config call
    const configCall = window.dataLayer.find((call: unknown) => {
      const arr = call as unknown[]
      return arr[0] === 'config' && arr[1] === 'G-TEST123'
    })
    expect(configCall).toBeDefined()
  })

  test('updates consent when called', async () => {
    await provider.init({
      measurementId: 'G-TEST123',
    })

    // Clear dataLayer
    window.dataLayer = []

    provider.updateConsent(true)

    expect(window.dataLayer).toHaveLength(1)
    const call = Array.from(window.dataLayer[0] as ArrayLike<unknown>)
    expect(call).toEqual(['consent', 'update', {
      analytics_storage: 'granted',
    }])
  })

  test('updates consent to denied', async () => {
    await provider.init({
      measurementId: 'G-TEST123',
    })

    window.dataLayer = []

    provider.updateConsent(false)

    expect(window.dataLayer).toHaveLength(1)
    const call = Array.from(window.dataLayer[0] as ArrayLike<unknown>)
    expect(call).toEqual(['consent', 'update', {
      analytics_storage: 'denied',
    }])
  })

  test('tracks events', async () => {
    await provider.init({
      measurementId: 'G-TEST123',
    })

    window.dataLayer = []

    provider.trackEvent('map_rendered', { foo: 'bar' })

    expect(window.dataLayer).toHaveLength(1)
    const call = Array.from(window.dataLayer[0] as ArrayLike<unknown>)
    expect(call).toEqual(['event', 'map_rendered', { foo: 'bar', environment: 'development' }])
  })

  test('tracks page views', async () => {
    await provider.init({
      measurementId: 'G-TEST123',
    })

    window.dataLayer = []

    provider.trackPageView('/test-path', 'Test Title')

    expect(window.dataLayer).toHaveLength(1)
    const call = Array.from(window.dataLayer[0] as ArrayLike<unknown>)
    expect(call).toEqual(['event', 'page_view', {
      page_path: '/test-path',
      page_title: 'Test Title',
      environment: 'development',
    }])
  })

  test('tracks page views without title', async () => {
    await provider.init({
      measurementId: 'G-TEST123',
    })

    window.dataLayer = []

    provider.trackPageView('/test-path')

    expect(window.dataLayer).toHaveLength(1)
    const call = Array.from(window.dataLayer[0] as ArrayLike<unknown>)
    expect(call).toEqual(['event', 'page_view', {
      page_path: '/test-path',
      environment: 'development',
    }])
  })

  test('is ready after initialization', async () => {
    expect(provider.isReady()).toBe(false)

    await provider.init({
      measurementId: 'G-TEST123',
    })

    expect(provider.isReady()).toBe(true)
  })

  test('does not track if not ready', () => {
    // Ensure dataLayer doesn't exist or is empty
    window.dataLayer = []

    provider.trackEvent('test_event')
    provider.trackPageView('/test')

    // Should not have any calls because provider is not initialized
    expect(window.dataLayer).toHaveLength(0)
  })

  test('warns when updating consent before init', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    provider.updateConsent(true)

    expect(consoleSpy).toHaveBeenCalledWith('[Analytics] Cannot update consent - gtag not ready')

    consoleSpy.mockRestore()
  })
})
