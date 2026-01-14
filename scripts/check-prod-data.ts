#!/usr/bin/env tsx
/**
 * Check what data already exists in PROD
 */

import { createClient } from '@supabase/supabase-js'

const PROD_URL = process.env.PROD_SUPABASE_URL || ''
const PROD_SERVICE_KEY = process.env.PROD_SUPABASE_SERVICE_KEY || ''

if (!PROD_URL || !PROD_SERVICE_KEY) {
  console.error('Error: PROD_SUPABASE_URL and PROD_SUPABASE_SERVICE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(PROD_URL, PROD_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkData() {
  console.log('=== Checking PROD Data ===\n')

  // Categories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*', { count: 'exact' })

  if (catError) {
    console.error('Error fetching categories:', catError)
  } else {
    console.log(`Categories: ${categories?.length || 0}`)
    if (categories && categories.length > 0 && categories.length < 20) {
      console.log('  Sample:', categories.slice(0, 3).map(c => c.slug).join(', '))
    }
  }

  // Locations
  const { data: locations, count: locCount, error: locError } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })

  if (locError) {
    console.error('Error fetching locations:', locError)
  } else {
    console.log(`Locations: ${locCount || 0}`)
  }

  // Location categories
  const { data: lc, count: lcCount, error: lcError } = await supabase
    .from('location_categories')
    .select('*', { count: 'exact', head: true })

  if (lcError) {
    console.error('Error fetching location_categories:', lcError)
  } else {
    console.log(`Location-categories: ${lcCount || 0}`)
  }
}

checkData().catch(console.error)
