import { ref, readonly } from 'vue'
import type { ConsentState } from '@/types/consent'
import { CONSENT_VERSION, CONSENT_STORAGE_KEY } from '@/types/consent'

const consentState = ref<ConsentState>({
  analytics: false,
  timestamp: null,
  version: CONSENT_VERSION,
})

const isConsentGiven = ref(false)
const showBanner = ref(false)

function loadConsent(): void {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (stored) {
      const parsed: ConsentState = JSON.parse(stored)
      // Re-ask consent if version changed
      if (parsed.version === CONSENT_VERSION) {
        consentState.value = parsed
        isConsentGiven.value = true
        showBanner.value = false
        return
      }
    }
  } catch {
    // Invalid stored data, show banner
  }
  showBanner.value = true
}

function acceptAnalytics(): void {
  consentState.value = {
    analytics: true,
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  }
  saveAndClose()
}

function declineAnalytics(): void {
  consentState.value = {
    analytics: false,
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  }
  saveAndClose()
}

function saveAndClose(): void {
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentState.value))
  isConsentGiven.value = true
  showBanner.value = false
}

export function useConsent() {
  return {
    consentState: readonly(consentState),
    isConsentGiven: readonly(isConsentGiven),
    showBanner: readonly(showBanner),
    loadConsent,
    acceptAnalytics,
    declineAnalytics,
  }
}
