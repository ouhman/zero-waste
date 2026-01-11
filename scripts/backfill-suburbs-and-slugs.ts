#!/usr/bin/env npx ts-node
/**
 * Migration script: Backfill suburbs and regenerate slugs
 *
 * This script:
 * 1. Fetches all locations with coordinates
 * 2. Calls Nominatim to get suburb for each location (rate limited: 1 req/sec)
 * 3. Updates suburb column
 * 4. Calls PostgreSQL generate_unique_slug() to regenerate slug
 * 5. Updates slug column
 *
 * Features:
 * - Dry-run mode to preview changes
 * - Progress tracking with resumability
 * - Rate limiting (1 req/sec for Nominatim)
 * - Graceful error handling (log and continue)
 * - Verification report
 *
 * Usage:
 *   npx ts-node scripts/backfill-suburbs-and-slugs.ts
 *   npx ts-node scripts/backfill-suburbs-and-slugs.ts --dry-run
 *   npx ts-node scripts/backfill-suburbs-and-slugs.ts --resume-from=abc123
 *
 * Environment:
 *   Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 *   (Service role key is needed to bypass RLS)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

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
  console.error('   Without it, updates will silently fail!')
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
// Types
// ================================================================

interface Location {
  id: string
  name: string
  city: string | null
  suburb: string | null
  slug: string | null
  latitude: number
  longitude: number
}

interface NominatimAddress {
  suburb?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
}

interface NominatimResponse {
  address?: NominatimAddress
  display_name?: string
  error?: string
}

interface ProcessResult {
  id: string
  name: string
  success: boolean
  oldSlug: string | null
  newSlug: string | null
  oldSuburb: string | null
  newSuburb: string | null
  error?: string
  skipped?: boolean
}

// ================================================================
// Nominatim API
// ================================================================

/**
 * Reverse geocode to get suburb from coordinates
 * Rate limited to 1 request per second (Nominatim requirement)
 */
