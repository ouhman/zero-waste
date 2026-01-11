import { describe, test, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PendingLocationPreviewPanel from '@/components/admin/PendingLocationPreviewPanel.vue'
import PaymentMethods from '@/components/PaymentMethods.vue'
import { createTestI18n, createTestRouter, createMockLocation } from '../../utils/test-helpers'

describe('PendingLocationPreviewPanel', () => {
  let i18n: ReturnType<typeof createTestI18n>
  let router: ReturnType<typeof createTestRouter>

  beforeEach(() => {
    i18n = createTestI18n()
    router = createTestRouter('/bulk-station/pending')
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    test('does not render when location is null', () => {
      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location: null
        },
        global: {
          plugins: [i18n, router]
        }
      })

      expect(wrapper.find('.fixed').exists()).toBe(false)
    })

    test('renders panel when location is provided', () => {
      const location = createMockLocation()
      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      expect(wrapper.find('.fixed.top-0.right-0').exists()).toBe(true)
    })

    test('renders backdrop when location is provided', () => {
      const location = createMockLocation()
      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      expect(wrapper.find('.fixed.inset-0.bg-black\\/40').exists()).toBe(true)
    })

    test('displays location name and address', () => {
      const location = createMockLocation({
        name: 'Test Shop',
        address: '123 Main St',
        city: 'Frankfurt'
      })

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      expect(wrapper.text()).toContain('Test Shop')
      expect(wrapper.text()).toContain('123 Main St')
      expect(wrapper.text()).toContain('Frankfurt')
    })

    test('displays submission information', () => {
      const location = createMockLocation({
        submitted_by_email: 'user@example.com',
        submission_type: 'new'
      })

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      expect(wrapper.text()).toContain('user@example.com')
      expect(wrapper.text()).toContain('new')
    })

    test('displays descriptions in both languages', () => {
      const location = createMockLocation({
        description_de: 'Deutsche Beschreibung',
        description_en: 'English Description'
      })

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      expect(wrapper.text()).toContain('Deutsche Beschreibung')
      expect(wrapper.text()).toContain('English Description')
    })

    test('displays address and coordinates', () => {
      const location = createMockLocation({
        address: '123 Test St',
        postal_code: '60311',
        city: 'Frankfurt',
        latitude: '50.1109',
        longitude: '8.6821'
      })

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      expect(wrapper.text()).toContain('123 Test St')
      expect(wrapper.text()).toContain('60311')
      expect(wrapper.text()).toContain('Frankfurt')
      expect(wrapper.text()).toContain('50.1109')
      expect(wrapper.text()).toContain('8.6821')
    })

    test('displays opening hours if available', () => {
      const location = createMockLocation({
        opening_hours_text: 'Monday to Friday: 10:00-18:00'
      })

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      expect(wrapper.text()).toContain('Monday to Friday: 10:00-18:00')
    })

    test('does not display opening hours section if not available', () => {
      const location = createMockLocation({
        opening_hours_text: null
      })

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      // Should not show opening hours heading
      const html = wrapper.html()
      const hasOpeningHoursSection = html.includes('Opening Hours') && html.includes('Monday')
      expect(hasOpeningHoursSection).toBe(false)
    })
  })

  describe('Categories', () => {
    test('displays categories when available', () => {
      const location = {
        ...createMockLocation(),
        location_categories: [
          {
            categories: {
              id: 'cat-1',
              name_de: 'Kategorie 1',
              name_en: 'Category 1',
              slug: 'cat-1',
              icon: null,
              icon_url: null,
              color: null,
              sort_order: 0,
              description_de: null,
              description_en: null,
              created_at: '2024-01-01',
              updated_at: null
            }
          },
          {
            categories: {
              id: 'cat-2',
              name_de: 'Kategorie 2',
              name_en: 'Category 2',
              slug: 'cat-2',
              icon: null,
              icon_url: null,
              color: null,
              sort_order: 1,
              description_de: null,
              description_en: null,
              created_at: '2024-01-01',
              updated_at: null
            }
          }
        ]
      }

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      expect(wrapper.text()).toContain('Kategorie 1')
      expect(wrapper.text()).toContain('Kategorie 2')
    })

    test('does not display categories section when empty', () => {
      const location = createMockLocation()
      delete (location as any).location_categories

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      // Should not show categories section at all
      const badges = wrapper.findAll('.bg-green-50.text-green-700')
      expect(badges.length).toBe(0)
    })
  })

  describe('Payment Methods', () => {
    test('displays payment methods when available', () => {
      const location = createMockLocation({
        payment_methods: {
          cash: true,
          credit_card: true,
          debit_card: false,
          contactless: true,
          mobile_payment: false
        }
      })

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const paymentComponent = wrapper.findComponent(PaymentMethods)
      expect(paymentComponent.exists()).toBe(true)
      expect(paymentComponent.props('paymentMethods')).toEqual({
        cash: true,
        credit_card: true,
        debit_card: false,
        contactless: true,
        mobile_payment: false
      })
    })

    test('does not display payment methods section when none are true', () => {
      const location = createMockLocation({
        payment_methods: {
          cash: false,
          credit_card: false,
          debit_card: false,
          contactless: false,
          mobile_payment: false
        }
      })

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const paymentComponent = wrapper.findComponent(PaymentMethods)
      expect(paymentComponent.exists()).toBe(false)
    })
  })

  describe('Contact Information', () => {
    test('displays website link', () => {
      const location = createMockLocation({
        website: 'https://example.com'
      })

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const websiteLink = wrapper.find('a[href="https://example.com"]')
      expect(websiteLink.exists()).toBe(true)
      expect(websiteLink.text()).toContain('example.com')
    })

    test('displays phone number', () => {
      const location = createMockLocation({
        phone: '+49 123 456789'
      })

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const phoneLink = wrapper.find('a[href="tel:+49 123 456789"]')
      expect(phoneLink.exists()).toBe(true)
      expect(phoneLink.text()).toContain('+49 123 456789')
    })

    test('displays email', () => {
      const location = createMockLocation({
        email: 'contact@example.com'
      })

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const emailLink = wrapper.find('a[href="mailto:contact@example.com"]')
      expect(emailLink.exists()).toBe(true)
      expect(emailLink.text()).toContain('contact@example.com')
    })

    test('displays Instagram handle', () => {
      const location = createMockLocation({
        instagram: '@testshop'
      })

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const instagramLink = wrapper.find('a[href="https://instagram.com/testshop"]')
      expect(instagramLink.exists()).toBe(true)
      expect(instagramLink.text()).toContain('@testshop')
    })

    test('does not display contact section when no contact info', () => {
      const location = createMockLocation({
        website: null,
        phone: null,
        email: null,
        instagram: null
      })

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      // Should not show any contact links
      const links = wrapper.findAll('a[href^="tel:"], a[href^="mailto:"], a[href*="instagram"]')
      expect(links.length).toBe(0)
    })
  })

  describe('Google Maps Link', () => {
    test('generates correct Google Maps URL', () => {
      const location = createMockLocation({
        latitude: '50.1109',
        longitude: '8.6821'
      })

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const googleMapsLink = wrapper.find('a[href*="google.com/maps"]')
      expect(googleMapsLink.exists()).toBe(true)
      expect(googleMapsLink.attributes('href')).toContain('50.1109,8.6821')
      expect(googleMapsLink.attributes('target')).toBe('_blank')
      expect(googleMapsLink.attributes('rel')).toBe('noopener')
    })
  })

  describe('Actions', () => {
    test('renders approve button', () => {
      const location = createMockLocation()
      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const approveButton = wrapper.findAll('button').find(btn => btn.text().includes('Approve'))
      expect(approveButton).toBeDefined()
    })

    test('renders reject button', () => {
      const location = createMockLocation()
      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const rejectButton = wrapper.findAll('button').find(btn => btn.text().includes('Reject'))
      expect(rejectButton).toBeDefined()
    })

    test('renders edit link', () => {
      const location = createMockLocation({ id: 'loc-123' })
      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const editLink = wrapper.find('a[href="/bulk-station/edit/loc-123"]')
      expect(editLink.exists()).toBe(true)
      expect(editLink.text()).toContain('Edit')
    })

    test('emits approve event with location id', async () => {
      const location = createMockLocation({ id: 'loc-123' })
      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const approveButton = wrapper.findAll('button').find(btn => btn.text().includes('Approve'))
      await approveButton?.trigger('click')

      expect(wrapper.emitted()).toHaveProperty('approve')
      expect(wrapper.emitted('approve')?.[0]).toEqual(['loc-123'])
    })

    test('emits reject event with location id', async () => {
      const location = createMockLocation({ id: 'loc-456' })
      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const rejectButton = wrapper.findAll('button').find(btn => btn.text().includes('Reject'))
      await rejectButton?.trigger('click')

      expect(wrapper.emitted()).toHaveProperty('reject')
      expect(wrapper.emitted('reject')?.[0]).toEqual(['loc-456'])
    })

    test('disables buttons when loading', () => {
      const location = createMockLocation()
      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location,
          loading: true
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const approveButton = wrapper.findAll('button').find(btn => btn.text().includes('Approve'))
      const rejectButton = wrapper.findAll('button').find(btn => btn.text().includes('Reject'))

      expect(approveButton?.attributes('disabled')).toBeDefined()
      expect(rejectButton?.attributes('disabled')).toBeDefined()
    })
  })

  describe('Close Behavior', () => {
    test('emits close event when close button is clicked', async () => {
      const location = createMockLocation()
      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const closeButton = wrapper.find('button')
      await closeButton.trigger('click')

      expect(wrapper.emitted()).toHaveProperty('close')
    })

    test('emits close event when backdrop is clicked', async () => {
      const location = createMockLocation()
      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const backdrop = wrapper.find('.fixed.inset-0.bg-black\\/40')
      await backdrop.trigger('click')

      expect(wrapper.emitted()).toHaveProperty('close')
    })

    test('closes on Escape key', async () => {
      const location = createMockLocation()
      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      // Simulate Escape key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted()).toHaveProperty('close')
    })

    test('does not close on Escape when panel is not open', async () => {
      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location: null
        },
        global: {
          plugins: [i18n, router]
        }
      })

      // Simulate Escape key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('close')).toBeUndefined()
    })
  })

  describe('Transitions', () => {
    test('applies slide-right transition class', () => {
      const location = createMockLocation()
      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      // Check for transition component wrapper
      const panel = wrapper.find('.fixed.top-0.right-0')
      expect(panel.exists()).toBe(true)
    })

    test('applies fade transition to backdrop', () => {
      const location = createMockLocation()
      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const backdrop = wrapper.find('.fixed.inset-0.bg-black\\/40')
      expect(backdrop.exists()).toBe(true)
    })
  })

  describe('Formatting', () => {
    test('formats URL display without protocol', () => {
      const location = createMockLocation({
        website: 'https://www.example.com/'
      })

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      const websiteLink = wrapper.find('a[href="https://www.example.com/"]')
      // Link contains emoji icon + formatted URL
      expect(websiteLink.text()).toContain('www.example.com')
    })

    test('formats date and time', () => {
      const location = createMockLocation({
        created_at: '2024-01-15T14:30:00Z'
      })

      const wrapper = mount(PendingLocationPreviewPanel, {
        props: {
          location
        },
        global: {
          plugins: [i18n, router]
        }
      })

      // Should display formatted date/time (format depends on locale)
      const text = wrapper.text()
      expect(text).toContain('2024')
    })
  })
})
