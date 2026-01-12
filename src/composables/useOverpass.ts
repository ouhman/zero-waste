import { ref } from 'vue'

export interface POI {
  id: number
  name: string
  lat: number
  lng: number
  type: string
  address?: string
  phone?: string
  website?: string
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: {
    lat: number
    lon: number
  }
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements: OverpassElement[]
}

export function useOverpass() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pois = ref<POI[]>([])

  /**
   * Find nearby points of interest using Overpass API
   * Only returns business-relevant POIs (shops, cafes, restaurants, etc.)
   * @param lat - Latitude
   * @param lng - Longitude
   * @param radiusMeters - Search radius in meters (default: 50)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise that resolves to array of POIs
   */
  async function findNearbyPOIs(
    lat: number,
    lng: number,
    radiusMeters: number = 50,
    signal?: AbortSignal
  ): Promise<POI[]> {
    loading.value = true
    error.value = null

    // Construct Overpass QL query - filter for business-relevant tags
    const query = `
      [out:json][timeout:25];
      (
        node["shop"](around:${radiusMeters},${lat},${lng});
        node["amenity"~"cafe|restaurant|bar|fast_food|bakery|pharmacy|bank|marketplace"](around:${radiusMeters},${lat},${lng});
        node["craft"](around:${radiusMeters},${lat},${lng});
        node["office"](around:${radiusMeters},${lat},${lng});
        way["shop"](around:${radiusMeters},${lat},${lng});
        way["amenity"~"cafe|restaurant|bar|fast_food|bakery|pharmacy|bank|marketplace"](around:${radiusMeters},${lat},${lng});
        way["craft"](around:${radiusMeters},${lat},${lng});
        way["office"](around:${radiusMeters},${lat},${lng});
      );
      out center body;
    `

    // List of public Overpass API instances (in order of preference)
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
    ]

    let lastError: string | null = null

    // Try each endpoint until one succeeds
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: query,
          signal,
          headers: {
            'Content-Type': 'text/plain'
          }
        })

        if (!response.ok) {
          lastError = `${response.status} ${response.statusText}`
          continue // Try next endpoint
        }

        // Success! Parse and return results
        const data: OverpassResponse = await response.json()

        // Parse, filter, and deduplicate POIs
        const parsedPOIs = data.elements
          .filter((element) => element.tags?.name) // Only include elements with names
          .map((element) => parsePOI(element))

        // Remove duplicates by name (keep first occurrence)
        const seenNames = new Set<string>()
        const uniquePOIs = parsedPOIs.filter((poi) => {
          const normalizedName = poi.name.toLowerCase().trim()
          if (seenNames.has(normalizedName)) {
            return false
          }
          seenNames.add(normalizedName)
          return true
        })

        pois.value = uniquePOIs
        loading.value = false
        return uniquePOIs
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          // User cancelled - don't try other endpoints
          error.value = 'Request was cancelled'
          loading.value = false
          pois.value = []
          return []
        }
        // Network/timeout error - try next endpoint
        lastError = e instanceof Error ? e.message : 'Unknown error'
        continue
      }
    }

    // All endpoints failed
    error.value = `Overpass API error: ${lastError}`
    loading.value = false
    pois.value = []
    return []
  }

  /**
   * Parse an Overpass element into a POI object
   */
  function parsePOI(element: OverpassElement): POI {
    const tags = element.tags || {}

    // Get coordinates (nodes have lat/lon, ways have center)
    const lat = element.lat ?? element.center?.lat ?? 0
    const lng = element.lon ?? element.center?.lon ?? 0

    // Extract type from various tag keys
    const type =
      tags.amenity ||
      tags.shop ||
      tags.tourism ||
      tags.leisure ||
      tags.craft ||
      'unknown'

    // Build address from addr:* tags
    const address = buildAddress(tags)

    return {
      id: element.id,
      name: tags.name,
      lat,
      lng,
      type,
      address,
      phone: tags.phone || tags['contact:phone'],
      website: tags.website || tags['contact:website']
    }
  }

  /**
   * Build a formatted address string from OSM addr:* tags
   */
  function buildAddress(tags: Record<string, string>): string | undefined {
    const parts: string[] = []

    // Street and house number
    if (tags['addr:street']) {
      let street = tags['addr:street']
      if (tags['addr:housenumber']) {
        street += ` ${tags['addr:housenumber']}`
      }
      parts.push(street)
    }

    // City
    if (tags['addr:city']) {
      parts.push(tags['addr:city'])
    }

    return parts.length > 0 ? parts.join(', ') : undefined
  }

  return {
    loading,
    error,
    pois,
    findNearbyPOIs
  }
}
