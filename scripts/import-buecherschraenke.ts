#!/usr/bin/env npx ts-node
/**
 * Import script: Import Bücherschränke (public bookcases) from geocoded data
 *
 * This script:
 * 1. Reads geocoded data from data/buecherschraenke-geocoded.json
 * 2. For each location:
 *    a. Generates unique slug using PostgreSQL generate_unique_slug() function
 *    b. Checks for duplicates (by slug or exact name+address)
 *    c. Inserts into locations table (status='approved')
 *    d. Links to Bücherschrank category via location_categories
 * 3. Reports detailed summary with success/failure counts
 *
 * Features:
 * - Dry-run mode to preview changes without inserting
 * - Duplicate detection (by slug, name+address)
 * - Comprehensive error handling with detailed logs
 * - Progress tracking
 * - Transaction-based inserts (rollback on error)
 *
 * Usage:
 *   npx ts-node scripts/import-buecherschraenke.ts --dry-run  # Preview
 *   npx ts-node scripts/import-buecherschraenke.ts             # Import
 *
 * Environment:
 *   Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 *   (Service role key is needed to bypass RLS)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// ES module compatibility
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Missing required environment variables')
  console.error('')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓ set' : '✗ MISSING')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓ set' : '✗ MISSING')
  console.error('')
  console.error('⚠️  The SERVICE_ROLE_KEY is REQUIRED to bypass RLS policies.')
  console.error('   Without it, inserts will silently fail!')
  console.error('')
  console.error('   Get it from: Supabase Dashboard → Project Settings → API → service_role')
  console.error('')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// ================================================================
// Constants
// ================================================================

const CATEGORY_ID = '4fa43a7d-ac1b-4baa-a009-e882279f9c1c' // Bücherschrank category
const DATA_FILE = path.join(__dirname, '..', 'data', 'buecherschraenke-geocoded.json')
const WEBSITE = 'https://frankfurt.de/themen/kultur/literatur/bibliotheken/buecherschraenke'

// ================================================================
// Types
// ================================================================

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
  geocode_confidence: 'high' | 'medium' | 'low'
  geocode_display_name: string
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

interface LocationInsert {
  name: string
  slug: string
  address: string
  city: string
  suburb: string | null
  postal_code: string | null
  latitude: number
  longitude: number
  status: 'approved'
  description_de: string
  description_en: string
  opening_hours_osm: string
  website: string
  created_at: string
  updated_at: string
}

interface ImportResult {
  name: string
  slug: string | null
  success: boolean
  skipped: boolean
  skipReason?: string
  error?: string
}

// ================================================================
// Helper Functions
// ================================================================

/**
 * Build German description from location data
 */
function buildDescription(location: GeocodedLocation): string {
  let desc = 'Offener Bücherschrank - 24/7 geöffnet.'
  if (location.additional_info) {
    desc += ` ${location.additional_info}`
  }
  return desc
}

/**
 * Generate slug using PostgreSQL generate_unique_slug() function
 */
async function generateSlug(
  name: string,
  suburb: string | null,
  city: string
): Promise<string> {
  const { data, error } = await supabase.rpc('generate_unique_slug', {
    name: name,
    suburb: suburb || '',
    city: city,
  })

  if (error) {
    throw new Error(`RPC error: ${error.message}`)
  }

  if (!data || typeof data !== 'string') {
    throw new Error('Invalid response from generate_unique_slug')
  }

  return data
}

/**
 * Check if location already exists (by slug or exact name+address match)
 */
async function checkDuplicate(
  slug: string,
  name: string,
  address: string
): Promise<{ exists: boolean; reason?: string; existingId?: string }> {
  // Check by slug
  const { data: bySlug, error: slugError } = await supabase
    .from('locations')
    .select('id, name')
    .eq('slug', slug)
    .maybeSingle()

  if (slugError) {
    throw new Error(`Error checking slug: ${slugError.message}`)
  }

  if (bySlug) {
    return {
      exists: true,
      reason: `Slug already exists: ${bySlug.name}`,
      existingId: bySlug.id,
    }
  }

  // Check by exact name + address match
  const { data: byNameAddress, error: nameError } = await supabase
    .from('locations')
    .select('id, slug')
    .eq('name', name)
    .eq('address', address)
    .maybeSingle()

  if (nameError) {
    throw new Error(`Error checking name+address: ${nameError.message}`)
  }

  if (byNameAddress) {
    return {
      exists: true,
      reason: `Name+address already exists: ${byNameAddress.slug}`,
      existingId: byNameAddress.id,
    }
  }

  return { exists: false }
}

