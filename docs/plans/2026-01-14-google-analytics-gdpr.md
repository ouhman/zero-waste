# Google Analytics Integration (GDPR-Compliant)

**Created:** 2026-01-14
**Status:** Ready for execution
**Estimated phases:** 4
**Target tokens per phase:** ~40-50k

## Overview

Add privacy-respecting Google Analytics 4 (GA4) to Zero Waste Frankfurt with:
- Friendly cookie consent banner (no tracking before consent)
- Google Consent Mode v2 for EU compliance
- Provider abstraction layer (easy future switch to Plausible/Matomo)
- Custom event tracking for key user interactions

## Key Principles

- **KISS** - Simple consent banner, minimal abstraction
- **DRY** - Single analytics composable used everywhere
- **YAGNI** - Only GA4 provider now, abstraction ready for future
- **Privacy-first** - No personal data, IP anonymization, consent-required

## Events to Track

| Event | Trigger | Parameters |
|-------|---------|------------|
| `map_rendered` | MapContainer mounted | - |
| `location_detail_view` | LocationDetailPanel opened | `location_slug`, `category` |
| `share_click` | Share button clicked | `method` (clipboard/native), `location_slug` |
| `submission_started` | User begins submission | `method` (google_maps/pin_on_map) |
| `submission_completed` | Submission successfully sent | `method` |
| `edit_suggestion_submitted` | User suggests an edit | `location_slug` |

## GA4 Property Setup (Manual Step)

Create **two separate GA4 properties** to keep dev traffic separate from production.

### Production Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Admin → Create → Property
3. Property name: `Zero Waste Frankfurt - Production`
4. Timezone: `Germany`, Currency: `Euro`
5. Business type: `Other` → `Understand user behavior`
6. Create a **Web** data stream:
   - URL: `https://map.zerowastefrankfurt.de`
   - Stream name: `Production`
