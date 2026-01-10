import { describe, test, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAdminStore } from '@/stores/admin'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  }
}))

describe('useAdminStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('computed properties', () => {
    test('filters locations by status', () => {
      const store = useAdminStore()

      store.locations = [
        { id: '1', status: 'pending', name: 'Location 1' } as any,
        { id: '2', status: 'approved', name: 'Location 2' } as any,
        { id: '3', status: 'rejected', name: 'Location 3' } as any,
        { id: '4', status: 'pending', name: 'Location 4' } as any
      ]

      expect(store.pendingLocations).toHaveLength(2)
      expect(store.approvedLocations).toHaveLength(1)
      expect(store.rejectedLocations).toHaveLength(1)
    })

    test('calculates stats correctly', () => {
      const store = useAdminStore()

      store.locations = [
        { id: '1', status: 'pending' } as any,
        { id: '2', status: 'approved' } as any,
        { id: '3', status: 'rejected' } as any,
        { id: '4', status: 'pending' } as any
      ]

      expect(store.stats).toEqual({
        pending: 2,
        approved: 1,
        rejected: 1,
        total: 4
      })
    })
  })

  describe('fetchLocations', () => {
    test('fetches all locations without status filter', async () => {
      const mockData = [
        { id: '1', name: 'Test Location', status: 'pending' }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        eq: vi.fn().mockReturnThis()
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const store = useAdminStore()
      await store.fetchLocations()

      expect(supabase.from).toHaveBeenCalledWith('locations')
      expect(mockQuery.select).toHaveBeenCalledWith(`
          *,
          location_categories(category_id)
        `)
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null)
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(store.locations).toEqual(mockData)
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    test('fetches locations with status filter', async () => {
      const mockData = [
        { id: '1', name: 'Test Location', status: 'pending' }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const store = useAdminStore()
      await store.fetchLocations('pending')

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'pending')
    })

    test('handles fetch error', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const store = useAdminStore()
      await store.fetchLocations()

      expect(store.error).toBe('Fetch failed')
      expect(store.loading).toBe(false)
    })
  })

  describe('updateLocation', () => {
    test('updates location and refetches data', async () => {
      const mockUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      }

      const mockFetch = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockUpdate as any)
        .mockReturnValueOnce(mockFetch as any)

      const store = useAdminStore()
      await store.updateLocation('123', { name: 'Updated Name' })

      expect(mockUpdate.update).toHaveBeenCalledWith({
        name: 'Updated Name',
        updated_at: expect.any(String)
      })
      expect(mockUpdate.eq).toHaveBeenCalledWith('id', '123')
      expect(store.loading).toBe(false)
    })

    test('updates location with categories', async () => {
      const mockUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      }

      const mockDelete = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      }

      const mockInsert = {
        insert: vi.fn().mockResolvedValue({ error: null })
      }

      const mockFetch = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockUpdate as any)
        .mockReturnValueOnce(mockDelete as any)
        .mockReturnValueOnce(mockInsert as any)
        .mockReturnValueOnce(mockFetch as any)

      const store = useAdminStore()
      await store.updateLocation('123', { name: 'Updated' }, ['cat1', 'cat2'])

      expect(mockDelete.delete).toHaveBeenCalled()
      expect(mockDelete.eq).toHaveBeenCalledWith('location_id', '123')
      expect(mockInsert.insert).toHaveBeenCalledWith([
        { location_id: '123', category_id: 'cat1' },
        { location_id: '123', category_id: 'cat2' }
      ])
    })

    test('handles update error', async () => {
      const mockUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') })
      }

      vi.mocked(supabase.from).mockReturnValue(mockUpdate as any)

      const store = useAdminStore()

      await expect(store.updateLocation('123', { name: 'Test' })).rejects.toThrow()
      expect(store.error).toBe('Update failed')
    })
  })

  describe('approveLocation', () => {
    test('approves location with user ID', async () => {
      const mockUser = { id: 'user123' }
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: mockUser } } as any)

      const mockUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      }

      const mockFetch = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockUpdate as any)
        .mockReturnValueOnce(mockFetch as any)

      const store = useAdminStore()
      await store.approveLocation('123')

      expect(mockUpdate.update).toHaveBeenCalledWith({
        status: 'approved',
        approved_by: 'user123',
        updated_at: expect.any(String)
      })
    })
  })

  describe('rejectLocation', () => {
    test('rejects location with reason', async () => {
      const mockUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      }

      const mockFetch = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockUpdate as any)
        .mockReturnValueOnce(mockFetch as any)

      const store = useAdminStore()
      await store.rejectLocation('123', 'Invalid data')

      expect(mockUpdate.update).toHaveBeenCalledWith({
        status: 'rejected',
        rejection_reason: 'Invalid data',
        updated_at: expect.any(String)
      })
    })
  })
})
