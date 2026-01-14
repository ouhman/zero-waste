import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import HoursSuggestionModal from '@/components/common/HoursSuggestionModal.vue'
import type { StructuredOpeningHours } from '@/types/osm'

// Mock the composable
const mockSubmitSuggestion = vi.fn()
const mockIsSubmitting = { value: false }
const mockError = { value: null }
const mockRateLimitExceeded = { value: false }

vi.mock('@/composables/useHoursSuggestion', () => ({
  useHoursSuggestion: () => ({
    isSubmitting: mockIsSubmitting,
    error: mockError,
    rateLimitExceeded: mockRateLimitExceeded,
    submitSuggestion: mockSubmitSuggestion
  })
}))

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'de' }
  })
}))

// Mock useNominatim's parseStructuredHours
vi.mock('@/composables/useNominatim', () => ({
  parseStructuredHours: vi.fn((osm: string) => {
    if (osm === 'Mo-Fr 09:00-18:00') {
      return {
        entries: [
          { day: 'monday', opens: '09:00', closes: '18:00' },
          { day: 'tuesday', opens: '09:00', closes: '18:00' },
          { day: 'wednesday', opens: '09:00', closes: '18:00' },
          { day: 'thursday', opens: '09:00', closes: '18:00' },
          { day: 'friday', opens: '09:00', closes: '18:00' }
        ]
      }
    }
    return null
  })
}))

