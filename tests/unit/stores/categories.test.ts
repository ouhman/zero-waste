import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCategoriesStore } from '@/stores/categories'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn()
    }
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

  describe('Admin methods', () => {
    it('uploads icon successfully', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
      const mockPublicUrl = 'https://storage.supabase.co/category-icons/test-123.png'

      const mockStorage = vi.mocked(supabase.storage.from)
      mockStorage.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: mockPublicUrl } })
      } as any)

      const store = useCategoriesStore()
      const url = await store.uploadIcon('test', mockFile)

      expect(url).toBe(mockPublicUrl)
    })

    it('rejects non-PNG files', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const store = useCategoriesStore()

      await expect(store.uploadIcon('test', mockFile)).rejects.toThrow('Only PNG files are allowed')
    })

    it('creates category with icon', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
      const mockPublicUrl = 'https://storage.supabase.co/category-icons/test-123.png'
      const mockCategory = {
        id: '1',
        slug: 'test',
        name_de: 'Test',
        name_en: 'Test',
        icon: null,
        color: '#000000',
        sort_order: 1,
        created_at: '2024-01-01',
        icon_url: mockPublicUrl,
        description_de: null,
        description_en: null,
        updated_at: '2024-01-01'
      }

      const mockStorage = vi.mocked(supabase.storage.from)
      mockStorage.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: mockPublicUrl } })
      } as any)

      const mockSupabase = vi.mocked(supabase.from)
      mockSupabase.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCategory, error: null })
          })
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [mockCategory], error: null })
        })
      } as any)

      const store = useCategoriesStore()
      const result = await store.createCategory({
        name_de: 'Test',
        name_en: 'Test',
        slug: 'test',
        color: '#000000',
        sort_order: 1
      }, mockFile)

      expect(result.icon_url).toBe(mockPublicUrl)
    })

    it('updates category with new icon', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
      const oldIconUrl = 'https://storage.supabase.co/category-icons/old-123.png'
      const newIconUrl = 'https://storage.supabase.co/category-icons/new-456.png'

      const existingCategory = {
        id: '1',
        slug: 'test',
        name_de: 'Test',
        name_en: 'Test',
        icon: null,
        color: '#000000',
        sort_order: 1,
        created_at: '2024-01-01',
        icon_url: oldIconUrl,
        description_de: null,
        description_en: null,
        updated_at: '2024-01-01'
      }

      const updatedCategory = { ...existingCategory, icon_url: newIconUrl }

      const mockStorage = vi.mocked(supabase.storage.from)
      mockStorage.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: newIconUrl } }),
        remove: vi.fn().mockResolvedValue({ error: null })
      } as any)

      const mockSupabase = vi.mocked(supabase.from)
      mockSupabase.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedCategory, error: null })
            })
          })
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [updatedCategory], error: null })
        })
      } as any)

      const store = useCategoriesStore()
      store.categories = [existingCategory]

      const result = await store.updateCategory('1', { name_de: 'Updated' }, mockFile)

      expect(result.icon_url).toBe(newIconUrl)
    })

    it('deletes category and reassigns locations', async () => {
      const categoryToDelete = {
        id: '1',
        slug: 'test',
        name_de: 'Test',
        name_en: 'Test',
        icon: null,
        color: '#000000',
        sort_order: 1,
        created_at: '2024-01-01',
        icon_url: 'https://storage.supabase.co/category-icons/test-123.png',
        description_de: null,
        description_en: null,
        updated_at: '2024-01-01'
      }

      const mockStorage = vi.mocked(supabase.storage.from)
      mockStorage.mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null })
      } as any)

      const mockSupabase = vi.mocked(supabase.from)
      mockSupabase.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      } as any)

      const store = useCategoriesStore()
      store.categories = [categoryToDelete]

      await store.deleteCategory('1', '2')

      expect(mockSupabase).toHaveBeenCalledWith('location_categories')
    })

    it('prevents deletion of "andere" category', async () => {
      const andereCategory = {
        id: '1',
        slug: 'andere',
        name_de: 'Sonstiges',
        name_en: 'Other',
        icon: null,
        color: '#000000',
        sort_order: 99,
        created_at: '2024-01-01',
        icon_url: null,
        description_de: null,
        description_en: null,
        updated_at: '2024-01-01'
      }

      const store = useCategoriesStore()
      store.categories = [andereCategory]

      await expect(store.deleteCategory('1', '2')).rejects.toThrow('Cannot delete the "Other" category')
    })

    it('gets location count for category', async () => {
      const mockSupabase = vi.mocked(supabase.from)
      mockSupabase.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 5, error: null })
        })
      } as any)

      const store = useCategoriesStore()
      const count = await store.getLocationCountForCategory('1')

      expect(count).toBe(5)
    })

    it('returns 0 when location count fails', async () => {
      const mockSupabase = vi.mocked(supabase.from)
      mockSupabase.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } })
        })
      } as any)

      const store = useCategoriesStore()
      const count = await store.getLocationCountForCategory('1')

      expect(count).toBe(0)
    })
  })
})
