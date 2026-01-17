// Fixture management - seed and cleanup test data

import { testSupabase } from '../helpers/supabase'
import { TEST_ADMIN, TEST_LOCATION, TEST_CATEGORY } from './test-data'
import type { Database } from '../../../../src/types/database'

// Re-export testSupabase for convenience
export { testSupabase }

type LocationRow = Database['public']['Tables']['locations']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

/**
 * Create test admin user if not exists
 * Set admin role in user metadata
 */
export async function seedTestAdmin(): Promise<string> {
  // Check if user already exists
  const { data: users } = await testSupabase.auth.admin.listUsers()
  const existingUser = users?.users.find(u => u.email === TEST_ADMIN.email)

  if (existingUser) {
    // Update metadata and password to ensure admin role is set
    const { error: updateError } = await testSupabase.auth.admin.updateUserById(
      existingUser.id,
      {
        password: TEST_ADMIN.password,
        user_metadata: { role: 'admin' },
      }
    )

    if (updateError) {
      throw new Error(`Failed to update test admin: ${updateError.message}`)
    }

    console.log(`Test admin already exists: ${TEST_ADMIN.email}`)
    return existingUser.id
  }

  // Create new admin user with password
  const { data, error } = await testSupabase.auth.admin.createUser({
    email: TEST_ADMIN.email,
    password: TEST_ADMIN.password,
    email_confirm: true,
    user_metadata: { role: 'admin' },
  })

  if (error) {
    throw new Error(`Failed to create test admin: ${error.message}`)
  }

  console.log(`Test admin created: ${TEST_ADMIN.email}`)
  return data.user.id
}

/**
 * Insert test location with all fields populated (or reset existing one)
 * Returns location ID for later reference
 */
export async function seedTestLocation(): Promise<string> {
  // First, get a category to link to
  const { data: categories } = await testSupabase
    .from('categories')
    .select('id')
    .limit(1)
    .single()

  if (!categories) {
    throw new Error('No categories found. Cannot create test location without a category.')
  }

  // Clean up any existing test locations first (handles slug conflicts from previous runs)
  // This catches locations where the name was modified by a test but slug remained
  const { data: existingLocations } = await testSupabase
    .from('locations')
    .select('id')
    .or('name.ilike.E2E Test%,slug.ilike.e2e-test-%')

  if (existingLocations && existingLocations.length > 0) {
    const existingIds = existingLocations.map(l => (l as any).id as string)

    // Delete junction records first
    await testSupabase
      .from('location_categories')
      .delete()
      .in('location_id', existingIds)

    // Delete locations
    await testSupabase
      .from('locations')
      .delete()
      .in('id', existingIds)

    console.log(`Cleaned up ${existingIds.length} existing test location(s)`)
  }

  // Insert new location
  const { data, error } = await testSupabase
    .from('locations')
    // @ts-ignore - Using service role key, type inference may be incorrect
    .insert([{
      name: TEST_LOCATION.name,
      address: TEST_LOCATION.address,
      city: TEST_LOCATION.city,
      suburb: TEST_LOCATION.suburb,
      postal_code: TEST_LOCATION.postal_code,
      latitude: TEST_LOCATION.latitude,
      longitude: TEST_LOCATION.longitude,
      description_de: TEST_LOCATION.description_de,
      description_en: TEST_LOCATION.description_en,
      website: TEST_LOCATION.website,
      phone: TEST_LOCATION.phone,
      email: TEST_LOCATION.email,
      instagram: TEST_LOCATION.instagram,
      status: TEST_LOCATION.status,
      payment_methods: TEST_LOCATION.payment_methods as any,
      opening_hours_osm: TEST_LOCATION.opening_hours_osm,
      opening_hours_structured: TEST_LOCATION.opening_hours_structured as any,
    }])
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to seed test location: ${error?.message || 'No data returned'}`)
  }

  // Link to category
  await testSupabase
    .from('location_categories')
    // @ts-ignore - Using service role key
    .insert([{
      location_id: (data as any).id as string,
      category_id: (categories as any).id as string,
    }])

  console.log(`Test location created: ${TEST_LOCATION.name} (${(data as any).id})`)
  return (data as any).id as string
}

/**
 * Insert test category (or return existing one)
 * Returns category ID
 */
export async function seedTestCategory(): Promise<string> {
  // Check if category already exists
  const { data: existing } = await testSupabase
    .from('categories')
    .select('id')
    .eq('slug', TEST_CATEGORY.slug)
    .single()

  if (existing) {
    console.log(`Test category already exists: ${TEST_CATEGORY.name_de} (${(existing as any).id})`)
    return (existing as any).id as string
  }

  const { data, error } = await testSupabase
    .from('categories')
    // @ts-ignore - Using service role key
    .insert([{
      name_de: TEST_CATEGORY.name_de,
      name_en: TEST_CATEGORY.name_en,
      slug: TEST_CATEGORY.slug,
      description_de: TEST_CATEGORY.description_de,
      description_en: TEST_CATEGORY.description_en,
      sort_order: TEST_CATEGORY.sort_order,
      icon_name: TEST_CATEGORY.icon_name,
      color: TEST_CATEGORY.color,
    }])
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to seed test category: ${error?.message || 'No data returned'}`)
  }

  console.log(`Test category created: ${TEST_CATEGORY.name_de} (${(data as any).id})`)
  return (data as any).id as string
}

