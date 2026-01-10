import L from 'leaflet'

const ICON_SIZE: [number, number] = [32, 32] // Scale down from 56x56
const ICON_ANCHOR: [number, number] = [16, 32] // Bottom center
const POPUP_ANCHOR: [number, number] = [0, -32] // Above marker

const iconCache = new Map<string, L.Icon>()

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
