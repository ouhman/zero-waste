import { describe, it, expect } from 'vitest'
import type {
  HoursSuggestion,
  HoursSuggestionInsert,
  HoursSuggestionWithLocation
} from '@/types/hours'
import type { StructuredOpeningHours, OpeningHoursEntry } from '@/types/osm'

describe('Hours Types', () => {
  describe('OpeningHoursEntry', () => {
    it('should allow valid opening hours entry', () => {
      const entry: OpeningHoursEntry = {
        day: 'monday',
        opens: '09:00',
        closes: '18:00'
      }

      expect(entry.day).toBe('monday')
      expect(entry.opens).toBe('09:00')
      expect(entry.closes).toBe('18:00')
    })

    it('should allow closed day with null times', () => {
      const entry: OpeningHoursEntry = {
        day: 'sunday',
        opens: null,
        closes: null
      }

      expect(entry.day).toBe('sunday')
      expect(entry.opens).toBeNull()
      expect(entry.closes).toBeNull()
    })

    it('should support all 7 days of the week', () => {
      const days: OpeningHoursEntry['day'][] = [
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
      ]

      days.forEach(day => {
        const entry: OpeningHoursEntry = {
          day,
          opens: '10:00',
          closes: '17:00'
        }
        expect(entry.day).toBe(day)
      })
    })
  })

  describe('StructuredOpeningHours', () => {
    it('should handle regular weekly hours with all 7 days', () => {
      const hours: StructuredOpeningHours = {
        entries: [
          { day: 'monday', opens: '09:00', closes: '18:00' },
          { day: 'tuesday', opens: '09:00', closes: '18:00' },
          { day: 'wednesday', opens: '09:00', closes: '18:00' },
          { day: 'thursday', opens: '09:00', closes: '18:00' },
          { day: 'friday', opens: '09:00', closes: '18:00' },
          { day: 'saturday', opens: '10:00', closes: '14:00' },
          { day: 'sunday', opens: null, closes: null }
        ],
        special: null
      }

      expect(hours.entries).toHaveLength(7)
      expect(hours.entries[6].opens).toBeNull() // Sunday closed
      expect(hours.special).toBeNull()
    })

    it('should handle special case: 24/7', () => {
      const hours: StructuredOpeningHours = {
        entries: [],
        special: '24/7'
      }

      expect(hours.entries).toHaveLength(0)
      expect(hours.special).toBe('24/7')
    })

    it('should handle special case: by appointment', () => {
      const hours: StructuredOpeningHours = {
        entries: [],
        special: 'by_appointment'
      }

      expect(hours.entries).toHaveLength(0)
      expect(hours.special).toBe('by_appointment')
    })

    it('should include closed days in entries', () => {
      const hours: StructuredOpeningHours = {
        entries: [
          { day: 'monday', opens: '09:00', closes: '17:00' },
          { day: 'tuesday', opens: null, closes: null }, // Closed
          { day: 'wednesday', opens: '09:00', closes: '17:00' },
          { day: 'thursday', opens: '09:00', closes: '17:00' },
          { day: 'friday', opens: '09:00', closes: '17:00' },
          { day: 'saturday', opens: null, closes: null }, // Closed
          { day: 'sunday', opens: null, closes: null }    // Closed
        ],
        special: null
      }

      const closedDays = hours.entries.filter(e => e.opens === null)
      expect(closedDays).toHaveLength(3)
    })
  })

  describe('HoursSuggestion', () => {
    it('should match database schema structure', () => {
      const suggestion: HoursSuggestion = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        location_id: '550e8400-e29b-41d4-a716-446655440001',
        suggested_hours: {
          entries: [
            { day: 'monday', opens: '10:00', closes: '18:00' },
            { day: 'tuesday', opens: '10:00', closes: '18:00' },
            { day: 'wednesday', opens: '10:00', closes: '18:00' },
            { day: 'thursday', opens: '10:00', closes: '18:00' },
            { day: 'friday', opens: '10:00', closes: '18:00' },
            { day: 'saturday', opens: null, closes: null },
            { day: 'sunday', opens: null, closes: null }
          ],
          special: null
        },
        note: 'Updated hours as of January 2026',
        ip_hash: 'abc123def456',
        status: 'pending',
        reviewed_at: null,
        reviewed_by: null,
        admin_note: null,
        created_at: '2026-01-13T10:00:00Z',
        updated_at: '2026-01-13T10:00:00Z'
      }

      expect(suggestion.id).toBeDefined()
      expect(suggestion.location_id).toBeDefined()
      expect(suggestion.suggested_hours.entries).toHaveLength(7)
      expect(suggestion.status).toBe('pending')
      expect(suggestion.ip_hash).toBeDefined()
    })

    it('should support all status values', () => {
      const statuses: HoursSuggestion['status'][] = ['pending', 'approved', 'rejected']

      statuses.forEach(status => {
        const suggestion: Partial<HoursSuggestion> = {
          status
        }
        expect(suggestion.status).toBe(status)
      })
    })

    it('should allow optional note field', () => {
      const withNote: Partial<HoursSuggestion> = {
        note: 'Hours changed recently'
      }
      const withoutNote: Partial<HoursSuggestion> = {
        note: null
      }

      expect(withNote.note).toBeDefined()
      expect(withoutNote.note).toBeNull()
    })
  })

  describe('HoursSuggestionInsert', () => {
    it('should contain minimum required fields for insert', () => {
      const insert: HoursSuggestionInsert = {
        location_id: '550e8400-e29b-41d4-a716-446655440001',
        suggested_hours: {
          entries: [
            { day: 'monday', opens: '09:00', closes: '17:00' },
            { day: 'tuesday', opens: '09:00', closes: '17:00' },
            { day: 'wednesday', opens: '09:00', closes: '17:00' },
            { day: 'thursday', opens: '09:00', closes: '17:00' },
            { day: 'friday', opens: '09:00', closes: '17:00' },
            { day: 'saturday', opens: null, closes: null },
            { day: 'sunday', opens: null, closes: null }
          ],
          special: null
        },
        ip_hash: 'abc123def456'
      }

      expect(insert.location_id).toBeDefined()
      expect(insert.suggested_hours).toBeDefined()
      expect(insert.ip_hash).toBeDefined()
    })

    it('should allow optional note in insert', () => {
      const withNote: HoursSuggestionInsert = {
        location_id: '550e8400-e29b-41d4-a716-446655440001',
        suggested_hours: {
          entries: [
            { day: 'monday', opens: '09:00', closes: '17:00' },
            { day: 'tuesday', opens: '09:00', closes: '17:00' },
            { day: 'wednesday', opens: '09:00', closes: '17:00' },
            { day: 'thursday', opens: '09:00', closes: '17:00' },
            { day: 'friday', opens: '09:00', closes: '17:00' },
            { day: 'saturday', opens: null, closes: null },
            { day: 'sunday', opens: null, closes: null }
          ],
          special: null
        },
        ip_hash: 'abc123',
        note: 'Updated based on store visit'
      }

      expect(withNote.note).toBe('Updated based on store visit')
    })
  })

  describe('HoursSuggestionWithLocation', () => {
    it('should extend HoursSuggestion with location info', () => {
      const suggestionWithLocation: HoursSuggestionWithLocation = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        location_id: '550e8400-e29b-41d4-a716-446655440001',
        suggested_hours: {
          entries: [
            { day: 'monday', opens: '09:00', closes: '17:00' },
            { day: 'tuesday', opens: '09:00', closes: '17:00' },
            { day: 'wednesday', opens: '09:00', closes: '17:00' },
            { day: 'thursday', opens: '09:00', closes: '17:00' },
            { day: 'friday', opens: '09:00', closes: '17:00' },
            { day: 'saturday', opens: null, closes: null },
            { day: 'sunday', opens: null, closes: null }
          ],
          special: null
        },
        note: 'Test note',
        ip_hash: 'abc123',
        status: 'pending',
        reviewed_at: null,
        reviewed_by: null,
        admin_note: null,
        created_at: '2026-01-13T10:00:00Z',
        updated_at: '2026-01-13T10:00:00Z',
        location: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Test Shop',
          slug: 'test-shop-frankfurt'
        }
      }

      expect(suggestionWithLocation.location).toBeDefined()
      expect(suggestionWithLocation.location.id).toBe('550e8400-e29b-41d4-a716-446655440001')
      expect(suggestionWithLocation.location.name).toBe('Test Shop')
      expect(suggestionWithLocation.location.slug).toBe('test-shop-frankfurt')
    })
  })
})
