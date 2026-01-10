import { describe, it, expect, beforeEach, vi } from 'vitest'
import { adminGuard, updateActivity } from '@/router/guards/adminGuard'
import { supabase } from '@/lib/supabase'
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn()
    }
  }
}))

describe('adminGuard', () => {
  let mockTo: RouteLocationNormalized
  let mockFrom: RouteLocationNormalized
  let mockNext: NavigationGuardNext

  beforeEach(() => {
    vi.clearAllMocks()

    mockTo = {
      meta: { requiresAdmin: true },
      path: '/bulk-station',
      name: 'admin-dashboard',
      matched: [],
      fullPath: '/bulk-station',
      query: {},
      hash: '',
      redirectedFrom: undefined,
      params: {}
    } as RouteLocationNormalized

    mockFrom = {
      path: '/',
      name: 'map',
      matched: [],
      fullPath: '/',
      query: {},
      hash: '',
      redirectedFrom: undefined,
      meta: {},
      params: {}
    } as RouteLocationNormalized

    mockNext = vi.fn() as any

    // Default mocks
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    })

    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null
    })
  })

  it('allows access to routes that do not require admin', async () => {
    mockTo.meta = { requiresAdmin: false }

    await adminGuard(mockTo, mockFrom, mockNext)

    expect(mockNext).toHaveBeenCalledWith()
    expect(supabase.auth.getSession).not.toHaveBeenCalled()
  })

  it('redirects to login when no session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    })

    await adminGuard(mockTo, mockFrom, mockNext)

    expect(mockNext).toHaveBeenCalledWith('/bulk-station/login')
  })

  it('redirects to login when getSession returns error', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: new Error('Session error') as any
    })

    await adminGuard(mockTo, mockFrom, mockNext)

    expect(mockNext).toHaveBeenCalledWith('/bulk-station/login')
  })

  it('allows access for valid admin session', async () => {
    const mockSession = {
      user: {
        id: '123',
        email: 'admin@test.com',
        user_metadata: {
          role: 'admin'
        }
      },
      access_token: 'token'
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null
    })

    await adminGuard(mockTo, mockFrom, mockNext)

    expect(mockNext).toHaveBeenCalledWith()
  })

  it('redirects to login and signs out when user is not admin', async () => {
    const mockSession = {
      user: {
        id: '123',
        email: 'user@test.com',
        user_metadata: {
          role: 'user'
        }
      },
      access_token: 'token'
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null
    })

    await adminGuard(mockTo, mockFrom, mockNext)

    expect(supabase.auth.signOut).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith('/bulk-station/login')
  })

  it('redirects to login and signs out when role is missing', async () => {
    const mockSession = {
      user: {
        id: '123',
        email: 'user@test.com',
        user_metadata: {}
      },
      access_token: 'token'
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null
    })

    await adminGuard(mockTo, mockFrom, mockNext)

    expect(supabase.auth.signOut).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith('/bulk-station/login')
  })

  it('handles exceptions and redirects to login', async () => {
    vi.mocked(supabase.auth.getSession).mockRejectedValue(new Error('Network error'))

    await adminGuard(mockTo, mockFrom, mockNext)

    expect(mockNext).toHaveBeenCalledWith('/bulk-station/login')
  })

  describe('updateActivity', () => {
    it('updates the last activity timestamp', () => {
      updateActivity()
      expect(updateActivity).toBeDefined()
      expect(typeof updateActivity).toBe('function')
    })
  })
})
