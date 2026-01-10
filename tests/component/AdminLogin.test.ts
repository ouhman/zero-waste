import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import AdminLogin from '@/views/admin/LoginView.vue'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn()
    }
  }
}))

// Mock i18n
const mockT = vi.fn((key: string) => key)
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT
  })
}))

const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/bulk-station/login', component: { template: '<div>Login</div>' } },
      { path: '/bulk-station', component: { template: '<div>Dashboard</div>' } }
    ]
  })
}

describe('AdminLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows login form', () => {
    const wrapper = mount(AdminLogin, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('requires email and password', async () => {
    const wrapper = mount(AdminLogin, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    const submitButton = wrapper.find('button[type="submit"]')

    // Initially, form should not allow submission with empty fields
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('authenticates with Supabase', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'admin@test.com' },
        session: { access_token: 'token' }
      },
      error: null
    } as any)

    const router = createMockRouter()
    const wrapper = mount(AdminLogin, {
      global: {
        plugins: [router],
        stubs: {
          teleport: true
        }
      }
    })

    // Fill in the form
    await wrapper.find('input[type="email"]').setValue('admin@test.com')
    await wrapper.find('input[type="password"]').setValue('password123')

    // Submit form
    await wrapper.find('form').trigger('submit')

    // Should call Supabase auth
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@test.com',
      password: 'password123'
    })
  })

  it('redirects to admin dashboard on success', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'admin@test.com' },
        session: { access_token: 'token' }
      },
      error: null
    } as any)

    const router = createMockRouter()
    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(AdminLogin, {
      global: {
        plugins: [router],
        stubs: {
          teleport: true
        }
      }
    })

    await wrapper.find('input[type="email"]').setValue('admin@test.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(pushSpy).toHaveBeenCalledWith('/bulk-station')
  })

  it('shows error on invalid credentials', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' }
    } as any)

    const wrapper = mount(AdminLogin, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    await wrapper.find('input[type="email"]').setValue('admin@test.com')
    await wrapper.find('input[type="password"]').setValue('wrong-password')
    await wrapper.find('form').trigger('submit')

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100))

    // Should display error message
    expect(wrapper.text()).toContain('Invalid credentials')
  })

  it('shows loading state during authentication', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )

    const wrapper = mount(AdminLogin, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    await wrapper.find('input[type="email"]').setValue('admin@test.com')
    await wrapper.find('input[type="password"]').setValue('password123')

    const form = wrapper.find('form')
    await form.trigger('submit')

    // Check for loading state immediately
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })
})
