import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import VerifyView from '@/views/VerifyView.vue'
import {
  createTestPinia,
  createTestRouter,
  createTestI18n
} from '../../utils/test-helpers'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('VerifyView', () => {
  let pinia: ReturnType<typeof createTestPinia>
  let router: ReturnType<typeof createTestRouter>
  let i18n: ReturnType<typeof createTestI18n>

  const MOCK_TOKEN = 'test-token-123'
  const SUPABASE_URL = 'https://test.supabase.co'

  beforeEach(() => {
    pinia = createTestPinia()
    router = createTestRouter()
    i18n = createTestI18n()

    // Mock environment variables
    import.meta.env.VITE_SUPABASE_URL = SUPABASE_URL
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'

    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders the page title', async () => {
      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      expect(wrapper.text()).toContain('Verify Submission')
    })

    it('renders the back to map link', async () => {
      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      const link = wrapper.find('a[href="/"]')
      expect(link.exists()).toBe(true)
      expect(link.text()).toContain('Back to Map')
    })

    it('renders the container with correct styling', async () => {
      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      const container = wrapper.find('.container')
      expect(container.exists()).toBe(true)
    })
  })

  describe('Token Validation', () => {
    it('shows loading state initially', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await nextTick()

      expect(wrapper.vm.verifying).toBe(true)
      expect(wrapper.text()).toContain('Loading')
    })

    it('validates token on mount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()

      expect(mockFetch).toHaveBeenCalledWith(
        `${SUPABASE_URL}/functions/v1/verify-submission`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-anon-key'
          }),
          body: JSON.stringify({ token: MOCK_TOKEN })
        })
      )
    })

    it('shows error when token is missing', async () => {
      await router.push({ path: '/verify' }) // No token

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.vm.verifying).toBe(false)
      expect(wrapper.vm.verificationError).toContain('Verification token is missing')
    })

    it('extracts token from query parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      await router.push({ path: '/verify', query: { token: 'my-custom-token' } })

      mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ token: 'my-custom-token' })
        })
      )
    })
  })

  describe('Success State', () => {
    it('shows success message on successful verification', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.vm.verified).toBe(true)
      expect(wrapper.vm.verifying).toBe(false)
    })

    it('displays success message with correct styling', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      const successDiv = wrapper.find('.bg-green-100')
      expect(successDiv.exists()).toBe(true)
      expect(successDiv.text()).toContain('Verification Successful!')
    })

    it('displays success title', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      const bold = wrapper.find('.bg-green-100 .font-bold')
      expect(bold.exists()).toBe(true)
      expect(bold.text()).toContain('Verification Successful!')
    })

    it('displays success message text', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Your location has been verified and will be reviewed shortly')
    })

    it('hides loading state after success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.find('.text-center.py-8').exists()).toBe(false)
    })
  })

  describe('Error State', () => {
    it('shows error message on verification failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid token' })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.vm.verificationError).toBe('Invalid token')
      expect(wrapper.vm.verified).toBe(false)
      expect(wrapper.vm.verifying).toBe(false)
    })

    it('displays error message with correct styling', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Token expired' })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      const errorDiv = wrapper.find('.bg-red-100')
      expect(errorDiv.exists()).toBe(true)
      expect(errorDiv.text()).toContain('Token expired')
    })

    it('displays error title', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Error message' })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      const bold = wrapper.find('.bg-red-100 .font-bold')
      expect(bold.exists()).toBe(true)
      expect(bold.text()).toContain('Error')
    })

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.vm.verificationError).toBe('Network error')
      expect(wrapper.vm.verified).toBe(false)
    })

    it('handles missing error message from server', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({}) // No error field
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.vm.verificationError).toBe('Verification failed')
    })

    it('handles non-Error exceptions', async () => {
      mockFetch.mockRejectedValue('String error')

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.vm.verificationError).toBe('Verification error occurred')
    })

    it('shows error when Supabase URL is not configured', async () => {
      import.meta.env.VITE_SUPABASE_URL = ''

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.vm.verificationError).toBe('Supabase URL not configured')
    })
  })

  describe('API Integration', () => {
    it('calls correct Edge Function endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()

      expect(mockFetch).toHaveBeenCalledWith(
        `${SUPABASE_URL}/functions/v1/verify-submission`,
        expect.any(Object)
      )
    })

    it('includes correct headers in request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-anon-key'
          }
        })
      )
    })

    it('sends token in request body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ token: MOCK_TOKEN })
        })
      )
    })

    it('uses POST method', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST'
        })
      )
    })
  })

  describe('Component Lifecycle', () => {
    it('verifies token automatically on mount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('does not call API if token is missing', async () => {
      await router.push({ path: '/verify' })

      mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('sets verifying to false after completion', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      expect(wrapper.vm.verifying).toBe(true)

      await flushPromises()
      await nextTick()

      expect(wrapper.vm.verifying).toBe(false)
    })
  })

  describe('Navigation', () => {
    it('back to map link navigates to home', async () => {
      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()

      const link = wrapper.find('a[href="/"]')
      expect(link.exists()).toBe(true)
    })

    it('back to map link is always visible', async () => {
      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      const link = wrapper.find('a[href="/"]')
      expect(link.exists()).toBe(true)
    })
  })

  describe('Conditional Rendering', () => {
    it('shows only loading when verifying', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await nextTick()

      expect(wrapper.find('.text-center.py-8').exists()).toBe(true)
      expect(wrapper.find('.bg-green-100').exists()).toBe(false)
      expect(wrapper.find('.bg-red-100').exists()).toBe(false)
    })

    it('shows only success when verified', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.find('.bg-green-100').exists()).toBe(true)
      expect(wrapper.find('.bg-red-100').exists()).toBe(false)
      expect(wrapper.find('.text-center.py-8').exists()).toBe(false)
    })

    it('shows only error when verification failed', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed' })
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.find('.bg-red-100').exists()).toBe(true)
      expect(wrapper.find('.bg-green-100').exists()).toBe(false)
      expect(wrapper.find('.text-center.py-8').exists()).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('handles token with special characters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      const specialToken = 'token-with-special-chars-!@#$%^&*()'
      await router.push({ path: '/verify', query: { token: specialToken } })

      mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ token: specialToken })
        })
      )
    })

    it('handles very long tokens', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      const longToken = 'a'.repeat(1000)
      await router.push({ path: '/verify', query: { token: longToken } })

      mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()

      expect(mockFetch).toHaveBeenCalled()
    })

    it('handles empty string token', async () => {
      await router.push({ path: '/verify', query: { token: '' } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.vm.verificationError).toContain('Verification token is missing')
    })

    it('handles malformed JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => { throw new Error('Invalid JSON') }
      })

      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.vm.verificationError).toBeTruthy()
    })
  })

  describe('Styling and Layout', () => {
    it('applies correct container classes', async () => {
      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      const container = wrapper.find('.container')
      expect(container.classes()).toContain('mx-auto')
      expect(container.classes()).toContain('px-4')
      expect(container.classes()).toContain('py-8')
    })

    it('applies correct title classes', async () => {
      await router.push({ path: '/verify', query: { token: MOCK_TOKEN } })

      const wrapper = mount(VerifyView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      const title = wrapper.find('h1')
      expect(title.classes()).toContain('text-3xl')
      expect(title.classes()).toContain('font-bold')
    })
  })
})
