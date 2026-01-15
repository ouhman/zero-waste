#!/usr/bin/env npx tsx
/**
 * Import Taschenstationen (bag stations) from CSV
 *
 * Simple single-pass script that:
 * 1. Reads CSV file
 * 2. Geocodes each address via Nominatim (1 req/sec)
 * 3. Inserts into locations table
 * 4. Links to Taschenstationen category
 *
 * Usage:
 *   npx tsx scripts/import-taschenstationen.ts --dry-run  # Preview
 *   npx tsx scripts/import-taschenstationen.ts             # Import
 *
 * Environment:
 *   Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load env based on --prod flag
const isProd = process.argv.includes('--prod')
const envFile = isProd ? '.env.production' : '.env.development'
dotenv.config({ path: path.join(__dirname, '..', envFile) })

// ================================================================
// Config
// ================================================================

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗ MISSING')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗ MISSING')
  console.error('\n   Get service_role key from: Supabase Dashboard → Settings → API')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const CSV_FILE = '/home/ouhman/Downloads/zerowastefrankfurt/Kopie von 25-10-02 Standortliste.csv'
const CATEGORY_SLUG = 'taschenstationen'
const RATE_LIMIT_MS = 1100 // Nominatim: 1 req/sec

// ================================================================
// Types
// ================================================================

interface CsvRow {
  name: string
  address: string
}

interface GeocodedLocation extends CsvRow {
  lat: number
  lng: number
  city: string
  suburb?: string
  postalCode?: string
}

// ================================================================
// CSV Parser
// ================================================================

function parseCSV(content: string): CsvRow[] {
  const lines = content.split('\n')
  const rows: CsvRow[] = []

  let i = 1 // Skip header
  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line || line === ',') {
      i++
      continue
    }

    // Stop at "NEUE STATIONEN" marker
    if (line.includes('NEUE STATIONEN')) break

    // Handle multiline addresses (quoted strings spanning multiple lines)
    let name = ''
    let address = ''

    if (line.startsWith('"')) {
      // Name is quoted - find closing quote
      const nameEnd = line.indexOf('",', 1)
      if (nameEnd > 0) {
        name = line.slice(1, nameEnd)
        address = line.slice(nameEnd + 2).replace(/^"|"$/g, '')
      }
    } else {
      const firstComma = line.indexOf(',')
      if (firstComma > 0) {
        name = line.slice(0, firstComma)
        let addr = line.slice(firstComma + 1).replace(/^"|"$/g, '')

        // Check if address continues on next lines (multiline quoted)
        if (line.includes(',"') && !line.endsWith('"')) {
          while (i + 1 < lines.length && !lines[i].endsWith('"')) {
            i++
            addr += ' ' + lines[i].trim().replace(/"$/, '')
          }
        }
        address = addr
      }
    }

    // Clean up
    name = name.trim()
    address = address.trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '')

    if (name && address) {
      rows.push({ name, address })
    }

    i++
  }

  return rows
}

// ================================================================
// Geocoding
// ================================================================

async function geocode(address: string): Promise<{
  lat: number
  lng: number
  city: string
  suburb?: string
  postalCode?: string
} | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', address)
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'de')

  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': 'ZeroWasteFrankfurt/1.0' },
  })

  if (!response.ok) return null

  const data = await response.json()
  if (!data.length) return null

  const result = data[0]
  const addr = result.address || {}

  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    city: addr.city || addr.town || addr.village || 'Frankfurt am Main',
    suburb: addr.suburb || addr.city_district || undefined,
    postalCode: addr.postcode || undefined,
  }
}

// ================================================================
// Database Operations
// ================================================================

async function getCategoryId(): Promise<string> {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', CATEGORY_SLUG)
    .single()

  if (error || !data) {
    throw new Error(`Category '${CATEGORY_SLUG}' not found. Run migration first.`)
  }
  return data.id
}

async function generateSlug(name: string, suburb: string | null, city: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_unique_slug', {
    name,
    suburb: suburb || '',
    city,
  })
  if (error) throw new Error(`Slug generation failed: ${error.message}`)
  return data
}

async function checkDuplicate(name: string, city: string): Promise<boolean> {
  const { data } = await supabase
    .from('locations')
    .select('id')
    .eq('name', name)
    .eq('city', city)
    .maybeSingle()
  return !!data
}

async function insertLocation(
  location: GeocodedLocation,
  categoryId: string,
  dryRun: boolean
): Promise<{ slug: string }> {
  const slug = await generateSlug(location.name, location.suburb || null, location.city)

  if (dryRun) return { slug }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('locations')
    .insert({
      name: location.name,
      slug,
      address: location.address,
      city: location.city,
      suburb: location.suburb || null,
      postal_code: location.postalCode || null,
      latitude: location.lat,
      longitude: location.lng,
      status: 'approved',
      description_de: 'Ausgabestelle für wiederverwendbare Taschen',
      description_en: 'Distribution point for reusable bags',
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Insert failed: ${error.message}`)
  if (!data) throw new Error('Insert returned no data - check RLS')

  // Link to category
  const { error: linkError } = await supabase
    .from('location_categories')
    .insert({ location_id: data.id, category_id: categoryId })

  if (linkError) {
    await supabase.from('locations').delete().eq('id', data.id)
    throw new Error(`Category link failed: ${linkError.message}`)
  }

  return { slug }
}

// ================================================================
// Main
// ================================================================

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const isProdEnv = process.argv.includes('--prod')
  console.log('📦 Taschenstationen Import')
  console.log('═'.repeat(50))
  console.log(`🌍 Environment: ${isProdEnv ? 'PRODUCTION' : 'DEVELOPMENT'}`)
  console.log(dryRun ? '🔍 DRY RUN - No changes\n' : '🚀 LIVE MODE\n')

  // Read and parse CSV
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌ CSV not found: ${CSV_FILE}`)
    process.exit(1)
  }

  const content = fs.readFileSync(CSV_FILE, 'utf-8')
  const rows = parseCSV(content)
  console.log(`📄 Parsed ${rows.length} locations from CSV\n`)

  // Get category ID
  const categoryId = await getCategoryId()
  console.log(`✅ Category found: ${CATEGORY_SLUG}\n`)

  // Process locations
  const stats = { inserted: 0, skipped: 0, failed: 0 }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const progress = `[${i + 1}/${rows.length}]`

    try {
      // Check duplicate
      const exists = await checkDuplicate(row.name, 'Frankfurt am Main')
      if (exists) {
        console.log(`${progress} ⏭️  ${row.name} (duplicate)`)
        stats.skipped++
        continue
      }

      // Geocode
      console.log(`${progress} 🌍 Geocoding: ${row.name}`)
      const geo = await geocode(row.address)

      if (!geo) {
        console.log(`         ❌ Geocoding failed`)
        stats.failed++
        continue
      }

      // Insert
      const location: GeocodedLocation = { ...row, ...geo }
      const { slug } = await insertLocation(location, categoryId, dryRun)

      console.log(`         ✅ ${slug}`)
      stats.inserted++

      // Rate limit
      if (i < rows.length - 1) {
        await new Promise((r) => setTimeout(r, RATE_LIMIT_MS))
      }
    } catch (err) {
      console.log(`         ❌ ${err instanceof Error ? err.message : 'Unknown error'}`)
      stats.failed++
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(50))
  console.log('📊 SUMMARY')
  console.log('═'.repeat(50))
  console.log(`${dryRun ? 'Would insert' : 'Inserted'}:  ${stats.inserted}`)
  console.log(`Skipped:     ${stats.skipped}`)
  console.log(`Failed:      ${stats.failed}`)

  if (dryRun && stats.inserted > 0) {
    console.log('\n💡 Run without --dry-run to apply changes')
  }
}

main().catch((err) => {
  console.error('\n❌ Fatal:', err)
  process.exit(1)
})
