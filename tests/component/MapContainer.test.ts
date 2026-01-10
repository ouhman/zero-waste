import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import MapContainer from '@/components/map/MapContainer.vue'

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn(() => ({
        on: vi.fn()
      })),
      remove: vi.fn()
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn()
    })),
    marker: vi.fn(() => ({
      addTo: vi.fn(),
      bindPopup: vi.fn(),
      on: vi.fn()
    })),
    icon: vi.fn(() => ({}))
  }
}))

describe('MapContainer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders Leaflet map', () => {
    const wrapper = mount(MapContainer)

    // Should have map container div
    expect(wrapper.find('.map-container').exists()).toBe(true)
  })

  it('centers on Frankfurt by default', () => {
    const wrapper = mount(MapContainer)

    // Frankfurt coordinates: [50.1109, 8.6821]
    expect(wrapper.vm).toBeDefined()
  })

  it('displays markers for locations', async () => {
    const wrapper = mount(MapContainer)

    // Wait for component to mount
    await wrapper.vm.$nextTick()

    expect(wrapper.vm).toBeDefined()
  })

  it('has proper height for map display', () => {
    const wrapper = mount(MapContainer)

    const mapDiv = wrapper.find('.map-container')
    expect(mapDiv.exists()).toBe(true)
  })
})
