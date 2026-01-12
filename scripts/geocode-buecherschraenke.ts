import fs from 'fs'
import path from 'path'

interface BuecherschrankLocation {
  name: string
  district: string
  location_short: string
  street: string
  postal_code: string
  city: string
  additional_info?: string
}

interface GeocodedLocation extends BuecherschrankLocation {
  latitude: string
  longitude: string
  geocode_confidence: 'high' | 'medium' | 'low' | 'failed'
  geocode_display_name?: string
}

interface RawData {
  extracted_at: string
  source_url: string
  total_count: number
  locations: BuecherschrankLocation[]
}

interface GeocodedData extends Omit<RawData, 'locations'> {
  geocoded_at: string
  geocoded_count: number
  failed_count: number
  locations: GeocodedLocation[]
}

interface NominatimResponse {
  lat: string
  lon: string
  display_name: string
  address?: {
    road?: string
    postcode?: string
    suburb?: string
    city?: string
  }
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'ZeroWasteFrankfurt/1.0 (map.zerowastefrankfurt.de)'
const RATE_LIMIT_MS = 1000 // 1 request per second (Nominatim requirement)
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

/**
 * Delay execution for a specified number of milliseconds
 */
async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Geocode an address using Nominatim API
 */
async function geocodeAddress(
  address: string,
  retries = MAX_RETRIES
): Promise<{ lat: string; lon: string; display_name: string } | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const url = new URL(NOMINATIM_BASE_URL)
      url.searchParams.set('q', address)
      url.searchParams.set('format', 'json')
      url.searchParams.set('limit', '1')
      url.searchParams.set('countrycodes', 'de')
      url.searchParams.set('addressdetails', '1')

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': USER_AGENT,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = (await response.json()) as NominatimResponse[]

      if (data.length === 0) {
        return null
      }

