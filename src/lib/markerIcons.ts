import L from 'leaflet'

const ICON_SIZE: [number, number] = [32, 32] // Scale down from 56x56
const ICON_ANCHOR: [number, number] = [16, 32] // Bottom center
const POPUP_ANCHOR: [number, number] = [0, -32] // Above marker

const iconCache = new Map<string, L.Icon>()

export function getCategoryIcon(categorySlug: string | null): L.Icon {
  const slug = categorySlug || 'andere'

  if (iconCache.has(slug)) {
    return iconCache.get(slug)!
  }

  const icon = L.icon({
    iconUrl: `/icons/categories/${slug}.png`,
    iconSize: ICON_SIZE,
    iconAnchor: ICON_ANCHOR,
    popupAnchor: POPUP_ANCHOR
  })

  iconCache.set(slug, icon)
  return icon
}
