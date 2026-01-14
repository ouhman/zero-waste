import { watch } from 'vue'
import type { AnalyticsProvider, AnalyticsEventName, EventParams } from '@/types/analytics'
import { GoogleAnalyticsProvider } from '@/lib/analytics/googleAnalytics'
import { NullAnalyticsProvider } from '@/lib/analytics/nullProvider'
import { useConsent } from '@/composables/useConsent'

/**
 * Singleton analytics provider instance
 */
let provider: AnalyticsProvider | null = null

/**
 * Create and configure the analytics provider based on environment
 */
function getProvider(): AnalyticsProvider {
  if (provider) {
    return provider
  }

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID

  if (!measurementId) {
    if (import.meta.env.DEV) {
      console.log('[Analytics] No VITE_GA_MEASUREMENT_ID found, using NullProvider')
    }
    provider = new NullAnalyticsProvider()
    return provider
  }

  provider = new GoogleAnalyticsProvider()
  return provider
}

/**
 * Initialize analytics with consent mode and start watching for consent changes
 */
export async function initAnalytics(): Promise<void> {
  const provider = getProvider()
  const { consentState } = useConsent()

  // Initialize provider with config
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (measurementId) {
    await provider.init({
      measurementId,
      debug: import.meta.env.DEV,
      anonymizeIp: true,
      sendPageView: false, // We send page views manually via router
    })

    // Watch for consent changes and update provider
    watch(
      () => consentState.value.analytics,
      (analyticsConsent) => {
        provider.updateConsent(analyticsConsent)
      },
      { immediate: true } // Apply current consent state immediately
    )
  } else {
    // NullProvider still needs init
    await provider.init({
      measurementId: '',
    })
  }
}

/**
 * Main analytics composable with strongly-typed tracking methods
 */
export function useAnalytics() {
  const provider = getProvider()

  return {
    /**
     * Track when the map is rendered
     */
    trackMapRendered(): void {
      provider.trackEvent('map_rendered')
    },

    /**
     * Track when a user views a location detail
     */
    trackLocationDetailView(locationSlug: string, category?: string): void {
      provider.trackEvent('location_detail_view', {
        location_slug: locationSlug,
        category,
      })
    },

    /**
     * Track when a user clicks a share button
     */
    trackShareClick(method: string, locationSlug: string): void {
      provider.trackEvent('share_click', {
        method,
        location_slug: locationSlug,
      })
    },

    /**
     * Track when a user starts a location submission
     */
    trackSubmissionStarted(method: 'google_maps' | 'pin_on_map'): void {
      provider.trackEvent('submission_started', {
        method,
      })
    },

    /**
     * Track when a user completes a location submission
     */
    trackSubmissionCompleted(method: 'google_maps' | 'pin_on_map'): void {
      provider.trackEvent('submission_completed', {
        method,
      })
    },

    /**
     * Track when a user submits an edit suggestion
     */
    trackEditSuggestionSubmitted(locationSlug: string): void {
      provider.trackEvent('edit_suggestion_submitted', {
        location_slug: locationSlug,
      })
    },

    /**
     * Track a page view (called automatically by router)
     */
    trackPageView(path: string, title?: string): void {
      provider.trackPageView(path, title)
    },

    /**
     * Track a raw event (escape hatch for custom events)
     */
    trackEvent(name: AnalyticsEventName | string, params?: EventParams): void {
      provider.trackEvent(name, params)
    },

    /**
     * Check if analytics is ready
     */
    isReady(): boolean {
      return provider.isReady()
    },
  }
}
