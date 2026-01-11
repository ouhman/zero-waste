# Map Navigation Behavior

This document describes how the map and location detail modal behave during navigation.

## Slug URLs

Locations can be accessed directly via `/location/:slug` (e.g., `/location/unverpackt-laden-frankfurt-am-main-nordend`).

## Navigation Scenarios

| Scenario | Map Behavior | Modal |
|----------|--------------|-------|
| **Direct landing** (external link, page refresh, typing URL) | Center + zoom on location | Opens |
| **Clicking a marker** | No movement | Opens, URL updates to slug |
| **Back button** (to a slug) | Pan only if marker outside view | Opens |
| **Forward button** (to a slug) | Pan only if marker outside view | Opens |
| **Closing modal** | No movement | Closes, URL changes to `/` |
| **Back button** (to `/`) | No movement | Closes |

## Rationale

- **Direct landing**: User is arriving from an external source (shared link, bookmark). They need to see the location, so we center and zoom.
- **Clicking markers**: User is actively browsing the map. Moving the map would be disorienting and cause loss of spatial context.
- **Back/Forward**: User is navigating history. We ensure the marker is visible but avoid unnecessary movement to preserve context.

## Implementation

Key files:
- `src/views/MapView.vue` - Handles slug routing and modal state
- `src/components/map/MapContainer.vue` - Provides map methods

### MapContainer Methods

| Method | Description |
|--------|-------------|
| `centerOn(lat, lng, zoom?)` | Center and optionally zoom to coordinates |
| `ensureVisible(lat, lng)` | Pan only if point is outside current bounds |
| `highlightMarker(locationId)` | Add visual highlight to a marker |
| `focusLocation(locationId)` | Center, zoom, and open popup |

### MapView Logic

```typescript
// openLocationBySlug(slug, centerMode)
// centerMode: 'center' | 'ensure' | 'none'

// Direct landing (onMounted)
openLocationBySlug(slug, 'center')

// Back/Forward navigation (watch)
openLocationBySlug(slug, 'ensure')

// Marker click (handleShowDetails)
// Does not call openLocationBySlug - just updates state and URL
```

## 404 Handling

When visiting a slug that doesn't exist:
- A modal overlay appears with "Not Found" message
- User can click "Back to Map" to dismiss and navigate to `/`
- Clicking outside the modal also dismisses it
