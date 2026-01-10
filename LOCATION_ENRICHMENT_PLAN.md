# Location Enrichment Feature - Implementation Plan

## Overview

This feature automatically enriches location data when users paste a Google Maps URL, reducing the complexity barrier for adding new locations. The system fetches business details (phone, opening hours, website, Instagram) from legal, free data sources.

## Data Sources (Priority Order)

| Source | Data Available | Cost | Rate Limits |
|--------|---------------|------|-------------|
| 1. OpenStreetMap Nominatim | phone, hours, email, website | Free | 1 req/sec |
| 2. Website Schema.org | hours, phone, social links | Free | Respectful |
| 3. Manual fallback | All fields | Free | N/A |

## Architecture Decision

**OSM-First Approach** - Germany has excellent OSM coverage for zero-waste shops. We query Nominatim with `extratags=1` to get business metadata, then optionally scrape the business website for Instagram (via schema.org `sameAs`).

---

## Phase 1: Enhanced Nominatim Integration (Frontend)
**Estimated Context: ~40k tokens**

### Goal
Extend the existing `useNominatim` composable to fetch business metadata (phone, hours, website) when parsing Google Maps URLs.

### Files to Modify
- `src/composables/useNominatim.ts` - Add `searchWithExtras()` method
- `src/lib/googleMapsUrlParser.ts` - No changes needed
- `src/components/LocationForm.vue` - Integrate enrichment into URL parsing flow

### Tasks

#### 1.1 Extend useNominatim Composable
```typescript
// New method signature
searchWithExtras(query: string, lat?: number, lng?: number): Promise<EnrichedResult>

interface EnrichedResult {
  // Existing
  lat: number
  lng: number
  address: string
  city: string
  postalCode: string
  // New from extratags
  phone?: string
  website?: string
  email?: string
  openingHours?: string
  openingHoursFormatted?: string // Human-readable
}
```

#### 1.2 Update LocationForm.vue - Step 1 (Quick Start)

**Current Flow:**
```
User pastes URL → Parse coords/name → Show "Found: [name]"
```

**New Flow:**
```
User pastes URL
  → Parse coords/name
  → Show spinner "Researching location..."
  → Query Nominatim with name + coords + extratags=1
  → Auto-fill: phone, website, hours, email
  → Show "Found: [name] + [X] details auto-filled"
```

#### 1.3 Add Loading State UI
- New ref: `enrichingLocation: boolean`
- Show animated spinner with text: "Researching location details..."
- Progress indication: "Found phone... Found hours... Found website..."
- Success summary: "Auto-filled 4 fields from OpenStreetMap"

#### 1.4 Unit Tests
- Test Nominatim extratags parsing
- Test loading state transitions
- Test partial data handling (some fields missing)

### Acceptance Criteria
- [ ] Pasting Google Maps URL shows loading spinner
- [ ] Phone, website, hours auto-populate when available in OSM
- [ ] User sees summary of what was auto-filled
- [ ] Graceful fallback when OSM has no extra data
- [ ] Rate limiting respected (1 req/sec)

---

## Phase 2: Opening Hours Parser
**Estimated Context: ~30k tokens**

### Goal
Parse OSM's opening_hours format into human-readable text for the form.

### Files to Create
- `src/lib/openingHoursParser.ts` - Parser utility

### Files to Modify
- `src/composables/useNominatim.ts` - Use parser
- `src/components/LocationForm.vue` - Display formatted hours

### Tasks

#### 2.1 Create Opening Hours Parser

OSM uses a specific format: `Mo-Fr 09:00-18:00; Sa 10:00-14:00; Su,PH off`

```typescript
// src/lib/openingHoursParser.ts
export function parseOsmOpeningHours(osmHours: string): FormattedHours {
  return {
    raw: osmHours,
    formatted: string,      // "Mon-Fri: 9:00-18:00, Sat: 10:00-14:00"
    isCurrentlyOpen: boolean,
    todayHours: string | null
  }
}
```

#### 2.2 Display in Form
- Show formatted hours in Step 3 (Details)
- Allow user to edit if incorrect
- Store both raw OSM format and user-friendly text

#### 2.3 Unit Tests
- Test various OSM hour formats
- Test edge cases (24/7, PH, seasonal)
- Test German day abbreviations

### Acceptance Criteria
- [ ] OSM hours converted to readable German format
- [ ] User can edit auto-filled hours
- [ ] Edge cases handled gracefully

