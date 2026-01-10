#!/usr/bin/env npx ts-node
/**
 * Migration script: Google Maps → Zero Waste Frankfurt
 *
 * This script:
 * 1. Reads extracted Google Maps locations
 * 2. Maps categories to our database categories
 * 3. Enriches each location with OSM data (address, phone, website, hours, payments)
 * 4. Validates that OSM matches are geographically close to original coordinates
 * 5. Outputs SQL and JSON for import
 *
 * Usage:
 *   npx ts-node scripts/migrate-google-maps.ts
 *
 * Rate limiting: Nominatim requires 1 request/second max
 */

import * as fs from 'fs'
import * as path from 'path'

// Types
interface GoogleMapsLocation {
  name: string
  category: string
  lat: number
  lng: number
  description: string
}

interface PaymentMethods {
  cash?: boolean
  credit_cards?: boolean
  debit_cards?: boolean
  contactless?: boolean
  maestro?: boolean
  visa?: boolean
  mastercard?: boolean
  american_express?: boolean
  mobile_payment?: boolean
}

interface Facilities {
  toilets?: boolean
  wheelchair?: boolean
  wifi?: boolean
  organic?: boolean
  outdoor_seating?: boolean
  takeaway?: boolean
}

interface EnrichedLocation {
  name: string
  original_category: string
  mapped_categories: string[]
  lat: number
  lng: number
  address: string
  city: string
  postal_code: string
  description_de: string
  phone?: string
  website?: string
  email?: string
  instagram?: string
  opening_hours_osm?: string
  opening_hours_text?: string
  payment_methods?: PaymentMethods
  facilities?: Facilities
  osm_enriched: boolean
  match_type: 'name_search' | 'reverse_geocode' | 'none'
}

// Category mapping: Google Maps → Our slugs
const CATEGORY_MAPPING: Record<string, string[]> = {
  'Unverpackt-Läden': ['unverpackt'],
  'Restaurants, Cafés, Bars': ['gastronomie'],
  'Bäckereien': ['baeckereien'],
  'Spezialitätengeschäfte & Milchtankstellen': ['feinkost'],
  'Fair Fashion & Second Hand Läden': ['second-hand', 'nachhaltige-mode'],
  'Unverpacktes Zusatzangebot': ['bio-regional'],
  'Wochenmärkte & Flohmärkte': ['wochenmaerkte'],
  'Nachhaltige Orte & Unternehmen': ['andere'],
  'Zero Waste Basics': ['haushalt-pflege'],
  'Repair Cafés': ['repair-cafes'],
}

// Calculate distance between two coordinates (Haversine formula)
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Maximum distance (km) to accept an OSM match as valid
const MAX_DISTANCE_KM = 1.5

// Detect milk dispensers from name
function isMilkDispenser(name: string): boolean {
  const keywords = ['milch', 'milk', 'dairy', 'tankstelle', 'automat']
  const lowerName = name.toLowerCase()
  return keywords.some(kw => lowerName.includes(kw))
}

// Detect flea markets from name
function isFleaMarket(name: string): boolean {
  const keywords = ['flohmarkt', 'flea', 'trödelmarkt']
  const lowerName = name.toLowerCase()
  return keywords.some(kw => lowerName.includes(kw))
}

// Map category with special cases
function mapCategory(googleCategory: string, name: string): string[] {
  let categories = CATEGORY_MAPPING[googleCategory] || ['andere']

  // Special case: milk dispensers
  if (googleCategory === 'Spezialitätengeschäfte & Milchtankstellen' && isMilkDispenser(name)) {
    categories = ['milchtankstellen']
  }

  // Special case: flea markets
  if (googleCategory === 'Wochenmärkte & Flohmärkte' && isFleaMarket(name)) {
    categories = ['flohmaerkte']
  }

  return categories
}

// Extract payment methods from OSM extratags
function extractPaymentMethods(extras: Record<string, any>): PaymentMethods | undefined {
  const paymentKeys = Object.keys(extras).filter(key => key.startsWith('payment:'))
  if (paymentKeys.length === 0) return undefined

  const payments: PaymentMethods = {}
  const isTrue = (value: any): boolean => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim()
      return normalized === 'yes' || normalized === 'true'
    }
    return false
  }

  const paymentMapping: Record<string, keyof PaymentMethods> = {
    'payment:cash': 'cash',
    'payment:credit_cards': 'credit_cards',
    'payment:debit_cards': 'debit_cards',
    'payment:contactless': 'contactless',
    'payment:maestro': 'maestro',
    'payment:visa': 'visa',
    'payment:mastercard': 'mastercard',
    'payment:american_express': 'american_express',
    'payment:cards': 'credit_cards',
    'payment:electronic_purses': 'contactless',
    'payment:nfc': 'contactless',
    'payment:apple_pay': 'mobile_payment',
    'payment:google_pay': 'mobile_payment',
  }

  for (const [osmKey, ourKey] of Object.entries(paymentMapping)) {
    if (extras[osmKey] && isTrue(extras[osmKey])) {
      payments[ourKey] = true
    }
  }

  return Object.keys(payments).length > 0 ? payments : undefined
}

