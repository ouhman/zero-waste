/**
 * Dynamic Marker Utilities
 * Generates SVG strings for Leaflet markers with Iconify icons
 * Uses @iconify/utils for consistent icon rendering with @iconify/vue
 */

import { iconToSVG, iconToHTML, replaceIDs } from '@iconify/utils'
import type { MarkerConfig } from '@/types/marker'
import { DEFAULT_MARKER_CONFIG } from '@/types/marker'

/**
 * Icon data cache for performance
 */
const iconDataCache = new Map<string, object | null>()

/**
 * Clear the icon cache
 */
export function clearIconSvgCache(): void {
  iconDataCache.clear()
}

/**
 * Fetch icon data from Iconify API
 * Returns the icon data object or null if not found
 */
async function fetchIconData(iconName: string): Promise<object | null> {
  if (iconDataCache.has(iconName)) {
    return iconDataCache.get(iconName) || null
  }

  try {
    // Parse icon name (e.g., "ph:bread" -> prefix "ph", name "bread")
    const [prefix, name] = iconName.split(':')
    if (!prefix || !name) {
      console.warn(`[DynamicMarker] Invalid icon name format: "${iconName}"`)
      return null
    }

    // Fetch from Iconify API (JSON format for full icon data)
    const response = await fetch(`https://api.iconify.design/${prefix}.json?icons=${name}`)

    if (!response.ok) {
      console.warn(`[DynamicMarker] Failed to fetch icon "${iconName}": ${response.status}`)
      iconDataCache.set(iconName, null)
      return null
    }

    const data = await response.json()

    // Check for direct icon or resolve alias
    let iconData = data.icons?.[name]

    // If not found directly, check if it's an alias
    if (!iconData && data.aliases?.[name]) {
      const alias = data.aliases[name]
      const parentName = alias.parent
      iconData = data.icons?.[parentName]

      // Merge alias properties with parent icon data
      if (iconData && alias) {
        iconData = { ...iconData, ...alias }
        delete iconData.parent // Remove the parent reference
      }
    }

    if (!iconData) {
      console.warn(`[DynamicMarker] Icon "${iconName}" not found in response`)
      iconDataCache.set(iconName, null)
      return null
    }

    // Merge with default values from the icon set
    const fullIconData = {
      ...iconData,
      width: iconData.width ?? data.width ?? 24,
      height: iconData.height ?? data.height ?? 24
    }

    iconDataCache.set(iconName, fullIconData)
    return fullIconData
  } catch (error) {
    console.warn(`[DynamicMarker] Error fetching icon "${iconName}":`, error)
    iconDataCache.set(iconName, null)
    return null
  }
}

/**
 * Generate SVG string for a dynamic marker
 * Uses @iconify/utils for consistent rendering with @iconify/vue
 */
export async function generateMarkerSvg(config: MarkerConfig): Promise<string> {
  const size = config.size ?? DEFAULT_MARKER_CONFIG.size
  const borderWidth = config.borderWidth ?? DEFAULT_MARKER_CONFIG.borderWidth
  const borderColor = config.borderColor ?? DEFAULT_MARKER_CONFIG.borderColor
  const iconColor = config.iconColor ?? '#FFFFFF'

  const center = size / 2
  const radius = center - borderWidth
  const iconSize = Math.floor(size * 0.55) // Slightly smaller for better fit
  const iconOffset = (size - iconSize) / 2

  // Fetch icon data
  const iconData = await fetchIconData(config.iconName)

  // Build SVG
  let svg = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`

  // Circle background with border
  svg += `<circle cx="${center}" cy="${center}" r="${radius}" fill="${config.color}" stroke="${borderColor}" stroke-width="${borderWidth}"/>`

  // Icon (if loaded successfully)
  if (iconData) {
    // Use @iconify/utils to convert icon data to SVG
    const renderData = iconToSVG(iconData as Parameters<typeof iconToSVG>[0], {
      height: iconSize
    })

    // Generate SVG HTML and replace IDs to avoid conflicts
    let iconSvgBody = iconToHTML(replaceIDs(renderData.body), renderData.attributes)

    // Extract just the inner content (remove outer <svg> tags if present)
    const innerMatch = iconSvgBody.match(/<svg[^>]*>([\s\S]*)<\/svg>/)
    const iconInner = innerMatch ? innerMatch[1] : renderData.body

    // Position and color the icon
    svg += `<g transform="translate(${iconOffset}, ${iconOffset})" fill="${iconColor}" color="${iconColor}">`
    svg += `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 ${renderData.attributes.viewBox?.split(' ').slice(2).join(' ') || '24 24'}">`
    svg += iconInner.replace(/currentColor/g, iconColor)
    svg += `</svg></g>`
  }

  svg += `</svg>`
  return svg
}

/**
 * Generate data URL for a dynamic marker (for L.Icon)
 */
export async function getMarkerDataUrl(config: MarkerConfig): Promise<string> {
  const svg = await generateMarkerSvg(config)
  const base64 = btoa(unescape(encodeURIComponent(svg)))
  return `data:image/svg+xml;base64,${base64}`
}
