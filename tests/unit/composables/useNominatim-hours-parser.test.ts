import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNominatim } from '@/composables/useNominatim'
import { createApp } from 'vue'
import { flushPromises } from '@vue/test-utils'

// Helper to setup composable with Vue instance context
function withSetup<T>(composable: () => T): [T, () => void] {
  let result: T
  const app = createApp({
    setup() {
      result = composable()
      return () => {}
    }
  })
  const el = document.createElement('div')
  app.mount(el)

  return [
    result!,
    () => {
      app.unmount()
      el.remove()
    }
  ]
}

describe('useNominatim - Opening Hours Parser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parseStructuredHours', () => {
    it('should include all 7 days in output', async () => {
      const [{ searchWithExtras, enrichedResult }, cleanup] = withSetup(() => useNominatim())

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{
          lat: '50.1109',
          lon: '8.6821',
          address: {
            road: 'Test Street',
            house_number: '1',
            city: 'Frankfurt',
            postcode: '60311'
          },
          extratags: {
            opening_hours: 'Mo-Fr 09:00-18:00'
          }
        }]
      })

      await searchWithExtras('Test Shop', 50.1109, 8.6821)
      await flushPromises()

      expect(enrichedResult.value).toBeDefined()
      expect(enrichedResult.value?.openingHoursStructured).toBeDefined()
      expect(enrichedResult.value?.openingHoursStructured?.entries).toHaveLength(7)

      const days = enrichedResult.value?.openingHoursStructured?.entries.map(e => e.day) || []
      expect(days).toContain('monday')
      expect(days).toContain('tuesday')
      expect(days).toContain('wednesday')
      expect(days).toContain('thursday')
      expect(days).toContain('friday')
      expect(days).toContain('saturday')
      expect(days).toContain('sunday')

      cleanup()
    })

    it('should set null times for closed days', async () => {
      const [{ searchWithExtras, enrichedResult }, cleanup] = withSetup(() => useNominatim())

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{
          lat: '50.1109',
          lon: '8.6821',
          address: {
            road: 'Test Street',
            house_number: '1',
            city: 'Frankfurt',
            postcode: '60311'
          },
          extratags: {
            opening_hours: 'Mo-Fr 09:00-18:00; Sa,Su off'
          }
        }]
      })

      await searchWithExtras('Test Shop', 50.1109, 8.6821)
      await flushPromises()

      expect(enrichedResult.value).toBeDefined()
      expect(enrichedResult.value?.openingHoursStructured).toBeDefined()

      const entries = enrichedResult.value?.openingHoursStructured?.entries || []
      expect(entries).toHaveLength(7)

      const saturday = entries.find(e => e.day === 'saturday')
      const sunday = entries.find(e => e.day === 'sunday')

      expect(saturday).toBeDefined()
      expect(saturday?.opens).toBeNull()
      expect(saturday?.closes).toBeNull()

      expect(sunday).toBeDefined()
      expect(sunday?.opens).toBeNull()
      expect(sunday?.closes).toBeNull()

      const monday = entries.find(e => e.day === 'monday')
      expect(monday?.opens).toBe('09:00')
      expect(monday?.closes).toBe('18:00')

      cleanup()
    })

    it('should handle "Su off" format', async () => {
      const [{ searchWithExtras, enrichedResult }, cleanup] = withSetup(() => useNominatim())

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{
          lat: '50.1109',
          lon: '8.6821',
          address: {
            road: 'Test Street',
            house_number: '1',
            city: 'Frankfurt',
            postcode: '60311'
          },
          extratags: {
            opening_hours: 'Mo-Sa 10:00-18:00; Su off'
          }
        }]
      })

      await searchWithExtras('Test Shop', 50.1109, 8.6821)
      await flushPromises()

      const entries = enrichedResult.value?.openingHoursStructured?.entries || []
      expect(entries).toHaveLength(7)

      const sunday = entries.find(e => e.day === 'sunday')
      expect(sunday?.opens).toBeNull()
      expect(sunday?.closes).toBeNull()

      cleanup()
    })

    it('should include missing days as closed', async () => {
      const [{ searchWithExtras, enrichedResult }, cleanup] = withSetup(() => useNominatim())

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{
          lat: '50.1109',
          lon: '8.6821',
          address: {
            road: 'Test Street',
            house_number: '1',
            city: 'Frankfurt',
            postcode: '60311'
          },
          extratags: {
            opening_hours: 'Mo-We 09:00-17:00'
          }
        }]
      })

      await searchWithExtras('Test Shop', 50.1109, 8.6821)
      await flushPromises()

      const entries = enrichedResult.value?.openingHoursStructured?.entries || []
      expect(entries).toHaveLength(7)

      const thursday = entries.find(e => e.day === 'thursday')
      const sunday = entries.find(e => e.day === 'sunday')

      expect(thursday?.opens).toBeNull()
      expect(thursday?.closes).toBeNull()
      expect(sunday?.opens).toBeNull()
      expect(sunday?.closes).toBeNull()

      cleanup()
    })

    it('should handle 24/7 special case', async () => {
      const [{ searchWithExtras, enrichedResult }, cleanup] = withSetup(() => useNominatim())

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{
          lat: '50.1109',
          lon: '8.6821',
          address: {
            road: 'Test Street',
            house_number: '1',
            city: 'Frankfurt',
            postcode: '60311'
          },
          extratags: {
            opening_hours: '24/7'
          }
        }]
      })

      await searchWithExtras('Test Shop', 50.1109, 8.6821)
      await flushPromises()

      expect(enrichedResult.value?.openingHoursStructured?.special).toBe('24/7')
      expect(enrichedResult.value?.openingHoursStructured?.entries).toHaveLength(0)

      cleanup()
    })

    it('should handle by appointment special case', async () => {
      const [{ searchWithExtras, enrichedResult }, cleanup] = withSetup(() => useNominatim())

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{
          lat: '50.1109',
          lon: '8.6821',
          address: {
            road: 'Test Street',
            house_number: '1',
            city: 'Frankfurt',
            postcode: '60311'
          },
          extratags: {
            opening_hours: 'by appointment'
          }
        }]
      })

      await searchWithExtras('Test Shop', 50.1109, 8.6821)
      await flushPromises()

      expect(enrichedResult.value?.openingHoursStructured?.special).toBe('by_appointment')
      expect(enrichedResult.value?.openingHoursStructured?.entries).toHaveLength(0)

      cleanup()
    })

    it('should handle mixed open and closed days', async () => {
      const [{ searchWithExtras, enrichedResult }, cleanup] = withSetup(() => useNominatim())

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{
          lat: '50.1109',
          lon: '8.6821',
          address: {
            road: 'Test Street',
            house_number: '1',
            city: 'Frankfurt',
            postcode: '60311'
          },
          extratags: {
            opening_hours: 'Mo 09:00-18:00; Tu off; We-Fr 09:00-18:00; Sa 10:00-14:00; Su off'
          }
        }]
      })

      await searchWithExtras('Test Shop', 50.1109, 8.6821)
      await flushPromises()

      const entries = enrichedResult.value?.openingHoursStructured?.entries || []
      expect(entries).toHaveLength(7)

      const monday = entries.find(e => e.day === 'monday')
      const tuesday = entries.find(e => e.day === 'tuesday')
      const wednesday = entries.find(e => e.day === 'wednesday')
      const saturday = entries.find(e => e.day === 'saturday')
      const sunday = entries.find(e => e.day === 'sunday')

      expect(monday?.opens).toBe('09:00')
      expect(monday?.closes).toBe('18:00')

      expect(tuesday?.opens).toBeNull()
      expect(tuesday?.closes).toBeNull()

      expect(wednesday?.opens).toBe('09:00')
      expect(wednesday?.closes).toBe('18:00')

      expect(saturday?.opens).toBe('10:00')
      expect(saturday?.closes).toBe('14:00')

      expect(sunday?.opens).toBeNull()
      expect(sunday?.closes).toBeNull()

      cleanup()
    })

    it('should return undefined for empty hours', async () => {
      const [{ searchWithExtras, enrichedResult }, cleanup] = withSetup(() => useNominatim())

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{
          lat: '50.1109',
          lon: '8.6821',
          address: {
            road: 'Test Street',
            house_number: '1',
            city: 'Frankfurt',
            postcode: '60311'
          },
          extratags: {}
        }]
      })

      await searchWithExtras('Test Shop', 50.1109, 8.6821)
      await flushPromises()

      expect(enrichedResult.value?.openingHoursStructured).toBeUndefined()

      cleanup()
    })
  })
})