async function getSuburbFromCoordinates(lat: number, lng: number): Promise<string | null> {
  const params = new URLSearchParams({
    format: 'json',
    lat: lat.toString(),
    lon: lng.toString(),
    addressdetails: '1',
  })

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'ZeroWasteFrankfurt/1.0 (Migration Script)',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data: NominatimResponse = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    // Extract suburb from address
    const suburb = data.address?.suburb || null
    return suburb
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Nominatim API error: ${message}`)
  }
}

/**
 * Sleep for specified milliseconds (for rate limiting)
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ================================================================
// Slug Generation
// ================================================================

/**
 * Call PostgreSQL generate_unique_slug() function via RPC
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

// ================================================================
// Progress Bar
// ================================================================

class ProgressBar {
  private total: number
  private current: number = 0
  private barLength: number = 40
  private startTime: number

  constructor(total: number) {
    this.total = total
    this.startTime = Date.now()
  }

  update(current: number): void {
    this.current = current
    this.render()
  }

  private render(): void {
    const percentage = Math.round((this.current / this.total) * 100)
    const filled = Math.round((this.current / this.total) * this.barLength)
    const empty = this.barLength - filled
    const bar = '█'.repeat(filled) + '░'.repeat(empty)

    // Calculate ETA
    const elapsed = Date.now() - this.startTime
    const rate = this.current / elapsed // items per ms
    const remaining = this.total - this.current
    const eta = remaining / rate // ms

    const etaMinutes = Math.floor(eta / 60000)
    const etaSeconds = Math.floor((eta % 60000) / 1000)
    const etaStr = `${etaMinutes}m ${etaSeconds}s`

    // Clear line and write progress
    process.stdout.write(`\r${bar} ${percentage}% (${this.current}/${this.total}) ETA: ${etaStr}`)
  }

  complete(): void {
    this.update(this.total)
    process.stdout.write('\n')
  }
}

// ================================================================
// Main Processing Logic
// ================================================================

async function processLocation(
  location: Location,
  dryRun: boolean
): Promise<ProcessResult> {
  const result: ProcessResult = {
    id: location.id,
    name: location.name,
    success: false,
    oldSlug: location.slug,
    newSlug: null,
    oldSuburb: location.suburb,
    newSuburb: null,
  }

  try {
    // Step 1: Fetch suburb from Nominatim
    let suburb: string | null = location.suburb

    if (!suburb) {
      try {
        suburb = await getSuburbFromCoordinates(location.latitude, location.longitude)
        result.newSuburb = suburb
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        result.error = `Failed to fetch suburb: ${message}`
        return result
      }
    } else {
      // Already has suburb, skip Nominatim call
      result.newSuburb = suburb
      result.skipped = true
    }

    // Step 2: Generate new slug
    let newSlug: string
    try {
      newSlug = await generateSlug(location.name, suburb, location.city || 'Frankfurt')
      result.newSlug = newSlug
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      result.error = `Failed to generate slug: ${message}`
      return result
    }

    // Step 3: Update database (unless dry-run)
    if (!dryRun) {
      const updateData: any = {
        slug: newSlug,
      }

      // Only update suburb if we fetched a new one
      if (!location.suburb && suburb) {
        updateData.suburb = suburb
      }

      const { data: updatedRows, error: updateError } = await supabase
        .from('locations')
        .update(updateData)
        .eq('id', location.id)
        .select('id')

      if (updateError) {
        result.error = `Failed to update: ${updateError.message}`
        return result
      }

      // Check if update actually affected any rows (RLS might silently block)
      if (!updatedRows || updatedRows.length === 0) {
        result.error = 'Update returned 0 rows - likely blocked by RLS. Check SUPABASE_SERVICE_ROLE_KEY.'
        return result
      }
    }

    result.success = true
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    result.error = `Unexpected error: ${message}`
    return result
  }
}

// ================================================================
// Main Script
// ================================================================

interface Stats {
  total: number
  updated: number
  skipped: number
  failed: number
  suburbsAdded: number
  slugsChanged: number
}

async function backfillSuburbsAndSlugs(
  dryRun: boolean,
  resumeFromId?: string
): Promise<void> {
  console.log('🌍 Zero Waste Frankfurt - Suburb & Slug Backfill Script')
  console.log('═'.repeat(60))
  console.log(dryRun ? '🔍 DRY RUN MODE - No changes will be made\n' : '🚀 LIVE MODE - Changes will be applied\n')

  // Fetch all locations
  let query = supabase
    .from('locations')
    .select('id, name, city, suburb, slug, latitude, longitude')
    .order('name')

  // Resume from specific ID if provided
  if (resumeFromId) {
    console.log(`📍 Resuming from location ID: ${resumeFromId}\n`)
    query = query.gte('id', resumeFromId)
  }

  const { data: locations, error: fetchError } = await query

  if (fetchError) {
    console.error('❌ Error fetching locations:', fetchError.message)
    process.exit(1)
  }

  if (!locations || locations.length === 0) {
    console.log('ℹ️  No locations found.')
    return
  }

  console.log(`📊 Found ${locations.length} locations to process\n`)

  // Initialize stats
  const stats: Stats = {
    total: locations.length,
    updated: 0,
    skipped: 0,
    failed: 0,
    suburbsAdded: 0,
    slugsChanged: 0,
  }

  // Initialize progress bar
  const progress = new ProgressBar(locations.length)

  // Process results for detailed report
  const results: ProcessResult[] = []
  const failures: ProcessResult[] = []

  // Process each location with rate limiting
  for (let i = 0; i < locations.length; i++) {
    const location = locations[i] as Location

    // Process location
    const result = await processLocation(location, dryRun)
    results.push(result)

    // Update stats
    if (result.success) {
      stats.updated++
      if (result.newSuburb && !result.oldSuburb) {
        stats.suburbsAdded++
      }
      if (result.newSlug !== result.oldSlug) {
        stats.slugsChanged++
      }
      if (result.skipped) {
        stats.skipped++
      }
    } else {
      stats.failed++
      failures.push(result)
    }

    // Update progress bar
    progress.update(i + 1)

    // Rate limiting: Wait 1 second between Nominatim requests
    // (Skip if location already had suburb or if it's the last item)
    if (i < locations.length - 1 && !result.skipped) {
      await sleep(1000)
    }
  }

  progress.complete()

  // Print detailed summary
  console.log('\n' + '═'.repeat(60))
  console.log('📊 SUMMARY')
  console.log('═'.repeat(60))
  console.log(`Total locations:        ${stats.total}`)
  console.log(`${dryRun ? 'Would update' : 'Updated'}:           ${stats.updated}`)
  console.log(`  - Suburbs added:      ${stats.suburbsAdded}`)
  console.log(`  - Slugs changed:      ${stats.slugsChanged}`)
  console.log(`  - Skipped (had suburb): ${stats.skipped}`)
  console.log(`Failed:                 ${stats.failed}`)

  // Print failures if any
  if (failures.length > 0) {
    console.log('\n' + '─'.repeat(60))
    console.log('❌ FAILURES')
    console.log('─'.repeat(60))
    failures.forEach((failure) => {
      console.log(`\n📍 ${failure.name} (${failure.id})`)
      console.log(`   Error: ${failure.error}`)
    })
  }

  // Print sample of changes
  const changes = results.filter(
    (r) => r.success && (r.newSuburb !== r.oldSuburb || r.newSlug !== r.oldSlug)
  )

  if (changes.length > 0) {
    console.log('\n' + '─'.repeat(60))
    console.log('📝 SAMPLE CHANGES (first 10)')
    console.log('─'.repeat(60))
    changes.slice(0, 10).forEach((change) => {
      console.log(`\n📍 ${change.name}`)
      if (change.newSuburb !== change.oldSuburb) {
        console.log(`   Suburb:  ${change.oldSuburb || '(none)'} → ${change.newSuburb || '(none)'}`)
      }
      if (change.newSlug !== change.oldSlug) {
        console.log(`   Slug:    ${change.oldSlug || '(none)'}`)
        console.log(`            → ${change.newSlug || '(none)'}`)
      }
    })
  }

  // Print next steps
  console.log('\n' + '═'.repeat(60))
  if (dryRun && stats.updated > 0) {
    console.log('💡 Next steps:')
    console.log('   1. Review the changes above')
    console.log('   2. Run without --dry-run to apply changes:')
    console.log('      npx ts-node scripts/backfill-suburbs-and-slugs.ts')
  } else if (!dryRun && stats.updated > 0) {
    console.log('✅ Migration complete!')
    console.log('   All suburbs and slugs have been updated.')
  } else {
    console.log('ℹ️  No changes needed.')
  }

  // Print resume instruction if there were failures
  if (failures.length > 0 && failures.length < stats.total) {
    const lastSuccessId = results.filter((r) => r.success).pop()?.id
    if (lastSuccessId) {
      console.log('\n💡 To resume from where you left off:')
      console.log(`   npx ts-node scripts/backfill-suburbs-and-slugs.ts --resume-from=${lastSuccessId}`)
    }
  }

  console.log('═'.repeat(60))
}

// ================================================================
// Command Line Interface
// ================================================================

function parseArgs(): { dryRun: boolean; resumeFromId?: string } {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const resumeArg = args.find((arg) => arg.startsWith('--resume-from='))
  const resumeFromId = resumeArg ? resumeArg.split('=')[1] : undefined

  return { dryRun, resumeFromId }
}

// Run the script
const { dryRun, resumeFromId } = parseArgs()
backfillSuburbsAndSlugs(dryRun, resumeFromId).catch((error) => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
