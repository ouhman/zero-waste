import L from 'leaflet'
import { generateMarkerSvg } from './dynamicMarkerUtils'
import type { MarkerSize } from '@/types/marker'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

const ICON_SIZE: [number, number] = [32, 32] // Scale down from 56x56
const ICON_ANCHOR: [number, number] = [16, 32] // Bottom center
const POPUP_ANCHOR: [number, number] = [0, -32] // Above marker

// Export caches for testing purposes
export const iconCache = new Map<string, L.Icon>()
export const divIconCache = new Map<string, L.DivIcon>()

/**
 * Clear all marker icon caches
 * Call this when categories are updated to force fresh icons
 */
export function clearMarkerIconCaches(): void {
  iconCache.clear()
  divIconCache.clear()
}

/**
 * Get dynamic marker icon using Iconify
 * Returns L.DivIcon with SVG content
 */
export async function getDynamicMarkerIcon(category: Category): Promise<L.DivIcon> {
  const { icon_name, color, marker_size } = category

  // Cache key includes all params that affect rendering
  const cacheKey = `${icon_name}-${color}-${marker_size}`

  if (divIconCache.has(cacheKey)) {
    return divIconCache.get(cacheKey)!
  }

  // Generate SVG string
  const svg = await generateMarkerSvg({
    iconName: icon_name!,
    color: color || '#9CA3AF', // Default gray
    size: (marker_size as MarkerSize) || 32
  })

  const size = marker_size || 32
  const icon = L.divIcon({
    className: 'dynamic-marker',
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  })

  divIconCache.set(cacheKey, icon)
  return icon
}

/**
 * Legacy icon function for categories without icon_name
 * Supports PNG icons via icon_url or local files
 */
export function getCategoryIcon(categorySlug: string | null, iconUrl?: string | null): L.Icon {
  const slug = categorySlug || 'andere'

  // Use iconUrl as cache key if provided, otherwise use slug
  const cacheKey = iconUrl || slug

  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!
  }

  // Prefer icon_url from database, fallback to local file
  const url = iconUrl || `/icons/categories/${slug}.png`

  const icon = L.icon({
    iconUrl: url,
    iconSize: ICON_SIZE,
    iconAnchor: ICON_ANCHOR,
    popupAnchor: POPUP_ANCHOR
  })

  iconCache.set(cacheKey, icon)
  return icon
}