// Extract facilities from OSM tags
function extractFacilities(extras: Record<string, any>): Facilities | undefined {
  const facilities: Facilities = {}

  const isTrue = (value: any): boolean => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim()
      return normalized === 'yes' || normalized === 'true'
    }
    return false
  }

  // Toilets
  if (extras.toilets && isTrue(extras.toilets)) {
    facilities.toilets = true
  }

  // Wheelchair accessibility
  if (extras.wheelchair && isTrue(extras.wheelchair)) {
    facilities.wheelchair = true
  }

  // WiFi
  if ((extras.internet_access && extras.internet_access === 'wlan') ||
      (extras['internet_access:fee'] === 'no')) {
    facilities.wifi = true
  }

  // Organic
  if (extras.organic && (extras.organic === 'yes' || extras.organic === 'only')) {
    facilities.organic = true
  }

  // Outdoor seating
  if (extras.outdoor_seating && isTrue(extras.outdoor_seating)) {
    facilities.outdoor_seating = true
  }

  // Takeaway
  if (extras.takeaway && isTrue(extras.takeaway)) {
    facilities.takeaway = true
  }

  return Object.keys(facilities).length > 0 ? facilities : undefined
}

// Extract contact field with preference for contact:* namespace
function extractContactField(extras: Record<string, any>, field: string): string | undefined {
  const contactKey = `contact:${field}`
  return extras[contactKey] || extras[field] || undefined
}

// Format opening hours for display (German day abbreviations)
function formatOpeningHours(osmHours: string): string {
  if (!osmHours) return ''
  if (osmHours === '24/7') return 'Täglich 24 Stunden'

  return osmHours
    .replace(/Tu/g, 'Di')
    .replace(/We/g, 'Mi')
    .replace(/Th/g, 'Do')
    .replace(/Su/g, 'So')
    .replace(/PH off/g, 'Feiertage geschlossen')
    .replace(/PH closed/g, 'Feiertage geschlossen')
    .replace(/;/g, ', ')
}

