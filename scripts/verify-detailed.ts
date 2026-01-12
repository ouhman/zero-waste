#!/usr/bin/env npx ts-node
/**
 * Detailed verification: Show complete data for sample locations
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const CATEGORY_ID = '4fa43a7d-ac1b-4baa-a009-e882279f9c1c'

async function verify() {
  console.log('🔍 Detailed Verification of Bücherschränke Import\n')

  // Get a few specific locations by slug
  const slugsToCheck = [
    'buecherschrank-altstadt-buchgasse-frankfurt-am-main',
    'buecherschrank-bockenheim-kirchplatz-frankfurt-am-main',
    'kinderbuecherschrank-nieder-eschbach-ben-gurion-ring-39-frankfurt-am-main',
  ]

  for (const slug of slugsToCheck) {
    const { data: location, error } = await supabase
      .from('locations')
      .select('*, location_categories(category_id)')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error(`❌ Error fetching ${slug}:`, error.message)
      continue
    }

    if (!location) {
      console.error(`❌ Location not found: ${slug}`)
      continue
    }

    console.log('─'.repeat(80))
    console.log(`📍 ${location.name}`)
    console.log('─'.repeat(80))
    console.log(`Slug:          ${location.slug}`)
    console.log(`Status:        ${location.status}`)
    console.log(`Address:       ${location.address}`)
    console.log(`City:          ${location.city}`)
    console.log(`Suburb:        ${location.suburb || '(none)'}`)
    console.log(`Postal Code:   ${location.postal_code || '(none)'}`)
    console.log(`Coordinates:   ${location.latitude}, ${location.longitude}`)
    console.log(`Description DE: ${location.description_de || '(none)'}`)
    console.log(`Description EN: ${location.description_en || '(none)'}`)
    console.log(`Opening Hours: ${location.opening_hours_osm || '(none)'}`)
    console.log(`Website:       ${location.website || '(none)'}`)
    console.log(`Created:       ${location.created_at}`)
    console.log(`Updated:       ${location.updated_at}`)

    // Verify category link
    const hasCategory = location.location_categories.some(
      (lc: any) => lc.category_id === CATEGORY_ID
    )
    console.log(`Category Link: ${hasCategory ? '✅ Linked to Bücherschrank' : '❌ NOT linked'}`)
    console.log('')
  }

  console.log('═'.repeat(80))
  console.log('✅ Detailed verification complete!')
}

verify().catch(console.error)
