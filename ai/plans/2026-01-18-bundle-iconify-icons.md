# Plan: Bundle Iconify Icons at Build Time

**Created:** 2026-01-18
**Status:** Planned
**Priority:** Medium

## Problem

Currently, the map fetches icon data from the Iconify API (`api.iconify.design`) at runtime for each category marker. This creates several issues:

1. **Single point of failure** - If Iconify API is down, map markers show only colored circles (no icons)
2. **Latency** - Extra network requests on every page load
3. **Alias resolution bug** - Icons like `mdi:trolley` (alias for `mdi:cart`) weren't resolving (fixed separately)
4. **Offline support** - Map icons don't work offline
5. **Rate limiting risk** - High traffic could hit API limits

## Solution

Bundle icon data at build time using `@iconify/json`. Icons are included in the JavaScript bundle, eliminating runtime API calls.

## Current Architecture

```
User loads map
    → MapContainer.vue calls addMarkers()
    → getDynamicMarkerIcon() in markerIcons.ts
    → generateMarkerSvg() in dynamicMarkerUtils.ts
    → fetchIconData() fetches from api.iconify.design
    → SVG string generated and used as L.DivIcon
```

## Target Architecture

```
User loads map
    → MapContainer.vue calls addMarkers()
    → getDynamicMarkerIcon() in markerIcons.ts
    → generateMarkerSvg() in dynamicMarkerUtils.ts
    → getIconData() reads from bundled JSON (no network)
    → SVG string generated and used as L.DivIcon
```

## Implementation Steps

### Phase 1: Install Dependencies

```bash
npm install @iconify/json
# OR install only the icon sets we use:
npm install @iconify-json/mdi @iconify-json/ph @iconify-json/lucide
```

**Decision needed:** Install full `@iconify/json` (~50MB) or only specific sets we use?
- Check which icon prefixes are used in categories table
- Likely just `mdi` based on current data

### Phase 2: Create Local Icon Resolver

Create new file: `src/lib/iconBundle.ts`

```typescript
/**
 * Bundled icon data - no runtime API calls
 * Icons are included in the build from @iconify/json
 */

// Import only the icon sets we use
import mdiIcons from '@iconify-json/mdi/icons.json'
// Add more as needed:
// import phIcons from '@iconify-json/ph/icons.json'
// import lucideIcons from '@iconify-json/lucide/icons.json'

interface IconData {
  body: string
  width?: number
  height?: number
}

interface IconSet {
  prefix: string
  icons: Record<string, IconData>
  aliases?: Record<string, { parent: string } & Partial<IconData>>
  width?: number
  height?: number
}

// Map of prefix -> icon set data
const iconSets: Record<string, IconSet> = {
  mdi: mdiIcons as IconSet,
  // ph: phIcons as IconSet,
  // lucide: lucideIcons as IconSet,
}

/**
 * Get icon data from bundled icons
 * Returns null if icon not found
 */
export function getIconData(iconName: string): IconData | null {
  const [prefix, name] = iconName.split(':')
  if (!prefix || !name) {
    console.warn(`[IconBundle] Invalid icon name format: "${iconName}"`)
    return null
  }

  const iconSet = iconSets[prefix]
  if (!iconSet) {
    console.warn(`[IconBundle] Icon set "${prefix}" not bundled`)
    return null
  }

  // Check direct icons first
  let iconData = iconSet.icons[name]

  // Resolve alias if needed
  if (!iconData && iconSet.aliases?.[name]) {
    const alias = iconSet.aliases[name]
    iconData = iconSet.icons[alias.parent]
    if (iconData) {
      // Merge alias properties
      iconData = { ...iconData, ...alias }
    }
  }

  if (!iconData) {
    console.warn(`[IconBundle] Icon "${iconName}" not found in bundle`)
    return null
  }

  // Apply default dimensions from icon set
  return {
    body: iconData.body,
    width: iconData.width ?? iconSet.width ?? 24,
    height: iconData.height ?? iconSet.height ?? 24,
  }
}

/**
 * Check if an icon set is bundled
 */
export function hasIconSet(prefix: string): boolean {
  return prefix in iconSets
}

/**
 * Get list of bundled icon set prefixes
 */
export function getBundledPrefixes(): string[] {
  return Object.keys(iconSets)
}
```

