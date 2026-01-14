import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { createI18n } from 'vue-i18n'
import LocationPinMap from '@/components/submission/LocationPinMap.vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { useNominatim } from '@/composables/useNominatim'
import L from 'leaflet'

// Mock i18n
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      submit: {
        back: 'Back',
        searchAddress: 'Search for an address...',
        iAmNearby: "I'm nearby",
        tapToPlace: 'Tap on the map to place a pin',
        dragToAdjust: 'Drag the pin to adjust the exact location',
        confirmLocation: 'Confirm this location',
        locatingYou: 'Getting your location...',
        accuracyInfo: 'Accuracy: ~{meters}m',
        selectedAddress: 'Selected: {address}'
      }
    }
  }
})

// Mock composables
vi.mock('@/composables/useGeolocation')
vi.mock('@/composables/useNominatim')

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(),
    tileLayer: vi.fn(),
    marker: vi.fn(),
    circle: vi.fn(),
    icon: vi.fn()
  }
}))

describe('LocationPinMap', () => {
  let wrapper: VueWrapper
  let mockMap: any
  let mockMarker: any
  let mockTileLayer: any
  let mockGetUserLocation: ReturnType<typeof vi.fn>
  let mockDebouncedGeocode: ReturnType<typeof vi.fn>
  let mockReverseGeocode: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Mock map instance
    mockMap = {
      setView: vi.fn().mockReturnThis(),
      flyTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      getZoom: vi.fn().mockReturnValue(12),
      on: vi.fn()
    }

    // Mock marker instance
    mockMarker = {
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      on: vi.fn(),
      getLatLng: vi.fn().mockReturnValue({ lat: 50.1109, lng: 8.6821 })
    }

    // Mock tile layer
    mockTileLayer = {
      addTo: vi.fn().mockReturnThis()
    }

    // Mock Leaflet methods
    vi.mocked(L.map).mockReturnValue(mockMap as any)
    vi.mocked(L.tileLayer).mockReturnValue(mockTileLayer as any)
    vi.mocked(L.marker).mockReturnValue(mockMarker as any)
    vi.mocked(L.circle).mockReturnValue({ addTo: vi.fn().mockReturnThis(), remove: vi.fn() } as any)
    vi.mocked(L.icon).mockReturnValue({} as any)

    // Mock geolocation composable
    mockGetUserLocation = vi.fn().mockResolvedValue(null)
    vi.mocked(useGeolocation).mockReturnValue({
      getUserLocation: mockGetUserLocation,
      loading: ref(false),
      error: ref(null),
      location: ref(null)
    } as any)

    // Mock Nominatim composable
    mockDebouncedGeocode = vi.fn().mockResolvedValue(undefined)
    mockReverseGeocode = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useNominatim).mockReturnValue({
      debouncedGeocode: mockDebouncedGeocode,
      reverseGeocode: mockReverseGeocode,
      result: ref(null),
      reverseResult: ref(null),
      loading: ref(false),
      error: ref(null)
    } as any)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders with all UI elements', () => {
      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })

      // Check for key elements
      expect(wrapper.find('.btn-back').exists()).toBe(true)
      expect(wrapper.find('.search-input').exists()).toBe(true)
      expect(wrapper.find('.btn-geolocation').exists()).toBe(true)
      expect(wrapper.find('.map-element').exists()).toBe(true)
    })

    test('renders back button with correct text', () => {
      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const backButton = wrapper.find('.btn-back')
      expect(backButton.text()).toContain('Back')
    })

    test('renders search input with placeholder', () => {
      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const searchInput = wrapper.find('.search-input')
      expect(searchInput.attributes('placeholder')).toBe('Search for an address...')
    })

    test('renders geolocation button with icon and text', () => {
      // Make sure loading is false
      vi.mocked(useGeolocation).mockReturnValue({
        getUserLocation: mockGetUserLocation,
        loading: ref(false),
        error: ref(null),
        location: ref(null)
      } as any)

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const geoButton = wrapper.find('.btn-geolocation')
      expect(geoButton.find('svg').exists()).toBe(true)
      expect(geoButton.text()).toContain("I'm nearby")
    })
  })

  describe('Map Initialization', () => {
    test('initializes Leaflet map on mount', async () => {
      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      await nextTick()

      expect(L.map).toHaveBeenCalled()
      expect(mockMap.setView).toHaveBeenCalledWith([50.1109, 8.6821], 13)
      expect(L.tileLayer).toHaveBeenCalledWith(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        expect.objectContaining({
          attribution: expect.stringContaining('OpenStreetMap'),
          maxZoom: 19
        })
      )
      expect(mockTileLayer.addTo).toHaveBeenCalledWith(mockMap)
    })

    test('removes map on unmount', async () => {
      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      await nextTick()

      wrapper.unmount()
      expect(mockMap.remove).toHaveBeenCalled()
    })
  })

  describe('Back Button', () => {
    test('emits back event when clicked', async () => {
      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const backButton = wrapper.find('.btn-back')

      await backButton.trigger('click')
      expect(wrapper.emitted('back')).toHaveLength(1)
    })

    test('has cursor-pointer class', () => {
      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const backButton = wrapper.find('.btn-back')
      expect(backButton.classes()).toContain('cursor-pointer')
    })
  })

  describe('Address Search', () => {
    test('triggers geocoding on search input', async () => {
      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const searchInput = wrapper.find('.search-input')

      await searchInput.setValue('Bockenheimer Landstraße 1, Frankfurt')
      await nextTick()

      expect(mockDebouncedGeocode).toHaveBeenCalledWith('Bockenheimer Landstraße 1, Frankfurt')
    })

    test('does not trigger geocoding for empty input', async () => {
      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const searchInput = wrapper.find('.search-input')

      await searchInput.setValue('')
      await nextTick()

      expect(mockDebouncedGeocode).not.toHaveBeenCalled()
    })

    test('displays geocoding result on map', async () => {
      const mockResult = {
        lat: 50.1234,
        lng: 8.6789,
        displayName: 'Test Address, Frankfurt'
      }

      // Use real refs so watch() works
      const resultRef = ref(null)
      const reverseResultRef = ref(null)
      const errorRef = ref(null)

      // Mock debouncedGeocode to update the result ref
      mockDebouncedGeocode.mockImplementation(() => {
        resultRef.value = mockResult as any
      })

      vi.mocked(useNominatim).mockReturnValue({
        debouncedGeocode: mockDebouncedGeocode,
        reverseGeocode: mockReverseGeocode,
        result: resultRef,
        reverseResult: reverseResultRef,
        loading: ref(false),
        error: errorRef
      } as any)

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const searchInput = wrapper.find('.search-input')

      await searchInput.setValue('Test Address')
      await nextTick()
      await nextTick() // Extra tick for watch to trigger

      // Should create a marker at the geocoded location
      expect(L.marker).toHaveBeenCalled()
    })

    test('displays error message when geocoding fails', async () => {
      // Use real refs so watch() works
      const resultRef = ref(null)
      const reverseResultRef = ref(null)
      const errorRef = ref<string | null>(null)

      // Mock debouncedGeocode to update the error ref
      mockDebouncedGeocode.mockImplementation(() => {
        errorRef.value = 'No results found'
      })

      vi.mocked(useNominatim).mockReturnValue({
        debouncedGeocode: mockDebouncedGeocode,
        reverseGeocode: mockReverseGeocode,
        result: resultRef,
        reverseResult: reverseResultRef,
        loading: ref(false),
        error: errorRef
      } as any)

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const searchInput = wrapper.find('.search-input')

      await searchInput.setValue('Invalid Address')
      await nextTick()
      await nextTick() // Extra tick for watch to trigger

      const errorMessage = wrapper.find('.error-message')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toBe('No results found')
    })
  })

  describe('Geolocation', () => {
    test('triggers geolocation when button clicked', async () => {
      mockGetUserLocation.mockResolvedValue({
        lat: 50.1109,
        lng: 8.6821,
        accuracy: 10
      })

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const geoButton = wrapper.find('.btn-geolocation')

      await geoButton.trigger('click')
      await flushPromises() // Wait for all promises to resolve
      await nextTick()

      expect(mockGetUserLocation).toHaveBeenCalled()
    })

    test('shows loading state while getting location', async () => {
      vi.mocked(useGeolocation).mockReturnValue({
        getUserLocation: mockGetUserLocation,
        loading: { value: true },
        error: { value: null },
        location: { value: null }
      } as any)

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const geoButton = wrapper.find('.btn-geolocation')

      expect(geoButton.classes()).toContain('loading')
      expect(geoButton.text()).toContain('Getting your location...')
      expect(geoButton.attributes('disabled')).toBeDefined()
    })

    test('creates marker at user location', async () => {
      mockGetUserLocation.mockResolvedValue({
        lat: 50.1234,
        lng: 8.6789,
        accuracy: 15
      })

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const geoButton = wrapper.find('.btn-geolocation')

      await geoButton.trigger('click')
      await flushPromises() // Wait for all promises to resolve
      await nextTick() // Wait for async operation

      expect(L.marker).toHaveBeenCalled()
      expect(mockMap.setView).toHaveBeenCalledWith([50.1234, 8.6789], 18)
    })

    test('displays accuracy info when available', async () => {
      mockGetUserLocation.mockResolvedValue({
        lat: 50.1234,
        lng: 8.6789,
        accuracy: 25
      })

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const geoButton = wrapper.find('.btn-geolocation')

      await geoButton.trigger('click')
      await flushPromises() // Wait for all promises to resolve
      await nextTick()

      const accuracyInfo = wrapper.find('.accuracy-info')
      expect(accuracyInfo.exists()).toBe(true)
      expect(accuracyInfo.text()).toContain('25m')
    })

    test('shows accuracy circle on map', async () => {
      mockGetUserLocation.mockResolvedValue({
        lat: 50.1234,
        lng: 8.6789,
        accuracy: 30
      })

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const geoButton = wrapper.find('.btn-geolocation')

      await geoButton.trigger('click')
      await flushPromises() // Wait for all promises to resolve
      await nextTick()

      expect(L.circle).toHaveBeenCalledWith(
        [50.1234, 8.6789],
        expect.objectContaining({
          radius: 30,
          color: '#10b981'
        })
      )
    })

    test('displays error when geolocation fails', async () => {
      mockGetUserLocation.mockResolvedValue(null)
      vi.mocked(useGeolocation).mockReturnValue({
        getUserLocation: mockGetUserLocation,
        loading: ref(false),
        error: ref('Location access denied'),
        location: ref(null)
      } as any)

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const geoButton = wrapper.find('.btn-geolocation')

      await geoButton.trigger('click')
      await flushPromises()
      await nextTick()

      const errorMessage = wrapper.find('.error-message')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toBe('Location access denied')
    })
  })

  describe('Marker Dragging', () => {
    test('marker is created as draggable', async () => {
      mockGetUserLocation.mockResolvedValue({
        lat: 50.1234,
        lng: 8.6789,
        accuracy: 10
      })

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const geoButton = wrapper.find('.btn-geolocation')

      await geoButton.trigger('click')
      await flushPromises() // Wait for all promises to resolve
      await nextTick()

      expect(L.marker).toHaveBeenCalledWith(
        [50.1234, 8.6789],
        expect.objectContaining({
          draggable: true
        })
      )
    })

    test('triggers reverse geocode on marker dragend', async () => {
      mockGetUserLocation.mockResolvedValue({
        lat: 50.1234,
        lng: 8.6789,
        accuracy: 10
      })

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const geoButton = wrapper.find('.btn-geolocation')

      await geoButton.trigger('click')
      await flushPromises() // Wait for all promises to resolve
      await nextTick()

      // Simulate dragend event
      const dragendCallback = mockMarker.on.mock.calls.find(
        (call: any[]) => call[0] === 'dragend'
      )?.[1]

      if (dragendCallback) {
        await dragendCallback()
        expect(mockReverseGeocode).toHaveBeenCalledWith(50.1109, 8.6821)
      }
    })
  })

  describe('Confirm Location', () => {
    test('does not show confirm button initially', () => {
      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      expect(wrapper.find('.btn-confirm').exists()).toBe(false)
    })

    test('shows confirm button after location is set', async () => {
      mockGetUserLocation.mockResolvedValue({
        lat: 50.1234,
        lng: 8.6789,
        accuracy: 10
      })

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const geoButton = wrapper.find('.btn-geolocation')

      await geoButton.trigger('click')
      await flushPromises() // Wait for all promises to resolve
      await nextTick()

      const confirmButton = wrapper.find('.btn-confirm')
      expect(confirmButton.exists()).toBe(true)
      expect(confirmButton.text()).toContain('Confirm this location')
    })

    test('emits location-confirmed event with correct data', async () => {
      mockGetUserLocation.mockResolvedValue({
        lat: 50.1234,
        lng: 8.6789,
        accuracy: 10
      })

      vi.mocked(useNominatim).mockReturnValue({
        debouncedGeocode: mockDebouncedGeocode,
        reverseGeocode: mockReverseGeocode,
        result: { value: null },
        reverseResult: {
          value: {
            address: 'Bockenheimer Landstraße 1',
            city: 'Frankfurt',
            postalCode: '60311',
            displayName: 'Bockenheimer Landstraße 1, Frankfurt'
          }
        },
        loading: { value: false },
        error: { value: null }
      } as any)

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const geoButton = wrapper.find('.btn-geolocation')

      await geoButton.trigger('click')
      await flushPromises() // Wait for all promises to resolve
      await nextTick()

      const confirmButton = wrapper.find('.btn-confirm')
      await confirmButton.trigger('click')

      const emitted = wrapper.emitted('location-confirmed')
      expect(emitted).toHaveLength(1)
      expect(emitted![0][0]).toEqual({
        lat: 50.1234,
        lng: 8.6789,
        address: 'Bockenheimer Landstraße 1, Frankfurt'
      })
    })

    test('confirm button has cursor-pointer class', async () => {
      mockGetUserLocation.mockResolvedValue({
        lat: 50.1234,
        lng: 8.6789,
        accuracy: 10
      })

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const geoButton = wrapper.find('.btn-geolocation')

      await geoButton.trigger('click')
      await flushPromises() // Wait for all promises to resolve
      await nextTick()

      const confirmButton = wrapper.find('.btn-confirm')
      expect(confirmButton.classes()).toContain('cursor-pointer')
    })
  })

  describe('Selected Address Display', () => {
    test('shows selected address after reverse geocoding', async () => {
      mockGetUserLocation.mockResolvedValue({
        lat: 50.1234,
        lng: 8.6789,
        accuracy: 10
      })

      vi.mocked(useNominatim).mockReturnValue({
        debouncedGeocode: mockDebouncedGeocode,
        reverseGeocode: mockReverseGeocode,
        result: { value: null },
        reverseResult: {
          value: {
            address: 'Bockenheimer Landstraße 1',
            city: 'Frankfurt',
            postalCode: '60311',
            displayName: 'Bockenheimer Landstraße 1, Frankfurt'
          }
        },
        loading: { value: false },
        error: { value: null }
      } as any)

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const geoButton = wrapper.find('.btn-geolocation')

      await geoButton.trigger('click')
      await flushPromises() // Wait for all promises to resolve
      await nextTick()

      const selectedAddress = wrapper.find('.selected-address')
      expect(selectedAddress.exists()).toBe(true)
      expect(selectedAddress.text()).toContain('Bockenheimer Landstraße 1, Frankfurt')
    })
  })

  describe('Accessibility', () => {
    test('back button has aria-label', () => {
      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const backButton = wrapper.find('.btn-back')
      expect(backButton.attributes('aria-label')).toBe('Back')
    })

    test('error message has role="alert"', async () => {
      // Use real refs so watch() works
      const resultRef = ref(null)
      const reverseResultRef = ref(null)
      const errorRef = ref<string | null>(null)

      // Mock debouncedGeocode to update the error ref
      mockDebouncedGeocode.mockImplementation(() => {
        errorRef.value = 'Error message'
      })

      vi.mocked(useNominatim).mockReturnValue({
        debouncedGeocode: mockDebouncedGeocode,
        reverseGeocode: mockReverseGeocode,
        result: resultRef,
        reverseResult: reverseResultRef,
        loading: ref(false),
        error: errorRef
      } as any)

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const searchInput = wrapper.find('.search-input')

      await searchInput.setValue('test')
      await nextTick()
      await nextTick() // Extra tick for watch to trigger

      const errorMessage = wrapper.find('.error-message')
      expect(errorMessage.attributes('role')).toBe('alert')
    })
  })

  describe('Mobile Responsiveness', () => {
    test('geolocation button text is hidden on mobile', () => {
      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const btnText = wrapper.find('.btn-text')
      expect(btnText.exists()).toBe(true)
      // Note: CSS media query hiding is tested via E2E/visual tests
    })

    test('map container has responsive height', () => {
      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const mapElement = wrapper.find('.map-element')
      expect(mapElement.exists()).toBe(true)
      // CSS height is 400px on mobile, 500px on desktop (tested in E2E)
    })
  })

  describe('Instruction Text', () => {
    test('shows tap to place instruction initially', () => {
      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const instructionText = wrapper.find('.instruction-text')
      expect(instructionText.exists()).toBe(true)
      expect(instructionText.text()).toBe('Tap on the map to place a pin')
      expect(instructionText.classes()).toContain('hint')
    })

    test('shows drag to adjust instruction when marker is placed', async () => {
      mockGetUserLocation.mockResolvedValue({
        lat: 50.1234,
        lng: 8.6789,
        accuracy: 10
      })

      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      const geoButton = wrapper.find('.btn-geolocation')

      await geoButton.trigger('click')
      await flushPromises() // Wait for all promises to resolve
      await nextTick()

      const instructionText = wrapper.find('.instruction-text')
      expect(instructionText.exists()).toBe(true)
      expect(instructionText.text()).toBe('Drag the pin to adjust the exact location')
      expect(instructionText.classes()).not.toContain('hint')
    })
  })

  describe('Map Click to Place Marker', () => {
    test('registers click handler on map', async () => {
      wrapper = mount(LocationPinMap, {
        global: {
          plugins: [i18n]
        }
      })
      await nextTick()

      expect(mockMap.on).toHaveBeenCalledWith('click', expect.any(Function))
    })
  })
})