7. Copy the **Measurement ID** (starts with `G-`)
8. **Important settings** (Data Settings → Data Collection):
   - Disable Google Signals (we don't need cross-device tracking)
   - Data retention: 14 months (minimum needed)

### Development Property

1. Admin → Create → Property (same account)
2. Property name: `Zero Waste Frankfurt - Development`
3. Same settings as production
4. Create a **Web** data stream:
   - URL: `http://localhost:5173`
   - Stream name: `Development`
5. Copy the **Measurement ID**

### Environment Files

**`.env.development`** (local dev):
```
VITE_GA_MEASUREMENT_ID=G-DEV1234567
```

**`.env.production`** (production build):
```
VITE_GA_MEASUREMENT_ID=G-PROD7654321
```

Vite automatically loads the correct file based on build mode:
- `npm run dev` → `.env.development`
- `npm run build` → `.env.production`

---

# Phase 1: Cookie Consent Banner

**Goal:** Create a friendly, non-intrusive consent banner with localStorage persistence.

**Estimated tokens:** ~45k

## Files to Create

### 1.1 Consent Types

**File:** `src/types/consent.ts`

```typescript
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
```

### 1.2 Consent Composable

**File:** `src/composables/useConsent.ts`

```typescript
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
```

### 1.3 Cookie Consent Banner Component

**File:** `src/components/common/CookieConsentBanner.vue`

```vue
<template>
  <Transition name="slide-up">
    <div
      v-if="showBanner"
      class="cookie-banner"
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-description"
    >
      <div class="cookie-content">
        <div class="cookie-text">
          <h2 id="cookie-title" class="cookie-title">
            {{ t('consent.title') }}
          </h2>
          <p id="cookie-description" class="cookie-description">
            {{ t('consent.description') }}
          </p>
        </div>
        <div class="cookie-actions">
          <button
            class="btn btn-secondary"
            @click="decline"
          >
            {{ t('consent.decline') }}
          </button>
          <button
            class="btn btn-primary"
            @click="accept"
          >
            {{ t('consent.accept') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useConsent } from '@/composables/useConsent'

const { t } = useI18n()
const { showBanner, acceptAnalytics, declineAnalytics } = useConsent()

function accept(): void {
  acceptAnalytics()
}

function decline(): void {
  declineAnalytics()
}
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: white;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -4px 6px -1px rgb(0 0 0 / 0.1);
  padding: 1rem;
}

.cookie-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .cookie-content {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.cookie-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #1f2937;
}

.cookie-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.cookie-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary {
  background: #16a34a;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #15803d;
}

.btn-secondary {
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f3f4f6;
}

/* Transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
```

### 1.4 i18n Translations

**Add to `src/locales/en.json`:**

```json
{
  "consent": {
    "title": "Help us improve this map",
    "description": "We use cookies to understand how the map is used — like which features are popular. We never track personal information or your location. Your data stays anonymous.",
    "accept": "Sure, that's fine",
    "decline": "No thanks"
  }
}
```

**Add to `src/locales/de.json`:**

```json
{
  "consent": {
    "title": "Hilf uns, die Karte zu verbessern",
    "description": "Wir nutzen Cookies, um zu verstehen, wie die Karte genutzt wird — z.B. welche Funktionen beliebt sind. Wir erfassen niemals persönliche Daten oder deinen Standort. Deine Daten bleiben anonym.",
    "accept": "Ja, kein Problem",
    "decline": "Nein danke"
  }
}
```

### 1.5 Integrate Banner in App.vue

**Update `src/App.vue`:**

```vue
<template>
  <div id="app">
    <RouterView />
    <ToastContainer />
    <CookieConsentBanner />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import ToastContainer from '@/components/common/ToastContainer.vue'
import CookieConsentBanner from '@/components/common/CookieConsentBanner.vue'
import { useConsent } from '@/composables/useConsent'

const { loadConsent } = useConsent()

onMounted(() => {
  loadConsent()
})
</script>
```

## Tests for Phase 1

**File:** `tests/unit/composables/useConsent.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useConsent } from '@/composables/useConsent'
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from '@/types/consent'

describe('useConsent', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset module state between tests
    vi.resetModules()
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
  })
})
```

**File:** `tests/component/common/CookieConsentBanner.spec.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import CookieConsentBanner from '@/components/common/CookieConsentBanner.vue'

// Mock useConsent
const mockAccept = vi.fn()
const mockDecline = vi.fn()
const mockShowBanner = ref(true)

vi.mock('@/composables/useConsent', () => ({
  useConsent: () => ({
    showBanner: mockShowBanner,
    acceptAnalytics: mockAccept,
    declineAnalytics: mockDecline,
  }),
}))

describe('CookieConsentBanner', () => {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: {
        consent: {
          title: 'Help us improve',
          description: 'We use cookies...',
          accept: 'Accept',
          decline: 'Decline',
        },
      },
    },
  })

  beforeEach(() => {
    mockAccept.mockClear()
    mockDecline.mockClear()
    mockShowBanner.value = true
  })

  it('renders when showBanner is true', () => {
    const wrapper = mount(CookieConsentBanner, {
      global: { plugins: [i18n] },
    })
    expect(wrapper.find('.cookie-banner').exists()).toBe(true)
  })

  it('calls acceptAnalytics on accept click', async () => {
    const wrapper = mount(CookieConsentBanner, {
      global: { plugins: [i18n] },
    })
    await wrapper.find('.btn-primary').trigger('click')
    expect(mockAccept).toHaveBeenCalled()
  })

  it('calls declineAnalytics on decline click', async () => {
    const wrapper = mount(CookieConsentBanner, {
      global: { plugins: [i18n] },
    })
    await wrapper.find('.btn-secondary').trigger('click')
    expect(mockDecline).toHaveBeenCalled()
  })
})
```

## Phase 1 Checklist

- [ ] Create `src/types/consent.ts`
- [ ] Create `src/composables/useConsent.ts`
- [ ] Create `src/components/common/CookieConsentBanner.vue`
- [ ] Add i18n translations (en.json and de.json)
- [ ] Update `App.vue` to include banner
- [ ] Write unit tests for useConsent
- [ ] Write component tests for CookieConsentBanner
- [ ] Manual test: banner appears on first visit
- [ ] Manual test: banner hidden after choice
- [ ] Manual test: choice persists after refresh
- [ ] Run `npm run type-check` - passes
- [ ] Run `npm test` - passes

---

# Phase 2: Analytics Abstraction & GA4 Provider

**Goal:** Create provider abstraction and implement GA4 with Consent Mode v2.

**Estimated tokens:** ~45k

## Files to Create

### 2.1 Analytics Types

**File:** `src/types/analytics.ts`

```typescript
/**
 * Analytics provider interface.
 * Implement this to add new analytics providers (Plausible, Matomo, etc.)
 */
export interface AnalyticsProvider {
  /**
   * Initialize the provider (load scripts, set config)
   */
  init(): void

  /**
   * Track a custom event
   */
  trackEvent(name: AnalyticsEventName, params?: EventParams): void

  /**
   * Track a page view
   */
  trackPageView(path: string, title?: string): void

  /**
   * Update consent state (for GDPR compliance)
   */
  updateConsent(granted: boolean): void

  /**
   * Check if provider is ready
   */
  isReady(): boolean
}

/**
 * Strongly-typed event names to prevent typos
 */
export type AnalyticsEventName =
  | 'map_rendered'
  | 'location_detail_view'
  | 'share_click'
  | 'submission_started'
  | 'submission_completed'
  | 'edit_suggestion_submitted'

/**
 * Event parameters
 */
export interface EventParams {
  location_slug?: string
  category?: string
  method?: 'clipboard' | 'native' | 'google_maps' | 'pin_on_map'
  [key: string]: string | number | boolean | undefined
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  measurementId: string
  debug?: boolean
}
```

### 2.2 GA4 Provider

**File:** `src/lib/analytics/googleAnalytics.ts`

```typescript
import type { AnalyticsProvider, AnalyticsEventName, EventParams, AnalyticsConfig } from '@/types/analytics'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

export class GoogleAnalyticsProvider implements AnalyticsProvider {
  private config: AnalyticsConfig
  private initialized = false

  constructor(config: AnalyticsConfig) {
    this.config = config
  }

  init(): void {
    if (this.initialized || typeof window === 'undefined') return

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments)
    }

    // Set default consent to denied (GDPR)
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })

    // Load GA4 script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.measurementId}`
    document.head.appendChild(script)

    // Initialize gtag
    window.gtag('js', new Date())
    window.gtag('config', this.config.measurementId, {
      anonymize_ip: true, // Extra safety, though GA4 does this by default
      send_page_view: false, // We'll send page views manually via router
    })

    if (this.config.debug) {
      console.log('[Analytics] GA4 initialized with consent denied')
    }

    this.initialized = true
  }

  updateConsent(granted: boolean): void {
    if (!this.initialized) return

    window.gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
    })

    if (this.config.debug) {
      console.log(`[Analytics] Consent updated: ${granted ? 'granted' : 'denied'}`)
    }
  }

  trackEvent(name: AnalyticsEventName, params?: EventParams): void {
    if (!this.initialized) return

    window.gtag('event', name, {
      ...params,
      event_category: 'engagement',
    })

    if (this.config.debug) {
      console.log(`[Analytics] Event: ${name}`, params)
    }
  }

  trackPageView(path: string, title?: string): void {
    if (!this.initialized) return

    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
    })

    if (this.config.debug) {
      console.log(`[Analytics] Page view: ${path}`)
    }
  }

  isReady(): boolean {
    return this.initialized
  }
}
```

### 2.3 Null Provider (for testing/disabled state)

**File:** `src/lib/analytics/nullProvider.ts`

```typescript
import type { AnalyticsProvider, AnalyticsEventName, EventParams } from '@/types/analytics'

