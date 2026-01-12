import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'
import { config } from 'dotenv'

// Load environment variables from .env file
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

async function verify() {
  console.log('🔍 Verifying Bücherschrank import...\n')

  // 1. Count total locations with Bücherschrank category
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('id, slug, name_en, name_de')
    .eq('slug', 'buecherschrank')
    .single()

  if (categoryError || !categoryData) {
    console.error('❌ Category not found:', categoryError)
    return
  }

  console.log('✅ Category found:', categoryData)
  console.log()

  // 2. Count locations with this category
  const { count, error: countError } = await supabase
    .from('location_categories')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryData.id)

  if (countError) {
    console.error('❌ Error counting locations:', countError)
    return
  }

  console.log(`📊 Total Bücherschrank locations: ${count}`)
  console.log()

  // 3. Get sample locations
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      address,
      suburb,
      latitude,
      longitude,
      website,
      status,
      location_categories!inner(
        category_id
      )
    `)
    .eq('location_categories.category_id', categoryData.id)
    .limit(10)

  if (locError) {
    console.error('❌ Error fetching locations:', locError)
    return
  }

  console.log('📍 Sample locations:')
  locations?.forEach((loc, i) => {
    console.log(`\n${i + 1}. ${loc.name}`)
    console.log(`   Address: ${loc.address}`)
    console.log(`   District: ${loc.suburb || 'N/A'}`)
    console.log(`   Status: ${loc.status}`)
    console.log(`   Coordinates: ${loc.latitude}, ${loc.longitude}`)
  })

  // 4. Check specific locations from verification checklist
  console.log('\n\n🎯 Checking specific locations from checklist:')

  const checkLocations = [
    'Altstadt - Buchgasse',
    'Bockenheim - Kirchplatz',
    'Nordend-Ost - Merianplatz',
    'Sachsenhausen - Schweizer Platz',
    'Nieder-Eschbach - Ben-Gurion-Ring'
  ]

  for (const searchName of checkLocations) {
    const { data, error } = await supabase
      .from('locations')
      .select(`
        id,
        name,
        address,
        suburb,
        latitude,
        longitude,
        website,
        location_categories!inner(
          category_id
        )
      `)
      .eq('location_categories.category_id', categoryData.id)
      .ilike('name', `%${searchName}%`)
      .single()

    if (error || !data) {
      console.log(`\n❌ NOT FOUND: ${searchName}`)
    } else {
      console.log(`\n✅ FOUND: ${data.name}`)
      console.log(`   Address: ${data.address}`)
      console.log(`   District: ${data.suburb || 'N/A'}`)
      console.log(`   Coordinates: ${data.latitude}, ${data.longitude}`)
    }
  }

  console.log('\n\n✨ Verification complete!')
}

verify()
