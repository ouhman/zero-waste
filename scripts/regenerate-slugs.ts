#!/usr/bin/env npx ts-node
/**
 * Migration script: Regenerate all location slugs
 *
 * This script:
 * 1. Fetches all locations from Supabase
 * 2. Generates new slugs using the fixed slug utility
 * 3. Updates each location with the new slug
 *
 * Usage:
 *   npx ts-node scripts/regenerate-slugs.ts
 *
 * Or with dry-run (just shows what would change):
 *   npx ts-node scripts/regenerate-slugs.ts --dry-run
 *
 * Environment:
 *   Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 *   (Service role key is needed to bypass RLS)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Inline the slug generation logic to avoid module resolution issues
// This is identical to src/utils/slug.ts

const GERMAN_REPLACEMENTS: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
  Ä: 'ae',
  Ö: 'oe',
  Ü: 'ue',
}

function slugify(text: string): string {
  let result = text

  for (const [char, replacement] of Object.entries(GERMAN_REPLACEMENTS)) {
    result = result.split(char).join(replacement)
  }

  result = result.toLowerCase()
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  result = result.replace(/[^a-z0-9]+/g, '-')
  result = result.replace(/^-+|-+$/g, '')

  return result
}

function generateRandomSuffix(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateSlug(name: string, city: string): string {
  const slugifiedName = slugify(name)
  const slugifiedCity = slugify(city)

  // Avoid city duplication if name already ends with the city
  let base: string
  if (slugifiedCity && slugifiedName.endsWith(slugifiedCity)) {
    base = slugifiedName
  } else if (slugifiedCity) {
    base = `${slugifiedName}-${slugifiedCity}`
  } else {
    base = slugifiedName
  }

  const suffix = generateRandomSuffix()
  return `${base}-${suffix}`
}

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials')
  console.error('Required: SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface Location {
  id: string
  name: string
  city: string | null
  slug: string | null
}

async function regenerateSlugs(dryRun: boolean): Promise<void> {
  console.log(dryRun ? '🔍 DRY RUN - No changes will be made\n' : '🚀 Starting slug regeneration...\n')

  // Fetch all locations
  const { data: locations, error: fetchError } = await supabase
    .from('locations')
    .select('id, name, city, slug')
    .order('name')

  if (fetchError) {
    console.error('Error fetching locations:', fetchError.message)
    process.exit(1)
  }

  if (!locations || locations.length === 0) {
    console.log('No locations found.')
    return
  }

  console.log(`Found ${locations.length} locations to process\n`)

  let updated = 0
  let failed = 0
  let skipped = 0

  for (const location of locations as Location[]) {
    const city = location.city || 'Frankfurt'
    const newSlug = generateSlug(location.name, city)
    const oldSlug = location.slug || '(none)'

    // Check if slug actually changed (ignoring the random suffix)
    const oldBase = oldSlug.split('-').slice(0, -1).join('-')
    const newBase = newSlug.split('-').slice(0, -1).join('-')
    const slugChanged = oldBase !== newBase

    if (!slugChanged) {
      skipped++
      continue
    }

    console.log(`📍 ${location.name}`)
    console.log(`   Old: ${oldSlug}`)
    console.log(`   New: ${newSlug}`)

    if (!dryRun) {
      const { error: updateError } = await supabase
        .from('locations')
        .update({ slug: newSlug })
        .eq('id', location.id)

      if (updateError) {
        console.log(`   ❌ Error: ${updateError.message}`)
        failed++
      } else {
        console.log(`   ✅ Updated`)
        updated++
      }
    } else {
      console.log(`   📝 Would update`)
      updated++
    }
    console.log('')
  }

  console.log('─'.repeat(50))
  console.log(`\n📊 Summary:`)
  console.log(`   Total locations: ${locations.length}`)
  console.log(`   ${dryRun ? 'Would update' : 'Updated'}: ${updated}`)
  console.log(`   Skipped (unchanged): ${skipped}`)
  if (failed > 0) {
    console.log(`   Failed: ${failed}`)
  }

  if (dryRun && updated > 0) {
    console.log(`\n💡 Run without --dry-run to apply changes`)
  }
}

// Parse command line arguments
const dryRun = process.argv.includes('--dry-run')

regenerateSlugs(dryRun).catch(console.error)
