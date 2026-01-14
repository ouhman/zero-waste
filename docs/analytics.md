# Analytics Integration

## Overview

Zero Waste Frankfurt uses Google Analytics 4 for anonymous usage analytics.
The implementation is GDPR-compliant and privacy-focused.

## Privacy Features

- **Consent-first**: No tracking until user accepts cookie banner
- **IP Anonymization**: Enabled by default in GA4, plus explicit config
- **No PII**: No personal information is ever tracked
- **Consent Mode v2**: EU-compliant consent handling
- **No cross-device tracking**: Google Signals disabled
- **Minimal data retention**: 14 months (GA4 minimum)

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

The analytics implementation uses a provider abstraction pattern, making it easy to switch providers.

1. **Create provider file**: `src/lib/analytics/plausible.ts`
2. **Implement the interface**:

```typescript
import type { AnalyticsProvider, AnalyticsEventName, EventParams, AnalyticsConfig } from '@/types/analytics'

export class PlausibleProvider implements AnalyticsProvider {
  private config: AnalyticsConfig
  private initialized = false

  constructor(config: AnalyticsConfig) {
    this.config = config
  }

  init(): void {
    // Load Plausible script
    const script = document.createElement('script')
    script.defer = true
    script.src = 'https://plausible.io/js/script.js'
    script.dataset.domain = this.config.measurementId
    document.head.appendChild(script)
    this.initialized = true
  }

  updateConsent(granted: boolean): void {
    // Plausible doesn't require consent handling (privacy-first by default)
  }

  trackEvent(name: AnalyticsEventName, params?: EventParams): void {
    if (!this.initialized || !window.plausible) return
    window.plausible(name, { props: params })
  }

  trackPageView(path: string, title?: string): void {
    // Plausible auto-tracks page views
  }

  isReady(): boolean {
    return this.initialized
  }
}
```

3. **Update composable**: Edit `src/composables/useAnalytics.ts`:

```typescript
function getProvider(): AnalyticsProvider {
  if (provider) return provider

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID

  if (!measurementId) {
    provider = new NullAnalyticsProvider()
    return provider
  }

  // Switch to Plausible
  provider = new PlausibleProvider({
    measurementId,
    debug: import.meta.env.DEV,
  })

  return provider
}
```

## Events

| Event | Description | Parameters | Tracked Where |
|-------|-------------|------------|---------------|
| `map_rendered` | Main map loaded | - | `src/components/map/MapContainer.vue` |
| `location_detail_view` | Location panel opened | `location_slug`, `category` | `src/components/map/LocationDetailPanel.vue` |
| `share_click` | Share button clicked | `method` (clipboard/native), `location_slug` | `src/components/map/ShareModal.vue` |
| `submission_started` | Submission flow started | `method` (google_maps/pin_on_map) | `src/components/submission/SubmissionMethodSelector.vue` |
| `submission_completed` | Submission successful | `method` | `src/views/SubmitView.vue` |
| `edit_suggestion_submitted` | Edit suggested | `location_slug` | `src/components/map/HoursSuggestionModal.vue` |

### Event Parameters

All events include:
- `event_category: 'engagement'` (automatically added by GA4 provider)

Individual event parameters:
- `location_slug`: URL slug of location (e.g., "unverpackt-laden-frankfurt-nordend")
- `category`: Category name (e.g., "Unverpackt-Laden")
- `method`: Action method (e.g., "clipboard", "native", "google_maps", "pin_on_map")

## Environment Setup

Single GA4 property with environment dimension for filtering dev/prod traffic:

| Environment | Value Sent | Filtered In GA4 |
|-------------|------------|-----------------|
| `npm run dev` | `environment: "development"` | Filter by Environment = development |
| `npm run build` | `environment: "production"` | Filter by Environment = production |

### Creating GA4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Admin → Create → Property
3. Property name: `Zero Waste Frankfurt`
4. Timezone: `Germany`, Currency: `Euro`
5. Create **Web** data stream with URL: `https://map.zerowastefrankfurt.de`
6. Copy Measurement ID (starts with `G-`)
7. **Important settings** (Data Settings → Data Collection):
   - Disable Google Signals
   - Data retention: 14 months

### Create Custom Dimension

1. Admin → Custom definitions → Create custom dimension
2. **Dimension name:** `Environment`
3. **Scope:** `Event`
4. **Event parameter:** `environment`
5. Save

### Environment File

**`.env`:**
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Filtering Reports by Environment

**In any GA4 report:**
1. Click **Add filter +**
2. Select **Environment** dimension
3. Choose: `exactly matches` → `production` or `development`
4. Click **Apply**

**Create Comparisons (for quick switching):**
1. Admin → Comparisons → Create comparison
2. Name: `Production`, Environment = `production`
3. Name: `Development`, Environment = `development`

**Note:** Real-time reports don't support custom dimension filters. Check individual event parameters instead.

## Testing

### Unit Tests

