# Enhanced Location Submission Flow

**Created:** 2026-01-11
**Status:** Ready for execution
**Estimated Phases:** 6 (each ~100-130k tokens)

## Overview

Improve the location submission experience by offering two methods:
1. **Google Maps Link** - Enhanced with tutorial and guided steps
2. **Pin on Map** - New feature for pinpointing location directly

Additionally, add an Instagram search helper for easier discovery.

## Key Decisions

- **Overpass API**: Free, ~10,000 requests/day limit, no auth required ([source](https://wiki.openstreetmap.org/wiki/Overpass_API))
- **Geolocation**: Reuse existing pattern from `useNearby.ts`
- **Map Component**: Extend Leaflet patterns from `MapContainer.vue`
- **POI Search**: 50m radius around pinned location

## Architecture

```
src/
  components/
    submission/                    # NEW folder for submission-specific components
      SubmissionMethodSelector.vue # Two card options
      GoogleMapsTutorial.vue       # Tutorial with GIF placeholder
      LocationPinMap.vue           # Interactive map for pinning
      NearbyPOISelector.vue        # POI selection from Overpass results
      InstagramSearchHelper.vue    # Helper link component
  composables/
    useOverpass.ts                 # NEW - Overpass API for POI queries
    useGeolocation.ts              # NEW - Extract from useNearby
```

---

## Phase 1: Core Infrastructure (~100k tokens)

**Goal:** Create foundational composables for the new features.

### Tasks

#### 1.1 Create `useGeolocation` Composable

Extract geolocation logic from `useNearby.ts` into a reusable composable.

**File:** `src/composables/useGeolocation.ts`

```typescript
// Features:
// - getUserLocation(): Promise<{lat, lng, accuracy} | null>
// - loading, error refs
// - Support for accuracy display (optional)
// - Proper cleanup
```

**Tests:** `tests/component/composables/useGeolocation.spec.ts`
- Mock navigator.geolocation
- Test success case
- Test permission denied
- Test timeout
- Test unsupported browser

#### 1.2 Create `useOverpass` Composable

New composable for querying OSM Overpass API.

**File:** `src/composables/useOverpass.ts`

```typescript
// Features:
// - findNearbyPOIs(lat, lng, radiusMeters): Promise<POI[]>
// - POI type: { name, lat, lng, type, address?, phone?, website?, ... }
// - Query shops, restaurants, cafes, etc. within radius
// - Rate limiting awareness
// - AbortController support for cancellation
```

**Overpass Query Pattern:**
```
[out:json][timeout:10];
(
  node["name"](around:50, {lat}, {lng});
  way["name"](around:50, {lat}, {lng});
);
out center body;
```

**Tests:** `tests/component/composables/useOverpass.spec.ts`
- Mock fetch responses
- Test successful POI query
- Test empty results
- Test error handling
- Test abort/cancellation

#### 1.3 Update `useNearby` to Use `useGeolocation`

Refactor `useNearby.ts` to import from `useGeolocation.ts` (DRY principle).

**Tests:** Ensure existing tests still pass.

### Acceptance Criteria

- [ ] `useGeolocation` works standalone
- [ ] `useOverpass` fetches POIs correctly
- [ ] `useNearby` still works after refactor
- [ ] All new composables have unit tests
- [ ] No breaking changes to existing functionality

---

## Phase 2: Method Selection UI (~100k tokens)

**Goal:** Create the initial selection screen with two options.

### Tasks

#### 2.1 Create `SubmissionMethodSelector` Component

**File:** `src/components/submission/SubmissionMethodSelector.vue`

```vue
<!--
  Two card-style buttons:
  1. "I can provide a Google Maps link" (map-pin icon)
  2. "I know the exact location" (crosshairs icon)

  Features:
  - Mobile-friendly tap targets
  - Hover/active states
  - Icons for each option
  - Emits: @select="'google-maps' | 'pin-map'"
-->
```

**Design:**
- Cards: ~200px wide on mobile, side-by-side on desktop
- Green border on hover
- Icon + Title + Short description
- `cursor: pointer` on both cards

#### 2.2 Add i18n Strings

**Files:** `src/i18n/locales/en.json`, `src/i18n/locales/de.json`

```json
{
  "submit": {
    "howToAdd": "How do you want to add a location?",
    "methodGoogleMaps": "I have a Google Maps link",
    "methodGoogleMapsDesc": "Copy a link from Google Maps",
    "methodPinMap": "I'll pin it on the map",
    "methodPinMapDesc": "Best if you're nearby or know the exact spot"
  }
}
```

#### 2.3 Update `LocationForm.vue` Step 1

Modify step 1 to show method selector first, then appropriate sub-flow.

```typescript
// New state:
const submissionMethod = ref<'google-maps' | 'pin-map' | null>(null)

// Step 1 now has two sub-views:
// - submissionMethod === null -> Show SubmissionMethodSelector
// - submissionMethod === 'google-maps' -> Show GoogleMapsTutorial (Phase 3)
// - submissionMethod === 'pin-map' -> Show LocationPinMap (Phase 4)
```

#### 2.4 Tests

**File:** `tests/component/submission/SubmissionMethodSelector.spec.ts`
- Renders two options
- Emits correct event on click
- Keyboard navigation (Enter/Space)
- Accessibility labels

### Acceptance Criteria

- [ ] Two card options render correctly
- [ ] Click emits correct method
- [ ] Mobile-responsive layout
- [ ] i18n works for DE/EN
- [ ] Unit tests pass

---

## Phase 3: Google Maps Tutorial Flow (~120k tokens)

**Goal:** Create guided tutorial for Google Maps link submission.

### Tasks

#### 3.1 Create `GoogleMapsTutorial` Component

**File:** `src/components/submission/GoogleMapsTutorial.vue`

```vue
<!--
  Guided steps:
  1. Open Google Maps (with deep link)
  2. Find the location
  3. Copy the link
  4. Paste below

  Features:
  - GIF placeholder area (will be replaced)
  - Step-by-step numbered instructions
  - "Open Google Maps" button (deep links to app on mobile)
  - Input field for URL
  - Back button to method selector
-->
```

#### 3.2 Google Maps Deep Link Logic

```typescript
// Detect mobile platform
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)
const isAndroid = /Android/i.test(navigator.userAgent)
const isIOS = /iPhone|iPad/i.test(navigator.userAgent)

// Deep link URLs:
// Android: 'geo:0,0?q=' or 'https://maps.google.com'
// iOS: 'comgooglemaps://' or 'https://maps.google.com'
// Desktop: 'https://maps.google.com'
```

#### 3.3 Add i18n Strings

```json
{
  "submit": {
    "tutorialStep1": "Open Google Maps",
    "tutorialStep1Desc": "Tap the button below or open the app",
    "tutorialStep2": "Find the location",
    "tutorialStep2Desc": "Search or navigate to the place you want to add",
    "tutorialStep3": "Copy the link",
    "tutorialStep3Desc": "Tap Share → Copy link",
    "tutorialStep4": "Paste the link below",
    "openGoogleMaps": "Open Google Maps",
    "pasteLink": "Paste your Google Maps link here"
  }
}
```

#### 3.4 Integrate with LocationForm

Wire up the Google Maps tutorial flow:
- When `submissionMethod === 'google-maps'`, show tutorial
- When URL is pasted, use existing parsing logic
- Enrichment status shows below input
- "Back" returns to method selector

#### 3.5 Tests

**File:** `tests/component/submission/GoogleMapsTutorial.spec.ts`
- Renders all 4 steps
- Open Maps button works
- URL input emits value
- Back button works
- Mobile detection logic

### Acceptance Criteria

- [ ] Tutorial displays 4 numbered steps
- [ ] GIF placeholder shows
- [ ] "Open Google Maps" button works (desktop + mobile)
- [ ] URL input connected to existing parsing
- [ ] Back navigation works
- [ ] Unit tests pass

---

## Phase 4: Map Pin Location Flow (~130k tokens)

**Goal:** Create interactive map for pinpointing locations.

### Tasks

#### 4.1 Create `LocationPinMap` Component

**File:** `src/components/submission/LocationPinMap.vue`

```vue
<!--
  Interactive map with:
  1. Search bar for address/city lookup
  2. "I am nearby" button (geolocation)
  3. Draggable marker for fine-tuning
  4. Confirm button to proceed

  Features:
  - Uses Leaflet (like MapContainer)
  - Default center: Frankfurt (50.1109, 8.6821)
  - Zoom level 15 for nearby, 12 for search
  - Pin marker is draggable
  - Shows accuracy circle for geolocation
-->
```

#### 4.2 Search Functionality

```typescript
// Use existing debouncedGeocode from useNominatim
// When user searches:
// 1. Geocode the address
// 2. Center map on result
// 3. Place marker at location
// 4. Allow user to drag marker to adjust
```

#### 4.3 "I Am Nearby" Button

```typescript
// Use useGeolocation composable
// When clicked:
// 1. Get user's current location
// 2. Center map on user
// 3. Place marker at user location
// 4. Show accuracy circle (optional)
// 5. Allow user to drag marker
```

#### 4.4 Marker Drag Handling

```typescript
// Leaflet marker with draggable: true
// On dragend:
// 1. Get new coordinates
// 2. Trigger reverse geocode for address
// 3. Update form data preview
```

#### 4.5 Add i18n Strings

```json
{
  "submit": {
    "searchAddress": "Search for an address...",
    "iAmNearby": "I'm nearby",
    "dragToAdjust": "Drag the pin to adjust the exact location",
    "confirmLocation": "Confirm this location",
    "locatingYou": "Getting your location...",
    "accuracyInfo": "Accuracy: ~{meters}m"
  }
}
```

#### 4.6 Tests

**File:** `tests/component/submission/LocationPinMap.spec.ts`
- Map renders with default center
- Search triggers geocoding
- "I am nearby" triggers geolocation
- Marker is draggable
- Confirm emits coordinates
- Error states display correctly

### Acceptance Criteria

- [ ] Map renders with Leaflet
- [ ] Address search works
- [ ] "I am nearby" uses geolocation
- [ ] Marker is draggable
- [ ] Confirm button emits lat/lng
- [ ] Works on mobile and desktop
- [ ] Unit tests pass

---

## Phase 5: POI Selection & Integration (~130k tokens)

**Goal:** Show nearby POIs after pinning and integrate everything.

### Tasks

#### 5.1 Create `NearbyPOISelector` Component

**File:** `src/components/submission/NearbyPOISelector.vue`

```vue
<!--
  After user confirms pin location:
  1. Query Overpass API for nearby POIs (50m radius)
  2. Display list of found businesses
  3. User can select one OR enter manually

  Features:
  - Loading state while querying
  - List of POI cards with name, type, address
  - "None of these" / "Enter manually" option
  - Auto-fill form when POI selected
-->
```

#### 5.2 POI Card Design

```vue
<!--
  Each POI card shows:
  - Business name (bold)
  - Category/type (e.g., "Restaurant", "Cafe")
  - Address (if available)
  - Checkmark when selected
-->
```

#### 5.3 Auto-fill from Selected POI

```typescript
// When user selects a POI:
// 1. Fill name from POI
// 2. Fill address from POI
// 3. Fill coordinates
// 4. Call searchWithExtras for additional metadata (phone, website, etc.)
// 5. Proceed to step 2 (Basic Info)
```

#### 5.4 Fallback: Manual Entry

```typescript
// If no POIs found OR user clicks "Enter manually":
// 1. Keep coordinates from pin
// 2. Keep address from reverse geocode
// 3. Proceed to step 2 with name field empty
// 4. User fills in business name manually
```

#### 5.5 Integrate Full Flow in LocationForm

Update `LocationForm.vue` to orchestrate:

```typescript
// Step 1 flow:
// 1. Method selector -> 'google-maps' | 'pin-map'
// 2a. Google Maps: Tutorial -> URL input -> Parse -> Enrich -> Step 2
// 2b. Pin Map: Map -> Pin -> POI selector -> Auto-fill -> Step 2
```

#### 5.6 Add i18n Strings

```json
{
  "submit": {
    "findingNearby": "Looking for businesses nearby...",
    "foundNearby": "Found {count} businesses nearby",
    "noPOIsFound": "No businesses found at this location",
    "selectBusiness": "Is this one of these businesses?",
    "enterManually": "None of these - I'll enter the name",
    "businessSelected": "Selected: {name}"
  }
}
```

#### 5.7 Tests

**File:** `tests/component/submission/NearbyPOISelector.spec.ts`
- Shows loading state
- Displays POI list
- Selection emits POI data
- "Enter manually" works
- Empty state when no POIs

**File:** `tests/component/LocationForm.integration.spec.ts`
- Full flow: method selection → google maps → step 2
- Full flow: method selection → pin map → POI → step 2
- Full flow: method selection → pin map → manual → step 2

### Acceptance Criteria

- [ ] POI selector shows after pin confirmation
- [ ] Overpass API queried correctly
- [ ] POI selection auto-fills form
- [ ] Manual entry fallback works
- [ ] Full integration in LocationForm
- [ ] Unit and integration tests pass

---

## Phase 6: Instagram Helper & Polish (~100k tokens)

**Goal:** Add Instagram helper, final polish, and documentation.

### Tasks

#### 6.1 Create `InstagramSearchHelper` Component

**File:** `src/components/submission/InstagramSearchHelper.vue`

```vue
<!--
  Small helper that appears when Instagram field is empty:
  - Search icon + "Help me find it" link
  - Opens Google search: "{business name} instagram"
  - New tab

  Props:
  - businessName: string
  - show: boolean (only when instagram field empty)
-->
```

#### 6.2 Integrate in LocationForm Step 3

```vue
<!-- Below Instagram input field -->
<InstagramSearchHelper
  v-if="!formData.instagram && formData.name"
  :business-name="formData.name"
/>
```

#### 6.3 Add i18n Strings

```json
{
  "submit": {
    "helpFindInstagram": "Help me find it"
  }
}
```

#### 6.4 Tests

**File:** `tests/component/submission/InstagramSearchHelper.spec.ts`
- Renders search icon and text
- Click opens correct Google search URL
- Opens in new tab

#### 6.5 Visual Polish

- Ensure consistent spacing across all new components
- Verify mobile responsiveness
- Test touch interactions
- Check dark mode compatibility (if applicable)
- Verify loading states are smooth

#### 6.6 Update Documentation

**File:** `CLAUDE.md`
- Document new submission flow
- Document new composables
- Update component structure

**File:** `docs/components.md`
- Add documentation for new submission components

#### 6.7 E2E Tests (Optional)

**File:** `tests/e2e/submission-flow.spec.ts`
- Test Google Maps flow end-to-end
- Test Pin Map flow end-to-end

### Acceptance Criteria

- [ ] Instagram helper shows when field empty
- [ ] Google search opens correctly
- [ ] All components visually consistent
- [ ] Documentation updated
- [ ] All tests pass

---

## Execution Notes

### Run Each Phase With

```bash
/execute-plan ai/2026-01-11-enhanced-location-submission.md
```

### Testing Commands

```bash
npm run test                    # Run all unit tests
npm run test -- --watch        # Watch mode
npm run test:e2e               # E2E tests
npm run type-check             # TypeScript validation
```

### Dependencies

No new npm dependencies required:
- Leaflet already installed
- vue-i18n already configured
- All composable patterns established

### Overpass API Endpoints

- Primary: `https://overpass-api.de/api/interpreter`
- Fallback: `https://overpass.kumi.systems/api/interpreter` (no rate limits)

### Mobile Deep Links

```typescript
// Google Maps
const googleMapsUrl = 'https://www.google.com/maps'

// Try native app first (optional enhancement)
// Android: intent://...
// iOS: comgooglemaps://
```

---

## Summary

| Phase | Focus | Est. Tokens |
|-------|-------|-------------|
| 1 | Core composables (useGeolocation, useOverpass) | ~100k |
| 2 | Method selection UI | ~100k |
| 3 | Google Maps tutorial flow | ~120k |
| 4 | Map pin location flow | ~130k |
| 5 | POI selection & integration | ~130k |
| 6 | Instagram helper & polish | ~100k |

**Total estimated context per phase:** Well within 150k token limit.

Each phase is self-contained and can be executed independently after previous phases complete.