/**
 * No-op analytics provider for testing or when analytics is disabled
 */
export class NullAnalyticsProvider implements AnalyticsProvider {
  init(): void {
    // No-op
  }

  updateConsent(_granted: boolean): void {
    // No-op
  }

  trackEvent(_name: AnalyticsEventName, _params?: EventParams): void {
    // No-op
  }

  trackPageView(_path: string, _title?: string): void {
    // No-op
  }

  isReady(): boolean {
    return true
  }
}
```

### 2.4 Analytics Composable

**File:** `src/composables/useAnalytics.ts`

```typescript
import { watch } from 'vue'
import type { AnalyticsProvider, AnalyticsEventName, EventParams } from '@/types/analytics'
import { GoogleAnalyticsProvider } from '@/lib/analytics/googleAnalytics'
import { NullAnalyticsProvider } from '@/lib/analytics/nullProvider'
import { useConsent } from '@/composables/useConsent'

// Singleton provider instance
let provider: AnalyticsProvider | null = null

function getProvider(): AnalyticsProvider {
  if (provider) return provider

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID

  if (!measurementId) {
    console.warn('[Analytics] VITE_GA_MEASUREMENT_ID not set, analytics disabled')
    provider = new NullAnalyticsProvider()
    return provider
  }

  provider = new GoogleAnalyticsProvider({
    measurementId,
    debug: import.meta.env.DEV,
  })

  return provider
}

