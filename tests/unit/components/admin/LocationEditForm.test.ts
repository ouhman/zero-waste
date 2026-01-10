import { describe, test, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import LocationEditForm from '@/components/admin/LocationEditForm.vue'

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn().mockReturnThis(),
      on: vi.fn(),
      remove: vi.fn()
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn()
    })),
    marker: vi.fn(() => ({
      addTo: vi.fn(),
      on: vi.fn(),
      setLatLng: vi.fn()
    }))
  }
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      admin: {
        form: {
          basicInfo: 'Basic Information',
          name: 'Name',
          slug: 'Slug',
          slugHelp: 'URL-friendly identifier',
          descriptionDe: 'Description (German)',
          descriptionEn: 'Description (English)',
          addressGeo: 'Address & Coordinates',
          address: 'Address',
          city: 'City',
          postalCode: 'ZIP Code',
          latitude: 'Latitude',
          longitude: 'Longitude',
          clickMapToSet: 'Click on map',
          contactInfo: 'Contact Information',
          website: 'Website',
          phone: 'Phone',
          email: 'Email',
          instagram: 'Instagram',
          categories: 'Categories',
          selectCategories: 'Select categories',
          paymentMethods: 'Payment Methods',
          cash: 'Cash',
          creditCard: 'Credit Card',
          debitCard: 'Debit Card',
          contactless: 'Contactless',
          mobilePayment: 'Mobile Payment',
          openingHours: 'Opening Hours',
          osmFormat: 'OSM Format',
          adminFields: 'Admin Fields',
          status: 'Status',
          statusPending: 'Pending',
          statusApproved: 'Approved',
          statusRejected: 'Rejected',
          adminNotes: 'Admin Notes',
          adminNotesHelp: 'Internal notes'
        },
        edit: {
          saveChanges: 'Save Changes'
        }
      },
      common: {
        cancel: 'Cancel',
        loading: 'Loading'
      }
    }
  }
})