Tests are located in:
- `tests/unit/composables/useConsent.test.ts` - Consent management
- `tests/unit/composables/useAnalytics.test.ts` - Analytics composable
- `tests/unit/lib/analytics/googleAnalytics.test.ts` - GA4 provider
- `tests/component/common/CookieConsentBanner.spec.ts` - Banner component

Run tests:
```bash
npm test
```

### Manual Testing

**Test locally without sending data to GA:**
1. Don't set `VITE_GA_MEASUREMENT_ID` in `.env`
2. NullProvider will be used (no-op, console warnings only)

**Test with GA4:**
1. Set `VITE_GA_MEASUREMENT_ID` in `.env`
2. Run `npm run dev`
3. Open browser DevTools → Network tab → Filter by "google"
4. With consent denied:
   - `gtag/js` script loads
   - No `collect` requests with full data
5. Accept consent banner:
   - `collect` requests appear with `gcs=G111` (consent granted)
6. Check Real-time reports in GA4 (events will have `environment: development`)

**Test events:**
1. Open map → see `map_rendered` in GA4 Real-time → Events
2. Click on location → see `location_detail_view`
3. Click share → see `share_click`
4. Start submission → see `submission_started`
5. Complete submission → see `submission_completed`

## GA4 Dashboard Setup

### Real-time Reports

Navigate to: **Reports → Realtime**

You'll see:
- Active users
- Events in last 30 minutes
- Custom events with parameters

### Custom Reports

1. **Explore → Create new exploration**
2. Dimensions: Event name, date
3. Metrics: Event count
4. Filter to custom events only

### Event Parameter Debugging

1. **Configure → Events**
2. Click on event name
3. View parameters
4. Create conversions from events (e.g., `submission_completed`)

## Implementation Details

### Consent Flow

1. User visits site → `CookieConsentBanner` shows
2. User accepts → `useConsent().acceptAnalytics()` called
3. Consent stored in localStorage: `zwf-cookie-consent`
4. `initAnalytics()` watches consent changes
5. GA4 consent updated: `analytics_storage: 'granted'`
6. Events start being tracked

### Page View Tracking

Page views are automatically tracked via Vue Router:

```typescript
// src/router/index.ts
router.afterEach((to) => {
  const { trackPageView } = useAnalytics()
  trackPageView(to.fullPath, document.title)
})
```

### Debug Mode

Development builds automatically enable debug logging:

```typescript
const provider = new GoogleAnalyticsProvider({
  measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
  debug: import.meta.env.DEV, // true in development
})
```

Debug logs appear in console:
```
[Analytics] GA4 initialized with consent denied
[Analytics] Consent updated: granted
[Analytics] Event: map_rendered {}
[Analytics] Page view: /submit
```

## Troubleshooting

### Events not showing in GA4

1. **Check consent**: Open DevTools → Application → Local Storage → `zwf-cookie-consent`
   - `analytics: true` means tracking is enabled
2. **Check Network tab**: Filter by "collect"
   - Should see requests to `www.google-analytics.com/g/collect`
3. **Check GA4 property**: Make sure you're in the correct property (dev vs prod)
4. **Real-time reports delay**: Events can take 10-30 seconds to appear

### Development events mixed with Production

Dev and prod events share the same GA4 property but are tagged with `environment` dimension:
1. **Filter reports**: Add filter for Environment = `production` to see only prod data
2. **Check event parameters**: In Real-time, click events to see `environment` parameter

### Consent banner not appearing

1. **Check localStorage**: Clear `zwf-cookie-consent` from Application tab
2. **Check version mismatch**: If `CONSENT_VERSION` changed, old consent is invalid

### TypeScript errors

Make sure `src/vite-env.d.ts` includes:

```typescript
interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID?: string
}
```

## Privacy Compliance

This implementation is compliant with:

- **GDPR** (EU General Data Protection Regulation)
- **ePrivacy Directive** (Cookie Law)
- **Google Consent Mode v2** (required for EU users)

### What we DON'T track

- ❌ No personal information (names, emails, addresses)
- ❌ No location data (user's physical location)
- ❌ No cross-device tracking (Google Signals disabled)
- ❌ No advertising data
- ❌ No IP addresses (anonymized by default in GA4)

### What we DO track

- ✅ Page views (which pages are popular)
- ✅ Custom events (which features are used)
- ✅ Browser/device type (for UX optimization)
- ✅ City-level location (provided by GA4, not precise)

### User Rights

Users can:
- Decline tracking (consent banner)
- Clear consent (delete localStorage `zwf-cookie-consent`)
- Request data deletion (contact site admin)

## Future Improvements

Potential enhancements (out of scope for initial implementation):

- [ ] Privacy policy page with analytics disclosure
- [ ] "Manage cookies" settings in footer
- [ ] Switch to Plausible (privacy-first, no consent needed)
- [ ] Server-side analytics for edge functions
- [ ] Custom dimensions for location categories
- [ ] Funnel analysis for submission flow
- [ ] E-commerce tracking for donation conversions (if added)
