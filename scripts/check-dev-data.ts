#!/usr/bin/env tsx
/**
 * Check DEV data counts
 */

import { createClient } from '@supabase/supabase-js'

// DEV credentials from .env
const DEV_URL = 'https://lccpndhssuemudzpfvvg.supabase.co'
const DEV_SERVICE_KEY = process.env.DEV_SUPABASE_SERVICE_KEY || ''

if (!DEV_SERVICE_KEY) {
  console.error('Error: DEV_SUPABASE_SERVICE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(DEV_URL, DEV_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkData() {
  console.log('=== Checking DEV Data ===\n')

  // Categories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*', { count: 'exact' })

  if (catError) {
    console.error('Error fetching categories:', catError)
  } else {
    console.log(`Categories: ${categories?.length || 0}`)
  }

  // Approved locations only
  const { data: locations, count: locCount, error: locError } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')

  if (locError) {
    console.error('Error fetching locations:', locError)
  } else {
    console.log(`Approved locations: ${locCount || 0}`)
  }

  // Location categories for approved locations
  const { data: lc, error: lcError } = await supabase
    .from('location_categories')
    .select('location_id, category_id, locations!inner(status)')
    .eq('locations.status', 'approved')

  if (lcError) {
    console.error('Error fetching location_categories:', lcError)
  } else {
    console.log(`Location-categories (approved): ${lc?.length || 0}`)
  }
}

checkData().catch(console.error)
