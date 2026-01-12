import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ref } from 'vue'
import NearbyPOISelector from '@/components/submission/NearbyPOISelector.vue'
import * as useOverpassModule from '@/composables/useOverpass'
import type { POI } from '@/composables/useOverpass'

// Mock useOverpass composable
const mockFindNearbyPOIs = vi.fn()
let mockLoading = ref(false)
let mockError = ref<string | null>(null)
let mockPois = ref<POI[]>([])

vi.mock('@/composables/useOverpass', () => ({
  useOverpass: () => ({
    loading: mockLoading,
    error: mockError,
    pois: mockPois,
    findNearbyPOIs: mockFindNearbyPOIs
  })
}))

// Setup i18n
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      submit: {
        findingNearby: 'Looking for businesses nearby...',
        foundNearby: 'Found {count} business nearby | Found {count} businesses nearby',
        noPOIsFound: 'No businesses found at this location',
        selectBusiness: 'Is this one of these businesses?',
        enterManually: "None of these - I'll enter the name",
        businessSelected: 'Selected: {name}',
        back: 'Back',
        continue: 'Continue',
        confirmSelection: 'Continue with this business'
      }
    }
  }
})

describe('NearbyPOISelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoading.value = false
    mockError.value = null
    mockPois.value = []
  })

  const defaultProps = {
    lat: 50.1109,
    lng: 8.6821,
    address: 'Bockenheimer Landstraße 24, Frankfurt am Main'
  }

  test('renders correctly with props', () => {
    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })
    expect(wrapper.exists()).toBe(true)
  })

  test('shows loading state while fetching POIs', async () => {
    mockLoading.value = true

    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    expect(wrapper.text()).toContain('Looking for businesses nearby')
  })

  test('calls findNearbyPOIs with correct parameters on mount', async () => {
    mockFindNearbyPOIs.mockResolvedValue([])

    mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    expect(mockFindNearbyPOIs).toHaveBeenCalledWith(50.1109, 8.6821, 50, expect.any(Object))
  })

  test('displays POI list when POIs are found', async () => {
    const mockPOIsList: POI[] = [
      {
        id: 1,
        name: 'Zero Waste Shop',
        lat: 50.1109,
        lng: 8.6821,
        type: 'shop',
        address: 'Bockenheimer Landstraße 24'
      },
      {
        id: 2,
        name: 'Green Cafe',
        lat: 50.1110,
        lng: 8.6822,
        type: 'cafe',
        address: 'Bockenheimer Landstraße 26'
      }
    ]

    mockPois.value = mockPOIsList
    mockLoading.value = false

    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Zero Waste Shop')
    expect(wrapper.text()).toContain('Green Cafe')
    expect(wrapper.text()).toContain('Found 2 businesses nearby')
  })

  test('shows empty state when no POIs found', async () => {
    mockPois.value = []
    mockLoading.value = false

    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('No businesses found at this location')
  })

  test('emits poi-selected when POI is clicked and continue is pressed', async () => {
    const mockPOI: POI = {
      id: 1,
      name: 'Zero Waste Shop',
      lat: 50.1109,
      lng: 8.6821,
      type: 'shop',
      address: 'Bockenheimer Landstraße 24',
      phone: '+49 69 12345',
      website: 'https://example.com'
    }

    mockPois.value = [mockPOI]
    mockLoading.value = false

    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    await wrapper.vm.$nextTick()

    // Find and click the first POI card to select it
    const poiCard = wrapper.find('[data-testid="poi-card-1"]')
    expect(poiCard.exists()).toBe(true)
    await poiCard.trigger('click')

    // No event emitted yet (only selected internally)
    expect(wrapper.emitted()).not.toHaveProperty('poi-selected')

    // Continue button should appear
    await wrapper.vm.$nextTick()
    const continueBtn = wrapper.find('.btn-continue')
    expect(continueBtn.exists()).toBe(true)
    await continueBtn.trigger('click')

    // Now the event should be emitted
    expect(wrapper.emitted()).toHaveProperty('poi-selected')
    const emittedData = wrapper.emitted('poi-selected')?.[0]?.[0] as any
    expect(emittedData.name).toBe('Zero Waste Shop')
    expect(emittedData.lat).toBe(50.1109)
    expect(emittedData.lng).toBe(8.6821)
    expect(emittedData.address).toBe('Bockenheimer Landstraße 24')
  })

  test('highlights selected POI', async () => {
    const mockPOIs: POI[] = [
      {
        id: 1,
        name: 'Zero Waste Shop',
        lat: 50.1109,
        lng: 8.6821,
        type: 'shop'
      },
      {
        id: 2,
        name: 'Green Cafe',
        lat: 50.1110,
        lng: 8.6822,
        type: 'cafe'
      }
    ]

    mockPois.value = mockPOIs
    mockLoading.value = false

    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    await wrapper.vm.$nextTick()

    // Click first POI
    const firstCard = wrapper.find('[data-testid="poi-card-1"]')
    await firstCard.trigger('click')

    // Check if selected class is applied
    expect(firstCard.classes()).toContain('selected')
  })

  test('emits enter-manually when "Enter manually" button is clicked', async () => {
    mockPois.value = []
    mockLoading.value = false

    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    await wrapper.vm.$nextTick()

    // Find and click the "Enter manually" button
    const manualButton = wrapper.find('[data-testid="enter-manually-btn"]')
    expect(manualButton.exists()).toBe(true)
    await manualButton.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('enter-manually')
  })

  test('emits back event when back button is clicked', async () => {
    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    const backButton = wrapper.find('[data-testid="back-btn"]')
    expect(backButton.exists()).toBe(true)
    await backButton.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('back')
  })

  test('displays POI type correctly', async () => {
    const mockPOI: POI = {
      id: 1,
      name: 'Zero Waste Shop',
      lat: 50.1109,
      lng: 8.6821,
      type: 'shop'
    }

    mockPois.value = [mockPOI]
    mockLoading.value = false

    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    await wrapper.vm.$nextTick()

    const poiCard = wrapper.find('[data-testid="poi-card-1"]')
    // Type should be capitalized (Shop, not shop)
    expect(poiCard.text()).toContain('Shop')
  })

  test('displays POI address when available', async () => {
    const mockPOI: POI = {
      id: 1,
      name: 'Zero Waste Shop',
      lat: 50.1109,
      lng: 8.6821,
      type: 'shop',
      address: 'Bockenheimer Landstraße 24, Frankfurt'
    }

    mockPois.value = [mockPOI]
    mockLoading.value = false

    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    await wrapper.vm.$nextTick()

    const poiCard = wrapper.find('[data-testid="poi-card-1"]')
    expect(poiCard.text()).toContain('Bockenheimer Landstraße 24, Frankfurt')
  })

  test('displays error message when fetch fails', async () => {
    mockError.value = 'Failed to fetch POIs'
    mockLoading.value = false

    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Failed to fetch POIs')
  })

  test('keyboard navigation: Enter key selects POI', async () => {
    const mockPOI: POI = {
      id: 1,
      name: 'Zero Waste Shop',
      lat: 50.1109,
      lng: 8.6821,
      type: 'shop'
    }

    mockPois.value = [mockPOI]
    mockLoading.value = false

    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    await wrapper.vm.$nextTick()

    const poiCard = wrapper.find('[data-testid="poi-card-1"]')
    await poiCard.trigger('keydown.enter')

    // Check POI is selected (checkmark appears)
    await wrapper.vm.$nextTick()
    expect(poiCard.classes()).toContain('selected')

    // Click continue button to emit event
    const continueBtn = wrapper.find('.btn-continue')
    await continueBtn.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('poi-selected')
  })

  test('keyboard navigation: Space key selects POI', async () => {
    const mockPOI: POI = {
      id: 1,
      name: 'Zero Waste Shop',
      lat: 50.1109,
      lng: 8.6821,
      type: 'shop'
    }

    mockPois.value = [mockPOI]
    mockLoading.value = false

    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    await wrapper.vm.$nextTick()

    const poiCard = wrapper.find('[data-testid="poi-card-1"]')
    await poiCard.trigger('keydown.space')

    // Check POI is selected
    await wrapper.vm.$nextTick()
    expect(poiCard.classes()).toContain('selected')

    // Click continue button to emit event
    const continueBtn = wrapper.find('.btn-continue')
    await continueBtn.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('poi-selected')
  })

  test('accessibility: POI cards have proper ARIA labels', async () => {
    const mockPOI: POI = {
      id: 1,
      name: 'Zero Waste Shop',
      lat: 50.1109,
      lng: 8.6821,
      type: 'shop'
    }

    mockPois.value = [mockPOI]
    mockLoading.value = false

    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    await wrapper.vm.$nextTick()

    const poiCard = wrapper.find('[data-testid="poi-card-1"]')
    expect(poiCard.attributes('role')).toBe('button')
    expect(poiCard.attributes('tabindex')).toBe('0')
    expect(poiCard.attributes('aria-label')).toContain('Zero Waste Shop')
  })

  test('cleans up on unmount', async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort')

    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    wrapper.unmount()

    expect(abortSpy).toHaveBeenCalled()
  })

  test('limits POI display to reasonable number', async () => {
    // Create 20 POIs
    const mockPOIs: POI[] = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Business ${i + 1}`,
      lat: 50.1109 + i * 0.0001,
      lng: 8.6821 + i * 0.0001,
      type: 'shop'
    }))

    mockPois.value = mockPOIs
    mockLoading.value = false

    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    await wrapper.vm.$nextTick()

    // Should display max 10 POIs
    const poiCards = wrapper.findAll('[data-testid^="poi-card-"]')
    expect(poiCards.length).toBeLessThanOrEqual(10)
  })

  test('passes correct data structure in poi-selected event', async () => {
    const mockPOI: POI = {
      id: 1,
      name: 'Zero Waste Shop',
      lat: 50.1109,
      lng: 8.6821,
      type: 'shop',
      address: 'Bockenheimer Landstraße 24',
      phone: '+49 69 12345',
      website: 'https://example.com'
    }

    mockPois.value = [mockPOI]
    mockLoading.value = false

    const wrapper = mount(NearbyPOISelector, {
      props: defaultProps,
      global: { plugins: [i18n] }
    })

    await wrapper.vm.$nextTick()

    const poiCard = wrapper.find('[data-testid="poi-card-1"]')
    await poiCard.trigger('click')

    // Click continue button
    await wrapper.vm.$nextTick()
    const continueBtn = wrapper.find('.btn-continue')
    await continueBtn.trigger('click')

    const emittedData = wrapper.emitted('poi-selected')?.[0]?.[0] as any
    expect(emittedData).toMatchObject({
      name: 'Zero Waste Shop',
      lat: 50.1109,
      lng: 8.6821,
      address: 'Bockenheimer Landstraße 24',
      phone: '+49 69 12345',
      website: 'https://example.com',
      type: 'shop'
    })
  })
})
