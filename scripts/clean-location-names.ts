/**
 * Clean Location Names Migration
 *
 * Removes city/suburb suffixes from location names.
 * Example: "Repair Café Bockenheim" → "Repair Café"
 *
 * Usage:
 *   npx tsx scripts/clean-location-names.ts --dry-run   # Preview changes
 *   npx tsx scripts/clean-location-names.ts             # Apply changes
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const isDryRun = process.argv.includes('--dry-run')

// For dry-run, anon key is sufficient (read-only)
// For actual updates, service role key is required
const supabaseKey = supabaseServiceKey || (isDryRun ? supabaseAnonKey : null)

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables:')
  console.error('  VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  if (isDryRun) {
    console.error('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗')
    console.error('\nNote: Dry-run can use anon key, but updates require SUPABASE_SERVICE_ROLE_KEY')
  } else {
    console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
    console.error('\nNote: Updates require SUPABASE_SERVICE_ROLE_KEY (not anon key)')
  }
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Common city/suburb suffixes to remove (order matters - longer first)
const LOCATION_SUFFIXES = [
  // Frankfurt variations
  'Frankfurt am Main',
  'Frankfurt a.M.',
  'Frankfurt/Main',
  'Frankfurt',
  // Common suburbs
  'Bockenheim',
  'Bornheim',
  'Nordend',
  'Sachsenhausen',
  'Ostend',
  'Westend',
  'Gallus',
  'Rödelheim',
  'Höchst',
  'Niederrad',
  'Oberrad',
  'Fechenheim',
  'Seckbach',
  'Riederwald',
  'Griesheim',
  'Nied',
  'Sindlingen',
  'Zeilsheim',
  'Unterliederbach',
  'Sossenheim',
  'Praunheim',
  'Heddernheim',
  'Niederursel',
  'Ginnheim',
  'Dornbusch',
  'Eckenheim',
  'Preungesheim',
  'Bonames',
  'Berkersheim',
  'Harheim',
  'Nieder-Erlenbach',
  'Kalbach-Riedberg',
  'Nieder-Eschbach',
  // Nearby cities
  'Bad Homburg',
  'Eschborn',
  'Offenbach',
  'Oberursel',
  'Kronberg',
  'Neu-Isenburg',
  'Dreieich',
  'Langen',
  'Hanau',
  'Bad Vilbel',
  'Friedberg',
  'Karben',
  'Maintal',
  'Mühlheim',
  'Dietzenbach',
  'Rodgau',
  'Darmstadt',
  'Wiesbaden',
  'Mainz',
]

interface Location {
  id: string
  name: string
  city: string
  address: string
}

interface CleanResult {
  id: string
  oldName: string
  newName: string
  removedSuffix: string
}

function cleanLocationName(name: string, city: string): { cleanedName: string; removedSuffix: string | null } {
  let cleanedName = name.trim()
  let removedSuffix: string | null = null

  // Also check the city from the database
  const suffixesToCheck = [...LOCATION_SUFFIXES]
  if (city && !suffixesToCheck.includes(city)) {
    // Add city at the beginning (higher priority)
    suffixesToCheck.unshift(city)
  }

  // Try to remove each suffix (case-insensitive)
  for (const suffix of suffixesToCheck) {
    // Check if name ends with suffix (with optional separators before it)
    const patterns = [
      new RegExp(`\\s*\\|\\s*${escapeRegex(suffix)}\\s*$`, 'i'), // "Name | Frankfurt"
      new RegExp(`\\s*-\\s*${escapeRegex(suffix)}\\s*$`, 'i'),   // "Name - Frankfurt"
      new RegExp(`\\s*,\\s*${escapeRegex(suffix)}\\s*$`, 'i'),   // "Name, Frankfurt"
      new RegExp(`\\s+${escapeRegex(suffix)}\\s*$`, 'i'),        // "Name Frankfurt"
    ]

    for (const pattern of patterns) {
      if (pattern.test(cleanedName)) {
        const newName = cleanedName.replace(pattern, '').trim()
        // Only accept if we still have a meaningful name (at least 2 chars)
        if (newName.length >= 2) {
          cleanedName = newName
          removedSuffix = suffix
          break
        }
      }
    }

    if (removedSuffix) break
  }

  // Clean up any trailing separators left over (|, -, ,)
  cleanedName = cleanedName.replace(/\s*[\|,\-]\s*$/, '').trim()

  return { cleanedName, removedSuffix }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function main() {
  const verbose = process.argv.includes('--verbose')

  console.log('🧹 Location Name Cleanup Script')
  console.log('================================')
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE (will update database)'}`)
  console.log('')

  // Fetch all locations
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, city, address')
    .order('name')

  if (error) {
    console.error('Error fetching locations:', error.message)
    process.exit(1)
  }

  if (!locations || locations.length === 0) {
    console.log('No locations found.')
    process.exit(0)
  }

  console.log(`Found ${locations.length} locations\n`)

  // Process each location
  const changes: CleanResult[] = []
  const unchanged: Location[] = []

  for (const location of locations as Location[]) {
    const { cleanedName, removedSuffix } = cleanLocationName(location.name, location.city)

    if (removedSuffix && cleanedName !== location.name) {
      changes.push({
        id: location.id,
        oldName: location.name,
        newName: cleanedName,
        removedSuffix,
      })
    } else {
      unchanged.push(location)
    }
  }

  // Report changes
  if (changes.length === 0) {
    console.log('✅ No location names need cleaning!')
    return
  }

  console.log(`📝 Found ${changes.length} names to clean:\n`)
  console.log('─'.repeat(80))

  for (const change of changes) {
    console.log(`  "${change.oldName}"`)
    console.log(`  → "${change.newName}"  (removed: "${change.removedSuffix}")`)
    console.log('')
  }

  console.log('─'.repeat(80))
  console.log(`\nSummary: ${changes.length} to update, ${unchanged.length} unchanged`)

  if (verbose) {
    console.log('\nUnchanged locations:')
    for (const loc of unchanged) {
      console.log(`  - ${loc.name}`)
    }
  }

  // Apply changes if not dry run
  if (!isDryRun) {
    console.log('\n🔄 Applying changes...\n')

    let successCount = 0
    let errorCount = 0

    for (const change of changes) {
      const { error: updateError } = await supabase
        .from('locations')
        .update({ name: change.newName })
        .eq('id', change.id)

      if (updateError) {
        console.error(`  ✗ Failed to update "${change.oldName}": ${updateError.message}`)
        errorCount++
      } else {
        console.log(`  ✓ Updated: "${change.oldName}" → "${change.newName}"`)
        successCount++
      }
    }

    console.log('\n' + '═'.repeat(80))
    console.log(`✅ Complete: ${successCount} updated, ${errorCount} errors`)
  } else {
    console.log('\n💡 Run without --dry-run to apply these changes')
  }
}

main().catch(console.error)
