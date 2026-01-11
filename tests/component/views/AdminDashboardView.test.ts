import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import DashboardView from '@/views/admin/DashboardView.vue'
import {
  createTestPinia,
  createTestRouter,
  createTestI18n,
  createMockLocation
} from '../../utils/test-helpers'
import { useAdminStore } from '@/stores/admin'

// Mock components
vi.mock('@/components/admin/AdminLayout.vue', () => ({
  default: {
    name: 'AdminLayout',
    template: '<div data-testid="admin-layout"><slot /></div>'
  }
}))

vi.mock('@/components/common/LoadingSpinner.vue', () => ({
  default: {
    name: 'LoadingSpinner',
    template: '<div data-testid="loading-spinner">Loading...</div>',
    props: ['centered', 'text']
  }
}))

vi.mock('@/components/common/EmptyState.vue', () => ({
  default: {
    name: 'EmptyState',
    template: '<div data-testid="empty-state"><p>{{ title }}</p><p>{{ description }}</p></div>',
    props: ['title', 'description']
  }
}))

// Mock useToast
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError
  })
}))

describe('DashboardView', () => {
  let pinia: ReturnType<typeof createTestPinia>
  let router: ReturnType<typeof createTestRouter>
  let i18n: ReturnType<typeof createTestI18n>

  const mockPendingLocations = [
    createMockLocation({
      id: '1',
      name: 'Pending Location 1',
      status: 'pending',
      created_at: new Date().toISOString()
    }),
    createMockLocation({
      id: '2',
      name: 'Pending Location 2',
      status: 'pending',
      created_at: new Date(Date.now() - 3600000).toISOString()
    }),
    createMockLocation({
      id: '3',
      name: 'Pending Location 3',
      status: 'pending',
      created_at: new Date(Date.now() - 86400000).toISOString()
    })
  ]

  beforeEach(() => {
    pinia = createTestPinia()
    router = createTestRouter()
    i18n = createTestI18n()

    mockToastSuccess.mockClear()
    mockToastError.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  async function mountWithData() {
    const adminStore = useAdminStore(pinia)
    adminStore.locations = [...mockPendingLocations]

    const wrapper = mount(DashboardView, {
      global: {
        plugins: [pinia, router, i18n]
      }
    })

    // Finish loading
    wrapper.vm.loading = false
    await flushPromises()
    await nextTick()

    return wrapper
  }

  describe('Initial Rendering', () => {
    it('renders within AdminLayout', async () => {
      const wrapper = await mountWithData()
      expect(wrapper.find('[data-testid="admin-layout"]').exists()).toBe(true)
    })

    it('displays dashboard title', async () => {
      const wrapper = await mountWithData()
      expect(wrapper.find('h1').exists()).toBe(true)
    })

    it('fetches dashboard data on mount', async () => {
      const adminStore = useAdminStore(pinia)
      const fetchSpy = vi.spyOn(adminStore, 'fetchLocations')

      mount(DashboardView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      expect(fetchSpy).toHaveBeenCalled()
    })
  })

  describe('Stats Display', () => {
    it('displays pending locations count', async () => {
      const wrapper = await mountWithData()
      expect(wrapper.text()).toContain('3')
    })

    it('displays stats cards', async () => {
      const wrapper = await mountWithData()
      const cards = wrapper.findAll('.bg-white.shadow')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  describe('Recent Submissions List', () => {
    it('displays location names', async () => {
      const wrapper = await mountWithData()
      expect(wrapper.text()).toContain('Pending Location 1')
    })

    it('displays location addresses', async () => {
      const wrapper = await mountWithData()
      expect(wrapper.text()).toContain('123 Test Street')
    })

    it('includes action buttons', async () => {
      const wrapper = await mountWithData()
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Quick Approve', () => {
    it('calls approveLocation when approve button clicked', async () => {
      const adminStore = useAdminStore(pinia)
      const approveSpy = vi.spyOn(adminStore, 'approveLocation').mockResolvedValue()

      const wrapper = await mountWithData()

      // Find first approve button
      const buttons = wrapper.findAll('button')
      const approveButton = buttons.find(btn => btn.text().includes('Approve'))

      if (approveButton) {
        await approveButton.trigger('click')
        await flushPromises()

        expect(approveSpy).toHaveBeenCalled()
      }
    })

    it('shows success toast on successful approval', async () => {
      const adminStore = useAdminStore(pinia)
      vi.spyOn(adminStore, 'approveLocation').mockResolvedValue()

      const wrapper = await mountWithData()

      const buttons = wrapper.findAll('button')
      const approveButton = buttons.find(btn => btn.text().includes('Approve'))

      if (approveButton) {
        await approveButton.trigger('click')
        await flushPromises()

        expect(mockToastSuccess).toHaveBeenCalled()
      }
    })

    it('shows error toast on approval failure', async () => {
      const adminStore = useAdminStore(pinia)
      vi.spyOn(adminStore, 'approveLocation').mockRejectedValue(new Error('Failed'))

      const wrapper = await mountWithData()

      const buttons = wrapper.findAll('button')
      const approveButton = buttons.find(btn => btn.text().includes('Approve'))

      if (approveButton) {
        await approveButton.trigger('click')
        await flushPromises()

        expect(mockToastError).toHaveBeenCalled()
      }
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no pending submissions', async () => {
      const adminStore = useAdminStore(pinia)
      adminStore.locations = []

      const wrapper = mount(DashboardView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      wrapper.vm.loading = false
      await flushPromises()
      await nextTick()

      expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner while fetching data', async () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      wrapper.vm.loading = true
      await nextTick()

      expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true)
    })

    it('hides content while loading', async () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      wrapper.vm.loading = true
      await nextTick()

      expect(wrapper.find('.grid').exists()).toBe(false)
    })
  })

  describe('Error State', () => {
    it('displays error message on fetch failure', async () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      wrapper.vm.error = 'Failed to load data'
      wrapper.vm.loading = false
      await nextTick()

      const errorDiv = wrapper.find('.bg-red-50')
      expect(errorDiv.exists()).toBe(true)
      expect(errorDiv.text()).toContain('Failed to load data')
    })

    it('includes try again button on error', async () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      wrapper.vm.error = 'Error'
      wrapper.vm.loading = false
      await nextTick()

      const tryAgainButton = wrapper.find('button')
      expect(tryAgainButton.exists()).toBe(true)
    })

    it('retries fetch when try again clicked', async () => {
      const adminStore = useAdminStore(pinia)
      const fetchSpy = vi.spyOn(adminStore, 'fetchLocations')

      const wrapper = mount(DashboardView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      await flushPromises()
      fetchSpy.mockClear()

      wrapper.vm.error = 'Error'
      wrapper.vm.loading = false
      await nextTick()

      const tryAgainButton = wrapper.find('button')
      await tryAgainButton.trigger('click')

      expect(fetchSpy).toHaveBeenCalled()
    })
  })

  describe('Date Formatting', () => {
    it('formats recent dates as "Just now"', async () => {
      const wrapper = await mountWithData()
      const result = wrapper.vm.formatDate(new Date().toISOString())
      expect(result).toBe('Just now')
    })

    it('formats minutes ago correctly', async () => {
      const wrapper = await mountWithData()
      const date = new Date(Date.now() - 5 * 60000).toISOString()
      const result = wrapper.vm.formatDate(date)
      expect(result).toBe('5 minutes ago')
    })

    it('formats hours ago correctly', async () => {
      const wrapper = await mountWithData()
      const date = new Date(Date.now() - 2 * 3600000).toISOString()
      const result = wrapper.vm.formatDate(date)
      expect(result).toBe('2 hours ago')
    })

    it('formats days ago correctly', async () => {
      const wrapper = await mountWithData()
      const date = new Date(Date.now() - 3 * 86400000).toISOString()
      const result = wrapper.vm.formatDate(date)
      expect(result).toBe('3 days ago')
    })

    it('formats old dates as full date', async () => {
      const wrapper = await mountWithData()
      const date = new Date(Date.now() - 10 * 86400000).toISOString()
      const result = wrapper.vm.formatDate(date)
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
    })

    it('handles singular forms correctly', async () => {
      const wrapper = await mountWithData()

      const minuteAgo = new Date(Date.now() - 60000).toISOString()
      expect(wrapper.vm.formatDate(minuteAgo)).toBe('1 minute ago')

      const hourAgo = new Date(Date.now() - 3600000).toISOString()
      expect(wrapper.vm.formatDate(hourAgo)).toBe('1 hour ago')

      const dayAgo = new Date(Date.now() - 86400000).toISOString()
      expect(wrapper.vm.formatDate(dayAgo)).toBe('1 day ago')
    })
  })

  describe('Component Integration', () => {
    it('passes correct props to LoadingSpinner', async () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [pinia, router, i18n]
        }
      })

      wrapper.vm.loading = true
      await nextTick()

      const spinner = wrapper.findComponent({ name: 'LoadingSpinner' })
      expect(spinner.props('centered')).toBe(true)
      expect(spinner.props('text')).toBe('Loading dashboard...')
    })

    it('integrates with admin store correctly', async () => {
      const adminStore = useAdminStore(pinia)
      adminStore.locations = [...mockPendingLocations]

      const wrapper = await mountWithData()

      expect(wrapper.vm.stats.pending).toBe(3)
    })
  })
})
