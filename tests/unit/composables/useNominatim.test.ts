import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useNominatim } from '@/composables/useNominatim'

// Mock global fetch
global.fetch = vi.fn()

describe('useNominatim', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('geocodes address to lat/lng', async () => {
    const mockResponse = [
      {
        lat: '50.1109221',
        lon: '8.6820634',
        display_name: 'Zeil, Frankfurt am Main, Germany'
      }
    ]

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const { geocode, result, loading } = useNominatim()

    expect(loading.value).toBe(false)

    const promise = geocode('Zeil, Frankfurt')
    expect(loading.value).toBe(true)

    await promise

    expect(loading.value).toBe(false)
    expect(result.value).toEqual({
      lat: 50.1109221,
      lng: 8.6820634,
      displayName: 'Zeil, Frankfurt am Main, Germany'
    })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://nominatim.openstreetmap.org/search'),
      expect.any(Object)
    )
  })

  it('debounces requests (1 req/sec)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => []
    } as Response)

    const { debouncedGeocode } = useNominatim()

    // Call multiple times rapidly
    debouncedGeocode('Frankfurt')
    debouncedGeocode('Frankfurt am Main')
    debouncedGeocode('Frankfurt am Main, Germany')

    // Should not call immediately
    expect(fetch).not.toHaveBeenCalled()

    // Fast-forward time by 900ms (less than 1 second)
    await vi.advanceTimersByTimeAsync(900)
    expect(fetch).not.toHaveBeenCalled()

    // Fast-forward remaining 100ms to complete 1 second
    await vi.advanceTimersByTimeAsync(100)

    // Should only call once with the last value
    expect(fetch).toHaveBeenCalledTimes(1)
    const callArgs = vi.mocked(fetch).mock.calls[0]
    expect(callArgs[0]).toContain('Frankfurt+am+Main%2C+Germany')
  })

  it('handles no results gracefully', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => []
    } as Response)

    const { geocode, result, error } = useNominatim()
    await geocode('nonexistent address xyz123')

    expect(result.value).toBeNull()
    expect(error.value).toBe('No results found')
  })

  it('handles network errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const { geocode, error } = useNominatim()
    await geocode('Frankfurt')

    expect(error.value).toBe('Network error')
  })

  it('handles HTTP errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    } as Response)

    const { geocode, error } = useNominatim()
    await geocode('Frankfurt')

    expect(error.value).toContain('HTTP error')
  })

  it('does not geocode empty strings', async () => {
    const { geocode } = useNominatim()
    await geocode('')

    expect(fetch).not.toHaveBeenCalled()
  })

  describe('searchWithExtras', () => {
    it('fetches location with extratags and returns enriched data', async () => {
      const mockResponse = [
        {
          lat: '50.1109221',
          lon: '8.6820634',
          display_name: 'Die Auffüllerei, Berger Straße, Frankfurt am Main, Germany',
          address: {
            road: 'Berger Straße',
            house_number: '168',
            city: 'Frankfurt am Main',
            postcode: '60385'
          },
          extratags: {
            phone: '+49 69 12345678',
            website: 'https://www.aufuellerei.de',
            email: 'info@aufuellerei.de',
            opening_hours: 'Mo-Fr 10:00-18:00; Sa 10:00-14:00'
          }
        }
      ]

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const { searchWithExtras, enrichedResult, loading } = useNominatim()

      expect(loading.value).toBe(false)

      const promise = searchWithExtras('Die Auffüllerei', 50.1109221, 8.6820634)
      expect(loading.value).toBe(true)

      await promise

      expect(loading.value).toBe(false)
      expect(enrichedResult.value).toEqual({
        lat: 50.1109221,
        lng: 8.6820634,
        address: 'Berger Straße 168',
        city: 'Frankfurt am Main',
        postalCode: '60385',
        suburb: undefined,
        phone: '+49 69 12345678',
        website: 'https://www.aufuellerei.de',
        email: 'info@aufuellerei.de',
        instagram: undefined,
        openingHours: 'Mo-Fr 10:00-18:00; Sa 10:00-14:00',
        openingHoursFormatted: 'Mo-Fr: 10:00-18:00, Sa: 10:00-14:00',
        openingHoursOsm: 'Mo-Fr 10:00-18:00; Sa 10:00-14:00',
        openingHoursStructured: {
          entries: [
            { day: 'monday', opens: '10:00', closes: '18:00' },
            { day: 'tuesday', opens: '10:00', closes: '18:00' },
            { day: 'wednesday', opens: '10:00', closes: '18:00' },
            { day: 'thursday', opens: '10:00', closes: '18:00' },
            { day: 'friday', opens: '10:00', closes: '18:00' },
            { day: 'saturday', opens: '10:00', closes: '14:00' },
            { day: 'sunday', opens: null, closes: null }
          ],
          special: null
        },
        paymentMethods: undefined
      })

      // Verify API call includes extratags
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('extratags=1'),
        expect.any(Object)
      )
    })

    it('handles missing extratags gracefully', async () => {
      const mockResponse = [
        {
          lat: '50.1109221',
          lon: '8.6820634',
          display_name: 'Frankfurt am Main, Germany',
          address: {
            road: 'Zeil',
            city: 'Frankfurt am Main',
            postcode: '60313'
          }
          // No extratags field
        }
      ]

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const { searchWithExtras, enrichedResult } = useNominatim()
      await searchWithExtras('Zeil', 50.1109221, 8.6820634)

      expect(enrichedResult.value).toEqual({
        lat: 50.1109221,
        lng: 8.6820634,
        address: 'Zeil',
        city: 'Frankfurt am Main',
        postalCode: '60313'
        // No phone, website, email, hours
      })
    })

    it('handles partial extratags data', async () => {
      const mockResponse = [
        {
          lat: '50.1109221',
          lon: '8.6820634',
          display_name: 'Shop, Frankfurt am Main, Germany',
          address: {
            road: 'Berger Straße',
            house_number: '100',
            city: 'Frankfurt am Main',
            postcode: '60385'
          },
          extratags: {
            phone: '+49 69 98765432'
            // Only phone, no website/email/hours
          }
        }
      ]

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const { searchWithExtras, enrichedResult } = useNominatim()
      await searchWithExtras('Shop', 50.1109221, 8.6820634)

      expect(enrichedResult.value).toEqual({
        lat: 50.1109221,
        lng: 8.6820634,
        address: 'Berger Straße 100',
        city: 'Frankfurt am Main',
        postalCode: '60385',
        phone: '+49 69 98765432'
        // No website, email, hours
      })
    })

    it('uses lat/lng for proximity search when provided', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [{
          lat: '50.1109221',
          lon: '8.6820634',
          display_name: 'Test',
          address: { city: 'Frankfurt am Main' }
        }]
      } as Response)

      const { searchWithExtras } = useNominatim()
      await searchWithExtras('Die Auffüllerei', 50.1109221, 8.6820634)

      // Verify API includes lat/lon in query
      const callUrl = vi.mocked(fetch).mock.calls[0][0] as string
      expect(callUrl).toContain('lat=50.1109221')
      expect(callUrl).toContain('lon=8.6820634')
    })

    it('handles errors in searchWithExtras', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const { searchWithExtras, error, enrichedResult } = useNominatim()
      await searchWithExtras('Test Location')

      expect(error.value).toBe('Network error')
      expect(enrichedResult.value).toBeNull()
    })

    it('returns null for empty results in searchWithExtras', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => []
      } as Response)

      const { searchWithExtras, enrichedResult, error } = useNominatim()
      await searchWithExtras('nonexistent location')

      expect(enrichedResult.value).toBeNull()
      expect(error.value).toBe('No results found')
    })

    it('does not call API with empty query', async () => {
      const { searchWithExtras } = useNominatim()
      await searchWithExtras('')

      expect(fetch).not.toHaveBeenCalled()
    })

    it('retries with simplified name when full name returns no results', async () => {
      vi.useFakeTimers()

      const mockResponse = [
        {
          lat: '50.1245912',
          lon: '8.7000886',
          display_name: 'Die Auffüllerei, Frankfurt am Main, Germany',
          address: {
            road: 'Berger Straße',
            house_number: '123',
            city: 'Frankfurt',
            postcode: '60316'
          },
          extratags: {
            phone: '+49 69 12345',
            website: 'https://auffuellerei.de'
          }
        }
      ]

      // First call (full name) returns empty, second call (simplified) returns results
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        } as Response)

      const { searchWithExtras, enrichedResult, error } = useNominatim()
      const searchPromise = searchWithExtras('Die Auffüllerei - unverpackt einkaufen')

      // Fast-forward the 1 second delay between retries
      await vi.runAllTimersAsync()
      await searchPromise

      // Should have made 2 calls
      expect(fetch).toHaveBeenCalledTimes(2)

      // First call with full name
      const firstCallUrl = vi.mocked(fetch).mock.calls[0][0] as string
      expect(firstCallUrl).toContain('q=Die+Auff%C3%BCllerei+-+unverpackt+einkaufen')

      // Second call with simplified name
      const secondCallUrl = vi.mocked(fetch).mock.calls[1][0] as string
      expect(secondCallUrl).toContain('q=Die+Auff%C3%BCllerei')
      expect(secondCallUrl).not.toContain('unverpackt')

      // Should have found results
      expect(error.value).toBeNull()
      expect(enrichedResult.value).not.toBeNull()
      expect(enrichedResult.value?.phone).toBe('+49 69 12345')

      vi.useRealTimers()
    })

    it('parses opening hours into formatted version', async () => {
      const mockResponse = [
        {
          lat: '50.1109221',
          lon: '8.6820634',
          display_name: 'Shop, Frankfurt am Main, Germany',
          address: {
            road: 'Zeil',
            house_number: '1',
            city: 'Frankfurt am Main',
            postcode: '60313'
          },
          extratags: {
            opening_hours: 'Mo-Fr 09:00-18:00; Sa 10:00-14:00; Su off'
          }
        }
      ]

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const { searchWithExtras, enrichedResult } = useNominatim()
      await searchWithExtras('Shop', 50.1109221, 8.6820634)

      expect(enrichedResult.value?.openingHours).toBe('Mo-Fr 09:00-18:00; Sa 10:00-14:00; Su off')
      expect(enrichedResult.value?.openingHoursFormatted).toBe('Mo-Fr: 9:00-18:00, Sa: 10:00-14:00, Su: Geschlossen')
    })

    it('handles missing opening hours gracefully', async () => {
      const mockResponse = [
        {
          lat: '50.1109221',
          lon: '8.6820634',
          display_name: 'Shop, Frankfurt am Main, Germany',
          address: {
            road: 'Zeil',
            city: 'Frankfurt am Main',
            postcode: '60313'
          },
          extratags: {
            phone: '+49 69 12345678'
            // No opening_hours
          }
        }
      ]

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const { searchWithExtras, enrichedResult } = useNominatim()
      await searchWithExtras('Shop', 50.1109221, 8.6820634)

      expect(enrichedResult.value?.openingHours).toBeUndefined()
      expect(enrichedResult.value?.openingHoursFormatted).toBeUndefined()
    })
  })
})