/**
 * Initialize analytics and set up consent watcher.
 * Call this once in App.vue or main.ts
 */
export function initAnalytics(): void {
  const analyticsProvider = getProvider()
  analyticsProvider.init()

  const { consentState, isConsentGiven } = useConsent()

  // Watch for consent changes
  watch(
    () => consentState.value.analytics,
    (granted) => {
      if (isConsentGiven.value) {
        analyticsProvider.updateConsent(granted)
      }
    },
    { immediate: true }
  )
}

/**
 * Analytics composable with strongly-typed tracking methods
 */
export function useAnalytics() {
  const analyticsProvider = getProvider()

  return {
    /**
     * Track when the main map is rendered
     */
    trackMapRendered: () => {
      analyticsProvider.trackEvent('map_rendered')
    },

    /**
     * Track when a location detail panel is opened
     */
    trackLocationDetailView: (locationSlug: string, category?: string) => {
      analyticsProvider.trackEvent('location_detail_view', {
        location_slug: locationSlug,
        category,
      })
    },

    /**
     * Track share button clicks
     */
    trackShareClick: (method: 'clipboard' | 'native', locationSlug: string) => {
      analyticsProvider.trackEvent('share_click', {
        method,
        location_slug: locationSlug,
      })
    },

    /**
     * Track when user starts the submission flow
     */
    trackSubmissionStarted: (method: 'google_maps' | 'pin_on_map') => {
      analyticsProvider.trackEvent('submission_started', { method })
    },

    /**
     * Track successful submission
     */
    trackSubmissionCompleted: (method: 'google_maps' | 'pin_on_map') => {
      analyticsProvider.trackEvent('submission_completed', { method })
    },

    /**
     * Track edit suggestions
     */
    trackEditSuggestionSubmitted: (locationSlug: string) => {
      analyticsProvider.trackEvent('edit_suggestion_submitted', {
        location_slug: locationSlug,
      })
    },

    /**
     * Track page views (called by router)
     */
    trackPageView: (path: string, title?: string) => {
      analyticsProvider.trackPageView(path, title)
    },

    /**
     * Raw event tracking (escape hatch)
     */
    trackEvent: (name: AnalyticsEventName, params?: EventParams) => {
      analyticsProvider.trackEvent(name, params)
    },
  }
}
```

### 2.5 Router Integration (Page Views)

**Update `src/router/index.ts`:**

Add after router definition:

```typescript
import { useAnalytics } from '@/composables/useAnalytics'

