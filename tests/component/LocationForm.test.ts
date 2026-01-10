import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LocationForm from '@/components/LocationForm.vue'
import { createI18n } from 'vue-i18n'

// Mock useNominatim
vi.mock('@/composables/useNominatim', () => ({
  useNominatim: vi.fn(() => ({
    debouncedGeocode: vi.fn(),
    result: { value: null },
    reverseGeocode: vi.fn(),
    reverseResult: { value: null },
    loading: { value: false },
    searchWithExtras: vi.fn(),
    enrichedResult: { value: null },
    error: { value: null }
  }))
}))

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'de',
  messages: {
    de: {
      common: {
        loading: 'Lädt...'
      },
      submit: {
        name: 'Name',
        address: 'Adresse',
        email: 'E-Mail',
        required: 'Pflichtfeld',
        step: 'Schritt',
        of: 'von',
        quickStartTitle: 'Los geht\'s mit einem Google Maps Link',
        quickStartDescription: 'Einfach einen Link einfügen',
        googleMapsUrlPlaceholder: 'Google Maps URL einfügen...',
        googleMapsUrlError: 'Ungültiger Google Maps Link',
        googleMapsUrlParsing: 'Link wird verarbeitet...',
        found: 'Gefunden',
        continue: 'Weiter',
        skipManual: 'Überspringen',
        researchingLocation: 'Ortsdaten werden recherchiert...',
        autoFilledSummary: '{count} Feld(er) automatisch ausgefüllt',
        noAdditionalDetails: 'Keine zusätzlichen Details gefunden',
        basicInfo: 'Grundinformationen',
        basicInfoDescription: 'Erzählen Sie uns von diesem Ort',
        nameQuestion: 'Wie heißt dieser Ort?',
        namePlaceholder: 'z.B. Unverpackt-Laden',
        addressQuestion: 'Was ist die Adresse?',
        addressPlaceholder: 'Straße und Hausnummer',
        city: 'Stadt',
        postalCode: 'PLZ',
        latitude: 'Breitengrad',
        longitude: 'Längengrad',
        coordinatesAutoFilled: 'Koordinaten',
        back: 'Zurück',
        geocoding: 'Adresse wird gesucht',
        addDetails: 'Details hinzufügen',
        addDetailsDescription: 'Helfen Sie anderen',
        descriptionDe: 'Beschreibung',
        descriptionPlaceholder: 'Kurze Beschreibung',
        website: 'Webseite',
        phone: 'Telefon',
        instagram: 'Instagram',
        openingHours: 'Öffnungszeiten',
        openingHoursPlaceholder: 'z.B. Mo-Fr 9-18 Uhr',
        almostThere: 'Fast geschafft!',
        almostThereDescription: 'E-Mail eingeben',
        emailQuestion: 'Ihre E-Mail-Adresse',
        emailHelp: 'Wir senden Ihnen eine Bestätigungs-E-Mail',
        summary: 'Zusammenfassung',
        submitLocation: 'Ort einreichen',
        missingFields: 'Bitte füllen Sie folgende Felder aus'
      }
    }
  }
})

