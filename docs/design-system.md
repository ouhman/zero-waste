# Design System

This document covers visual design specifications for the Zero Waste Frankfurt application.

## Category Icons

Category icons appear as map markers and in category filters.

### Specifications

| Property | Value |
|----------|-------|
| Size | 56x56 pixels |
| Shape | Circle |
| Border | 2px white stroke |
| Inner icon | Scaled to fill ~65% of circle |

### SVG Template

```svg
<svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
  <!-- Circle background with white border -->
  <circle cx="28" cy="28" r="26" fill="#CATEGORY_COLOR" stroke="#FFFFFF" stroke-width="2"/>

  <!-- Inner icon (white, centered and scaled) -->
  <g transform="translate(X, Y) scale(S)">
    <path d="..." fill="#FFFFFF"/>
  </g>
</svg>
```

### Guidelines

- **Inner icon prominence**: The inner icon should be clearly visible at small sizes (32x32 on map). Scale it to fill approximately 65% of the circle diameter.
- **White border**: All icons must have a 2px white border for consistency and visibility against map backgrounds.
- **Regenerate PNG**: After editing an SVG, regenerate the PNG:
  ```bash
  rsvg-convert -w 56 -h 56 public/icons/categories/ICON.svg -o public/icons/categories/ICON.png
  ```

### Example: Bücherschrank Icon

```svg
<svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
  <circle cx="28" cy="28" r="26" fill="#8B5CF6" stroke="#FFFFFF" stroke-width="2"/>
  <g transform="translate(8, 8) scale(1.65)">
    <path d="M9 3V18H12V3H9M12 5L16 18L19 17L15 4L12 5M5 5V18H8V5H5M3 19V21H21V19H3Z" fill="#FFFFFF"/>
  </g>
</svg>
```

---

## Dynamic Markers (Iconify)

Category markers on the map use [Iconify](https://iconify.design/) icons rendered dynamically. The admin panel allows selecting any Iconify icon for a category.

### Architecture

- **Admin preview**: Uses `@iconify/vue` `<Icon>` component (`DynamicMarker.vue`)
- **Map markers**: Uses `@iconify/utils` to generate SVG strings for Leaflet (`dynamicMarkerUtils.ts`)

Both use the same underlying Iconify libraries for consistent rendering.

### Implementation: Fetching Icons Programmatically

**Important**: When rendering Iconify icons outside Vue components (e.g., for Leaflet DivIcon HTML), use the **JSON API** with `@iconify/utils`, NOT raw SVG fetching.

**Why**: Different icon sets have different SVG structures (`<path>`, `<circle>`, `<g>`, nested elements, etc.). Regex-based SVG parsing breaks on many icons.

#### ✅ Correct approach

```typescript
// src/lib/dynamicMarkerUtils.ts

import { iconToSVG, iconToHTML, replaceIDs } from '@iconify/utils'

// 1. Fetch JSON data (provides structured icon info)
const [prefix, name] = 'ph:bread'.split(':')
const response = await fetch(`https://api.iconify.design/${prefix}.json?icons=${name}`)
const data = await response.json()
const iconData = data.icons[name]

// 2. Use @iconify/utils to render (same lib @iconify/vue uses internally)
const renderData = iconToSVG(iconData, { height: 24 })
const html = iconToHTML(replaceIDs(renderData.body), renderData.attributes)
```

#### ❌ Wrong approach

```typescript
// Don't do this - breaks on many icon sets!
const response = await fetch('https://api.iconify.design/ph:bread.svg')
const svg = await response.text()
// Regex parsing fails if icon uses <circle>, <g>, <rect>, etc.
const path = svg.match(/<path[^>]*>/)
```

### Cache Invalidation

When a category's icon is updated in admin:
1. `clearMarkerIconCaches()` clears the Leaflet DivIcon cache
2. `clearIconSvgCache()` clears the Iconify JSON cache
3. Locations are force-refetched to get updated category data

See `src/stores/categories.ts` → `updateCategory()`.

---

## Map Controls (Google Maps Style)

Map controls are positioned in the bottom-right corner, following Google Maps conventions.

### Layout

```
┌─────────────────────────────────┐
│                                 │
│              MAP                │
│                                 │
│                           [◎]   │  ← NearMe button
│                           [+]   │  ← Zoom controls
│                           [-]   │
│ © OSM                           │  ← Attribution (bottom-left)
└─────────────────────────────────┘
```

### Positioning Specs

#### Desktop (md+, ≥768px)

| Element | Right | Bottom |
|---------|-------|--------|
| Zoom controls | 3.5rem (56px) | 1.5rem (24px) |
| NearMe button | 3rem (48px) | 6.5rem (104px) |

#### Mobile (<768px)

| Element | Right | Bottom |
|---------|-------|--------|
| Zoom controls | 0.75rem (12px) | 0.75rem (12px) |
| NearMe button | 0.75rem (12px) | 9rem (144px) |

### Leaflet CSS Override

Leaflet has default styles that must be overridden. Key learnings:

1. **Attribution interference**: Leaflet's attribution control defaults to bottom-right, affecting zoom control positioning. Move it to bottom-left.

2. **Reset container, style control**: Don't style `.leaflet-bottom.leaflet-right` margins - reset it to `0` and apply margins directly to `.leaflet-control-zoom`.

3. **Use `!important`**: Leaflet's styles are specific; `!important` is needed to override.

```css
/* Move attribution to bottom-left */
.leaflet-control-attribution {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: auto !important;
  margin: 0 !important;
}

/* Reset container positioning */
.leaflet-bottom.leaflet-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  bottom: 0.75rem !important;
  right: 0.75rem !important;
}

/* Reset zoom control margins */
.leaflet-control-zoom {
  margin: 0 !important;
}

/* Desktop spacing */
@media (min-width: 768px) {
  .leaflet-bottom.leaflet-right {
    bottom: 1.5rem !important;
    right: 3.5rem !important;
  }
}
```

### NearMe Button

The NearMe button sits above the zoom controls.

**Styling:**
- Compact mode: `w-12 h-12` (48x48px) rounded circle
- Background: `bg-green-500` with white icon
- Must have `cursor-pointer` class

**Positioning (MapView.vue):**
```html
<div class="absolute bottom-36 md:bottom-[6.5rem] right-3 md:right-12 z-[1000]">
  <NearMeButton compact />
</div>
```

---

## Color Palette

### Category Colors

| Category | Color | Hex |
|----------|-------|-----|
| Bücherschrank | Purple | `#8B5CF6` |
| Unverpackt | Green | `#22C55E` |
| ... | ... | ... |

### UI Colors

| Usage | Tailwind Class | Hex |
|-------|----------------|-----|
| Primary action | `bg-green-500` | `#22C55E` |
| Primary hover | `bg-green-600` | `#16A34A` |
| Text primary | `text-gray-900` | `#111827` |
| Text secondary | `text-gray-600` | `#4B5563` |
| Border | `border-gray-200` | `#E5E7EB` |

---

## Interactive Elements

### Cursor Pointer Rule

**All clickable elements must have `cursor: pointer`.**

This is documented in CLAUDE.md but worth repeating:

```vue
<!-- Correct -->
<button class="cursor-pointer ...">Click me</button>

<!-- Incorrect - missing cursor -->
<button class="...">Click me</button>
```

Use `cursor-pointer` (Tailwind) on:
- Buttons
- Links
- Clickable cards
- Interactive icons
- Any element with `@click` handler
