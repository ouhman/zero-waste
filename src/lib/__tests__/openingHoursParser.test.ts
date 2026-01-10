import { describe, it, expect } from 'vitest'
import { parseOsmOpeningHours } from '../openingHoursParser'

describe('parseOsmOpeningHours', () => {
  it('parses simple weekday hours', () => {
    const result = parseOsmOpeningHours('Mo-Fr 09:00-18:00')

    expect(result.raw).toBe('Mo-Fr 09:00-18:00')
    expect(result.formatted).toBe('Mo-Fr: 9:00-18:00')
  })

  it('parses complex hours with multiple time ranges', () => {
    const result = parseOsmOpeningHours('Mo-Fr 09:00-18:00; Sa 10:00-14:00')

    expect(result.raw).toBe('Mo-Fr 09:00-18:00; Sa 10:00-14:00')
    expect(result.formatted).toBe('Mo-Fr: 9:00-18:00, Sa: 10:00-14:00')
  })

  it('parses hours with closed days', () => {
    const result = parseOsmOpeningHours('Mo-Sa 09:00-20:00; Su off')

    expect(result.raw).toBe('Mo-Sa 09:00-20:00; Su off')
    expect(result.formatted).toBe('Mo-Sa: 9:00-20:00, Su: Geschlossen')
  })

  it('handles 24/7 format', () => {
    const result = parseOsmOpeningHours('24/7')

    expect(result.raw).toBe('24/7')
    expect(result.formatted).toBe('24/7')
  })

  it('parses split hours (lunch break)', () => {
    const result = parseOsmOpeningHours('Mo-Fr 08:00-12:00,14:00-18:00')

    expect(result.raw).toBe('Mo-Fr 08:00-12:00,14:00-18:00')
    expect(result.formatted).toBe('Mo-Fr: 8:00-12:00, 14:00-18:00')
  })

  it('handles public holidays (PH)', () => {
    const result = parseOsmOpeningHours('Mo-Fr 09:00-18:00; PH off')

    expect(result.raw).toBe('Mo-Fr 09:00-18:00; PH off')
    expect(result.formatted).toBe('Mo-Fr: 9:00-18:00, Feiertage: Geschlossen')
  })

  it('handles multiple day groups with different times', () => {
    const result = parseOsmOpeningHours('Mo,We,Fr 09:00-18:00; Tu,Th 10:00-20:00; Sa 10:00-14:00; Su off')

    expect(result.raw).toBe('Mo,We,Fr 09:00-18:00; Tu,Th 10:00-20:00; Sa 10:00-14:00; Su off')
    expect(result.formatted).toBe('Mo,We,Fr: 9:00-18:00, Tu,Th: 10:00-20:00, Sa: 10:00-14:00, Su: Geschlossen')
  })

  it('handles invalid/empty input gracefully', () => {
    const result = parseOsmOpeningHours('')

    expect(result.raw).toBe('')
    expect(result.formatted).toBe('')
  })

  it('handles malformed input gracefully', () => {
    const result = parseOsmOpeningHours('invalid format')

    expect(result.raw).toBe('invalid format')
    expect(result.formatted).toBe('invalid format')
  })

  it('removes leading zeros from hours', () => {
    const result = parseOsmOpeningHours('Mo-Fr 09:00-18:00')

    // 09:00 should become 9:00
    expect(result.formatted).toBe('Mo-Fr: 9:00-18:00')
  })

  it('preserves double-digit hours', () => {
    const result = parseOsmOpeningHours('Mo-Fr 10:00-22:00')

    expect(result.formatted).toBe('Mo-Fr: 10:00-22:00')
  })

  it('handles German day abbreviations', () => {
    // OSM standard uses English abbreviations
    const result = parseOsmOpeningHours('Mo-Fr 09:00-18:00')

    expect(result.formatted).toContain('Mo-Fr')
  })

  it('handles complex real-world example', () => {
    // Real example from a zero waste shop
    const result = parseOsmOpeningHours('Tu-Fr 10:00-18:00; Sa 10:00-14:00; Mo,Su,PH off')

    expect(result.raw).toBe('Tu-Fr 10:00-18:00; Sa 10:00-14:00; Mo,Su,PH off')
    expect(result.formatted).toBe('Tu-Fr: 10:00-18:00, Sa: 10:00-14:00, Mo,Su,Feiertage: Geschlossen')
  })

  it('handles hours with only minutes (edge case)', () => {
    const result = parseOsmOpeningHours('Mo-Fr 09:30-17:45')

    expect(result.formatted).toBe('Mo-Fr: 9:30-17:45')
  })

  it('handles midnight notation', () => {
    const result = parseOsmOpeningHours('Fr-Sa 18:00-24:00')

    expect(result.formatted).toBe('Fr-Sa: 18:00-24:00')
  })

  it('handles open-ended hours', () => {
    // Some places use "open end" but this is rare in OSM
    const result = parseOsmOpeningHours('Mo-Fr 09:00+')

    // Should format the time part (remove leading zero) but keep the +
    expect(result.formatted).toBe('Mo-Fr: 9:00+')
  })
})