// Track page views
router.afterEach((to) => {
  const { trackPageView } = useAnalytics()
  trackPageView(to.fullPath, document.title)
})
```

### 2.6 Initialize in App

**Update `src/App.vue`:**

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import ToastContainer from '@/components/common/ToastContainer.vue'
import CookieConsentBanner from '@/components/common/CookieConsentBanner.vue'
import { useConsent } from '@/composables/useConsent'
import { initAnalytics } from '@/composables/useAnalytics'

const { loadConsent } = useConsent()

onMounted(() => {
  loadConsent()
  initAnalytics()
})
</script>
```

### 2.7 Environment Files

**Create `.env.development`** (for local dev):

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GA_MEASUREMENT_ID=G-DEV1234567
```

**Create `.env.production`** (for production builds):

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GA_MEASUREMENT_ID=G-PROD7654321
```

**Update `.env.example`:**

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # Optional: Get from GA4 dashboard
```

**Add to `.gitignore`** (if not already):

```
.env.development
.env.production
```

**Update `src/vite-env.d.ts`:**

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GA_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## Tests for Phase 2

**File:** `tests/unit/lib/analytics/googleAnalytics.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GoogleAnalyticsProvider } from '@/lib/analytics/googleAnalytics'

describe('GoogleAnalyticsProvider', () => {
  beforeEach(() => {
    // Reset window
    delete (window as any).dataLayer
    delete (window as any).gtag
    document.head.innerHTML = ''
  })

  it('initializes gtag with consent denied', () => {
    const provider = new GoogleAnalyticsProvider({ measurementId: 'G-TEST123' })
    provider.init()

    expect(window.dataLayer).toBeDefined()
    expect(window.gtag).toBeDefined()
    expect(document.querySelector('script[src*="gtag"]')).toBeTruthy()
  })

  it('updates consent when called', () => {
    const provider = new GoogleAnalyticsProvider({ measurementId: 'G-TEST123' })
    provider.init()

    const gtagSpy = vi.spyOn(window, 'gtag')
    provider.updateConsent(true)

    expect(gtagSpy).toHaveBeenCalledWith('consent', 'update', {
      analytics_storage: 'granted',
    })
  })

  it('tracks events', () => {
    const provider = new GoogleAnalyticsProvider({ measurementId: 'G-TEST123' })
    provider.init()

    const gtagSpy = vi.spyOn(window, 'gtag')
    provider.trackEvent('map_rendered', { test: 'value' })

    expect(gtagSpy).toHaveBeenCalledWith('event', 'map_rendered', {
      test: 'value',
      event_category: 'engagement',
    })
  })

  it('is ready after init', () => {
    const provider = new GoogleAnalyticsProvider({ measurementId: 'G-TEST123' })
    expect(provider.isReady()).toBe(false)
    provider.init()
    expect(provider.isReady()).toBe(true)
  })
})
```

**File:** `tests/unit/composables/useAnalytics.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the provider
vi.mock('@/lib/analytics/googleAnalytics', () => ({
  GoogleAnalyticsProvider: vi.fn().mockImplementation(() => ({
    init: vi.fn(),
    updateConsent: vi.fn(),
    trackEvent: vi.fn(),
    trackPageView: vi.fn(),
    isReady: vi.fn().mockReturnValue(true),
  })),
}))

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('provides typed tracking methods', async () => {
    const { useAnalytics } = await import('@/composables/useAnalytics')
    const analytics = useAnalytics()

    expect(analytics.trackMapRendered).toBeDefined()
    expect(analytics.trackLocationDetailView).toBeDefined()
    expect(analytics.trackShareClick).toBeDefined()
    expect(analytics.trackSubmissionStarted).toBeDefined()
    expect(analytics.trackSubmissionCompleted).toBeDefined()
    expect(analytics.trackEditSuggestionSubmitted).toBeDefined()
  })
})
```

## Phase 2 Checklist

- [ ] Create `src/types/analytics.ts`
- [ ] Create `src/lib/analytics/googleAnalytics.ts`
- [ ] Create `src/lib/analytics/nullProvider.ts`
- [ ] Create `src/composables/useAnalytics.ts`
- [ ] Update `src/router/index.ts` for page view tracking
- [ ] Update `App.vue` to call `initAnalytics()`
- [ ] Create `.env.development` with dev GA measurement ID
- [ ] Create `.env.production` with prod GA measurement ID
- [ ] Update `.env.example` with placeholder
- [ ] Add `.env.development` and `.env.production` to `.gitignore`
- [ ] Update `vite-env.d.ts` with env types
- [ ] Write tests for GA provider
- [ ] Write tests for useAnalytics
- [ ] Manual test: GA script loads in browser (dev property)
- [ ] Manual test: Consent denied by default (check Network tab)
- [ ] Manual test: Consent updates after accepting banner
- [ ] Run `npm run type-check` - passes
- [ ] Run `npm test` - passes

---

# Phase 3: Event Tracking Implementation

**Goal:** Add tracking calls to components for all specified events.

**Estimated tokens:** ~40k

## Components to Update

### 3.1 Map Rendered Event

**File:** `src/components/map/MapContainer.vue`

Add tracking when map component mounts:

```typescript
import { useAnalytics } from '@/composables/useAnalytics'

