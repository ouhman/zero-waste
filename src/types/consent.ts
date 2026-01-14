export interface ConsentState {
  analytics: boolean
  timestamp: number | null
  version: number
}

export interface ConsentBannerProps {
  show: boolean
}

// Version bump forces re-consent if we add new tracking categories
export const CONSENT_VERSION = 1
export const CONSENT_STORAGE_KEY = 'zwf-cookie-consent'