### Phase 3: Update dynamicMarkerUtils.ts

Modify `dynamicMarkerUtils.ts` to use bundled icons with API fallback:

```typescript
import { getIconData, hasIconSet } from './iconBundle'

async function fetchIconData(iconName: string): Promise<object | null> {
  // Try bundled icons first (instant, no network)
  const bundledIcon = getIconData(iconName)
  if (bundledIcon) {
    return bundledIcon
  }

  // Fallback to API for non-bundled icon sets
  const [prefix] = iconName.split(':')
  if (hasIconSet(prefix)) {
    // Icon set is bundled but icon not found - don't try API
    return null
  }

  // Icon set not bundled - try API as fallback
  // ... existing API fetch code ...
}
```

### Phase 4: Update Vite Config (if needed)

Ensure JSON imports work correctly in `vite.config.ts`:

```typescript
export default defineConfig({
  // JSON imports should work by default in Vite
  // But if issues, add:
  json: {
    stringify: true // For large JSON files
  }
})
```

### Phase 5: Audit Current Icon Usage

Query categories table to identify which icon prefixes are used:

```sql
SELECT DISTINCT split_part(icon_name, ':', 1) as prefix, COUNT(*)
FROM categories
WHERE icon_name IS NOT NULL
GROUP BY prefix;
```

Only install/bundle the icon sets actually in use.

### Phase 6: Update Admin Icon Selector (Optional Enhancement)

Consider limiting the IconSelector component to only show icons from bundled sets. This prevents admins from selecting icons that won't render on the map.

```typescript
// In IconSelector.vue
const allowedPrefixes = ['mdi'] // Only bundled sets

// Filter search results to allowed prefixes
const filteredResults = results.filter(icon =>
  allowedPrefixes.includes(icon.prefix)
)
```

### Phase 7: Testing

1. **Unit tests** for `iconBundle.ts`:
   - Test direct icon lookup
   - Test alias resolution
   - Test missing icon handling
   - Test invalid format handling

2. **Integration tests**:
   - Verify map markers render with bundled icons
   - Verify no network requests to api.iconify.design
   - Test with various icon names from categories

3. **Manual testing**:
   - Check all category markers on map
   - Verify admin preview still works
   - Test offline functionality

### Phase 8: Cleanup

1. Remove or deprecate API fallback code if not needed
2. Remove `iconDataCache` if no longer used
3. Update documentation

## Bundle Size Considerations

| Icon Set | Approximate Size |
|----------|------------------|
| `@iconify-json/mdi` | ~1.5MB (gzipped: ~300KB) |
| `@iconify-json/ph` | ~200KB |
| `@iconify-json/lucide` | ~150KB |
| Full `@iconify/json` | ~50MB |

**Recommendation:** Only install icon sets actually used. Tree-shaking won't help since we need the full JSON.

Consider: If bundle size is a concern, we could:
1. Extract only the icons we use into a custom JSON file
2. Load icon data dynamically but from our own CDN/Supabase

## Files to Modify

- [ ] `package.json` - Add `@iconify-json/mdi` dependency
- [ ] `src/lib/iconBundle.ts` - New file for bundled icon access
- [ ] `src/lib/dynamicMarkerUtils.ts` - Use bundled icons, keep API fallback
- [ ] `src/components/admin/IconSelector.vue` - Optionally limit to bundled sets
- [ ] `vite.config.ts` - JSON import config if needed

## Rollback Plan

If issues arise:
1. The API fallback remains in place
2. Simply remove the bundled icon check to revert to API-only
3. No database changes required

## Future Enhancements

1. **Build-time icon extraction**: Script to scan categories and extract only used icons
2. **CDN caching**: If we need more icon sets, self-host on CloudFront
3. **Icon validation**: Validate icon_name in admin before saving to ensure it exists

## Notes

- The `@iconify/vue` component in admin will continue to work (it has its own fetching)
- This change only affects the Leaflet map markers
- Existing markers using PNG fallback (`icon_url`) are unaffected