---

## Phase 3: Website Schema.org Enrichment (Backend)
**Estimated Context: ~50k tokens**

### Goal
Create a Supabase Edge Function that fetches a business website and extracts schema.org JSON-LD data (for Instagram and backup data).

### Files to Create
- `supabase/functions/enrich-location/index.ts` - Edge function
- `src/composables/useEnrichment.ts` - Frontend composable

### Files to Modify
- `src/components/LocationForm.vue` - Call enrichment after OSM

### Tasks

#### 3.1 Create Edge Function: enrich-location

```typescript
// POST /functions/v1/enrich-location
// Body: { websiteUrl: string }
// Returns: { instagram?: string, phone?: string, hours?: string, email?: string }

export default async function handler(req: Request) {
  const { websiteUrl } = await req.json()

  // 1. Check robots.txt
  // 2. Fetch website HTML
  // 3. Extract <script type="application/ld+json">
  // 4. Parse LocalBusiness schema
  // 5. Return extracted data
}
```

#### 3.2 Schema.org Parser
Extract from JSON-LD:
- `telephone` → phone
- `openingHoursSpecification` → hours
- `sameAs` array → find Instagram URL
- `email` → email

#### 3.3 Create useEnrichment Composable
```typescript
export function useEnrichment() {
  const enrichFromWebsite = async (url: string): Promise<EnrichmentResult>
  return { enrichFromWebsite, loading, error }
}
```

#### 3.4 Integrate into LocationForm
- After OSM enrichment, if website found but no Instagram
- Call enrich-location edge function
- Fill Instagram field if found

#### 3.5 Add robots.txt Checker
- Respect crawl permissions
- Skip if disallowed

### Acceptance Criteria
- [ ] Edge function extracts schema.org data
- [ ] Instagram auto-filled when available
- [ ] robots.txt respected
- [ ] Timeout handling (max 5 seconds)
- [ ] Error handling (invalid URLs, no schema)

---

## Phase 4: UI Polish & Error Handling
**Estimated Context: ~30k tokens**

### Goal
Refine the user experience with better loading states, error messages, and manual override options.

### Files to Modify
- `src/components/LocationForm.vue` - UI improvements
- `src/components/ui/` - New loading components if needed

### Tasks

#### 4.1 Enhanced Loading UI
```vue
<div v-if="enrichingLocation" class="enrichment-status">
  <LoadingSpinner />
  <div class="status-text">
    <p>Researching location details...</p>
    <ul class="found-items">
      <li v-if="foundPhone">✓ Phone number</li>
      <li v-if="foundHours">✓ Opening hours</li>
      <li v-if="foundWebsite">✓ Website</li>
      <li v-if="foundInstagram">✓ Instagram</li>
    </ul>
  </div>
</div>
```

#### 4.2 "Auto-filled" Indicators
- Show small badge next to auto-filled fields
- "From OpenStreetMap" or "From website"
- Allow easy clearing with X button

#### 4.3 Manual Override UX
- If auto-fill is wrong, user can clear and type manually
- Confirmation: "Replace auto-filled data?"

#### 4.4 Error States
- OSM timeout: "Couldn't fetch details, please fill manually"
- No data found: "No additional details found"
- Partial data: "Found some details, please verify"

#### 4.5 Accessibility
- Loading spinner has aria-label
- Status updates announced to screen readers
- Keyboard navigation preserved

### Acceptance Criteria
- [ ] Clear visual feedback during enrichment
- [ ] Users can override auto-filled data
- [ ] Accessible loading states
- [ ] Graceful error handling

---

## Phase 5: Testing & Documentation
**Estimated Context: ~25k tokens**

### Goal
Comprehensive testing and documentation for maintainability.

### Files to Create
- `src/lib/__tests__/openingHoursParser.test.ts`
- `src/composables/__tests__/useEnrichment.test.ts`
- `tests/e2e/location-enrichment.spec.ts`

### Files to Modify
- `README.md` - Document feature
- `src/composables/__tests__/useNominatim.test.ts` - Extend tests

### Tasks

#### 5.1 Unit Tests
- Opening hours parser edge cases
- Nominatim extratags parsing
- Schema.org extraction
- Error handling paths

#### 5.2 Integration Tests
- Full enrichment flow with mocked APIs
- Timeout scenarios
- Partial data scenarios

