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

// Manual geocode data from Google Maps
const manualGeocodes: Record<
  string,
  { lat: string; lon: string; displayName: string }
> = {
  'Bücherschrank Dornbusch -  Albert-Schweitzer-Siedlung': {
    // Ecke Grafenstraße/Reinhardstraße - Grafenstraße 2, 60433 Frankfurt
    lat: '50.1619',
    lon: '8.6657',
    displayName:
      'Grafenstraße/Reinhardstraße, Dornbusch, Frankfurt am Main, 60433',
  },
  'Bücherschrank Niederursel - Kupferhammer (Mertonviertel)': {
    // Sebastian-Kneipp-Straße/Kupferhammer - approximate center of Mertonviertel
    lat: '50.1637',
    lon: '8.6363',
    displayName:
      'Kupferhammer/Sebastian-Kneipp-Straße, Niederursel, Frankfurt am Main, 60439',
  },
  'Bücherschrank Niederursel - Ecke Weißkirchener Weg / Gerhart-Hauptmann-Ring':
    {
      // Gerhart-Hauptmann-Ring 398 area
      lat: '50.1582',
      lon: '8.6229',
      displayName:
        'Weißkirchener Weg/Gerhart-Hauptmann-Ring, Niederursel, Frankfurt am Main, 60439',
    },
  'Bücherschrank Unterliederbach - An der Ludwig-Erhard-Schule': {
    // Ludwig-Erhard-Schule - Nußzeil 2, 65929 Frankfurt
    lat: '50.1097',
    lon: '8.5368',
    displayName:
      'Ludwig-Erhard-Schule, An der Ludwig-Erhard-Schule, Unterliederbach, Frankfurt am Main, 65929',
  },
}

async function fixFailedGeocodes() {
  console.log('=== Fixing Failed Geocodes ===\n')

  // Read geocoded file
  const filePath = path.join(
    process.cwd(),
    'data',
    'buecherschraenke-geocoded.json'
  )
  const data: GeocodedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  let fixedCount = 0

  // Update failed locations with manual coordinates
  data.locations = data.locations.map((location) => {
    if (location.geocode_confidence === 'failed') {
      const manualData = manualGeocodes[location.name]
      if (manualData) {
        console.log(`✅ Fixed: ${location.name}`)
        console.log(`   Coordinates: ${manualData.lat}, ${manualData.lon}`)
        fixedCount++
        return {
          ...location,
          latitude: manualData.lat,
          longitude: manualData.lon,
          geocode_confidence: 'medium' as const,
          geocode_display_name: manualData.displayName,
        }
      }
    }
    return location
  })

  // Update statistics
  data.geocoded_count = data.total_count - (data.failed_count - fixedCount)
  data.failed_count = data.failed_count - fixedCount
  data.geocoded_at = new Date().toISOString()

  // Write updated file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))

  console.log(`\n=== Summary ===`)
  console.log(`Fixed locations: ${fixedCount}`)
  console.log(`Total geocoded: ${data.geocoded_count}/${data.total_count}`)
  console.log(`Remaining failed: ${data.failed_count}`)

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

  console.log('\nConfidence distribution:')
  console.log(`  High: ${confidenceDist.high}`)
  console.log(`  Medium: ${confidenceDist.medium}`)
  console.log(`  Low: ${confidenceDist.low}`)
  console.log(`  Failed: ${confidenceDist.failed}`)
}

fixFailedGeocodes().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
