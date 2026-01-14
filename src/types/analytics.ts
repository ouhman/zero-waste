/**
 * Analytics event names for type safety
 */
export type AnalyticsEventName =
  | 'map_rendered'
  | 'location_detail_view'
  | 'share_click'
  | 'submission_started'
  | 'submission_completed'
  | 'edit_suggestion_submitted'

/**
 * Event parameters for analytics events
 */
export interface EventParams {
  [key: string]: string | number | boolean | undefined
}

/**
 * Configuration for analytics provider
 */
export interface AnalyticsConfig {
  measurementId: string
  debug?: boolean
  anonymizeIp?: boolean
  sendPageView?: boolean
}

/**
 * Analytics provider interface - all providers must implement this
 */
export interface AnalyticsProvider {
  /**
   * Initialize the analytics provider with consent denied by default
   */
  init(config: AnalyticsConfig): Promise<void>

  /**
   * Update consent state (Consent Mode v2)
   */
  updateConsent(analytics: boolean): void

  /**
   * Track a custom event
   */
  trackEvent(name: AnalyticsEventName | string, params?: EventParams): void

  /**
   * Track a page view
   */
  trackPageView(path: string, title?: string): void

  /**
   * Check if provider is ready
   */
  isReady(): boolean
}
