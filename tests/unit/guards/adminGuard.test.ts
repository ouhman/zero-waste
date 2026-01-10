import { describe, it, expect, vi, beforeEach } from 'vitest'
import { adminGuard } from '@/router/guards/adminGuard'
import { supabase } from '@/lib/supabase'
import type { RouteLocationNormalized } from 'vue-router'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    }
  }
}))

describe('Admin Route Guard', () => {
  const mockTo = { path: '/admin', meta: { requiresAdmin: true } } as RouteLocationNormalized
  const mockFrom = { path: '/' } as RouteLocationNormalized
  const mockNext = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows authenticated admin users', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'admin@test.com',
          role: 'authenticated'
        }
      },
      error: null
    } as any)

    await adminGuard(mockTo, mockFrom, mockNext)

    expect(mockNext).toHaveBeenCalledWith()
  })

  it('redirects unauthenticated users to login', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' }
    } as any)

    await adminGuard(mockTo, mockFrom, mockNext)

    expect(mockNext).toHaveBeenCalledWith('/admin/login')
  })

  it('redirects when auth check fails', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: { message: 'Session expired' }
    } as any)

    await adminGuard(mockTo, mockFrom, mockNext)

    expect(mockNext).toHaveBeenCalledWith('/admin/login')
  })

  it('allows access to login page without authentication', async () => {
    const mockLoginTo = {
      path: '/admin/login',
      meta: { requiresAdmin: false }
    } as RouteLocationNormalized

    await adminGuard(mockLoginTo, mockFrom, mockNext)

    expect(mockNext).toHaveBeenCalledWith()
  })

  it('handles auth errors gracefully', async () => {
    vi.mocked(supabase.auth.getUser).mockRejectedValue(
      new Error('Network error')
    )

    await adminGuard(mockTo, mockFrom, mockNext)

    expect(mockNext).toHaveBeenCalledWith('/admin/login')
  })
})
