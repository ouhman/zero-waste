import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { StructuredOpeningHours } from '@/types/osm'

// Mock supabase
const mockInsert = vi.fn()
const mockSelect = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert,
      select: mockSelect
    }))
  }
}))

// Mock fetch for IP retrieval
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve('192.168.1.1')
  } as Response)
)

// Import after mocks
const { useHoursSuggestion } = await import('@/composables/useHoursSuggestion')

describe('useHoursSuggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns correct initial state', () => {
    const { isSubmitting, error, rateLimitExceeded } = useHoursSuggestion()

    expect(isSubmitting.value).toBe(false)
    expect(error.value).toBeNull()
    expect(rateLimitExceeded.value).toBe(false)
  })

  it('sets isSubmitting during submission', async () => {
    // Mock rate limit check
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ count: 0 })
      })
    })

    // Mock insert
    mockInsert.mockResolvedValue({ error: null })

    const { isSubmitting, submitSuggestion } = useHoursSuggestion()

    const suggestedHours: StructuredOpeningHours = {
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

    expect(isSubmitting.value).toBe(false)

    const promise = submitSuggestion('location-id', suggestedHours)

    // Should be submitting now
    expect(isSubmitting.value).toBe(true)

    await promise

    // Should be done submitting
    expect(isSubmitting.value).toBe(false)
  })

  it('handles rate limiting correctly', async () => {
    // Mock rate limit exceeded (count >= 5)
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ count: 5 })
      })
    })

    const { rateLimitExceeded, error, submitSuggestion } = useHoursSuggestion()

    const suggestedHours: StructuredOpeningHours = {
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

    const result = await submitSuggestion('location-id', suggestedHours)

    expect(result.success).toBe(false)
    expect(rateLimitExceeded.value).toBe(true)
    expect(error.value).toBe('Too many suggestions. Please try again later.')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('returns success on successful submission', async () => {
    // Mock rate limit check
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ count: 0 })
      })
    })

    // Mock successful insert
    mockInsert.mockResolvedValue({ error: null })

    const { submitSuggestion } = useHoursSuggestion()

    const suggestedHours: StructuredOpeningHours = {
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

    const result = await submitSuggestion('location-id', suggestedHours, 'Test note')

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        location_id: 'location-id',
        suggested_hours: suggestedHours,
        note: 'Test note',
        ip_hash: expect.any(String)
      })
    )
  })

  it('returns error on failed submission', async () => {
    // Mock rate limit check
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ count: 0 })
      })
    })

    // Mock failed insert
    mockInsert.mockResolvedValue({ error: { message: 'Database error' } })

    const { error, submitSuggestion } = useHoursSuggestion()

    const suggestedHours: StructuredOpeningHours = {
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

    const result = await submitSuggestion('location-id', suggestedHours)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Database error')
    expect(error.value).toBe('Database error')
  })

  it('handles optional note parameter', async () => {
    // Mock rate limit check
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ count: 0 })
      })
    })

    // Mock insert
    mockInsert.mockResolvedValue({ error: null })

    const { submitSuggestion } = useHoursSuggestion()

    const suggestedHours: StructuredOpeningHours = {
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

    await submitSuggestion('location-id', suggestedHours)

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        note: undefined
      })
    )
  })
})
