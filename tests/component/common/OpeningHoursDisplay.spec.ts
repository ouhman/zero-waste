import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import OpeningHoursDisplay from '@/components/common/OpeningHoursDisplay.vue'
import type { StructuredOpeningHours } from '@/types/osm'

const i18n = createI18n({
  legacy: false,
  locale: 'de',
  messages: {
    de: {
      openingHours: {
        notAvailable: 'Öffnungszeiten nicht verfügbar',
        disclaimer: 'Angaben ohne Gewähr. Bitte überprüfen Sie die Zeiten vor Ihrem Besuch.',
        suggestEdit: 'Änderung vorschlagen',
        '24_7': '24 Stunden geöffnet',
        byAppointment: 'Nach Vereinbarung',
        closed: 'Geschlossen'
      }
    },
    en: {
      openingHours: {
        notAvailable: 'Opening hours not available',
        disclaimer: 'Hours may be inaccurate. Please verify before visiting.',
        suggestEdit: 'Suggest an edit',
        '24_7': 'Open 24 hours',
        byAppointment: 'By appointment',
        closed: 'Closed'
      }
    }
  }
})

describe('OpeningHoursDisplay', () => {
  let mockDate: Date
  const RealDate = global.Date

  beforeEach(() => {
    // Mock Date to return Thursday, Jan 15, 2026
    mockDate = new Date('2026-01-15T12:00:00Z')

    // Create a proper Date mock that preserves static methods
    const MockDate: any = function(...args: any[]) {
      if (args.length === 0) {
        return mockDate
      }
      return new RealDate(...args)
    }

    // Preserve static methods
    MockDate.now = RealDate.now
    MockDate.parse = RealDate.parse
    MockDate.UTC = RealDate.UTC
    MockDate.prototype = RealDate.prototype

    global.Date = MockDate
  })

  afterEach(() => {
    global.Date = RealDate
  })

  test('renders today\'s hours in collapsed state', () => {
    const hours: StructuredOpeningHours = {
      entries: [
        { day: 'monday', opens: '09:00', closes: '18:00' },
        { day: 'tuesday', opens: '09:00', closes: '18:00' },
        { day: 'wednesday', opens: '09:00', closes: '18:00' },
        { day: 'thursday', opens: '10:00', closes: '20:00' },
        { day: 'friday', opens: '09:00', closes: '18:00' },
        { day: 'saturday', opens: '10:00', closes: '14:00' },
        { day: 'sunday', opens: null, closes: null }
      ]
    }

    const wrapper = mount(OpeningHoursDisplay, {
      props: { hours },
      global: { plugins: [i18n] }
    })

    // Should show today (Thursday) with hours
    expect(wrapper.text()).toContain('Donnerstag')
    expect(wrapper.text()).toContain('10:00–20:00')

    // Should NOT show full week initially
    expect(wrapper.text()).not.toContain('Montag')
    expect(wrapper.text()).not.toContain('disclaimer')
  })

  test('expands to show full week on click', async () => {
    const hours: StructuredOpeningHours = {
      entries: [
        { day: 'monday', opens: '09:00', closes: '18:00' },
        { day: 'tuesday', opens: '09:00', closes: '18:00' },
        { day: 'wednesday', opens: '09:00', closes: '18:00' },
        { day: 'thursday', opens: '10:00', closes: '20:00' },
        { day: 'friday', opens: '09:00', closes: '18:00' },
        { day: 'saturday', opens: '10:00', closes: '14:00' },
        { day: 'sunday', opens: null, closes: null }
      ]
    }

    const wrapper = mount(OpeningHoursDisplay, {
      props: { hours },
      global: { plugins: [i18n] }
    })

    // Click the button to expand
    const button = wrapper.find('button')
    await button.trigger('click')

    // Should show all days starting from Monday
    expect(wrapper.text()).toContain('Montag')
    expect(wrapper.text()).toContain('Dienstag')
    expect(wrapper.text()).toContain('Mittwoch')
    expect(wrapper.text()).toContain('Donnerstag')
    expect(wrapper.text()).toContain('Freitag')
    expect(wrapper.text()).toContain('Samstag')
    expect(wrapper.text()).toContain('Sonntag')
  })

  test('highlights today in expanded view', async () => {
    const hours: StructuredOpeningHours = {
      entries: [
        { day: 'monday', opens: '09:00', closes: '18:00' },
        { day: 'tuesday', opens: '09:00', closes: '18:00' },
        { day: 'wednesday', opens: '09:00', closes: '18:00' },
        { day: 'thursday', opens: '10:00', closes: '20:00' },
        { day: 'friday', opens: '09:00', closes: '18:00' },
        { day: 'saturday', opens: '10:00', closes: '14:00' },
        { day: 'sunday', opens: null, closes: null }
      ]
    }

    const wrapper = mount(OpeningHoursDisplay, {
      props: { hours },
      global: { plugins: [i18n] }
    })

    // Expand
    await wrapper.find('button').trigger('click')

    // Find all day rows
    const dayRows = wrapper.findAll('.flex.justify-between')

    // Thursday (index 3) should be highlighted (today = Thursday, mocked)
    expect(dayRows[3].classes()).toContain('font-medium')
    expect(dayRows[3].classes()).toContain('text-gray-900')

    // Monday (index 0) should NOT be highlighted
    expect(dayRows[0].classes()).toContain('text-gray-600')
    expect(dayRows[0].classes()).not.toContain('font-medium')
  })

  test('shows disclaimer text when expanded', async () => {
    const hours: StructuredOpeningHours = {
      entries: [
        { day: 'thursday', opens: '10:00', closes: '20:00' }
      ]
    }

    const wrapper = mount(OpeningHoursDisplay, {
      props: { hours },
      global: { plugins: [i18n] }
    })

    // Not visible when collapsed
    expect(wrapper.text()).not.toContain('Angaben ohne Gewähr')

    // Expand
    await wrapper.find('button').trigger('click')

    // Disclaimer should now be visible
    expect(wrapper.text()).toContain('Angaben ohne Gewähr')
  })

  test('emits suggest-edit event when clicking the link', async () => {
    const hours: StructuredOpeningHours = {
      entries: [
        { day: 'thursday', opens: '10:00', closes: '20:00' }
      ]
    }

    const wrapper = mount(OpeningHoursDisplay, {
      props: { hours },
      global: { plugins: [i18n] }
    })

    // Expand to show suggest edit button
    await wrapper.find('button').trigger('click')

    // Find and click suggest edit button
    const buttons = wrapper.findAll('button')
    const suggestButton = buttons.find(b => b.text().includes('Änderung vorschlagen'))
    expect(suggestButton).toBeDefined()

    await suggestButton!.trigger('click')

    // Check event was emitted
    expect(wrapper.emitted('suggest-edit')).toBeTruthy()
    expect(wrapper.emitted('suggest-edit')).toHaveLength(1)
  })

  test('handles null hours gracefully', () => {
    const wrapper = mount(OpeningHoursDisplay, {
      props: { hours: null },
      global: { plugins: [i18n] }
    })

    // Should show "not available" message
    expect(wrapper.text()).toContain('Öffnungszeiten nicht verfügbar')
  })

  test('handles empty hours gracefully', () => {
    const hours: StructuredOpeningHours = {
      entries: []
    }

    const wrapper = mount(OpeningHoursDisplay, {
      props: { hours },
      global: { plugins: [i18n] }
    })

    // Should show "not available" message
    expect(wrapper.text()).toContain('Öffnungszeiten nicht verfügbar')
  })

  test('shows 24/7 special case', () => {
    const hours: StructuredOpeningHours = {
      entries: [],
      special: '24/7'
    }

    const wrapper = mount(OpeningHoursDisplay, {
      props: { hours },
      global: { plugins: [i18n] }
    })

    expect(wrapper.text()).toContain('24 Stunden geöffnet')
    // Should not show expand button
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  test('shows by appointment special case', () => {
    const hours: StructuredOpeningHours = {
      entries: [],
      special: 'by_appointment'
    }

    const wrapper = mount(OpeningHoursDisplay, {
      props: { hours },
      global: { plugins: [i18n] }
    })

    expect(wrapper.text()).toContain('Nach Vereinbarung')
    // Should not show expand button
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  test('shows closed days correctly', async () => {
    const hours: StructuredOpeningHours = {
      entries: [
        { day: 'monday', opens: '09:00', closes: '18:00' },
        { day: 'tuesday', opens: '09:00', closes: '18:00' },
        { day: 'wednesday', opens: '09:00', closes: '18:00' },
        { day: 'thursday', opens: null, closes: null }, // Today is closed
        { day: 'friday', opens: '09:00', closes: '18:00' },
        { day: 'saturday', opens: '10:00', closes: '14:00' },
        { day: 'sunday', opens: null, closes: null }
      ]
    }

    const wrapper = mount(OpeningHoursDisplay, {
      props: { hours },
      global: { plugins: [i18n] }
    })

    // Today (Thursday) should show "Closed"
    expect(wrapper.text()).toContain('Donnerstag')
    expect(wrapper.text()).toContain('Closed')
  })

  test('i18n works for English locale', async () => {
    const hours: StructuredOpeningHours = {
      entries: [
        { day: 'thursday', opens: '10:00', closes: '20:00' }
      ]
    }

    // Create English i18n instance
    const i18nEn = createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {
          openingHours: {
            notAvailable: 'Opening hours not available',
            disclaimer: 'Hours may be inaccurate. Please verify before visiting.',
            suggestEdit: 'Suggest an edit',
            '24_7': 'Open 24 hours',
            byAppointment: 'By appointment',
            closed: 'Closed'
          }
        }
      }
    })

    const wrapper = mount(OpeningHoursDisplay, {
      props: { hours },
      global: { plugins: [i18nEn] }
    })

    // Should show English day name
    expect(wrapper.text()).toContain('Thursday')

    // Expand and check English translations
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('Hours may be inaccurate')
    expect(wrapper.text()).toContain('Suggest an edit')
  })

  test('chevron rotates when expanded', async () => {
    const hours: StructuredOpeningHours = {
      entries: [
        { day: 'thursday', opens: '10:00', closes: '20:00' }
      ]
    }

    const wrapper = mount(OpeningHoursDisplay, {
      props: { hours },
      global: { plugins: [i18n] }
    })

    // Find chevron icon (it should have transition-transform class)
    const chevron = wrapper.find('.transition-transform')
    expect(chevron.exists()).toBe(true)

    // Should not have rotate-180 initially
    expect(chevron.classes()).not.toContain('rotate-180')

    // Click to expand
    await wrapper.find('button').trigger('click')

    // Should now have rotate-180
    expect(chevron.classes()).toContain('rotate-180')
  })

  test('aria-expanded attribute updates correctly', async () => {
    const hours: StructuredOpeningHours = {
      entries: [
        { day: 'thursday', opens: '10:00', closes: '20:00' }
      ]
    }

    const wrapper = mount(OpeningHoursDisplay, {
      props: { hours },
      global: { plugins: [i18n] }
    })

    const button = wrapper.find('button')

    // Should be false initially
    expect(button.attributes('aria-expanded')).toBe('false')

    // Click to expand
    await button.trigger('click')

    // Should be true
    expect(button.attributes('aria-expanded')).toBe('true')
  })

  test('shows fallback text when structured hours not available', async () => {
    const wrapper = mount(OpeningHoursDisplay, {
      props: {
        hours: null,
        fallbackText: 'May-Sep: Mo-So 11:00-22:00, Oct-Apr: Mo-So 11:00-19:00'
      },
      global: { plugins: [i18n] }
    })

    // Should show preview text instead of "not available"
    expect(wrapper.text()).toContain('May-Sep: Mo-So 11:00-22:00')
    expect(wrapper.text()).not.toContain('Öffnungszeiten nicht verfügbar')

    // Click to expand
    await wrapper.find('button').trigger('click')

    // Should show full text, disclaimer, and suggest edit button when expanded
    expect(wrapper.text()).toContain('Angaben ohne Gewähr')
    expect(wrapper.text()).toContain('Änderung vorschlagen')
  })

  test('prefers structured hours over fallback text', async () => {
    const hours: StructuredOpeningHours = {
      entries: [
        { day: 'thursday', opens: '10:00', closes: '20:00' }
      ]
    }

    const wrapper = mount(OpeningHoursDisplay, {
      props: {
        hours,
        fallbackText: 'Some fallback text'
      },
      global: { plugins: [i18n] }
    })

    // Should show structured hours, not fallback
    expect(wrapper.text()).toContain('Donnerstag')
    expect(wrapper.text()).toContain('10:00–20:00')
    expect(wrapper.text()).not.toContain('Some fallback text')
  })

  test('emits suggest-edit from fallback text view', async () => {
    const wrapper = mount(OpeningHoursDisplay, {
      props: {
        hours: null,
        fallbackText: 'Mo-Fr 09:00-18:00'
      },
      global: { plugins: [i18n] }
    })

    // First expand the view
    await wrapper.find('button').trigger('click')

    // Now find and click the suggest edit button
    const suggestButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Änderung vorschlagen')
    )
    expect(suggestButton).toBeDefined()

    await suggestButton!.trigger('click')

    expect(wrapper.emitted('suggest-edit')).toBeTruthy()
    expect(wrapper.emitted('suggest-edit')).toHaveLength(1)
  })
})
