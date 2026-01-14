import type { AnalyticsProvider, AnalyticsConfig, EventParams } from '@/types/analytics'

/**
 * No-op analytics provider used when:
 * - VITE_GA_MEASUREMENT_ID is not configured
 * - In test environments
 * - For debugging without sending data
 */
export class NullAnalyticsProvider implements AnalyticsProvider {
  private ready = false

  async init(_config: AnalyticsConfig): Promise<void> {
    this.ready = true
    if (import.meta.env.DEV) {
      console.log('[Analytics] NullProvider initialized (no data will be sent)')
    }
  }

  updateConsent(_analytics: boolean): void {
    // No-op
  }

  trackEvent(_name: string, _params?: EventParams): void {
    // No-op
  }

  trackPageView(_path: string, _title?: string): void {
    // No-op
  }

  isReady(): boolean {
    return this.ready
  }
}