/**
 * Insert location and link to category
 */
async function insertLocation(
  locationData: LocationInsert,
  dryRun: boolean
): Promise<{ id: string }> {
  if (dryRun) {
    // In dry-run, return a fake ID
    return { id: 'dry-run-id' }
  }

  // Insert location
  const { data: insertedLocation, error: insertError } = await supabase
    .from('locations')
    .insert(locationData)
    .select('id')
    .single()

  if (insertError) {
    throw new Error(`Failed to insert location: ${insertError.message}`)
  }

  if (!insertedLocation) {
    throw new Error('Insert returned no data - likely blocked by RLS')
  }

  // Link to category
  const { error: categoryError } = await supabase
    .from('location_categories')
    .insert({
      location_id: insertedLocation.id,
      category_id: CATEGORY_ID,
    })

  if (categoryError) {
    // Rollback: delete the location we just inserted
    await supabase.from('locations').delete().eq('id', insertedLocation.id)
    throw new Error(`Failed to link category: ${categoryError.message}`)
  }

  return { id: insertedLocation.id }
}

/**
 * Process a single location
 */
async function processLocation(
  location: GeocodedLocation,
  dryRun: boolean
): Promise<ImportResult> {
  const result: ImportResult = {
    name: location.name,
    slug: null,
    success: false,
    skipped: false,
  }

  try {
    // Generate slug
    const slug = await generateSlug(
      location.name,
      location.district || null,
      location.city
    )
    result.slug = slug

    // Check for duplicates
    const duplicate = await checkDuplicate(slug, location.name, location.street)

    if (duplicate.exists) {
      result.skipped = true
      result.skipReason = duplicate.reason
      return result
    }

    // Prepare location data
    const now = new Date().toISOString()
    const locationData: LocationInsert = {
      name: location.name,
      slug: slug,
      address: location.street,
      city: location.city,
      suburb: location.district || null,
      postal_code: location.postal_code || null,
      latitude: parseFloat(location.latitude),
      longitude: parseFloat(location.longitude),
      status: 'approved',
      description_de: buildDescription(location),
      description_en: 'Public bookcase - open 24/7',
      opening_hours_osm: '24/7',
      website: WEBSITE,
      created_at: now,
      updated_at: now,
    }

    // Insert location and link to category
    await insertLocation(locationData, dryRun)

    result.success = true
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    result.error = message
    return result
  }
}

// ================================================================
// Main Script
// ================================================================

interface Stats {
  total: number
  inserted: number
  skipped: number
  failed: number
}

