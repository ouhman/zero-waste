import { describe, test, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import { createTestRouter, createTestI18n } from '../../utils/test-helpers'

describe('AdminSidebar', () => {
  let router: ReturnType<typeof createTestRouter>
  let i18n: ReturnType<typeof createTestI18n>

  beforeEach(() => {
    router = createTestRouter('/bulk-station')
    i18n = createTestI18n()
  })

  test('renders navigation links', () => {
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).toContain('Locations')
    expect(wrapper.text()).toContain('Categories')
  })

  test('renders all router-links', () => {
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    const links = wrapper.findAllComponents({ name: 'RouterLink' })
    expect(links.length).toBe(3) // Dashboard, Locations, Categories
  })

  test('dashboard link points to correct route', () => {
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    const dashboardLink = wrapper.findAll('a').find(a => a.text().includes('Dashboard'))
    expect(dashboardLink?.attributes('href')).toBe('/bulk-station')
  })

  test('locations link points to correct route', () => {
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    const locationsLink = wrapper.findAll('a').find(a => a.text().includes('Locations'))
    expect(locationsLink?.attributes('href')).toBe('/bulk-station/locations')
  })

  test('categories link points to correct route', () => {
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    const categoriesLink = wrapper.findAll('a').find(a => a.text().includes('Categories'))
    expect(categoriesLink?.attributes('href')).toBe('/bulk-station/categories')
  })

  test('emits close event when close button is clicked', async () => {
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    const closeButton = wrapper.find('button[aria-label="Close sidebar"]')
    expect(closeButton.exists()).toBe(true)

    await closeButton.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('close')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  test('emits close event when navigation link is clicked', async () => {
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    const dashboardLink = wrapper.findAll('a')[0]
    await dashboardLink.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('close')
  })

  test('applies open class when open prop is true', () => {
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    const aside = wrapper.find('aside')
    expect(aside.classes()).toContain('translate-x-0')
  })

  test('applies closed class when open prop is false', () => {
    const wrapper = mount(AdminSidebar, {
      props: { open: false },
      global: {
        plugins: [router, i18n]
      }
    })

    const aside = wrapper.find('aside')
    expect(aside.classes()).toContain('-translate-x-full')
  })

  test('shows mobile overlay when open', () => {
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    const overlay = wrapper.find('.fixed.inset-0.bg-gray-900')
    expect(overlay.exists()).toBe(true)
  })

  test('hides mobile overlay when closed', () => {
    const wrapper = mount(AdminSidebar, {
      props: { open: false },
      global: {
        plugins: [router, i18n]
      }
    })

    const overlay = wrapper.find('.fixed.inset-0.bg-gray-900')
    expect(overlay.exists()).toBe(false)
  })

  test('emits close when overlay is clicked', async () => {
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    const overlay = wrapper.find('.fixed.inset-0.bg-gray-900')
    await overlay.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('close')
  })

  test('close button is only visible on mobile (lg:hidden)', () => {
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    const closeButton = wrapper.find('button[aria-label="Close sidebar"]')
    expect(closeButton.classes()).toContain('lg:hidden')
  })

  test('renders SVG icons for navigation items', () => {
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    const svgs = wrapper.findAll('svg')
    // One for close button + three for nav items
    expect(svgs.length).toBeGreaterThanOrEqual(3)
  })

  test('highlights active route - dashboard', async () => {
    await router.push('/bulk-station')
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    await router.isReady()

    const dashboardLink = wrapper.findAll('a')[0]
    expect(dashboardLink.classes()).toContain('nav-link-active')
  })

  test('highlights active route - locations', async () => {
    await router.push('/bulk-station/locations')
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    await router.isReady()

    const locationsLink = wrapper.findAll('a').find(a => a.text().includes('Locations'))
    expect(locationsLink?.classes()).toContain('nav-link-active')
  })

  test('highlights active route - edit location (should highlight locations)', async () => {
    await router.push('/bulk-station/edit/123')
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    await router.isReady()

    const locationsLink = wrapper.findAll('a').find(a => a.text().includes('Locations'))
    expect(locationsLink?.classes()).toContain('nav-link-active')
  })

  test('highlights active route - pending (should highlight locations)', async () => {
    await router.push('/bulk-station/pending')
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    await router.isReady()

    const locationsLink = wrapper.findAll('a').find(a => a.text().includes('Locations'))
    expect(locationsLink?.classes()).toContain('nav-link-active')
  })

  test('sidebar is sticky on desktop', () => {
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    const aside = wrapper.find('aside')
    // Should have lg:sticky class for desktop sticky behavior
    expect(aside.classes()).toContain('lg:sticky')
  })

  test('sidebar is fixed on mobile', () => {
    const wrapper = mount(AdminSidebar, {
      props: { open: true },
      global: {
        plugins: [router, i18n]
      }
    })

    const aside = wrapper.find('aside')
    expect(aside.classes()).toContain('fixed')
  })
})
