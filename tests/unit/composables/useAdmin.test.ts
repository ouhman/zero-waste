import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdmin } from '@/composables/useAdmin'
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

describe('useAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches pending locations', async () => {
    const mockLocations = [
      { id: '1', name: 'Pending Location 1', status: 'pending' },
      { id: '2', name: 'Pending Location 2', status: 'pending' }
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockLocations,
            error: null
          })
        })
      })
    } as any)

    const { fetchPendingLocations, pendingLocations, loading } = useAdmin()
    await fetchPendingLocations()

    expect(pendingLocations.value).toHaveLength(2)
    expect(pendingLocations.value[0].name).toBe('Pending Location 1')
    expect(loading.value).toBe(false)
  })

  it('approves location (status → approved)', async () => {
    // Mock auth.getUser
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: {
        user: { id: 'admin-user-1', email: 'admin@test.com' }
      },
      error: null
    } as any)

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: { id: '1', status: 'approved' },
        error: null
      })
    })

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate
    } as any)

    const { approveLocation, loading, error } = useAdmin()
    await approveLocation('1')

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'approved' })
    )
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('rejects location with reason', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: { id: '1', status: 'rejected' },
        error: null
      })
    })

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate
    } as any)

    const { rejectLocation, loading, error } = useAdmin()
    const reason = 'Invalid location'
    await rejectLocation('1', reason)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'rejected',
        rejection_reason: reason
      })
    )
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('edits location fields', async () => {
    const updatedData = {
      name: 'Updated Name',
      address: 'Updated Address'
    }

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: { id: '1', ...updatedData },
        error: null
      })
    })

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate
    } as any)

    const { updateLocation, loading, error } = useAdmin()
    await updateLocation('1', updatedData)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining(updatedData)
    )
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('handles fetch error gracefully', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })
    } as any)

    const { fetchPendingLocations, error, loading } = useAdmin()
    await fetchPendingLocations()

    expect(error.value).toBeTruthy()
    expect(loading.value).toBe(false)
  })
})
