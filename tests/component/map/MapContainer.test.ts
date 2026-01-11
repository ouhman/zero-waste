import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import MapContainer from '@/components/map/MapContainer.vue'
import { createMockLocation } from '../../utils/test-helpers'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row'] & {
  location_categories?: {
    categories: Database['public']['Tables']['categories']['Row']
  }[]
}

// Mock Leaflet with more complete implementation
const mockMarker = {
  addTo: vi.fn().mockReturnThis(),
  bindPopup: vi.fn().mockReturnThis(),
  openPopup: vi.fn().mockReturnThis(),
  remove: vi.fn(),
  getElement: vi.fn(() => ({
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    },
    style: {
      zIndex: ''
    }
  }))
}

const mockMap = {
  setView: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  remove: vi.fn(),
  closePopup: vi.fn(),
  panTo: vi.fn(),
  getBounds: vi.fn(() => ({
    contains: vi.fn(() => false)
  }))
}

const mockTileLayer = {
  addTo: vi.fn().mockReturnThis()
}

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => mockTileLayer),
    marker: vi.fn(() => mockMarker),
    icon: vi.fn(() => ({})),
    latLng: vi.fn((lat: number, lng: number) => ({ lat, lng }))
  }
}))

// Mock marker icons
vi.mock('@/lib/markerIcons', () => ({
  getCategoryIcon: vi.fn(() => ({}))
}))

// Mock PopupCard
vi.mock('@/components/map/PopupCard', () => ({
  generatePopupHTML: vi.fn((location) => `<div class="popup-content">${location.name}</div>`)
}))

