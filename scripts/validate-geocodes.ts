import fs from 'fs'
import path from 'path'

interface GeocodedLocation {
  name: string
  district: string
  location_short: string
  street: string
  postal_code: string
  city: string
  additional_info?: string
  latitude: string
  longitude: string
  geocode_confidence: 'high' | 'medium' | 'low' | 'failed'
  geocode_display_name?: string
}

interface GeocodedData {
  extracted_at: string
  geocoded_at: string
  source_url: string
  total_count: number
  geocoded_count: number
  failed_count: number
  locations: GeocodedLocation[]
}

async function validateGeocodes() {
  console.log('=== Validating Geocoded Data ===\n')

  // Read geocoded file
  const filePath = path.join(
    process.cwd(),
    'data',
    'buecherschraenke-geocoded.json'
  )
  const data: GeocodedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  console.log(`Total locations: ${data.total_count}`)
  console.log(`Geocoded: ${data.geocoded_count}`)
  console.log(`Failed: ${data.failed_count}\n`)

  // Validate all locations have coordinates
  const missingCoords = data.locations.filter(
    (loc) => !loc.latitude || !loc.longitude
  )
  if (missingCoords.length > 0) {
    console.log(`❌ ${missingCoords.length} locations missing coordinates:`)
    missingCoords.forEach((loc) => console.log(`  - ${loc.name}`))
  } else {
    console.log('✅ All locations have coordinates\n')
  }

  // Validate coordinates are within Frankfurt bounds
  // Expanded bounds to include outer districts
  const bounds = {
    latMin: 50.0,
    latMax: 50.25, // Extended for Nieder-Erlenbach
    lonMin: 8.45, // Extended for western districts
    lonMax: 8.8,
  }

  const outsideBounds = data.locations.filter((loc) => {
    if (!loc.latitude || !loc.longitude) return false
    const lat = parseFloat(loc.latitude)
    const lon = parseFloat(loc.longitude)
    return (
      lat < bounds.latMin ||
      lat > bounds.latMax ||
      lon < bounds.lonMin ||
      lon > bounds.lonMax
    )
  })

  if (outsideBounds.length > 0) {
    console.log(`⚠️  ${outsideBounds.length} locations outside Frankfurt bounds:`)
    outsideBounds.forEach((loc) => {
      console.log(`  - ${loc.name}: ${loc.latitude}, ${loc.longitude}`)
    })
    console.log()
  } else {
    console.log(
      `✅ All coordinates within Frankfurt bounds (${bounds.latMin}-${bounds.latMax}, ${bounds.lonMin}-${bounds.lonMax})\n`
    )
  }

  // Print confidence distribution
  const confidenceDist = {
    high: 0,
    medium: 0,
    low: 0,
    failed: 0,
  }

  data.locations.forEach((loc) => {
    confidenceDist[loc.geocode_confidence]++
  })

  console.log('Confidence distribution:')
  console.log(`  High: ${confidenceDist.high} (${((confidenceDist.high / data.total_count) * 100).toFixed(1)}%)`)
  console.log(`  Medium: ${confidenceDist.medium} (${((confidenceDist.medium / data.total_count) * 100).toFixed(1)}%)`)
  console.log(`  Low: ${confidenceDist.low} (${((confidenceDist.low / data.total_count) * 100).toFixed(1)}%)`)
  console.log(`  Failed: ${confidenceDist.failed} (${((confidenceDist.failed / data.total_count) * 100).toFixed(1)}%)\n`)

  // Print sample locations from different confidence levels
  console.log('=== Sample Locations ===\n')

  const highConfidenceSample = data.locations.find(
    (loc) => loc.geocode_confidence === 'high'
  )
  if (highConfidenceSample) {
    console.log('HIGH CONFIDENCE:')
    console.log(JSON.stringify(highConfidenceSample, null, 2))
    console.log()
  }

  const mediumConfidenceSample = data.locations.find(
    (loc) => loc.geocode_confidence === 'medium'
  )
  if (mediumConfidenceSample) {
    console.log('MEDIUM CONFIDENCE:')
    console.log(JSON.stringify(mediumConfidenceSample, null, 2))
    console.log()
  }

  const lowConfidenceSample = data.locations.find(
    (loc) => loc.geocode_confidence === 'low'
  )
  if (lowConfidenceSample) {
    console.log('LOW CONFIDENCE:')
    console.log(JSON.stringify(lowConfidenceSample, null, 2))
    console.log()
  }

  // Print locations for spot-checking
  console.log('=== Locations to Spot-Check (first 5) ===')
  data.locations.slice(0, 5).forEach((loc, index) => {
    console.log(
      `${index + 1}. ${loc.name} (${loc.geocode_confidence})`
    )
    console.log(
      `   Address: ${loc.street}, ${loc.postal_code} ${loc.city}`
    )
    console.log(`   Coordinates: ${loc.latitude}, ${loc.longitude}`)
    console.log(
      `   Google Maps: https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`
    )
    console.log()
  })

  console.log('=== Validation Complete ===')
}

validateGeocodes().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
