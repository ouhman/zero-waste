import type { AnalyticsProvider, AnalyticsConfig, EventParams } from '@/types/analytics'

/**
 * Google Analytics 4 (GA4) provider with Consent Mode v2 support
 *
 * Key features:
 * - Consent Mode v2 compliant (defaults to DENIED)
 * - Only updates consent when user makes a choice
 * - Supports all GA4 event tracking
 * - Debug logging in development mode
 */
export class GoogleAnalyticsProvider implements AnalyticsProvider {
  private ready = false
  private config: AnalyticsConfig | null = null

  async init(config: AnalyticsConfig): Promise<void> {
    this.config = config

    // Load gtag script dynamically
    await this.loadGtagScript(config.measurementId)

    // Initialize gtag with default consent DENIED (Consent Mode v2)
    this.initGtag(config)

    this.ready = true

    if (config.debug || import.meta.env.DEV) {
      console.log('[Analytics] GA4 initialized with Consent Mode v2 (default: DENIED)')
      console.log('[Analytics] Measurement ID:', config.measurementId)
    }
  }

  updateConsent(analytics: boolean): void {
    if (!this.ready || !window.gtag) {
      console.warn('[Analytics] Cannot update consent - gtag not ready')
      return
    }

    // Update only analytics_storage (we don't use ads)
    window.gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
    })

    if (this.config?.debug || import.meta.env.DEV) {
      console.log('[Analytics] Consent updated:', analytics ? 'GRANTED' : 'DENIED')
    }
  }

  trackEvent(name: string, params?: EventParams): void {
    if (!this.ready || !window.gtag) {
      return
    }

    const environment = import.meta.env.DEV ? 'development' : 'production'
    window.gtag('event', name, { ...params, environment })

    if (this.config?.debug || import.meta.env.DEV) {
      console.log('[Analytics] Event tracked:', name, params)
    }
  }

  trackPageView(path: string, title?: string): void {
    if (!this.ready || !window.gtag) {
      return
    }

    const environment = import.meta.env.DEV ? 'development' : 'production'
    const params: EventParams = {
      page_path: path,
      environment,
    }

    if (title) {
      params.page_title = title
    }

    window.gtag('event', 'page_view', params)

    if (this.config?.debug || import.meta.env.DEV) {
      console.log('[Analytics] Page view tracked:', path, title)
    }
  }

  isReady(): boolean {
    return this.ready
  }

  /**
   * Load gtag.js script and initialize dataLayer
   */
  private async loadGtagScript(measurementId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Initialize dataLayer before script loads
      window.dataLayer = window.dataLayer || []
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer.push(arguments)
      }

      // Set timestamp
      window.gtag('js', new Date())

      // Load script
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`

      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load gtag.js'))

      document.head.appendChild(script)
    })
  }

  /**
   * Initialize gtag with consent defaults and config
   */
  private initGtag(config: AnalyticsConfig): void {
    if (!window.gtag) return

    // Set default consent to DENIED (Consent Mode v2)
    // This MUST be called before the GA config
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500, // Wait up to 500ms for consent update
    })

    // Configure GA4 with environment dimension
    const environment = import.meta.env.DEV ? 'development' : 'production'

    window.gtag('config', config.measurementId, {
      anonymize_ip: config.anonymizeIp !== false, // Default true for safety
      send_page_view: config.sendPageView !== true, // Default false (we send manually)
      debug_mode: config.debug || import.meta.env.DEV,
      environment, // Custom dimension - filter in GA4 reports
    })
  }
}

/**
 * Global type declarations for gtag
 */
declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (
      command: 'consent' | 'config' | 'event' | 'js' | 'set',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) => void
  }
}