const { trackMapRendered } = useAnalytics()

// Track once when map is first rendered
let hasTrackedMapRender = false

onMounted(() => {
  if (!hasTrackedMapRender) {
    trackMapRendered()
    hasTrackedMapRender = true
  }
})
```

### 3.2 Location Detail View Event

**File:** `src/components/LocationDetailPanel.vue`

Track when location details are viewed:

```typescript
import { useAnalytics } from '@/composables/useAnalytics'

const { trackLocationDetailView } = useAnalytics()

// Watch for location changes and track views
watch(
  () => props.location,
  (location) => {
    if (location?.slug) {
      const categoryName = location.categories?.[0]?.name
      trackLocationDetailView(location.slug, categoryName)
    }
  },
  { immediate: true }
)
```

### 3.3 Share Button Click Event

**File:** `src/components/LocationDetailPanel.vue` (or wherever share logic is)

Track share method:

```typescript
import { useAnalytics } from '@/composables/useAnalytics'

const { trackShareClick } = useAnalytics()

async function handleShare() {
  const locationSlug = props.location?.slug || 'unknown'

  if (navigator.share) {
    try {
      await navigator.share({ /* ... */ })
      trackShareClick('native', locationSlug)
    } catch {
      // User cancelled, don't track
    }
  } else {
    await navigator.clipboard.writeText(shareUrl)
    trackShareClick('clipboard', locationSlug)
  }
}
```

### 3.4 Submission Started Event

**File:** `src/views/SubmitView.vue` (or method selector component)

Track when user picks a submission method:

```typescript
import { useAnalytics } from '@/composables/useAnalytics'

const { trackSubmissionStarted } = useAnalytics()

function selectGoogleMapsMethod() {
  trackSubmissionStarted('google_maps')
  // ... existing logic
}

function selectPinOnMapMethod() {
  trackSubmissionStarted('pin_on_map')
  // ... existing logic
}
```

### 3.5 Submission Completed Event

**File:** `src/composables/useSubmission.ts` (or submission handler)

Track successful submissions:

```typescript
import { useAnalytics } from '@/composables/useAnalytics'

const { trackSubmissionCompleted } = useAnalytics()

async function submitLocation(data: SubmissionData, method: 'google_maps' | 'pin_on_map') {
  try {
    // ... submission logic
    await supabase.functions.invoke('submit-location', { body: data })
    trackSubmissionCompleted(method)
    return { success: true }
  } catch (error) {
    // Don't track failed submissions
    throw error
  }
}
```

### 3.6 Edit Suggestion Event

**File:** Component that handles edit suggestions (if exists)

```typescript
import { useAnalytics } from '@/composables/useAnalytics'

