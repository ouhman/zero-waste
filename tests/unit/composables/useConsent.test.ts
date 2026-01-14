import { describe, it, expect, beforeEach } from 'vitest'
import { useConsent } from '@/composables/useConsent'
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from '@/types/consent'

describe('useConsent', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows banner when no consent stored', () => {
    const { loadConsent, showBanner } = useConsent()
    loadConsent()
    expect(showBanner.value).toBe(true)
  })

  it('hides banner when valid consent exists', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
      analytics: true,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    }))
    const { loadConsent, showBanner, consentState } = useConsent()
    loadConsent()
    expect(showBanner.value).toBe(false)
    expect(consentState.value.analytics).toBe(true)
  })

  it('shows banner when consent version is outdated', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
      analytics: true,
      timestamp: Date.now(),
      version: CONSENT_VERSION - 1,
    }))
    const { loadConsent, showBanner } = useConsent()
    loadConsent()
    expect(showBanner.value).toBe(true)
  })

  it('saves consent when accepted', () => {
    const { acceptAnalytics, consentState, showBanner } = useConsent()
    acceptAnalytics()
    expect(consentState.value.analytics).toBe(true)
    expect(showBanner.value).toBe(false)
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeTruthy()
  })

  it('saves declined consent', () => {
    const { declineAnalytics, consentState, showBanner } = useConsent()
    declineAnalytics()
    expect(consentState.value.analytics).toBe(false)
    expect(showBanner.value).toBe(false)
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
    expect(stored).toBeTruthy()
    if (stored) {
      const parsed = JSON.parse(stored)
      expect(parsed.analytics).toBe(false)
    }
  })
})
