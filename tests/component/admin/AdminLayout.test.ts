import { describe, test, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import { createTestRouter, createTestI18n } from '../../utils/test-helpers'

// Mock useAuth composable
const mockLogout = vi.fn()
const mockUser = { email: 'admin@test.com', id: 'user-123' }

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout
  })
}))

describe('AdminLayout', () => {
  let router: ReturnType<typeof createTestRouter>
  let i18n: ReturnType<typeof createTestI18n>

  beforeEach(() => {
    router = createTestRouter('/bulk-station')
    i18n = createTestI18n()
    vi.clearAllMocks()
  })

  test('renders header with title', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [router, i18n]
      }
    })

    expect(wrapper.text()).toContain('Zero Waste Frankfurt - Admin')
  })

  test('displays logged-in user email', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [router, i18n]
      }
    })

    expect(wrapper.text()).toContain('admin@test.com')
  })

  test('renders logout button', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [router, i18n]
      }
    })

    const logoutButton = wrapper.find('button:not([aria-label])')
    expect(logoutButton.exists()).toBe(true)
    expect(logoutButton.text()).toBe('Logout')
  })

  test('calls logout when logout button is clicked', async () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [router, i18n]
      }
    })

    const logoutButtons = wrapper.findAll('button')
    const logoutButton = logoutButtons.find(btn => btn.text() === 'Logout')
    expect(logoutButton).toBeDefined()

    await logoutButton!.trigger('click')

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  test('renders AdminSidebar component', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [router, i18n]
      }
    })

    expect(wrapper.findComponent(AdminSidebar).exists()).toBe(true)
  })

  test('renders slot content', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [router, i18n]
      },
      slots: {
        default: '<div class="test-content">Test Content</div>'
      }
    })

    expect(wrapper.find('.test-content').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Content')
  })

  test('sidebar is initially closed on mobile', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [router, i18n]
      }
    })

    const sidebar = wrapper.findComponent(AdminSidebar)
    expect(sidebar.props('open')).toBe(false)
  })

  test('toggles sidebar when hamburger button is clicked', async () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [router, i18n]
      }
    })

    const sidebar = wrapper.findComponent(AdminSidebar)
    expect(sidebar.props('open')).toBe(false)

    // Find and click the hamburger menu button (has aria-label="Toggle sidebar")
    const hamburgerButton = wrapper.find('button[aria-label="Toggle sidebar"]')
    expect(hamburgerButton.exists()).toBe(true)

    await hamburgerButton.trigger('click')
    expect(sidebar.props('open')).toBe(true)

    await hamburgerButton.trigger('click')
    expect(sidebar.props('open')).toBe(false)
  })

  test('closes sidebar when close event is emitted', async () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [router, i18n]
      }
    })

    const sidebar = wrapper.findComponent(AdminSidebar)

    // Open sidebar first
    await wrapper.find('button[aria-label="Toggle sidebar"]').trigger('click')
    expect(sidebar.props('open')).toBe(true)

    // Emit close event from sidebar
    await sidebar.vm.$emit('close')
    await wrapper.vm.$nextTick()

    expect(sidebar.props('open')).toBe(false)
  })

  test('has mobile-responsive hamburger menu button', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [router, i18n]
      }
    })

    const hamburgerButton = wrapper.find('button[aria-label="Toggle sidebar"]')
    expect(hamburgerButton.exists()).toBe(true)

    // Check it has the lg:hidden class (hidden on large screens)
    expect(hamburgerButton.classes()).toContain('lg:hidden')
  })

  test('renders SVG icon in hamburger button', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [router, i18n]
      }
    })

    const hamburgerButton = wrapper.find('button[aria-label="Toggle sidebar"]')
    const svg = hamburgerButton.find('svg')

    expect(svg.exists()).toBe(true)
    expect(svg.classes()).toContain('h-6')
    expect(svg.classes()).toContain('w-6')
  })

  test('main content area has proper styling', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [router, i18n]
      }
    })

    const main = wrapper.find('main')
    expect(main.exists()).toBe(true)
    expect(main.classes()).toContain('flex-1')
  })

  test('header has proper styling and structure', () => {
    const wrapper = mount(AdminLayout, {
      global: {
        plugins: [router, i18n]
      }
    })

    const header = wrapper.find('header')
    expect(header.exists()).toBe(true)
    expect(header.classes()).toContain('bg-white')
    expect(header.classes()).toContain('shadow-sm')
  })
})