/**
 * Delete all test data (prefix: 'e2e-test-' or 'E2E Test')
 * Order matters due to foreign keys
 */
export async function cleanupTestData(): Promise<void> {
  console.log('Cleaning up test data...')

  // Get all test location IDs first
  const { data: testLocations } = await testSupabase
    .from('locations')
    .select('id')
    .or('name.ilike.E2E Test%,name.ilike.e2e-%')

  const testLocationIds = (testLocations?.map(l => (l as any).id as string) || []) as string[]

  // Delete location_categories junction records first
  if (testLocationIds.length > 0) {
    await testSupabase
      .from('location_categories')
      .delete()
      .in('location_id', testLocationIds)
  }

  // Delete locations
  const { error: locationsError } = await testSupabase
    .from('locations')
    .delete()
    .or('name.ilike.E2E Test%,name.ilike.e2e-%')

  if (locationsError && !locationsError.message.includes('No rows found')) {
    console.error(`Failed to cleanup locations: ${locationsError.message}`)
  }

  // Delete categories
  const { error: categoriesError } = await testSupabase
    .from('categories')
    .delete()
    .or('slug.ilike.e2e-%,name_de.ilike.E2E Test%')

  if (categoriesError && !categoriesError.message.includes('No rows found')) {
    console.error(`Failed to cleanup categories: ${categoriesError.message}`)
  }

  // Cleanup storage (category icons)
  const { data: files } = await testSupabase.storage
    .from('category-icons')
    .list('', { search: 'e2e-' })

  if (files && files.length > 0) {
    await testSupabase.storage
      .from('category-icons')
      .remove(files.map(f => f.name))
  }

  console.log('Test data cleaned up')
}

/**
 * Fetch location with all related data for assertions
 */
export async function getLocationById(id: string): Promise<LocationRow | null> {
  const { data, error } = await testSupabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    throw new Error(`Failed to fetch location: ${error.message}`)
  }

  return data
}

/**
 * Fetch category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const { data, error } = await testSupabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    throw new Error(`Failed to fetch category: ${error.message}`)
  }

  return data
}

/**
 * Fetch category by ID
 */
export async function getCategoryById(id: string): Promise<CategoryRow | null> {
  const { data, error } = await testSupabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    throw new Error(`Failed to fetch category: ${error.message}`)
  }

  return data
}

/**
 * Delete a single location by ID
 * Cleans up junction table first
 */
export async function cleanupLocation(id: string): Promise<void> {
  // Delete location_categories junction records first
  await testSupabase
    .from('location_categories')
    .delete()
    .eq('location_id', id)

  // Delete the location
  const { error } = await testSupabase
    .from('locations')
    .delete()
    .eq('id', id)

  if (error && !error.message.includes('No rows found')) {
    console.error(`Failed to cleanup location ${id}: ${error.message}`)
  }
}

/**
 * Delete a single category by ID
 * Cleans up junction table and storage icon if exists
 */
export async function cleanupCategory(id: string): Promise<void> {
  // Get category to check for icon
  const category = await getCategoryById(id)

  // Delete icon from storage if it exists
  if (category?.icon_url) {
    const url = new URL(category.icon_url)
    const pathMatch = url.pathname.match(/category-icons\/(.+)$/)
    if (pathMatch) {
      await testSupabase.storage
        .from('category-icons')
        .remove([pathMatch[1]])
        .catch(() => {
          // Ignore errors when deleting icon
        })
    }
  }

  // Delete the category
  const { error } = await testSupabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error && !error.message.includes('No rows found')) {
    console.error(`Failed to cleanup category ${id}: ${error.message}`)
  }
}