const { trackEditSuggestionSubmitted } = useAnalytics()

async function submitEditSuggestion(locationSlug: string, edits: EditData) {
  try {
    // ... submission logic
    trackEditSuggestionSubmitted(locationSlug)
    return { success: true }
  } catch (error) {
    throw error
  }
}
```

## Notes on Implementation

- **Find exact file locations** - The above are templates. Locate the actual components/composables.
- **Keep tracking calls minimal** - One line per event, no complex logic
- **Only track success** - Don't track failed/cancelled actions
- **No PII** - Never include email, name, or personal data in events

## Phase 3 Checklist

- [ ] Add `trackMapRendered()` to MapContainer.vue
- [ ] Add `trackLocationDetailView()` to LocationDetailPanel.vue
- [ ] Add `trackShareClick()` to share handler
- [ ] Add `trackSubmissionStarted()` to method selector
- [ ] Add `trackSubmissionCompleted()` to submission handler
- [ ] Add `trackEditSuggestionSubmitted()` if edit feature exists
- [ ] Verify no PII in any tracking calls
- [ ] Run `npm run type-check` - passes
- [ ] Run `npm test` - passes

---

# Phase 4: Testing & Documentation

**Goal:** Final testing, GA4 verification, and documentation updates.

**Estimated tokens:** ~25k

## 4.1 Manual Testing Checklist

### Consent Flow
- [ ] Fresh visit: banner appears at bottom
- [ ] Accept: banner disappears, choice saved
- [ ] Decline: banner disappears, no tracking
- [ ] Refresh: banner stays hidden (localStorage persists)
- [ ] Clear localStorage: banner reappears

### Environment Verification
- [ ] `npm run dev` → Network tab shows dev measurement ID (G-DEV...)
- [ ] `npm run build && npm run preview` → Shows prod measurement ID (G-PROD...)
- [ ] Dev events appear in "Development" GA4 property
- [ ] Prod events appear in "Production" GA4 property

### GA4 Verification (Chrome DevTools)
1. Open Network tab, filter by `google`
2. With consent denied:
   - `gtag/js` script loads
   - No `collect` requests with full data
3. Accept consent:
   - `collect` requests appear with `gcs=G111` (consent granted)
4. Check Real-time reports in correct GA4 property (dev vs prod)

### Event Verification (Test in Dev Property)
- [ ] Open map → see `map_rendered` in GA4 Real-time → Events
- [ ] Click on location → see `location_detail_view`
- [ ] Click share → see `share_click`
- [ ] Start submission → see `submission_started`
- [ ] Complete submission → see `submission_completed`

## 4.2 GA4 Dashboard Setup

Create custom reports for the tracked events:

1. **Reports → Engagement → Events**
   - All custom events should appear here

2. **Create Custom Report:**
   - Explore → Create new exploration
   - Dimensions: Event name, date
   - Metrics: Event count
   - Filter to your custom events

## 4.3 Documentation Updates

**Update `CLAUDE.md`:**

Add under Tech Stack or new section:

```markdown
## Analytics

Uses Google Analytics 4 with GDPR-compliant implementation:
- Cookie consent required before tracking (Consent Mode v2)
- IP anonymization enabled
- No personal data tracked

### Events Tracked
- `map_rendered` - Main map loaded
- `location_detail_view` - Location details opened
- `share_click` - Share button used
- `submission_started` - User begins adding location
- `submission_completed` - Location successfully submitted
- `edit_suggestion_submitted` - Edit suggestion sent

### Configuration
Two separate GA4 properties are used:
- `.env.development` → Development property (localhost traffic)
- `.env.production` → Production property (live site traffic)

Set `VITE_GA_MEASUREMENT_ID` in each file with the respective measurement ID.

