import { describe, it, expect, beforeEach, vi } from 'vitest'
import { adminGuard, updateActivity } from '@/router/guards/adminGuard'
import { supabase } from '@/lib/supabase'
import type { RouteLocationNormalized } from 'vue-router'

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

    const result = await adminGuard(mockTo)

    expect(result).toBe(true)
    expect(supabase.auth.getSession).not.toHaveBeenCalled()
  })

  it('redirects to login when no session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    })

    const result = await adminGuard(mockTo)

    expect(result).toBe('/bulk-station/login')
  })

  it('redirects to login when getSession returns error', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: new Error('Session error') as any
    })

    const result = await adminGuard(mockTo)

    expect(result).toBe('/bulk-station/login')
  })

  it('allows access for valid admin session', async () => {
    const mockSession = {
      user: {
        id: '123',
        email: 'admin@test.com',
        app_metadata: {
          role: 'admin'
        }
      },
      access_token: 'token'
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null
    })

    const result = await adminGuard(mockTo)

    expect(result).toBe(true)
  })

  it('redirects to login and signs out when user is not admin', async () => {
    const mockSession = {
      user: {
        id: '123',
        email: 'user@test.com',
        app_metadata: {
          role: 'user'
        }
      },
      access_token: 'token'
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null
    })

    const result = await adminGuard(mockTo)

    expect(supabase.auth.signOut).toHaveBeenCalled()
    expect(result).toBe('/bulk-station/login')
  })

  it('redirects to login and signs out when role is missing', async () => {
    const mockSession = {
      user: {
        id: '123',
        email: 'user@test.com',
        app_metadata: {}
      },
      access_token: 'token'
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null
    })

    const result = await adminGuard(mockTo)

    expect(supabase.auth.signOut).toHaveBeenCalled()
    expect(result).toBe('/bulk-station/login')
  })

  it('handles exceptions and redirects to login', async () => {
    vi.mocked(supabase.auth.getSession).mockRejectedValue(new Error('Network error'))

    const result = await adminGuard(mockTo)

    expect(result).toBe('/bulk-station/login')
  })

  describe('updateActivity', () => {
    it('updates the last activity timestamp', () => {
      updateActivity()
      expect(updateActivity).toBeDefined()
      expect(typeof updateActivity).toBe('function')
    })
  })
})
