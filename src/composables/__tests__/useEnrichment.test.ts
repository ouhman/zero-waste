import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEnrichment } from '../useEnrichment'

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useEnrichment', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('should initialize with default state', () => {
    const { loading, error, data } = useEnrichment()

    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
    expect(data.value).toBe(null)
  })

  it('should enrich location from website', async () => {
    const mockData = {
      instagram: 'https://instagram.com/zerowaste',
      phone: '+49 69 123456',
      email: 'info@example.com',
      openingHours: 'Mo-Fr: 9:00-18:00',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockData,
      }),
    })

    const { enrichFromWebsite, loading, error, data } = useEnrichment()

    const result = await enrichFromWebsite('https://example.com')

    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
    expect(data.value).toEqual(mockData)
    expect(result).toEqual(mockData)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.supabase.co/functions/v1/enrich-location',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'test-anon-key',
        },
        body: JSON.stringify({ websiteUrl: 'https://example.com' }),
      }
    )
  })

  it('should handle partial data', async () => {
    const mockData = {
      instagram: 'https://instagram.com/zerowaste',
      // No phone, email, or openingHours
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockData,
      }),
    })

    const { enrichFromWebsite, data } = useEnrichment()

    const result = await enrichFromWebsite('https://example.com')

    expect(data.value).toEqual(mockData)
    expect(result).toEqual(mockData)
  })

  it('should handle empty website URL', async () => {
    const { enrichFromWebsite, error } = useEnrichment()

    const result = await enrichFromWebsite('')

    expect(error.value).toBe('Website URL is required')
    expect(result).toBe(null)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should handle HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        error: 'Not found',
      }),
    })

    const { enrichFromWebsite, error, data } = useEnrichment()

    const result = await enrichFromWebsite('https://example.com')

    expect(error.value).toBe('Not found')
    expect(data.value).toBe(null)
    expect(result).toBe(null)
  })

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { enrichFromWebsite, error, data } = useEnrichment()

    const result = await enrichFromWebsite('https://example.com')

    expect(error.value).toBe('Network error')
    expect(data.value).toBe(null)
    expect(result).toBe(null)
  })

  it('should handle robots.txt blocking', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        error: 'Crawling not allowed by robots.txt',
      }),
    })

    const { enrichFromWebsite, error } = useEnrichment()

    const result = await enrichFromWebsite('https://example.com')

    expect(error.value).toBe('Crawling not allowed by robots.txt')
    expect(result).toBe(null)
  })

  it('should handle timeout', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 408,
      json: async () => ({
        error: 'Request timeout',
      }),
    })

    const { enrichFromWebsite, error } = useEnrichment()

    const result = await enrichFromWebsite('https://example.com')

    expect(error.value).toBe('Request timeout')
    expect(result).toBe(null)
  })

  it('should handle missing environment variables', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')

    const { enrichFromWebsite, error } = useEnrichment()

    const result = await enrichFromWebsite('https://example.com')

    expect(error.value).toBe('Supabase URL not configured')
    expect(result).toBe(null)

    // Restore for other tests
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
  })

  it('should handle API returning success: false', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Failed to extract data',
      }),
    })

    const { enrichFromWebsite, error } = useEnrichment()

    const result = await enrichFromWebsite('https://example.com')

    expect(error.value).toBe('Failed to extract data')
    expect(result).toBe(null)
  })

  it('should reset state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { instagram: 'https://instagram.com/test' },
      }),
    })

    const { enrichFromWebsite, reset, data, error } = useEnrichment()

    await enrichFromWebsite('https://example.com')
    expect(data.value).not.toBe(null)

    reset()

    expect(data.value).toBe(null)
    expect(error.value).toBe(null)
  })

  it('should set loading state correctly', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    mockFetch.mockReturnValueOnce(promise as any)

    const { enrichFromWebsite, loading } = useEnrichment()

    expect(loading.value).toBe(false)

    const enrichPromise = enrichFromWebsite('https://example.com')
    expect(loading.value).toBe(true)

    resolvePromise!({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    })

    await enrichPromise
    expect(loading.value).toBe(false)
  })

  it('should handle malformed JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Invalid JSON')
      },
    })

    const { enrichFromWebsite, error } = useEnrichment()

    const result = await enrichFromWebsite('https://example.com')

    expect(error.value).toMatch(/HTTP 500/)
    expect(result).toBe(null)
  })
})
