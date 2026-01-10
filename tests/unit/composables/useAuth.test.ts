import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useAuth } from '@/composables/useAuth'
import { supabase } from '@/lib/supabase'
import { flushPromises } from '@vue/test-utils'
import { createApp } from 'vue'

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn()
    }
  }
}))

// Mock adminGuard
vi.mock('@/router/guards/adminGuard', () => ({
  updateActivity: vi.fn()
}))

// Helper to setup composable with Vue instance context
function withSetup<T>(composable: () => T): [T, () => void] {
  let result: T
  const app = createApp({
    setup() {
      result = composable()
      return () => {}
    }
  })
  const el = document.createElement('div')
  app.mount(el)

  return [
    result!,
    () => {
      app.unmount()
      el.remove()
    }
  ]
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    })

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    } as any)

    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with loading state', () => {
    const [{ loading }, cleanup] = withSetup(() => useAuth())
    expect(loading.value).toBe(true)
    cleanup()
  })

  it('loads session on mount and sets loading to false', async () => {
    const mockUser = { id: '123', email: 'admin@test.com' }
    const mockSession = { user: mockUser, access_token: 'token' }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null
    })

    const [{ user, session, loading }, cleanup] = withSetup(() => useAuth())

    // Initially loading
    expect(loading.value).toBe(true)

    // Wait for async operations
    await flushPromises()

    expect(loading.value).toBe(false)
    expect(user.value).toEqual(mockUser)
    expect(session.value).toEqual(mockSession)
    cleanup()
  })

  it('sets user and session to null when no session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    })

    const [{ user, session, loading }, cleanup] = withSetup(() => useAuth())

    await flushPromises()

    expect(loading.value).toBe(false)
    expect(user.value).toBe(null)
    expect(session.value).toBe(null)
    cleanup()
  })

  it('listens for auth state changes', async () => {
    const mockCallback = vi.fn()
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      mockCallback.mockImplementation(callback)
      return {
        data: { subscription: { unsubscribe: vi.fn() } }
      } as any
    })

    const [{ user, session }, cleanup] = withSetup(() => useAuth())
    await flushPromises()

    // Simulate auth state change
    const newUser = { id: '456', email: 'new@test.com' }
    const newSession = { user: newUser, access_token: 'new-token' }
    mockCallback('SIGNED_IN', newSession)

    expect(user.value).toEqual(newUser)
    expect(session.value).toEqual(newSession)
    cleanup()
  })

  it('logout clears session and redirects to login', async () => {
    const mockUser = { id: '123', email: 'admin@test.com' }
    const mockSession = { user: mockUser, access_token: 'token' }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null
    })

    const [{ logout, user, session }, cleanup] = withSetup(() => useAuth())
    await flushPromises()

    // User is logged in
    expect(user.value).toEqual(mockUser)

    // Logout
    await logout()

    expect(supabase.auth.signOut).toHaveBeenCalled()
    expect(user.value).toBe(null)
    expect(session.value).toBe(null)
    expect(mockPush).toHaveBeenCalledWith('/bulk-station/login')
    cleanup()
  })

  it('tracks user activity with event listeners', async () => {
    const { updateActivity } = await import('@/router/guards/adminGuard')

    const [_, cleanup] = withSetup(() => useAuth())
    await flushPromises()

    // Clear previous calls from setup
    vi.mocked(updateActivity).mockClear()

    // Simulate user activity
    const mouseEvent = new Event('mousedown')
    document.dispatchEvent(mouseEvent)

    expect(updateActivity).toHaveBeenCalled()
    cleanup()
  })

  it('cleans up event listeners on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

    const [_, cleanup] = withSetup(() => useAuth())
    await flushPromises()

    cleanup()

    // Should remove all activity event listeners
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })
})