// Search Nominatim for location data with coordinate validation
async function searchNominatim(
  name: string,
  lat: number,
  lng: number
): Promise<{
  address: string
  city: string
  postalCode: string
  phone?: string
  website?: string
  email?: string
  instagram?: string
  openingHours?: string
  paymentMethods?: PaymentMethods
  facilities?: Facilities
  matchType: 'name_search' | 'reverse_geocode'
} | null> {
  // Try searching by name first
  const queries = [name]

  // Simplify name (remove everything after dash/pipe)
  const simplified = name.split(/\s*[-|_–—]\s*/)[0].trim()
  if (simplified !== name) {
    queries.push(simplified)
  }

  for (const query of queries) {
    try {
      const params = new URLSearchParams({
        format: 'json',
        q: query,
        limit: '5', // Get multiple results to find closest match
        addressdetails: '1',
        extratags: '1',
      })

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            'User-Agent': 'ZeroWasteFrankfurt-Migration/1.0 (contact@zerowastefrankfurt.de)',
          },
        }
      )

      if (!response.ok) {
        console.error(`   Nominatim error: ${response.status}`)
        continue
      }

      const data = await response.json()

      if (data.length > 0) {
        // Find the result closest to our coordinates
        let bestMatch = null
        let bestDistance = Infinity

        for (const result of data) {
          const resultLat = parseFloat(result.lat)
          const resultLng = parseFloat(result.lon)
          const distance = getDistanceKm(lat, lng, resultLat, resultLng)

          if (distance < bestDistance) {
            bestDistance = distance
            bestMatch = result
          }
        }

        // Only accept if within MAX_DISTANCE_KM
        if (bestMatch && bestDistance <= MAX_DISTANCE_KM) {
          const addr = bestMatch.address || {}
          const extras = bestMatch.extratags || {}

          // Build street address
          const streetParts = []
          if (addr.road) streetParts.push(addr.road)
          if (addr.house_number) streetParts.push(addr.house_number)

          console.log(`   📍 OSM match ${bestDistance.toFixed(2)}km away`)

          return {
            address: streetParts.join(' ') || '',
            city: addr.city || addr.town || addr.village || addr.municipality || '',
            postalCode: addr.postcode || '',
            phone: extractContactField(extras, 'phone'),
            website: extractContactField(extras, 'website'),
            email: extractContactField(extras, 'email'),
            instagram: extractContactField(extras, 'instagram'),
            openingHours: extras.opening_hours,
            paymentMethods: extractPaymentMethods(extras),
            facilities: extractFacilities(extras),
            matchType: 'name_search',
          }
        } else if (bestMatch) {
          console.log(`   ⚠️  OSM result too far (${bestDistance.toFixed(1)}km away)`)
        }
      }

      // Wait 1 second before next query (Nominatim rate limit)
      await sleep(1000)
    } catch (e) {
      console.error(`   Error searching for "${query}":`, e)
    }
  }

  // Fallback: reverse geocode the coordinates (always accurate for address)
  try {
    await sleep(1000) // Rate limit

    const params = new URLSearchParams({
      format: 'json',
      lat: lat.toString(),
      lon: lng.toString(),
      addressdetails: '1',
    })

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'ZeroWasteFrankfurt-Migration/1.0 (contact@zerowastefrankfurt.de)',
        },
      }
    )

    if (response.ok) {
      const data = await response.json()
      const addr = data.address || {}

      const streetParts = []
      if (addr.road) streetParts.push(addr.road)
      if (addr.house_number) streetParts.push(addr.house_number)

      console.log(`   📍 Reverse geocode: ${streetParts.join(' ')}, ${addr.city || addr.town || ''}`)

      return {
        address: streetParts.join(' ') || '',
        city: addr.city || addr.town || addr.village || addr.municipality || '',
        postalCode: addr.postcode || '',
        matchType: 'reverse_geocode',
      }
    }
  } catch (e) {
    console.error(`   Error reverse geocoding:`, e)
  }

  return null
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function escapeSQL(str: string): string {
  if (!str) return ''
  return str.replace(/'/g, "''")
}

async function main() {
  console.log('🚀 Starting Google Maps → Zero Waste Frankfurt migration\n')

  // Read extracted data
  const inputPath = path.join(process.cwd(), 'google-maps-export.json')
  if (!fs.existsSync(inputPath)) {
    console.error('❌ google-maps-export.json not found. Run the extraction first.')
    process.exit(1)
  }

  const locations: GoogleMapsLocation[] = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  console.log(`📍 Found ${locations.length} locations to process`)
  console.log(`⏱️  Estimated time: ${Math.ceil(locations.length * 2 / 60)} minutes\n`)

  const enrichedLocations: EnrichedLocation[] = []
  let nameMatchCount = 0
  let reverseGeocodeCount = 0
  let errorCount = 0

  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i]
    console.log(`[${i + 1}/${locations.length}] ${loc.name}`)

    // Map category
    const mappedCategories = mapCategory(loc.category, loc.name)

    // Search Nominatim for enrichment
    const osmData = await searchNominatim(loc.name, loc.lat, loc.lng)

    const enriched: EnrichedLocation = {
      name: loc.name,
      original_category: loc.category,
      mapped_categories: mappedCategories,
      lat: loc.lat,
      lng: loc.lng,
      address: osmData?.address || '',
      city: osmData?.city || 'Frankfurt',
      postal_code: osmData?.postalCode || '',
      description_de: loc.description,
      phone: osmData?.phone,
      website: osmData?.website,
      email: osmData?.email,
      instagram: osmData?.instagram,
      opening_hours_osm: osmData?.openingHours,
      opening_hours_text: osmData?.openingHours ? formatOpeningHours(osmData.openingHours) : undefined,
      payment_methods: osmData?.paymentMethods,
      facilities: osmData?.facilities,
      osm_enriched: osmData?.matchType === 'name_search',
      match_type: osmData?.matchType || 'none',
    }

    if (osmData?.matchType === 'name_search') {
      nameMatchCount++
      if (osmData.phone || osmData.website || osmData.openingHours) {
        console.log(`   ✅ Full enrichment (phone/web/hours)`)
      } else {
        console.log(`   ✅ Name match (address only)`)
      }
    } else if (osmData?.matchType === 'reverse_geocode') {
      reverseGeocodeCount++
    } else {
      errorCount++
      console.log(`   ❌ No data found`)
    }

    enrichedLocations.push(enriched)
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`📊 SUMMARY`)
  console.log(`${'='.repeat(50)}`)
  console.log(`   Total locations: ${locations.length}`)
  console.log(`   Full OSM match:  ${nameMatchCount} (${(nameMatchCount/locations.length*100).toFixed(1)}%)`)
  console.log(`   Address only:    ${reverseGeocodeCount} (${(reverseGeocodeCount/locations.length*100).toFixed(1)}%)`)
  console.log(`   No data:         ${errorCount} (${(errorCount/locations.length*100).toFixed(1)}%)`)

  // Save enriched JSON
  const jsonOutputPath = path.join(process.cwd(), 'migration-data.json')
  fs.writeFileSync(jsonOutputPath, JSON.stringify(enrichedLocations, null, 2))
  console.log(`\n💾 Saved enriched data to: ${jsonOutputPath}`)

  // Generate SQL
  const sqlLines: string[] = [
    '-- Zero Waste Frankfurt: Migration from Google Maps',
    '-- Generated: ' + new Date().toISOString(),
    '-- Total locations: ' + enrichedLocations.length,
    '',
    '-- NOTE: Run this after seeding categories',
    '',
    'DO $$',
    'DECLARE',
    '  loc_id uuid;',
  ]

  // Add category ID variables
  const allCategorySlugs = new Set<string>()
  enrichedLocations.forEach(loc => loc.mapped_categories.forEach(c => allCategorySlugs.add(c)))
  allCategorySlugs.forEach(slug => {
    sqlLines.push(`  cat_${slug.replace(/-/g, '_')}_id uuid;`)
  })

  sqlLines.push('BEGIN')
  sqlLines.push('  -- Get category IDs')
  allCategorySlugs.forEach(slug => {
    const varName = `cat_${slug.replace(/-/g, '_')}_id`
    sqlLines.push(`  SELECT id INTO ${varName} FROM categories WHERE slug = '${slug}';`)
  })
  sqlLines.push('')

  // Generate INSERT statements
  enrichedLocations.forEach((loc, i) => {
    sqlLines.push(`  -- Location ${i + 1}: ${loc.name}`)
    sqlLines.push(`  INSERT INTO locations (name, description_de, address, city, postal_code, latitude, longitude, website, phone, email, instagram, opening_hours_text, opening_hours_osm, payment_methods, facilities, status)`)
    sqlLines.push(`  VALUES (`)
    sqlLines.push(`    '${escapeSQL(loc.name)}',`)
    sqlLines.push(`    '${escapeSQL(loc.description_de)}',`)
    sqlLines.push(`    '${escapeSQL(loc.address)}',`)
    sqlLines.push(`    '${escapeSQL(loc.city)}',`)
    sqlLines.push(`    '${escapeSQL(loc.postal_code)}',`)
    sqlLines.push(`    ${loc.lat},`)
    sqlLines.push(`    ${loc.lng},`)
    sqlLines.push(`    ${loc.website ? `'${escapeSQL(loc.website)}'` : 'NULL'},`)
    sqlLines.push(`    ${loc.phone ? `'${escapeSQL(loc.phone)}'` : 'NULL'},`)
    sqlLines.push(`    ${loc.email ? `'${escapeSQL(loc.email)}'` : 'NULL'},`)
    sqlLines.push(`    ${loc.instagram ? `'${escapeSQL(loc.instagram)}'` : 'NULL'},`)
    sqlLines.push(`    ${loc.opening_hours_text ? `'${escapeSQL(loc.opening_hours_text)}'` : 'NULL'},`)
    sqlLines.push(`    ${loc.opening_hours_osm ? `'${escapeSQL(loc.opening_hours_osm)}'` : 'NULL'},`)
    sqlLines.push(`    ${loc.payment_methods ? `'${JSON.stringify(loc.payment_methods)}'::jsonb` : 'NULL'},`)
    sqlLines.push(`    ${loc.facilities ? `'${JSON.stringify(loc.facilities)}'::jsonb` : 'NULL'},`)
    sqlLines.push(`    'approved'`)
    sqlLines.push(`  ) RETURNING id INTO loc_id;`)

    // Add category associations
    loc.mapped_categories.forEach(slug => {
      const varName = `cat_${slug.replace(/-/g, '_')}_id`
      sqlLines.push(`  INSERT INTO location_categories (location_id, category_id) VALUES (loc_id, ${varName});`)
    })
    sqlLines.push('')
  })

  sqlLines.push('END $$;')
  sqlLines.push('')
  sqlLines.push(`-- Migration complete: ${enrichedLocations.length} locations imported`)

  const sqlOutputPath = path.join(process.cwd(), 'migration.sql')
  fs.writeFileSync(sqlOutputPath, sqlLines.join('\n'))
  console.log(`💾 Saved SQL migration to: ${sqlOutputPath}`)

  console.log('\n✅ Migration preparation complete!')
  console.log('\nNext steps:')
  console.log('1. Review migration-data.json for accuracy')
  console.log('2. Run migration.sql in Supabase SQL Editor')
}

main().catch(console.error)