describe('HoursSuggestionModal', () => {
  const currentHours: StructuredOpeningHours = {
    entries: [
      { day: 'monday', opens: '09:00', closes: '18:00' },
      { day: 'tuesday', opens: '09:00', closes: '18:00' },
      { day: 'wednesday', opens: '09:00', closes: '18:00' },
      { day: 'thursday', opens: '09:00', closes: '18:00' },
      { day: 'friday', opens: '09:00', closes: '18:00' },
      { day: 'saturday', opens: null, closes: null },
      { day: 'sunday', opens: null, closes: null }
    ]
  }

  const defaultProps = {
    locationId: 'test-location-id',
    locationName: 'Test Location',
    currentHours,
    website: 'https://example.com',
    city: 'Frankfurt'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all 7 days with checkboxes', () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps
    })

    // 7 days = 7 checkboxes
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes).toHaveLength(7)
  })

  it('pre-fills current hours correctly', async () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps
    })

    await nextTick()

    // Check that Monday has times (not closed)
    const mondayCheckbox = wrapper.findAll('input[type="checkbox"]')[0]
    expect((mondayCheckbox.element as HTMLInputElement).checked).toBe(false)

    // Check that Saturday is marked as closed
    const saturdayCheckbox = wrapper.findAll('input[type="checkbox"]')[5]
    expect((saturdayCheckbox.element as HTMLInputElement).checked).toBe(true)
  })

  it('toggles closed state', async () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps
    })

    await nextTick()

    // Get Monday checkbox (first day)
    const mondayCheckbox = wrapper.findAll('input[type="checkbox"]')[0]
    expect((mondayCheckbox.element as HTMLInputElement).checked).toBe(false)

    // Click to close Monday
    await mondayCheckbox.trigger('change')
    await nextTick()

    expect((mondayCheckbox.element as HTMLInputElement).checked).toBe(true)
  })

  it('shows time inputs when day is not closed', async () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps
    })

    await nextTick()

    // Monday (not closed) should have time inputs
    const timeInputs = wrapper.findAll('input[type="time"]')
    expect(timeInputs.length).toBeGreaterThan(0)
  })

  it('hides time inputs when day is closed', async () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: {
        ...defaultProps,
        currentHours: {
          entries: [
            { day: 'monday', opens: null, closes: null },
            { day: 'tuesday', opens: null, closes: null },
            { day: 'wednesday', opens: null, closes: null },
            { day: 'thursday', opens: null, closes: null },
            { day: 'friday', opens: null, closes: null },
            { day: 'saturday', opens: null, closes: null },
            { day: 'sunday', opens: null, closes: null }
          ]
        }
      }
    })

    await nextTick()

    // All days closed, should have no time inputs
    const timeInputs = wrapper.findAll('input[type="time"]')
    expect(timeInputs).toHaveLength(0)
  })

  it('shows "marked as closed" text when day is closed', async () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: {
        ...defaultProps,
        currentHours: {
          entries: [
            { day: 'monday', opens: null, closes: null },
            { day: 'tuesday', opens: '09:00', closes: '18:00' },
            { day: 'wednesday', opens: '09:00', closes: '18:00' },
            { day: 'thursday', opens: '09:00', closes: '18:00' },
            { day: 'friday', opens: '09:00', closes: '18:00' },
            { day: 'saturday', opens: null, closes: null },
            { day: 'sunday', opens: null, closes: null }
          ]
        }
      }
    })

    await nextTick()

    // Should show the translation key for "marked as closed"
    expect(wrapper.text()).toContain('hoursSuggestion.markedClosed')
  })

  it('submits suggestion with correct data structure', async () => {
    mockSubmitSuggestion.mockResolvedValue({ success: true })

    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps
    })

    await nextTick()

    // Fill in note
    const noteTextarea = wrapper.find('textarea')
    await noteTextarea.setValue('Test note')

    // Directly call the submit method on the component instance
    await (wrapper.vm as any).submit()

    expect(mockSubmitSuggestion).toHaveBeenCalledWith(
      'test-location-id',
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({ day: 'monday' })
        ])
      }),
      'Test note'
    )
  })

  it('emits close event when close button clicked', async () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps
    })

    const closeButton = wrapper.findAll('button')[0] // First button is the X
    await closeButton.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close event when cancel button clicked', async () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps
    })

    const buttons = wrapper.findAll('button')
    const cancelButton = buttons[buttons.length - 2] // Second to last button is cancel
    await cancelButton.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits submitted and close events on successful submission', async () => {
    mockSubmitSuggestion.mockResolvedValue({ success: true })

    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps
    })

    await nextTick()

    // Directly call the submit method
    await (wrapper.vm as any).submit()

    expect(wrapper.emitted('submitted')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('closes on backdrop click', async () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps,
      attachTo: document.body
    })

    const backdrop = wrapper.find('.fixed.inset-0')
    await backdrop.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()

    wrapper.unmount()
  })

  it('closes on ESC key', async () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps,
      attachTo: document.body
    })

    await nextTick()

    // Simulate ESC key
    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    document.dispatchEvent(event)

    await nextTick()

    expect(wrapper.emitted('close')).toBeTruthy()

    wrapper.unmount()
  })

  it('displays location name in header', () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps
    })

    expect(wrapper.text()).toContain('Test Location')
  })

  it('allows entering a note', async () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps
    })

    const noteTextarea = wrapper.find('textarea')
    await noteTextarea.setValue('My test note')

    expect((noteTextarea.element as HTMLTextAreaElement).value).toBe('My test note')
  })

  it('parses OSM format when structured hours not provided', async () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: {
        locationId: 'test-location-id',
        locationName: 'Test Location',
        currentHours: null,
        osmFormat: 'Mo-Fr 09:00-18:00'
      }
    })

    await nextTick()

    // Should have time inputs for weekdays
    const timeInputs = wrapper.findAll('input[type="time"]')
    expect(timeInputs.length).toBeGreaterThan(0)
  })

  it('has wider layout (max-w-lg)', () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps
    })

    const modal = wrapper.find('.max-w-lg')
    expect(modal.exists()).toBe(true)
  })

  it('shows column headers for day, closed, hours', () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps
    })

    // Find the grid header row specifically
    const headerRow = wrapper.find('.grid.pb-2.border-b')
    expect(headerRow.text()).toContain('hoursSuggestion.day')
    expect(headerRow.text()).toContain('hoursSuggestion.closed')
    expect(headerRow.text()).toContain('hoursSuggestion.hours')
  })

  it('shows helper links when website provided', () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps
    })

    // Should have website link
    const websiteLink = wrapper.find('a[href="https://example.com"]')
    expect(websiteLink.exists()).toBe(true)
    expect(websiteLink.text()).toContain('hoursSuggestion.checkWebsite')

    // Should have Google Maps link (always shown, uses name + city)
    const mapsLink = wrapper.find('a[href*="google.com/maps"]')
    expect(mapsLink.exists()).toBe(true)
    expect(mapsLink.text()).toContain('hoursSuggestion.checkGoogleMaps')
  })

  it('hides website link when not provided', () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: {
        ...defaultProps,
        website: null
      }
    })

    // Should not have website link
    const websiteLink = wrapper.find('a[href*="example.com"]')
    expect(websiteLink.exists()).toBe(false)

    // Should still have Google Maps link
    const mapsLink = wrapper.find('a[href*="google.com/maps"]')
    expect(mapsLink.exists()).toBe(true)
  })

  it('constructs Google Maps URL with name and city', () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps
    })

    const mapsLink = wrapper.find('a[href*="google.com/maps"]')
    expect(mapsLink.exists()).toBe(true)
    // URL should contain encoded name and city
    expect(mapsLink.attributes('href')).toContain('Test%20Location')
    expect(mapsLink.attributes('href')).toContain('Frankfurt')
  })

  it('constructs Google Maps URL with just name when no city', () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: {
        ...defaultProps,
        city: null
      }
    })

    const mapsLink = wrapper.find('a[href*="google.com/maps"]')
    expect(mapsLink.exists()).toBe(true)
    expect(mapsLink.attributes('href')).toContain('Test%20Location')
  })

  it('validates that opens time is before closes time', async () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps
    })

    await nextTick()

    // Access internal hours and set invalid times (opens after closes)
    const vm = wrapper.vm as any
    vm.hours.monday.opens = '18:00'
    vm.hours.monday.closes = '09:00'

    await nextTick()

    // Should show validation error
    expect(wrapper.text()).toContain('hoursSuggestion.timeValidationError')

    // Should have red border on inputs
    const inputs = wrapper.findAll('input[type="time"]')
    const hasErrorClass = inputs.some(input => input.classes().includes('border-red-300'))
    expect(hasErrorClass).toBe(true)
  })

  it('disables submit button when validation errors exist', async () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: defaultProps
    })

    await nextTick()

    // Set invalid times
    const vm = wrapper.vm as any
    vm.hours.monday.opens = '20:00'
    vm.hours.monday.closes = '09:00'

    await nextTick()

    // Submit button should be disabled - check via element property
    const buttons = wrapper.findAll('button')
    const submitButton = buttons[buttons.length - 1] // Last button is submit
    expect((submitButton.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('does not show validation error for closed days', async () => {
    const wrapper = mount(HoursSuggestionModal, {
      props: {
        ...defaultProps,
        currentHours: {
          entries: [
            { day: 'monday', opens: null, closes: null },
            { day: 'tuesday', opens: '09:00', closes: '18:00' },
            { day: 'wednesday', opens: '09:00', closes: '18:00' },
            { day: 'thursday', opens: '09:00', closes: '18:00' },
            { day: 'friday', opens: '09:00', closes: '18:00' },
            { day: 'saturday', opens: null, closes: null },
            { day: 'sunday', opens: null, closes: null }
          ]
        }
      }
    })

    await nextTick()

    // Should not show validation error for closed days
    expect(wrapper.text()).not.toContain('hoursSuggestion.timeValidationError')
  })
})
