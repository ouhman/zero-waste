#!/usr/bin/env npx ts-node
/**
 * Verification script: Verify Bücherschränke import
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
  console.log('🔍 Verifying Bücherschränke import...\n')

  // Count total
  const { data: locations, error: countError } = await supabase
    .from('locations')
    .select('id, name, slug, status, suburb, address')
    .eq('status', 'approved')

  if (countError) {
    console.error('Error querying locations:', countError.message)
    process.exit(1)
  }

  // Count with category
  const { data: withCategory, error: catError } = await supabase
    .from('location_categories')
    .select('location_id')
    .eq('category_id', CATEGORY_ID)

  if (catError) {
    console.error('Error querying categories:', catError.message)
    process.exit(1)
  }

  console.log('📊 Database Statistics:')
  console.log(`   Total approved locations: ${locations?.length || 0}`)
  console.log(`   Locations with Bücherschrank category: ${withCategory?.length || 0}`)

  // Get sample locations
  const { data: samples, error: sampleError } = await supabase
    .from('locations')
    .select('id, name, slug, status, suburb, address, latitude, longitude')
    .in(
      'id',
      (withCategory || []).slice(0, 5).map((c) => c.location_id)
    )

  if (sampleError) {
    console.error('Error fetching samples:', sampleError.message)
    process.exit(1)
  }

  if (samples && samples.length > 0) {
    console.log('\n📝 Sample Locations (first 5):')
    samples.forEach((loc, idx) => {
      console.log(`\n${idx + 1}. ${loc.name}`)
      console.log(`   Slug: ${loc.slug}`)
      console.log(`   Address: ${loc.address}`)
      console.log(`   Suburb: ${loc.suburb || '(none)'}`)
      console.log(`   Coordinates: ${loc.latitude}, ${loc.longitude}`)
      console.log(`   Status: ${loc.status}`)
    })
  }

  console.log('\n✅ Verification complete!')
}

verify().catch(console.error)
