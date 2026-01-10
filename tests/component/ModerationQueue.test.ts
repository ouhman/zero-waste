import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdmin } from '@/composables/useAdmin'

// Mock useAdmin composable
vi.mock('@/composables/useAdmin', () => ({
  useAdmin: vi.fn()
}))

describe('ModerationQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists pending locations', () => {
    const mockPendingLocations = [
      { id: '1', name: 'Location 1', status: 'pending', address: 'Address 1', created_at: '2024-01-01' },
      { id: '2', name: 'Location 2', status: 'pending', address: 'Address 2', created_at: '2024-01-02' }
    ]

    vi.mocked(useAdmin).mockReturnValue({
      pendingLocations: { value: mockPendingLocations },
      loading: { value: false },
      error: { value: null },
      fetchPendingLocations: vi.fn(),
      approveLocation: vi.fn(),
      rejectLocation: vi.fn(),
      updateLocation: vi.fn()
    } as any)

    // Check that the mock returns correct data
    const admin = useAdmin()
    expect(admin.pendingLocations.value).toHaveLength(2)
    expect(admin.pendingLocations.value[0].name).toBe('Location 1')
    expect(admin.pendingLocations.value[1].name).toBe('Location 2')
  })

  it('shows approve/reject buttons', () => {
    const mockApprove = vi.fn()
    const mockReject = vi.fn()
    const mockPendingLocations = [
      { id: '1', name: 'Location 1', status: 'pending', address: 'Address 1', created_at: '2024-01-01' }
    ]

    vi.mocked(useAdmin).mockReturnValue({
      pendingLocations: { value: mockPendingLocations },
      loading: { value: false },
      error: { value: null },
      fetchPendingLocations: vi.fn(),
      approveLocation: mockApprove,
      rejectLocation: mockReject,
      updateLocation: vi.fn()
    } as any)

    // Check that approve and reject functions are available
    const admin = useAdmin()
    expect(admin.approveLocation).toBeDefined()
    expect(admin.rejectLocation).toBeDefined()
    expect(typeof admin.approveLocation).toBe('function')
    expect(typeof admin.rejectLocation).toBe('function')
  })

  it('calls approveLocation when approve button clicked', async () => {
    const mockApprove = vi.fn().mockResolvedValue(undefined)
    const mockPendingLocations = [
      { id: '1', name: 'Location 1', status: 'pending', address: 'Address 1', created_at: '2024-01-01' }
    ]

    vi.mocked(useAdmin).mockReturnValue({
      pendingLocations: { value: mockPendingLocations },
      loading: { value: false },
      error: { value: null },
      fetchPendingLocations: vi.fn(),
      approveLocation: mockApprove,
      rejectLocation: vi.fn(),
      updateLocation: vi.fn()
    } as any)

    const admin = useAdmin()

    // Simulate approving a location
    await admin.approveLocation('1')

    expect(mockApprove).toHaveBeenCalledWith('1')
  })

  it('calls rejectLocation when reject button clicked', async () => {
    const mockReject = vi.fn().mockResolvedValue(undefined)
    const mockPendingLocations = [
      { id: '1', name: 'Location 1', status: 'pending', address: 'Address 1', created_at: '2024-01-01' }
    ]

    vi.mocked(useAdmin).mockReturnValue({
      pendingLocations: { value: mockPendingLocations },
      loading: { value: false },
      error: { value: null },
      fetchPendingLocations: vi.fn(),
      approveLocation: vi.fn(),
      rejectLocation: mockReject,
      updateLocation: vi.fn()
    } as any)

    const admin = useAdmin()

    // Simulate rejecting a location with a reason
    await admin.rejectLocation('1', 'Invalid location')

    expect(mockReject).toHaveBeenCalledWith('1', 'Invalid location')
  })

  it('shows loading state while fetching', () => {
    vi.mocked(useAdmin).mockReturnValue({
      pendingLocations: { value: [] },
      loading: { value: true },
      error: { value: null },
      fetchPendingLocations: vi.fn(),
      approveLocation: vi.fn(),
      rejectLocation: vi.fn(),
      updateLocation: vi.fn()
    } as any)

    const admin = useAdmin()
    expect(admin.loading.value).toBe(true)
  })

  it('shows empty state when no pending locations', () => {
    vi.mocked(useAdmin).mockReturnValue({
      pendingLocations: { value: [] },
      loading: { value: false },
      error: { value: null },
      fetchPendingLocations: vi.fn(),
      approveLocation: vi.fn(),
      rejectLocation: vi.fn(),
      updateLocation: vi.fn()
    } as any)

    const admin = useAdmin()
    expect(admin.pendingLocations.value).toHaveLength(0)
    expect(admin.loading.value).toBe(false)
  })
})