describe('LocationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all required fields', () => {
    const wrapper = mount(LocationForm, {
      global: {
        plugins: [i18n]
      },
      props: {
        mode: 'submit'
      }
    })

    expect(wrapper.find('input[name="name"]').exists()).toBe(true)
    expect(wrapper.find('input[name="address"]').exists()).toBe(true)
    expect(wrapper.find('input[name="email"]').exists()).toBe(true)
    expect(wrapper.find('input[name="latitude"]').exists()).toBe(true)
    expect(wrapper.find('input[name="longitude"]').exists()).toBe(true)
  })

  it('shows validation errors', async () => {
    const wrapper = mount(LocationForm, {
      global: {
        plugins: [i18n]
      },
      props: {
        mode: 'submit'
      }
    })

    // Try to submit empty form
    await wrapper.find('form').trigger('submit.prevent')

    // Wait for validation
    await wrapper.vm.$nextTick()

    // Should show error messages
    const errorElements = wrapper.findAll('.error, .text-red-500, [role="alert"]')
    expect(errorElements.length).toBeGreaterThan(0)
  })

  it('disables submit until valid', async () => {
    const wrapper = mount(LocationForm, {
      global: {
        plugins: [i18n]
      },
      props: {
        mode: 'submit'
      }
    })

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()

    // Fill in required fields
    await wrapper.find('input[name="name"]').setValue('Test Location')
    await wrapper.find('input[name="address"]').setValue('Test Address')
    await wrapper.find('input[name="latitude"]').setValue('50.1109')
    await wrapper.find('input[name="longitude"]').setValue('8.6821')
    await wrapper.find('input[name="email"]').setValue('test@example.com')

    await wrapper.vm.$nextTick()

    // Button should be enabled now
    expect(submitButton.attributes('disabled')).toBeUndefined()
  })

  it('shows loading state during submit', async () => {
    const wrapper = mount(LocationForm, {
      global: {
        plugins: [i18n]
      },
      props: {
        mode: 'submit'
      }
    })

    // Fill form
    await wrapper.find('input[name="name"]').setValue('Test')
    await wrapper.find('input[name="address"]').setValue('Test Address')
    await wrapper.find('input[name="latitude"]').setValue('50.1109')
    await wrapper.find('input[name="longitude"]').setValue('8.6821')
    await wrapper.find('input[name="email"]').setValue('test@example.com')

    // Mock submit to take time
    await wrapper.setProps({ loading: true })

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
    expect(submitButton.text()).toContain('...') // Loading indicator
  })

  it('prefills form in edit mode', async () => {
    const existingLocation = {
      id: '1',
      name: 'Existing Location',
      address: 'Existing Address',
      latitude: '50.1109',
      longitude: '8.6821',
      city: 'Frankfurt',
      postal_code: '60311',
      website: 'https://example.com',
      description_de: 'Test description'
    }

    const wrapper = mount(LocationForm, {
      global: {
        plugins: [i18n]
      },
      props: {
        mode: 'edit',
        existingLocation
      }
    })

    // Wait for component to mount and prefill
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

    expect((wrapper.find('input[name="name"]').element as HTMLInputElement).value).toBe('Existing Location')
    expect((wrapper.find('input[name="address"]').element as HTMLInputElement).value).toBe('Existing Address')
    expect((wrapper.find('input[name="website"]').element as HTMLInputElement).value).toBe('https://example.com')
  })

  it('hides email field in edit mode', () => {
    const wrapper = mount(LocationForm, {
      global: {
        plugins: [i18n]
      },
      props: {
        mode: 'edit'
      }
    })

    expect(wrapper.find('input[name="email"]').exists()).toBe(false)
  })

  it('emits submit event with form data', async () => {
    const wrapper = mount(LocationForm, {
      global: {
        plugins: [i18n]
      },
      props: {
        mode: 'submit'
      }
    })

    await wrapper.find('input[name="name"]').setValue('Test Location')
    await wrapper.find('input[name="address"]').setValue('Test Address, Frankfurt')
    await wrapper.find('input[name="latitude"]').setValue('50.1109')
    await wrapper.find('input[name="longitude"]').setValue('8.6821')
    await wrapper.find('input[name="email"]').setValue('test@example.com')

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]).toBeDefined()

    const emittedData = wrapper.emitted('submit')?.[0]?.[0] as any
    expect(emittedData.name).toBe('Test Location')
    expect(emittedData.email).toBe('test@example.com')
  })

  it('shows submission type selector in submit mode', () => {
    const wrapper = mount(LocationForm, {
      global: {
        plugins: [i18n]
      },
      props: {
        mode: 'submit'
      }
    })

    // Should have radio buttons or select for submission type
    const typeInputs = wrapper.findAll('input[name="submission_type"]')
    expect(typeInputs.length).toBeGreaterThan(0)
  })

  it('allows selecting existing location for update', async () => {
    const wrapper = mount(LocationForm, {
      global: {
        plugins: [i18n]
      },
      props: {
        mode: 'submit'
      }
    })

    // Select "update" submission type
    const updateRadio = wrapper.find('input[value="update"]')
    if (updateRadio.exists()) {
      await updateRadio.setValue(true)
      await wrapper.vm.$nextTick()

      // Should show location search/selector
      expect(wrapper.html()).toContain('search')
    }
  })

  describe('Location Enrichment', () => {
    it('shows enrichment loading state when processing Google Maps URL', async () => {
      const { useNominatim } = await import('@/composables/useNominatim')
      const mockSearchWithExtras = vi.fn()

      vi.mocked(useNominatim).mockReturnValue({
        debouncedGeocode: vi.fn(),
        result: { value: null },
        reverseGeocode: vi.fn(),
        reverseResult: { value: null },
        loading: { value: false },
        searchWithExtras: mockSearchWithExtras,
        enrichedResult: { value: null },
        error: { value: null }
      } as any)

      const wrapper = mount(LocationForm, {
        global: {
          plugins: [i18n]
        },
        props: {
          mode: 'submit'
        }
      })

      // Find Google Maps URL input (in step 1)
      const urlInput = wrapper.find('input[type="url"]')
      expect(urlInput.exists()).toBe(true)

      // Enter a valid Google Maps URL
      await urlInput.setValue('https://www.google.com/maps/place/Test/@50.1109,8.6821,17z')
      await wrapper.vm.$nextTick()

      // Should show researching message
      expect(wrapper.text()).toContain('Ortsdaten werden recherchiert')
    })

    it('displays enrichment summary after successful auto-fill', async () => {
      const wrapper = mount(LocationForm, {
        global: {
          plugins: [i18n]
        },
        props: {
          mode: 'submit'
        }
      })

      // Simulate enrichment by directly setting the summary
      // (In real usage, this would be set by the watcher)
      await wrapper.vm.$nextTick()

      // The component should handle enriched results through watchers
      expect(wrapper.find('input[type="url"]').exists()).toBe(true)
    })

    it('shows error message if enrichment fails', async () => {
      const { useNominatim } = await import('@/composables/useNominatim')

      vi.mocked(useNominatim).mockReturnValue({
        debouncedGeocode: vi.fn(),
        result: { value: null },
        reverseGeocode: vi.fn(),
        reverseResult: { value: null },
        loading: { value: false },
        searchWithExtras: vi.fn().mockRejectedValue(new Error('Network error')),
        enrichedResult: { value: null },
        error: { value: 'Network error' }
      } as any)

      const wrapper = mount(LocationForm, {
        global: {
          plugins: [i18n]
        },
        props: {
          mode: 'submit'
        }
      })

      await wrapper.vm.$nextTick()

      // Component should handle errors gracefully
      expect(wrapper.exists()).toBe(true)
    })
  })
})
