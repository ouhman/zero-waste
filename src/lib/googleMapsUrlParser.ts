/**
 * Google Maps URL Parser
 * Extracts coordinates from various Google Maps URL formats
 */

export interface ParsedCoordinates {
  lat: number
  lng: number
  name?: string
}

/**
 * Parse a Google Maps URL and extract coordinates
 *
 * Supported formats:
 * - https://www.google.com/maps/place/Name/@50.123,8.456,17z
 * - https://www.google.com/maps/@50.123,8.456,17z
 * - https://maps.google.com/?q=50.123,8.456
 * - https://www.google.com/maps?q=50.123,8.456
 * - https://www.google.com/maps/search/50.123,8.456
 * - https://maps.app.goo.gl/... (contains !3d{lat}!4d{lng})
 * - https://www.google.com/maps/dir/...!3d50.123!4d8.456
 */
export function parseGoogleMapsUrl(url: string): ParsedCoordinates | null {
  if (!url || typeof url !== 'string') {
    return null
  }

  // Clean up the URL
  const trimmedUrl = url.trim()

  // Check if it looks like a Google Maps URL
  if (!isGoogleMapsUrl(trimmedUrl)) {
    return null
  }

  // Try each parsing pattern in order of reliability
  const patterns = [
    // Pattern 1: @ symbol followed by coordinates (most common in place URLs)
    // Example: @50.1234567,8.6789012,17z
    {
      regex: /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      latIndex: 1,
      lngIndex: 2
    },
    // Pattern 2: Query parameter q or ll with coordinates
    // Example: ?q=50.123,8.456 or ?ll=50.123,8.456
    {
      regex: /[?&](?:q|ll|query)=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      latIndex: 1,
      lngIndex: 2
    },
    // Pattern 3: Data parameter format (used in some share links)
    // Example: !3d50.123!4d8.456
    {
      regex: /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
      latIndex: 1,
      lngIndex: 2
    },
    // Pattern 4: Coordinates in search path
    // Example: /search/50.123,8.456
    {
      regex: /\/search\/(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      latIndex: 1,
      lngIndex: 2
    },
    // Pattern 5: Direct coordinates in path (less common)
    // Example: /maps/50.123,8.456
    {
      regex: /\/maps\/(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      latIndex: 1,
      lngIndex: 2
    }
  ]

  for (const pattern of patterns) {
    const match = trimmedUrl.match(pattern.regex)
    if (match) {
      const lat = parseFloat(match[pattern.latIndex])
      const lng = parseFloat(match[pattern.lngIndex])

      if (isValidCoordinate(lat, lng)) {
        // Try to extract place name from URL
        const name = extractPlaceName(trimmedUrl)
        return { lat, lng, name: name || undefined }
      }
    }
  }

  return null
}

/**
 * Extract place name from Google Maps URL
 * Example: /place/Die+Auff%C3%BCllerei+-+unverpackt+einkaufen/@50.123,8.456
 */
function extractPlaceName(url: string): string | null {
  // Pattern: /place/ENCODED_NAME/@ or /place/ENCODED_NAME,
  const placeMatch = url.match(/\/place\/([^/@]+)(?:\/|@|,)/)

  if (placeMatch && placeMatch[1]) {
    try {
      // Decode URL encoding: + becomes space, %XX becomes character
      const decoded = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))

      // Clean up the name - remove trailing commas, dashes at the end
      const cleaned = decoded.trim().replace(/[,\-]+$/, '').trim()

      // Only return if it looks like a real name (not just coordinates)
      if (cleaned && !/^[\d.\-,\s]+$/.test(cleaned)) {
        return cleaned
      }
    } catch {
      // If decoding fails, return null
      return null
    }
  }

  return null
}

/**
 * Check if a URL looks like a Google Maps URL
 */
export function isGoogleMapsUrl(url: string): boolean {
  const googleMapsPatterns = [
    /google\.com\/maps/i,
    /maps\.google\./i,
    /maps\.app\.goo\.gl/i,
    /goo\.gl\/maps/i
  ]

  return googleMapsPatterns.some(pattern => pattern.test(url))
}

/**
 * Validate that coordinates are within valid ranges
 * Latitude: -90 to 90
 * Longitude: -180 to 180
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  if (isNaN(lat) || isNaN(lng)) {
    return false
  }

  if (lat < -90 || lat > 90) {
    return false
  }

  if (lng < -180 || lng > 180) {
    return false
  }

  return true
}
