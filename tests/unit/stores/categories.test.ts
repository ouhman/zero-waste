import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCategoriesStore } from '@/stores/categories'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

describe('Category Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches all categories', async () => {
    const mockCategories = [
      { id: '1', slug: 'unverpackt', name_de: 'Unverpackt', name_en: 'Bulk Store', icon: null, color: null, sort_order: 1, created_at: '2024-01-01' },
      { id: '2', slug: 'reparatur', name_de: 'Reparatur', name_en: 'Repair', icon: null, color: null, sort_order: 2, created_at: '2024-01-01' }
    ]

    const mockSupabase = vi.mocked(supabase.from)
    mockSupabase.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
      })
    } as any)

    const store = useCategoriesStore()
    await store.fetchCategories()

    expect(store.categories).toHaveLength(2)
    expect(store.categories[0].slug).toBe('unverpackt')
  })

  it('returns category by slug', async () => {
    const mockCategories = [
      { id: '1', slug: 'unverpackt', name_de: 'Unverpackt', name_en: 'Bulk Store', icon: null, color: null, sort_order: 1, created_at: '2024-01-01' }
    ]

    const mockSupabase = vi.mocked(supabase.from)
    mockSupabase.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
      })
    } as any)

    const store = useCategoriesStore()
    await store.fetchCategories()

    const category = store.getCategoryBySlug('unverpackt')
    expect(category).toBeDefined()
    expect(category?.name_de).toBe('Unverpackt')
  })

  it('returns undefined for non-existent slug', async () => {
    const mockSupabase = vi.mocked(supabase.from)
    mockSupabase.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      })
    } as any)

    const store = useCategoriesStore()
    await store.fetchCategories()

    const category = store.getCategoryBySlug('non-existent')
    expect(category).toBeUndefined()
  })

  it('handles fetch error gracefully', async () => {
    const mockSupabase = vi.mocked(supabase.from)
    mockSupabase.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
      })
    } as any)

    const store = useCategoriesStore()
    await store.fetchCategories()

    expect(store.error).toBe('Database error')
    expect(store.categories).toHaveLength(0)
  })
})
