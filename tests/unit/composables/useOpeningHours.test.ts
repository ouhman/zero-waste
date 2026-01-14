import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import { useOpeningHours } from '@/composables/useOpeningHours'
import type { StructuredOpeningHours } from '@/types/osm'

describe('useOpeningHours', () => {
  let mockDate: Date
  const RealDate = global.Date

  beforeEach(() => {
    // Mock Date to return a specific day (Thursday, Jan 15, 2026)
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

  test('returns correct today value', () => {
    const hours = ref<StructuredOpeningHours | null>(null)
    const { today } = useOpeningHours(hours)

    // Jan 15, 2026 is a Thursday
    expect(today.value).toBe('thursday')
  })

  test('formats hours correctly', () => {
    const hours = ref<StructuredOpeningHours | null>(null)
    const { formatHours } = useOpeningHours(hours)

    // Normal hours
    expect(formatHours({ day: 'monday', opens: '09:00', closes: '18:00' })).toBe('09:00–18:00')
    expect(formatHours({ day: 'monday', opens: '10:30', closes: '22:45' })).toBe('10:30–22:45')

    // Closed day (null opens/closes)
    expect(formatHours({ day: 'sunday', opens: null, closes: null })).toBe('Closed')
    expect(formatHours(null)).toBe('Closed')
  })

  test('handles closed days correctly', () => {
    const hoursData: StructuredOpeningHours = {
      entries: [
        { day: 'monday', opens: '09:00', closes: '18:00' },
        { day: 'tuesday', opens: '09:00', closes: '18:00' },
        { day: 'wednesday', opens: '09:00', closes: '18:00' },
        { day: 'thursday', opens: null, closes: null }, // Closed
        { day: 'friday', opens: '09:00', closes: '18:00' },
        { day: 'saturday', opens: '10:00', closes: '14:00' },
        { day: 'sunday', opens: null, closes: null } // Closed
      ]
    }

    const hours = ref(hoursData)
    const { todayHours, formatHours } = useOpeningHours(hours)

    // Today is Thursday, which is closed
    expect(todayHours.value).toEqual({ day: 'thursday', opens: null, closes: null })
    expect(formatHours(todayHours.value)).toBe('Closed')
  })

  test('reorders week starting from today', () => {
    const hoursData: StructuredOpeningHours = {
      entries: [
        { day: 'monday', opens: '09:00', closes: '18:00' },
        { day: 'tuesday', opens: '09:00', closes: '18:00' },
        { day: 'wednesday', opens: '09:00', closes: '18:00' },
        { day: 'thursday', opens: '09:00', closes: '18:00' },
        { day: 'friday', opens: '09:00', closes: '18:00' },
        { day: 'saturday', opens: '10:00', closes: '14:00' },
        { day: 'sunday', opens: null, closes: null }
      ]
    }

    const hours = ref(hoursData)
    const { weekFromToday } = useOpeningHours(hours)

    // Today is Thursday, so week should start with Thursday
    const days = weekFromToday.value.map(e => e.day)
    expect(days).toEqual(['thursday', 'friday', 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday'])
  })

  test('returns localized day names for German', () => {
    const hours = ref<StructuredOpeningHours | null>(null)
    const { getDayName } = useOpeningHours(hours)

    expect(getDayName('monday', 'de')).toBe('Montag')
    expect(getDayName('tuesday', 'de')).toBe('Dienstag')
    expect(getDayName('wednesday', 'de')).toBe('Mittwoch')
    expect(getDayName('thursday', 'de')).toBe('Donnerstag')
    expect(getDayName('friday', 'de')).toBe('Freitag')
    expect(getDayName('saturday', 'de')).toBe('Samstag')
    expect(getDayName('sunday', 'de')).toBe('Sonntag')
  })

  test('returns localized day names for English', () => {
    const hours = ref<StructuredOpeningHours | null>(null)
    const { getDayName } = useOpeningHours(hours)

    expect(getDayName('monday', 'en')).toBe('Monday')
    expect(getDayName('tuesday', 'en')).toBe('Tuesday')
    expect(getDayName('wednesday', 'en')).toBe('Wednesday')
    expect(getDayName('thursday', 'en')).toBe('Thursday')
    expect(getDayName('friday', 'en')).toBe('Friday')
    expect(getDayName('saturday', 'en')).toBe('Saturday')
    expect(getDayName('sunday', 'en')).toBe('Sunday')
  })

  test('detects special schedules', () => {
    const hours24_7 = ref<StructuredOpeningHours>({
      entries: [],
      special: '24/7'
    })
    const hoursByAppointment = ref<StructuredOpeningHours>({
      entries: [],
      special: 'by_appointment'
    })
    const hoursNormal = ref<StructuredOpeningHours>({
      entries: [{ day: 'monday', opens: '09:00', closes: '18:00' }]
    })

    const { isSpecial: isSpecial1 } = useOpeningHours(hours24_7)
    const { isSpecial: isSpecial2 } = useOpeningHours(hoursByAppointment)
    const { isSpecial: isSpecial3 } = useOpeningHours(hoursNormal)

    expect(isSpecial1.value).toBe('24/7')
    expect(isSpecial2.value).toBe('by_appointment')
    expect(isSpecial3.value).toBeFalsy()
  })

  test('handles null hours gracefully', () => {
    const hours = ref<StructuredOpeningHours | null>(null)
    const { todayHours, weekFromToday } = useOpeningHours(hours)

    expect(todayHours.value).toBeNull()
    expect(weekFromToday.value).toEqual([])
  })

  test('fills missing days with closed entries', () => {
    // Only provide some days
    const hoursData: StructuredOpeningHours = {
      entries: [
        { day: 'monday', opens: '09:00', closes: '18:00' },
        { day: 'wednesday', opens: '09:00', closes: '18:00' }
        // Missing: tuesday, thursday, friday, saturday, sunday
      ]
    }

    const hours = ref(hoursData)
    const { weekFromToday } = useOpeningHours(hours)

    expect(weekFromToday.value).toHaveLength(7)

    // Find Tuesday (should be filled with closed)
    const tuesday = weekFromToday.value.find(e => e.day === 'tuesday')
    expect(tuesday).toEqual({ day: 'tuesday', opens: null, closes: null })
  })
})