### Switching Providers
Analytics uses a provider abstraction (`src/types/analytics.ts`).
To switch to Plausible/Matomo, implement `AnalyticsProvider` interface.
```

**Update `README.md`:**

Add to environment variables section:

```markdown
# Analytics (optional - uses NullProvider if not set)
# Create separate .env.development and .env.production files
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # Get from GA4 dashboard
```

## 4.4 Create Analytics Documentation

**File:** `docs/analytics.md`

```markdown
# Analytics Integration

## Overview

Zero Waste Frankfurt uses Google Analytics 4 for anonymous usage analytics.
The implementation is GDPR-compliant and privacy-focused.

## Privacy Features

- **Consent-first**: No tracking until user accepts cookie banner
- **IP Anonymization**: Enabled by default in GA4, plus explicit config
- **No PII**: No personal information is ever tracked
- **Consent Mode v2**: EU-compliant consent handling

## Architecture

```
┌─────────────────────┐
│   useAnalytics()    │  ← Composable (strongly-typed methods)
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ AnalyticsProvider   │  ← Interface
│    (abstract)       │
└──────────┬──────────┘
           │
┌──────────▼──────────┐     ┌─────────────────────┐
│ GoogleAnalytics     │     │   NullProvider      │
│    Provider         │     │   (testing/off)     │
└─────────────────────┘     └─────────────────────┘
```

## Adding a New Provider (e.g., Plausible)

1. Create `src/lib/analytics/plausible.ts`
2. Implement `AnalyticsProvider` interface
3. Update `getProvider()` in `useAnalytics.ts`

## Events

| Event | Description | Parameters |
|-------|-------------|------------|
| `map_rendered` | Main map loaded | - |
| `location_detail_view` | Location panel opened | `location_slug`, `category` |
| `share_click` | Share button clicked | `method`, `location_slug` |
| `submission_started` | Submission flow started | `method` |
| `submission_completed` | Submission successful | `method` |
| `edit_suggestion_submitted` | Edit suggested | `location_slug` |

## Environment Setup

Two separate GA4 properties keep dev traffic separate from production:

| Environment | File | GA4 Property |
|-------------|------|--------------|
| Development | `.env.development` | Zero Waste Frankfurt - Development |
| Production | `.env.production` | Zero Waste Frankfurt - Production |

Vite automatically loads the correct file:
- `npm run dev` → `.env.development`
- `npm run build` → `.env.production`

## Testing

To test locally without sending data to GA:
1. Don't set `VITE_GA_MEASUREMENT_ID` in `.env.development`
2. NullProvider will be used (no-op)

For integration testing:
1. Use the Development GA4 property
2. Check Real-time reports in the Development dashboard
3. Production property stays clean for real user data
```

## Phase 4 Checklist

- [ ] Complete manual testing checklist
- [ ] Verify events in GA4 Real-time reports
- [ ] Update `CLAUDE.md` with analytics section
- [ ] Update `README.md` with env variable
- [ ] Create `docs/analytics.md`
- [ ] Final `npm run build` - succeeds
- [ ] Deploy to staging (if applicable)
- [ ] Verify in production GA4 dashboard

---

# Summary

| Phase | Description | Key Files | Est. Tokens |
|-------|-------------|-----------|-------------|
| 1 | Cookie consent banner | `useConsent.ts`, `CookieConsentBanner.vue`, i18n | ~45k |
| 2 | Analytics abstraction + GA4 | `useAnalytics.ts`, `googleAnalytics.ts`, types | ~45k |
| 3 | Event tracking in components | Updates to 5-6 existing components | ~40k |
| 4 | Testing & documentation | Manual testing, docs, GA4 setup | ~25k |

**Total estimated:** ~155k tokens across 4 phases

## Future Improvements (Out of Scope)

- [ ] Privacy policy page with analytics disclosure
- [ ] "Manage cookies" settings in footer
- [ ] Switch to Plausible when budget allows
- [ ] Server-side analytics for edge functions