#### 5.3 E2E Tests
```typescript
test('auto-fills location details from Google Maps URL', async ({ page }) => {
  await page.goto('/submit')
  await page.fill('[data-testid="google-maps-url"]', GOOGLE_MAPS_URL)
  await expect(page.locator('.enrichment-spinner')).toBeVisible()
  await expect(page.locator('[data-testid="phone-input"]')).toHaveValue(/\+49/)
})
```

#### 5.4 Documentation
- Update README with feature description
- Document data sources and their limitations
- Add troubleshooting guide

### Acceptance Criteria
- [ ] >80% test coverage for new code
- [ ] E2E test passing
- [ ] Documentation complete

---

## Technical Specifications

### API Endpoints

#### Nominatim (Existing, Extended Usage)
```
GET https://nominatim.openstreetmap.org/search
  ?q={name}+{city}
  &format=json
  &extratags=1
  &addressdetails=1
  &limit=1
```

#### Enrich Location (New Edge Function)
```
POST /functions/v1/enrich-location
Content-Type: application/json

{
  "websiteUrl": "https://example.com"
}

Response:
{
  "success": true,
  "data": {
    "instagram": "https://instagram.com/example",
    "phone": "+49 123 456",
    "email": "info@example.com",
    "openingHours": "Mo-Fr 09:00-18:00"
  }
}
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Pastes URL                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Parse Google Maps URL (existing)                   │
│              Extract: name, lat, lng                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Query Nominatim with extratags                     │
│              GET /search?q={name}&extratags=1                   │
│                                                                 │
│              Returns: phone, website, hours, email              │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
          ┌─────────────────┐     ┌─────────────────┐
          │  Has website?   │     │   No website    │
          │      YES        │     │   Skip to form  │
          └─────────────────┘     └─────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│           Call enrich-location Edge Function                    │
│           POST /functions/v1/enrich-location                    │
│                                                                 │
│           Returns: instagram (from schema.org sameAs)           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Auto-fill Form Fields                        │
│           Show summary: "Found X details"                       │
│           User can edit/override any field                      │
└─────────────────────────────────────────────────────────────────┘
```

### Rate Limiting Strategy

| Source | Limit | Our Strategy |
|--------|-------|--------------|
| Nominatim | 1 req/sec | Debounce, cache results |
| Business websites | Respectful | Max 1 req per submission, 5s timeout |

### Error Handling Matrix

| Scenario | User Message | Behavior |
|----------|--------------|----------|
| Nominatim timeout | "Couldn't fetch details" | Continue with manual entry |
| Nominatim no results | "Location not found in database" | Use parsed URL data only |
| Website fetch fails | (Silent) | Skip Instagram enrichment |
| Invalid schema.org | (Silent) | Skip Instagram enrichment |
| All enrichment fails | "Please fill details manually" | Form still works |

---

## File Structure (New/Modified)

```
src/
├── composables/
│   ├── useNominatim.ts          # MODIFY: Add searchWithExtras()
│   └── useEnrichment.ts         # NEW: Website schema.org fetching
├── lib/
│   ├── googleMapsUrlParser.ts   # NO CHANGES
│   └── openingHoursParser.ts    # NEW: OSM hours → readable format
├── components/
│   └── LocationForm.vue         # MODIFY: Enrichment UI flow
└── types/
    └── enrichment.ts            # NEW: Type definitions

supabase/
└── functions/
    └── enrich-location/
        └── index.ts             # NEW: Schema.org extraction
```

---

## Implementation Order

1. **Phase 1** - Core Nominatim integration (highest value, lowest risk)
2. **Phase 2** - Opening hours parser (improves UX)
3. **Phase 4** - UI polish (can start in parallel with Phase 3)
4. **Phase 3** - Website enrichment (nice-to-have for Instagram)
5. **Phase 5** - Testing & docs (final phase)

---

## Success Metrics

- **Primary**: Reduce average form completion time by 50%
- **Secondary**: 70%+ of submissions have auto-filled data
- **Quality**: <5% of users override auto-filled data (indicates accuracy)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| OSM data outdated | Show "verify this info" prompt |
| Rate limiting | Implement caching, debouncing |
| Schema.org not present | Silent fallback, no user impact |
| CORS on website fetch | Use Edge Function (server-side) |

---

## Notes

- All data sources are free and legal
- No Google API dependencies (avoids ToS issues)
- Germany/Frankfurt has excellent OSM coverage
- Feature degrades gracefully if enrichment fails