      return {
        lat: data[0].lat,
        lon: data[0].lon,
        display_name: data[0].display_name,
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1}/${retries} failed:`, error)
      if (attempt < retries - 1) {
        await delay(RETRY_DELAY_MS)
      }
    }
  }

  return null
}

/**
 * Determine confidence level based on geocoding result
 */
function determineConfidence(
  location: BuecherschrankLocation,
  displayName: string
): 'high' | 'medium' | 'low' {
  const displayLower = displayName.toLowerCase()
  const street = location.street.toLowerCase()
  const postalCode = location.postal_code

  // High: Exact address match (street + postal code)
  if (displayLower.includes(street) && displayLower.includes(postalCode)) {
    return 'high'
  }

  // Medium: Partial match (street only)
  if (displayLower.includes(street)) {
    return 'medium'
  }

  // Low: Approximate match (district/area only)
  return 'low'
}

/**
 * Geocode a single location
 */
async function geocodeLocation(
  location: BuecherschrankLocation,
  index: number,
  total: number
): Promise<GeocodedLocation> {
  // Build query string
  const addressParts = [location.street]
  if (location.postal_code) {
    addressParts.push(location.postal_code)
  }
  addressParts.push('Frankfurt am Main', 'Germany')
  const query = addressParts.join(', ')

  console.log(`[${index + 1}/${total}] Geocoding: ${location.name}`)
  console.log(`  Query: ${query}`)

  const result = await geocodeAddress(query)

  if (!result) {
    console.log(`  ❌ FAILED to geocode`)
    return {
      ...location,
      latitude: '',
      longitude: '',
      geocode_confidence: 'failed',
    }
  }

  const confidence = determineConfidence(location, result.display_name)

  console.log(
    `  ✅ ${confidence.toUpperCase()} confidence: ${result.lat}, ${result.lon}`
  )

  return {
    ...location,
    latitude: result.lat,
    longitude: result.lon,
    geocode_confidence: confidence,
    geocode_display_name: result.display_name,
  }
}

/**
 * Main geocoding function
 */
async function geocodeAll() {
  console.log('=== Bücherschränke Geocoding ===\n')

  // Read input file
  const inputPath = path.join(
    process.cwd(),
    'data',
    'buecherschraenke-raw.json'
  )
  const rawData: RawData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))

  console.log(`Total locations to geocode: ${rawData.total_count}`)
  console.log(`Rate limit: ${RATE_LIMIT_MS}ms per request`)
  console.log(
    `Estimated time: ~${Math.ceil((rawData.total_count * RATE_LIMIT_MS) / 1000)}s\n`
  )

  const geocodedLocations: GeocodedLocation[] = []
  let successCount = 0
  let failedCount = 0

  // Geocode each location with rate limiting
  for (let i = 0; i < rawData.locations.length; i++) {
    const location = rawData.locations[i]
    const geocoded = await geocodeLocation(location, i, rawData.total_count)

    if (geocoded.geocode_confidence === 'failed') {
      failedCount++
    } else {
      successCount++
    }

    geocodedLocations.push(geocoded)

    // Rate limiting: wait 1 second between requests (except after last)
    if (i < rawData.locations.length - 1) {
      await delay(RATE_LIMIT_MS)
    }
  }

  // Count confidence distribution
  const confidenceDist = {
    high: 0,
    medium: 0,
    low: 0,
    failed: 0,
  }

  geocodedLocations.forEach((loc) => {
    confidenceDist[loc.geocode_confidence]++
  })

  // Create output data
  const geocodedData: GeocodedData = {
    extracted_at: rawData.extracted_at,
    geocoded_at: new Date().toISOString(),
    source_url: rawData.source_url,
    total_count: rawData.total_count,
    geocoded_count: successCount,
    failed_count: failedCount,
    locations: geocodedLocations,
  }

  // Write output file
  const outputPath = path.join(
    process.cwd(),
    'data',
    'buecherschraenke-geocoded.json'
  )
  fs.writeFileSync(outputPath, JSON.stringify(geocodedData, null, 2))

  // Print summary
  console.log('\n=== Geocoding Complete ===')
  console.log(`Total attempted: ${rawData.total_count}`)
  console.log(`Successful: ${successCount}`)
  console.log(`Failed: ${failedCount}`)
  console.log('\nConfidence distribution:')
  console.log(`  High: ${confidenceDist.high}`)
  console.log(`  Medium: ${confidenceDist.medium}`)
  console.log(`  Low: ${confidenceDist.low}`)
  console.log(`  Failed: ${confidenceDist.failed}`)
  console.log(`\nOutput written to: ${outputPath}`)

  // Print failed locations if any
  if (failedCount > 0) {
    console.log('\n⚠️  Failed locations:')
    geocodedLocations
      .filter((loc) => loc.geocode_confidence === 'failed')
      .forEach((loc) => {
        console.log(`  - ${loc.name} (${loc.street})`)
      })
  }

  // Print low confidence locations if any
  const lowConfidence = geocodedLocations.filter(
    (loc) => loc.geocode_confidence === 'low'
  )
  if (lowConfidence.length > 0) {
    console.log('\n⚠️  Low confidence locations (manual verification recommended):')
    lowConfidence.forEach((loc) => {
      console.log(`  - ${loc.name} (${loc.street})`)
    })
  }

  // Validate coordinates are within Frankfurt bounds
  console.log('\n=== Coordinate Validation ===')
  const invalidCoords = geocodedLocations.filter((loc) => {
    if (loc.geocode_confidence === 'failed') return false
    const lat = parseFloat(loc.latitude)
    const lon = parseFloat(loc.longitude)
    return lat < 50.0 || lat > 50.2 || lon < 8.5 || lon > 8.8
  })

  if (invalidCoords.length > 0) {
    console.log(`⚠️  ${invalidCoords.length} locations outside Frankfurt bounds:`)
    invalidCoords.forEach((loc) => {
      console.log(
        `  - ${loc.name}: ${loc.latitude}, ${loc.longitude}`
      )
    })
  } else {
    console.log('✅ All coordinates within Frankfurt bounds (50.0-50.2, 8.5-8.8)')
  }

  // Print sample location
  if (successCount > 0) {
    const sampleLoc = geocodedLocations.find(
      (loc) => loc.geocode_confidence === 'high'
    )
    if (sampleLoc) {
      console.log('\n=== Sample Geocoded Location ===')
      console.log(JSON.stringify(sampleLoc, null, 2))
    }
  }
}

// Run the script
geocodeAll().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
