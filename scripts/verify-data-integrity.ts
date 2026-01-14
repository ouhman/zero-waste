#!/usr/bin/env tsx
/**
 * Verify data integrity between DEV and PROD
 */

import { createClient } from '@supabase/supabase-js'

const DEV_URL = 'https://lccpndhssuemudzpfvvg.supabase.co'
const DEV_SERVICE_KEY = process.env.DEV_SUPABASE_SERVICE_KEY || ''

const PROD_URL = 'https://rivleprddnvqgigxjyuc.supabase.co'
const PROD_SERVICE_KEY = process.env.PROD_SUPABASE_SERVICE_KEY || ''

const devClient = createClient(DEV_URL, DEV_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const prodClient = createClient(PROD_URL, PROD_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function verify() {
  console.log('=== Data Integrity Verification ===\n')

  // 1. Count comparison
  console.log('1. Count Comparison')
  console.log('   ----------------')

  const devCats = await devClient.from('categories').select('*', { count: 'exact', head: true })
  const prodCats = await prodClient.from('categories').select('*', { count: 'exact', head: true })
  console.log(`   Categories: DEV=${devCats.count}, PROD=${prodCats.count} ${devCats.count === prodCats.count ? '✅' : '❌'}`)

  const devLocs = await devClient.from('locations').select('*', { count: 'exact', head: true }).eq('status', 'approved')
  const prodLocs = await prodClient.from('locations').select('*', { count: 'exact', head: true })
  console.log(`   Locations: DEV(approved)=${devLocs.count}, PROD=${prodLocs.count} ${devLocs.count === prodLocs.count ? '✅' : '❌'}`)

  const devLc = await devClient.from('location_categories').select('*, locations!inner(status)').eq('locations.status', 'approved')
  const prodLc = await prodClient.from('location_categories').select('*')
  console.log(`   Location-categories: DEV(approved)=${devLc.data?.length}, PROD=${prodLc.data?.length} ${devLc.data?.length === prodLc.data?.length ? '✅' : '❌'}`)

  // 2. Sample location check
  console.log('\n2. Sample Location Check')
  console.log('   ---------------------')

  const { data: devSample } = await devClient
    .from('locations')
    .select('name, slug, city, status')
    .eq('status', 'approved')
    .order('created_at')
    .limit(3)

  const { data: prodSample } = await prodClient
    .from('locations')
    .select('name, slug, city, status')
    .order('created_at')
    .limit(3)

  if (devSample && prodSample) {
    for (let i = 0; i < 3; i++) {
      const dev = devSample[i]
      const prod = prodSample[i]
      const match = dev?.slug === prod?.slug
      console.log(`   ${i + 1}. ${prod?.name} (${prod?.city}) ${match ? '✅' : '❌'}`)
      if (!match && dev) {
        console.log(`      DEV: ${dev.slug}, PROD: ${prod?.slug}`)
      }
    }
  }

  // 3. Check all locations are approved in PROD
  console.log('\n3. PROD Status Check')
  console.log('   ------------------')

  const { data: statuses } = await prodClient
    .from('locations')
    .select('status')

  const approvedCount = statuses?.filter(l => l.status === 'approved').length || 0
  const otherCount = statuses?.filter(l => l.status !== 'approved').length || 0

  console.log(`   Approved: ${approvedCount}`)
  console.log(`   Other: ${otherCount} ${otherCount === 0 ? '✅' : '❌ Should be 0!'}`)

  // 4. Check category slugs match
  console.log('\n4. Category Slugs Check')
  console.log('   --------------------')

  const { data: devCatSlugs } = await devClient
    .from('categories')
    .select('slug')
    .order('slug')

  const { data: prodCatSlugs } = await prodClient
    .from('categories')
    .select('slug')
    .order('slug')

  const devSlugs = devCatSlugs?.map(c => c.slug).sort() || []
  const prodSlugs = prodCatSlugs?.map(c => c.slug).sort() || []

  const slugsMatch = JSON.stringify(devSlugs) === JSON.stringify(prodSlugs)
  console.log(`   All category slugs match: ${slugsMatch ? '✅' : '❌'}`)

  if (!slugsMatch) {
    console.log('   DEV:', devSlugs.slice(0, 5).join(', '))
    console.log('   PROD:', prodSlugs.slice(0, 5).join(', '))
  }

  console.log('\n=== Verification Complete ===')
}

verify().catch(console.error)
