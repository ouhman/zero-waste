import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSearch } from '@/composables/useSearch'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn()
  }
}))

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls Supabase search_locations function', async () => {
    const mockResults = [
      { id: '1', name: 'Test Location', slug: 'test-location', address: 'Test Address', city: 'Frankfurt', postal_code: '60311', latitude: '50.1109', longitude: '8.6821', website: null, phone: null, email: null, instagram: null, opening_hours_text: null, submission_type: null, submitted_by_email: null, related_location_id: null, status: 'approved', approved_by: null, rejection_reason: null, admin_notes: null, deleted_at: null, created_at: '2024-01-01', updated_at: '2024-01-01', description_de: null, description_en: null }
    ]

    const mockSupabase = vi.mocked(supabase.rpc)
    mockSupabase.mockResolvedValue({ data: mockResults, error: null } as any)

    const { search, results } = useSearch()
    await search('test')

    expect(mockSupabase).toHaveBeenCalledWith('search_locations', { search_term: 'test' })
    expect(results.value).toHaveLength(1)
    expect(results.value[0].name).toBe('Test Location')
  })

  it('returns empty array for no matches', async () => {
    const mockSupabase = vi.mocked(supabase.rpc)
    mockSupabase.mockResolvedValue({ data: [], error: null } as any)

    const { search, results } = useSearch()
    await search('nonexistent')

    expect(results.value).toHaveLength(0)
  })

  it('handles search error gracefully', async () => {
    const mockSupabase = vi.mocked(supabase.rpc)
    mockSupabase.mockResolvedValue({ data: null, error: { message: 'Search error' } } as any)

    const { search, error } = useSearch()
    await search('test')

    expect(error.value).toBe('Search error')
  })

  it('debounces search input', async () => {
    const mockSupabase = vi.mocked(supabase.rpc)
    mockSupabase.mockResolvedValue({ data: [], error: null } as any)

    const { debouncedSearch } = useSearch()

    // Call multiple times rapidly
    debouncedSearch('a')
    debouncedSearch('ab')
    debouncedSearch('abc')

    // Wait for debounce delay (300ms)
    await new Promise(resolve => setTimeout(resolve, 350))

    // Should only call once
    expect(mockSupabase).toHaveBeenCalledTimes(1)
    expect(mockSupabase).toHaveBeenCalledWith('search_locations', { search_term: 'abc' })
  })

  it('does not search for empty string', async () => {
    const mockSupabase = vi.mocked(supabase.rpc)

    const { search, results } = useSearch()
    await search('')

    expect(mockSupabase).not.toHaveBeenCalled()
    expect(results.value).toHaveLength(0)
  })

  it('does not search for strings shorter than 2 characters', async () => {
    const mockSupabase = vi.mocked(supabase.rpc)

    const { search } = useSearch()
    await search('a')

    expect(mockSupabase).not.toHaveBeenCalled()
  })
})
