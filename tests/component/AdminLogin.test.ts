import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import AdminLogin from '@/views/admin/LoginView.vue'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn()
    },
    rpc: vi.fn()
  }
}))

// Mock the router so verifyCode's redirect is observable
const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush })
}))

// Mock i18n (returns the key, ignoring interpolation args)
const mockT = vi.fn((key: string) => key)
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT
  })
}))

function mountLogin() {
  return mount(AdminLogin, {
    global: {
      stubs: {
        teleport: true
      }
    }
  })
}

/**
 * Drive the request step for an admin email so the component lands on the
 * verify (code-entry) step. Consumes two rpc calls + one signInWithOtp.
 */
async function goToVerifyStep(wrapper: VueWrapper): Promise<void> {
  vi.mocked(supabase.rpc)
    .mockResolvedValueOnce({ data: true as any, error: null } as any) // check_rate_limit
    .mockResolvedValueOnce({ data: true as any, error: null } as any) // is_admin_email
  vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: {}, error: null } as any)

  await wrapper.find('input[type="email"]').setValue('admin@test.com')
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

describe('AdminLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the email request form (no password field)', () => {
    const wrapper = mountLogin()

    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('#email').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(false)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    // Not on the code step yet
    expect(wrapper.find('#code').exists()).toBe(false)
  })

  it('requires email to enable the send button', async () => {
    const wrapper = mountLogin()
    const submitButton = wrapper.find('button[type="submit"]')

    expect(submitButton.attributes('disabled')).toBeDefined()

    await wrapper.find('input[type="email"]').setValue('admin@test.com')

    expect(submitButton.attributes('disabled')).toBeUndefined()
  })

  it('sends an OTP code and advances to the verify step for an admin email', async () => {
    const wrapper = mountLogin()
    await goToVerifyStep(wrapper)

    // Rate limit + admin checks ran
    expect(supabase.rpc).toHaveBeenCalledWith('check_rate_limit', { check_email: 'admin@test.com' })
    expect(supabase.rpc).toHaveBeenCalledWith('is_admin_email', { check_email: 'admin@test.com' })

    // Sends a code (no emailRedirectTo, no silent user creation)
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'admin@test.com',
      options: { shouldCreateUser: false }
    })

    // Now on the code-entry step
    expect(wrapper.find('#code').exists()).toBe(true)
    expect(wrapper.find('input[type="email"]').exists()).toBe(false)
  })

  it('advances to the verify step for a non-admin email without sending (enumeration-safe)', async () => {
    vi.mocked(supabase.rpc)
      .mockResolvedValueOnce({ data: true as any, error: null } as any) // check_rate_limit
      .mockResolvedValueOnce({ data: false as any, error: null } as any) // is_admin_email (NOT admin)

    const wrapper = mountLogin()
    await wrapper.find('input[type="email"]').setValue('regular@test.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // No code was actually sent...
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled()
    // ...but the UI reveals nothing: still advances to the code step
    expect(wrapper.find('#code').exists()).toBe(true)
  })

  it('shows a rate-limit error and stays on the request step', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: false as any, error: null } as any)

    const wrapper = mountLogin()
    await wrapper.find('input[type="email"]').setValue('admin@test.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.bg-red-50').exists()).toBe(true)
    expect(wrapper.text()).toContain('admin.login.rateLimited')
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled()
    // Stayed on request step
    expect(wrapper.find('#code').exists()).toBe(false)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })

  it('surfaces an email send rate-limit (429) and stays on the request step', async () => {
    vi.mocked(supabase.rpc)
      .mockResolvedValueOnce({ data: true as any, error: null } as any) // check_rate_limit
      .mockResolvedValueOnce({ data: true as any, error: null } as any) // is_admin_email
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({
      data: {},
      error: { status: 429, message: 'over email send rate limit' }
    } as any)

    const wrapper = mountLogin()
    await wrapper.find('input[type="email"]').setValue('admin@test.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.bg-red-50').exists()).toBe(true)
    expect(wrapper.text()).toContain('admin.login.rateLimited')
    expect(wrapper.find('#code').exists()).toBe(false)
  })

  it('surfaces a generic error when the code send fails', async () => {
    vi.mocked(supabase.rpc)
      .mockResolvedValueOnce({ data: true as any, error: null } as any) // check_rate_limit
      .mockResolvedValueOnce({ data: true as any, error: null } as any) // is_admin_email
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({
      data: {},
      error: { status: 500, message: 'smtp unavailable' }
    } as any)

    const wrapper = mountLogin()
    await wrapper.find('input[type="email"]').setValue('admin@test.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.bg-red-50').exists()).toBe(true)
    expect(wrapper.text()).toContain('admin.login.genericError')
    expect(wrapper.find('#code').exists()).toBe(false)
  })

  it('handles rate-limit RPC errors gracefully', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null as any,
      error: { message: 'Database error' } as any
    } as any)

    const wrapper = mountLogin()
    await wrapper.find('input[type="email"]').setValue('admin@test.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.bg-red-50').exists()).toBe(true)
    expect(wrapper.text()).toContain('admin.login.rateLimited')
  })

  it('verifies the code and redirects to the dashboard on success', async () => {
    const wrapper = mountLogin()
    await goToVerifyStep(wrapper)

    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
      data: { session: {} },
      error: null
    } as any)

    await wrapper.find('#code').setValue('123456')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'admin@test.com',
      token: '123456',
      type: 'email'
    })
    expect(mockPush).toHaveBeenCalledWith('/bulk-station')
  })

  it('verifies an 8-digit code (OTP length is a per-project setting)', async () => {
    const wrapper = mountLogin()
    await goToVerifyStep(wrapper)

    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
      data: { session: {} },
      error: null
    } as any)

    await wrapper.find('#code').setValue('44945805')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'admin@test.com',
      token: '44945805',
      type: 'email'
    })
    expect(mockPush).toHaveBeenCalledWith('/bulk-station')
  })

  it('enables the verify button only for a 6–8 digit code', async () => {
    const wrapper = mountLogin()
    await goToVerifyStep(wrapper)

    const verifyButton = wrapper.find('button[type="submit"]')

    await wrapper.find('#code').setValue('12345') // too short
    expect(verifyButton.attributes('disabled')).toBeDefined()

    await wrapper.find('#code').setValue('123456') // 6 digits
    expect(verifyButton.attributes('disabled')).toBeUndefined()

    await wrapper.find('#code').setValue('44945805') // 8 digits
    expect(verifyButton.attributes('disabled')).toBeUndefined()
  })

  it('shows a code error and stays on the verify step for an invalid code', async () => {
    const wrapper = mountLogin()
    await goToVerifyStep(wrapper)

    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
      data: { session: null },
      error: { status: 403, message: 'Token has expired or is invalid' }
    } as any)

    await wrapper.find('#code').setValue('000000')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.bg-red-50').exists()).toBe(true)
    expect(wrapper.text()).toContain('admin.login.codeError')
    expect(mockPush).not.toHaveBeenCalled()
    // Stayed on the verify step
    expect(wrapper.find('#code').exists()).toBe(true)
  })

  it('lets the user return to the email step with "change email"', async () => {
    const wrapper = mountLogin()
    await goToVerifyStep(wrapper)
    expect(wrapper.find('#code').exists()).toBe(true)

    // "Use a different email" is the second (type=button) control
    await wrapper.find('button[type="button"]:last-of-type').trigger('click')
    await flushPromises()

    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('#code').exists()).toBe(false)
  })

  it('shows the loading state while a code is being requested', async () => {
    vi.mocked(supabase.rpc).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: true as any, error: null }), 100)) as any
    )

    const wrapper = mountLogin()
    await wrapper.find('input[type="email"]').setValue('admin@test.com')

    const submitButton = wrapper.find('button[type="submit"]')
    await wrapper.find('form').trigger('submit')

    expect(submitButton.attributes('disabled')).toBeDefined()
    expect(submitButton.text()).toBe('common.loading')
  })
})
