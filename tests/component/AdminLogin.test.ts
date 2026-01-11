import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AdminLogin from '@/views/admin/LoginView.vue'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn()
    },
    rpc: vi.fn()
  }
}))

// Mock i18n
const mockT = vi.fn((key: string) => key)
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT
  })
}))

describe('AdminLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows login form with email input only', () => {
    const wrapper = mount(AdminLogin, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    // Should have email input
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('#email').exists()).toBe(true)

    // Should NOT have password input (magic link auth)
    expect(wrapper.find('input[type="password"]').exists()).toBe(false)

    // Should have submit button
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('requires email to enable submit button', async () => {
    const wrapper = mount(AdminLogin, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    const submitButton = wrapper.find('button[type="submit"]')

    // Initially disabled with empty email
    expect(submitButton.attributes('disabled')).toBeDefined()

    // Fill email
    await wrapper.find('input[type="email"]').setValue('admin@test.com')

    // Should now be enabled
    expect(submitButton.attributes('disabled')).toBeUndefined()
  })

  it('sends magic link via Supabase on successful admin check', async () => {
    // Mock rate limit check (allowed)
    vi.mocked(supabase.rpc)
      .mockResolvedValueOnce({ data: true, error: null }) // check_rate_limit
      .mockResolvedValueOnce({ data: true, error: null }) // is_admin_email

    // Mock magic link send
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({
      data: {},
      error: null
    } as any)

    const wrapper = mount(AdminLogin, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    // Fill in the email
    await wrapper.find('input[type="email"]').setValue('admin@test.com')

    // Submit form
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // Should check rate limit
    expect(supabase.rpc).toHaveBeenCalledWith('check_rate_limit', { check_email: 'admin@test.com' })

    // Should check if admin
    expect(supabase.rpc).toHaveBeenCalledWith('is_admin_email', { check_email: 'admin@test.com' })

    // Should send magic link
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'admin@test.com',
      options: {
        emailRedirectTo: expect.stringContaining('/bulk-station')
      }
    })
  })

  it('shows success message after sending magic link', async () => {
    // Mock successful flow
    vi.mocked(supabase.rpc)
      .mockResolvedValueOnce({ data: true, error: null }) // check_rate_limit
      .mockResolvedValueOnce({ data: true, error: null }) // is_admin_email

    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({
      data: {},
      error: null
    } as any)

    const wrapper = mount(AdminLogin, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    await wrapper.find('input[type="email"]').setValue('admin@test.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // Should show success message
    expect(wrapper.find('.bg-green-50').exists()).toBe(true)
    expect(wrapper.text()).toContain('admin.login.checkEmailGeneric')

    // Form should be hidden
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('shows generic success message even for non-admin emails (security)', async () => {
    // Mock rate limit OK but non-admin email
    vi.mocked(supabase.rpc)
      .mockResolvedValueOnce({ data: true, error: null }) // check_rate_limit
      .mockResolvedValueOnce({ data: false, error: null }) // is_admin_email (NOT admin)

    const wrapper = mount(AdminLogin, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    await wrapper.find('input[type="email"]').setValue('regular@test.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // Should still show success message (don't reveal non-admin)
    expect(wrapper.find('.bg-green-50').exists()).toBe(true)

    // Should NOT have called signInWithOtp (security)
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled()
  })

  it('shows error when rate limited', async () => {
    // Mock rate limit exceeded
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: false, error: null })

    const wrapper = mount(AdminLogin, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    await wrapper.find('input[type="email"]').setValue('admin@test.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // Should show rate limit error
    expect(wrapper.find('.bg-red-50').exists()).toBe(true)
    expect(wrapper.text()).toContain('admin.login.rateLimited')

    // Should NOT proceed to send magic link
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled()
  })

  it('shows loading state during authentication', async () => {
    // Mock slow rate limit check
    vi.mocked(supabase.rpc).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: true, error: null }), 100))
    )

    const wrapper = mount(AdminLogin, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    await wrapper.find('input[type="email"]').setValue('admin@test.com')

    const submitButton = wrapper.find('button[type="submit"]')

    // Submit form
    await wrapper.find('form').trigger('submit')

    // Button should be disabled during loading
    expect(submitButton.attributes('disabled')).toBeDefined()

    // Button text should show loading state
    expect(submitButton.text()).toBe('common.loading')
  })

  it('handles RPC errors gracefully', async () => {
    // Mock RPC error
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' } as any
    })

    const wrapper = mount(AdminLogin, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    await wrapper.find('input[type="email"]').setValue('admin@test.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // Should show generic error (don't expose internals)
    expect(wrapper.find('.bg-red-50').exists()).toBe(true)
    expect(wrapper.text()).toContain('admin.login.rateLimited')
  })
})