describe('LocationEditForm', () => {
  const mockLocation = {
    id: '123',
    name: 'Test Location',
    slug: 'test-location',
    address: '123 Test St',
    city: 'Frankfurt',
    postal_code: '60311',
    latitude: '50.1109',
    longitude: '8.6821',
    description_de: 'Test description',
    description_en: 'Test description EN',
    website: 'https://test.com',
    phone: '+49 123 456',
    email: 'test@test.com',
    instagram: '@test',
    opening_hours_osm: 'Mo-Fr 10:00-18:00',
    status: 'pending',
    admin_notes: 'Test notes',
    payment_methods: {
      cash: true,
      credit_card: false
    },
    location_categories: [
      { category_id: 'cat1' }
    ],
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    deleted_at: null,
    opening_hours_text: null,
    opening_hours_structured: null,
    submission_type: null,
    submitted_by_email: null,
    related_location_id: null,
    approved_by: null,
    rejection_reason: null
  }

  const mockCategories = [
    { id: 'cat1', name_de: 'Category 1', name_en: 'Category 1', slug: 'cat1', icon: null, color: null, sort_order: 1, created_at: '2024-01-01', icon_url: null, description_de: null, description_en: null, updated_at: null },
    { id: 'cat2', name_de: 'Category 2', name_en: 'Category 2', slug: 'cat2', icon: null, color: null, sort_order: 2, created_at: '2024-01-01', icon_url: null, description_de: null, description_en: null, updated_at: null }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders form with location data', async () => {
    const wrapper = mount(LocationEditForm, {
      props: {
        location: mockLocation,
        categories: mockCategories,
        loading: false
      },
      global: {
        plugins: [i18n]
      }
    })

    await wrapper.vm.$nextTick()

    const nameInput = wrapper.find('#name').element as HTMLInputElement
    const slugInput = wrapper.find('#slug').element as HTMLInputElement
    const addressInput = wrapper.find('#address').element as HTMLInputElement

    expect(nameInput.value).toBe('Test Location')
    expect(slugInput.value).toBe('test-location')
    expect(addressInput.value).toBe('123 Test St')
  })

  test('emits save event with form data', async () => {
    const wrapper = mount(LocationEditForm, {
      props: {
        location: mockLocation,
        categories: mockCategories
      },
      global: {
        plugins: [i18n]
      }
    })

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted()).toHaveProperty('save')
    const saveEvent = wrapper.emitted('save')![0][0] as any
    expect(saveEvent).toHaveProperty('location')
    expect(saveEvent).toHaveProperty('categoryIds')
  })

  test('auto-generates slug from name', async () => {
    const emptyLocation = {
      ...mockLocation,
      name: '',
      slug: null
    }

    const wrapper = mount(LocationEditForm, {
      props: {
        location: emptyLocation,
        categories: mockCategories
      },
      global: {
        plugins: [i18n]
      }
    })

    const nameInput = wrapper.find('#name')
    await nameInput.setValue('New Location Name')
    await nameInput.trigger('input')

    const slugInput = wrapper.find('#slug').element as HTMLInputElement
    expect(slugInput.value).toBe('new-location-name')
  })

  test('tracks dirty state', async () => {
    const wrapper = mount(LocationEditForm, {
      props: {
        location: mockLocation,
        categories: mockCategories
      },
      global: {
        plugins: [i18n]
      }
    })

    await wrapper.vm.$nextTick()

    const submitButton = wrapper.find('button[type="submit"]')
    // Initially disabled because form is not dirty
    expect(submitButton.attributes('disabled')).toBeDefined()

    const nameInput = wrapper.find('#name')
    await nameInput.setValue('Updated Name')
    await wrapper.vm.$nextTick()

    // After change, button should be enabled (not disabled)
    expect(submitButton.attributes('disabled')).toBeUndefined()
  })

  test('shows loading state on submit button', () => {
    const wrapper = mount(LocationEditForm, {
      props: {
        location: mockLocation,
        categories: mockCategories,
        loading: true
      },
      global: {
        plugins: [i18n]
      }
    })

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.text()).toContain('Loading')
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  test('renders category checkboxes', () => {
    const wrapper = mount(LocationEditForm, {
      props: {
        location: mockLocation,
        categories: mockCategories
      },
      global: {
        plugins: [i18n]
      }
    })

    const categoryCheckboxes = wrapper.findAll('input[type="checkbox"][value="cat1"], input[type="checkbox"][value="cat2"]')
    expect(categoryCheckboxes.length).toBeGreaterThan(0)
  })

  test('renders payment method checkboxes', () => {
    const wrapper = mount(LocationEditForm, {
      props: {
        location: mockLocation,
        categories: mockCategories
      },
      global: {
        plugins: [i18n]
      }
    })

    const form = wrapper.find('form')
    expect(form.html()).toContain('Cash')
    expect(form.html()).toContain('Credit Card')
  })

  test('emits cancel event', async () => {
    const wrapper = mount(LocationEditForm, {
      props: {
        location: mockLocation,
        categories: mockCategories
      },
      global: {
        plugins: [i18n]
      }
    })

    const cancelButton = wrapper.find('button[type="button"]')
    await cancelButton.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('cancel')
  })

  test('excludes non-updatable fields from save payload (regression test)', async () => {
    // This test ensures that non-updatable fields are not included in the save payload:
    // - location_categories: joined relation, causes "column not found" error
    // - search_vector: generated column, causes "can only be updated to DEFAULT" error
    const locationWithSearchVector = {
      ...mockLocation,
      search_vector: "'test':1A 'location':2A"
    }

    const wrapper = mount(LocationEditForm, {
      props: {
        location: locationWithSearchVector,
        categories: mockCategories
      },
      global: {
        plugins: [i18n]
      }
    })

    // Make a change to enable the save button
    const nameInput = wrapper.find('#name')
    await nameInput.setValue('Updated Name')
    await wrapper.vm.$nextTick()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted()).toHaveProperty('save')
    const saveEvent = wrapper.emitted('save')![0][0] as any

    // The location object should NOT contain non-updatable fields
    expect(saveEvent.location).not.toHaveProperty('location_categories')
    expect(saveEvent.location).not.toHaveProperty('search_vector')

    // But categoryIds should be passed separately
    expect(saveEvent).toHaveProperty('categoryIds')
    expect(saveEvent.categoryIds).toEqual(['cat1'])
  })
})