async function importBuecherschraenke(dryRun: boolean): Promise<void> {
  console.log('📚 Bücherschränke Import Script')
  console.log('═'.repeat(60))
  console.log(dryRun ? '🔍 DRY RUN MODE - No changes will be made\n' : '🚀 LIVE MODE - Changes will be applied\n')

  // Read geocoded data
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ Error: Data file not found: ${DATA_FILE}`)
    process.exit(1)
  }

  let data: GeocodedData
  try {
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8')
    data = JSON.parse(fileContent) as GeocodedData
  } catch (error) {
    console.error(`❌ Error reading data file: ${error}`)
    process.exit(1)
  }

  console.log(`📊 Loaded ${data.locations.length} locations from ${path.basename(DATA_FILE)}`)
  console.log(`   Source: ${data.source_url}`)
  console.log(`   Geocoded: ${data.geocoded_at}`)
  console.log(`   Category ID: ${CATEGORY_ID}\n`)

  // Verify category exists
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id, name_de, slug')
    .eq('id', CATEGORY_ID)
    .maybeSingle()

  if (categoryError) {
    console.error(`❌ Error checking category: ${categoryError.message}`)
    process.exit(1)
  }

  if (!category) {
    console.error(`❌ Error: Category not found with ID: ${CATEGORY_ID}`)
    console.error('   Run Phase 1 first to create the category.')
    process.exit(1)
  }

  console.log(`✅ Category verified: ${category.name_de} (${category.slug})\n`)

  // Initialize stats
  const stats: Stats = {
    total: data.locations.length,
    inserted: 0,
    skipped: 0,
    failed: 0,
  }

  // Process results for detailed report
  const results: ImportResult[] = []
  const failures: ImportResult[] = []
  const skipped: ImportResult[] = []

  // Process each location
  console.log('Processing locations...\n')

  for (let i = 0; i < data.locations.length; i++) {
    const location = data.locations[i]
    const progress = `[${i + 1}/${data.locations.length}]`

    // Process location
    const result = await processLocation(location, dryRun)
    results.push(result)

    // Update stats
    if (result.success) {
      stats.inserted++
      console.log(`${progress} ✅ ${result.name}`)
      console.log(`          → ${result.slug}`)
    } else if (result.skipped) {
      stats.skipped++
      skipped.push(result)
      console.log(`${progress} ⏭️  ${result.name}`)
      console.log(`          → ${result.skipReason}`)
    } else {
      stats.failed++
      failures.push(result)
      console.log(`${progress} ❌ ${result.name}`)
      console.log(`          → ${result.error}`)
    }
  }

  // Print detailed summary
  console.log('\n' + '═'.repeat(60))
  console.log('📊 SUMMARY')
  console.log('═'.repeat(60))
  console.log(`Total locations:        ${stats.total}`)
  console.log(`${dryRun ? 'Would insert' : 'Inserted'}:          ${stats.inserted}`)
  console.log(`Skipped (duplicates):   ${stats.skipped}`)
  console.log(`Failed:                 ${stats.failed}`)

  // Print failures if any
  if (failures.length > 0) {
    console.log('\n' + '─'.repeat(60))
    console.log('❌ FAILURES')
    console.log('─'.repeat(60))
    failures.forEach((failure) => {
      console.log(`\n📍 ${failure.name}`)
      console.log(`   Error: ${failure.error}`)
    })
  }

  // Print skipped items summary
  if (skipped.length > 0 && skipped.length <= 10) {
    console.log('\n' + '─'.repeat(60))
    console.log('⏭️  SKIPPED (DUPLICATES)')
    console.log('─'.repeat(60))
    skipped.forEach((skip) => {
      console.log(`\n📍 ${skip.name}`)
      console.log(`   Reason: ${skip.skipReason}`)
    })
  } else if (skipped.length > 10) {
    console.log('\n' + '─'.repeat(60))
    console.log(`⏭️  SKIPPED (DUPLICATES): ${skipped.length} total`)
    console.log('─'.repeat(60))
    console.log('(Too many to display - see individual progress messages above)')
  }

  // Print sample inserted locations
  const inserted = results.filter((r) => r.success).slice(0, 5)
  if (inserted.length > 0) {
    console.log('\n' + '─'.repeat(60))
    console.log('📝 SAMPLE INSERTED LOCATIONS (first 5)')
    console.log('─'.repeat(60))
    inserted.forEach((ins) => {
      console.log(`\n📍 ${ins.name}`)
      console.log(`   Slug: ${ins.slug}`)
    })
  }

  // Print next steps
  console.log('\n' + '═'.repeat(60))
  if (dryRun && stats.inserted > 0) {
    console.log('💡 Next steps:')
    console.log('   1. Review the changes above')
    console.log('   2. Run without --dry-run to apply changes:')
    console.log('      npx ts-node scripts/import-buecherschraenke.ts')
  } else if (!dryRun && stats.inserted > 0) {
    console.log('✅ Import complete!')
    console.log(`   ${stats.inserted} Bücherschränke added to the database.`)
    console.log('')
    console.log('🔍 Verification query (run in Supabase SQL Editor):')
    console.log('')
    console.log('   SELECT l.name, l.slug, l.status, c.name_de as category')
    console.log('   FROM locations l')
    console.log('   JOIN location_categories lc ON l.id = lc.location_id')
    console.log('   JOIN categories c ON lc.category_id = c.id')
    console.log(`   WHERE c.id = '${CATEGORY_ID}'`)
    console.log('   ORDER BY l.name;')
  } else if (stats.inserted === 0) {
    console.log('ℹ️  No new locations to import.')
    if (stats.skipped > 0) {
      console.log('   All locations already exist in the database.')
    }
  }

  console.log('═'.repeat(60))
}

// ================================================================
// Command Line Interface
// ================================================================

function parseArgs(): { dryRun: boolean } {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  return { dryRun }
}

// Run the script
const { dryRun } = parseArgs()
importBuecherschraenke(dryRun).catch((error) => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
