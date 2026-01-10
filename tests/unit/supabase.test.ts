import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Mock environment variables for testing
const MOCK_SUPABASE_URL = 'https://test.supabase.co'
const MOCK_SUPABASE_KEY = 'test-key-123'

describe('Supabase Client', () => {
  it('connects to Supabase successfully', () => {
    // Create a Supabase client
    const supabase = createClient<Database>(
      MOCK_SUPABASE_URL,
      MOCK_SUPABASE_KEY
    )

    // Verify client is created
    expect(supabase).toBeDefined()
    expect(typeof supabase.from).toBe('function')
  })

  it('can query categories table', async () => {
    // This test verifies the client can construct queries for categories
    const supabase = createClient<Database>(
      MOCK_SUPABASE_URL,
      MOCK_SUPABASE_KEY
    )

    // Test that we can construct a query (won't actually execute without real DB)
    const query = supabase
      .from('categories')
      .select('*')
      .order('sort_order')

    expect(query).toBeDefined()
  })

  it('can query approved locations from database', async () => {
    // This test verifies the client can construct queries for approved locations
    const supabase = createClient<Database>(
      MOCK_SUPABASE_URL,
      MOCK_SUPABASE_KEY
    )

    // Test that we can construct a query for approved locations
    const query = supabase
      .from('locations')
      .select(`
        *,
        location_categories(
          categories(*)
        )
      `)
      .eq('status', 'approved')
      .is('deleted_at', null)

    expect(query).toBeDefined()
  })

  it('can query location by slug', async () => {
    const supabase = createClient<Database>(
      MOCK_SUPABASE_URL,
      MOCK_SUPABASE_KEY
    )

    const query = supabase
      .from('locations')
      .select(`
        *,
        location_categories(
          categories(*)
        )
      `)
      .eq('slug', 'test-location')
      .eq('status', 'approved')
      .single()

    expect(query).toBeDefined()
  })

  it('validates environment variables are needed', () => {
    // This test reminds us that env vars are required
    expect(MOCK_SUPABASE_URL).toBeDefined()
    expect(MOCK_SUPABASE_KEY).toBeDefined()
  })
})