describe('MapContainer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders map container', () => {
    const wrapper = mount(MapContainer)
    expect(wrapper.find('.map-container').exists()).toBe(true)
  })

  it('initializes Leaflet map on mount', async () => {
    const L = await import('leaflet')
    mount(MapContainer)

    // Wait for onMounted hook
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(L.default.map).toHaveBeenCalled()
    expect(L.default.tileLayer).toHaveBeenCalled()
    expect(mockTileLayer.addTo).toHaveBeenCalled()
  })

  it('centers on Frankfurt by default', async () => {
    mount(MapContainer)
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockMap.setView).toHaveBeenCalledWith(
      [50.1109, 8.6821],
      13
    )
  })

  it('centers on custom coordinates when provided', async () => {
    mount(MapContainer, {
      props: {
        centerLat: 51.5074,
        centerLng: -0.1278
      }
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockMap.setView).toHaveBeenCalledWith(
      [51.5074, -0.1278],
      13
    )
  })

  it('creates markers for locations', async () => {
    const L = await import('leaflet')
    const location = createMockLocation({
      id: 'loc-1',
      name: 'Test Location',
      latitude: '50.1109',
      longitude: '8.6821'
    })

    mount(MapContainer, {
      props: {
        locations: [location]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(L.default.marker).toHaveBeenCalledWith(
      [50.1109, 8.6821],
      expect.any(Object)
    )
    expect(mockMarker.addTo).toHaveBeenCalled()
    expect(mockMarker.bindPopup).toHaveBeenCalled()
  })

  it('creates multiple markers for multiple locations', async () => {
    const L = await import('leaflet')
    const locations: Location[] = [
      createMockLocation({ id: 'loc-1', latitude: '50.1109', longitude: '8.6821' }) as Location,
      createMockLocation({ id: 'loc-2', latitude: '50.1209', longitude: '8.6921' }) as Location,
      createMockLocation({ id: 'loc-3', latitude: '50.1309', longitude: '8.7021' }) as Location
    ]

    mount(MapContainer, {
      props: {
        locations
      }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(L.default.marker).toHaveBeenCalledTimes(3)
  })

  it('skips locations with invalid coordinates', async () => {
    const L = await import('leaflet')
    const locations: Location[] = [
      createMockLocation({ id: 'loc-1', latitude: '50.1109', longitude: '8.6821' }) as Location,
      createMockLocation({ id: 'loc-2', latitude: 'invalid', longitude: '8.6921' }) as Location,
      createMockLocation({ id: 'loc-3', latitude: '50.1309', longitude: 'invalid' }) as Location
    ]

    mount(MapContainer, {
      props: {
        locations
      }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    // Only one valid location should create a marker
    expect(L.default.marker).toHaveBeenCalledTimes(1)
  })

  it('updates markers when locations prop changes', async () => {
    const L = await import('leaflet')
    const location1 = createMockLocation({ id: 'loc-1' })
    const location2 = createMockLocation({ id: 'loc-2' })

    const wrapper = mount(MapContainer, {
      props: {
        locations: [location1]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    // Clear mock calls from initial render
    vi.clearAllMocks()

    // Update locations
    await wrapper.setProps({
      locations: [location1, location2]
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    // Should create 2 new markers
    expect(L.default.marker).toHaveBeenCalledTimes(2)
  })

  it('emits show-details event when popup detail button is clicked', async () => {
    const wrapper = mount(MapContainer)
    await new Promise(resolve => setTimeout(resolve, 0))

    // Simulate popupopen event
    const popupopenCallback = mockMap.on.mock.calls.find(
      call => call[0] === 'popupopen'
    )?.[1]

    expect(popupopenCallback).toBeDefined()

    // Create a mock button in DOM
    const mockButton = document.createElement('button')
    mockButton.className = 'location-details-btn'
    mockButton.dataset.locationId = 'test-location-id'
    document.body.appendChild(mockButton)

    // Trigger popupopen
    popupopenCallback()

    // Wait for setTimeout in popupopen handler
    await new Promise(resolve => setTimeout(resolve, 10))

    // Simulate button click
    mockButton.click()

    expect(wrapper.emitted('show-details')).toBeTruthy()
    expect(wrapper.emitted('show-details')![0]).toEqual(['test-location-id'])

    // Cleanup
    document.body.removeChild(mockButton)
  })

  it('emits share-location event when popup share button is clicked', async () => {
    const wrapper = mount(MapContainer)
    await new Promise(resolve => setTimeout(resolve, 0))

    // Create a mock button in DOM
    const mockButton = document.createElement('button')
    mockButton.className = 'location-share-btn'
    mockButton.dataset.locationId = 'share-test-id'
    document.body.appendChild(mockButton)

    // Trigger popupopen
    const popupopenCallback = mockMap.on.mock.calls.find(
      call => call[0] === 'popupopen'
    )?.[1]
    popupopenCallback()

    await new Promise(resolve => setTimeout(resolve, 10))

    // Simulate button click
    mockButton.click()

    expect(wrapper.emitted('share-location')).toBeTruthy()
    expect(wrapper.emitted('share-location')![0]).toEqual(['share-test-id'])

    // Cleanup
    document.body.removeChild(mockButton)
  })

  it('exposes centerOn method', async () => {
    const wrapper = mount(MapContainer)
    await new Promise(resolve => setTimeout(resolve, 0))

    vi.clearAllMocks()

    wrapper.vm.centerOn(52.5200, 13.4050, 15)

    expect(mockMap.setView).toHaveBeenCalledWith([52.5200, 13.4050], 15)
  })

  it('exposes centerOn method with default zoom', async () => {
    const wrapper = mount(MapContainer)
    await new Promise(resolve => setTimeout(resolve, 0))

    vi.clearAllMocks()

    wrapper.vm.centerOn(52.5200, 13.4050)

    expect(mockMap.setView).toHaveBeenCalledWith([52.5200, 13.4050], 13)
  })

  it('exposes focusLocation method', async () => {
    const location = createMockLocation({
      id: 'loc-1',
      latitude: '50.1109',
      longitude: '8.6821'
    })

    const wrapper = mount(MapContainer, {
      props: {
        locations: [location]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    vi.clearAllMocks()

    wrapper.vm.focusLocation('loc-1')

    expect(mockMap.setView).toHaveBeenCalledWith([50.1109, 8.6821], 17)
  })

  it('exposes highlightMarker method', async () => {
    const location = createMockLocation({
      id: 'loc-1',
      latitude: '50.1109',
      longitude: '8.6821'
    })

    const wrapper = mount(MapContainer, {
      props: {
        locations: [location]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify the method exists and can be called without error
    expect(wrapper.vm.highlightMarker).toBeDefined()
    expect(() => wrapper.vm.highlightMarker('loc-1')).not.toThrow()

    // Verify getElement was called
    expect(mockMarker.getElement).toHaveBeenCalled()
  })

  it('exposes ensureVisible method', async () => {
    const wrapper = mount(MapContainer)
    await new Promise(resolve => setTimeout(resolve, 0))

    vi.clearAllMocks()

    // Mock that point is not in bounds
    mockMap.getBounds.mockReturnValue({
      contains: vi.fn(() => false)
    })

    wrapper.vm.ensureVisible(50.1109, 8.6821)

    expect(mockMap.panTo).toHaveBeenCalled()
  })

  it('does not pan if location is already visible', async () => {
    const wrapper = mount(MapContainer)
    await new Promise(resolve => setTimeout(resolve, 0))

    vi.clearAllMocks()

    // Mock that point is in bounds
    mockMap.getBounds.mockReturnValue({
      contains: vi.fn(() => true)
    })

    wrapper.vm.ensureVisible(50.1109, 8.6821)

    expect(mockMap.panTo).not.toHaveBeenCalled()
  })

  it('removes map on unmount', async () => {
    const wrapper = mount(MapContainer)
    await new Promise(resolve => setTimeout(resolve, 0))

    wrapper.unmount()

    expect(mockMap.remove).toHaveBeenCalled()
  })

  it('updates map view when center props change', async () => {
    const wrapper = mount(MapContainer, {
      props: {
        centerLat: 50.1109,
        centerLng: 8.6821
      }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    vi.clearAllMocks()

    await wrapper.setProps({
      centerLat: 52.5200,
      centerLng: 13.4050
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockMap.setView).toHaveBeenCalledWith([52.5200, 13.4050], 13)
  })

  it('does not update map view when center props are unchanged', async () => {
    const wrapper = mount(MapContainer, {
      props: {
        centerLat: 50.1109,
        centerLng: 8.6821
      }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    vi.clearAllMocks()

    await wrapper.setProps({
      centerLat: 50.1109,
      centerLng: 8.6821
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockMap.setView).not.toHaveBeenCalled()
  })

  it('handles locations with categories', async () => {
    const location: Location = {
      ...createMockLocation({
        id: 'loc-1',
        latitude: '50.1109',
        longitude: '8.6821'
      }),
      location_categories: [
        {
          categories: {
            id: 'cat-1',
            slug: 'unverpackt',
            name_de: 'Unverpackt',
            name_en: 'Unpackaged',
            icon: null,
            icon_url: null,
            color: '#10b981',
            sort_order: 1,
            description_de: null,
            description_en: null,
            created_at: '2024-01-01',
            updated_at: null
          }
        }
      ]
    }

    mount(MapContainer, {
      props: {
        locations: [location]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    const L = await import('leaflet')
    expect(L.default.marker).toHaveBeenCalled()
  })

  it('closes popup when details button is clicked', async () => {
    const wrapper = mount(MapContainer)
    await new Promise(resolve => setTimeout(resolve, 0))

    // Create a mock button in DOM
    const mockButton = document.createElement('button')
    mockButton.className = 'location-details-btn'
    mockButton.dataset.locationId = 'test-id'
    document.body.appendChild(mockButton)

    // Trigger popupopen
    const popupopenCallback = mockMap.on.mock.calls.find(
      call => call[0] === 'popupopen'
    )?.[1]
    popupopenCallback()

    await new Promise(resolve => setTimeout(resolve, 10))

    mockButton.click()

    expect(mockMap.closePopup).toHaveBeenCalled()

    // Cleanup
    document.body.removeChild(mockButton)
  })

  it('closes popup when share button is clicked', async () => {
    const wrapper = mount(MapContainer)
    await new Promise(resolve => setTimeout(resolve, 0))

    // Create a mock button in DOM
    const mockButton = document.createElement('button')
    mockButton.className = 'location-share-btn'
    mockButton.dataset.locationId = 'test-id'
    document.body.appendChild(mockButton)

    // Trigger popupopen
    const popupopenCallback = mockMap.on.mock.calls.find(
      call => call[0] === 'popupopen'
    )?.[1]
    popupopenCallback()

    await new Promise(resolve => setTimeout(resolve, 10))

    mockButton.click()

    expect(mockMap.closePopup).toHaveBeenCalled()

    // Cleanup
    document.body.removeChild(mockButton)
  })
})
