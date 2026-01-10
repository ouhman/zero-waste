import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSubmission } from '@/composables/useSubmission'

// Mock global fetch for Edge Function calls
global.fetch = vi.fn()

describe('useSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates required fields', () => {
    const { validate, errors } = useSubmission()

    const result = validate({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      email: '',
      submission_type: 'new'
    })

    expect(result).toBe(false)
    expect(errors.value.name).toBeDefined()
    expect(errors.value.address).toBeDefined()
    expect(errors.value.latitude).toBeDefined()
    expect(errors.value.longitude).toBeDefined()
    expect(errors.value.email).toBeDefined()
  })

  it('validates email format', () => {
    const { validate, errors } = useSubmission()

    const result = validate({
      name: 'Test Location',
      address: 'Test Address',
      latitude: '50.1109',
      longitude: '8.6821',
      email: 'invalid-email',
      submission_type: 'new'
    })

    expect(result).toBe(false)
    expect(errors.value.email).toContain('invalid')
  })

  it('validates lat/lng are numbers', () => {
    const { validate, errors } = useSubmission()

    const result = validate({
      name: 'Test Location',
      address: 'Test Address',
      latitude: 'not-a-number',
      longitude: 'also-not-a-number',
      email: 'test@example.com',
      submission_type: 'new'
    })

    expect(result).toBe(false)
    expect(errors.value.latitude).toBeDefined()
    expect(errors.value.longitude).toBeDefined()
  })

  it('validates lat/lng ranges', () => {
    const { validate, errors } = useSubmission()

    const result = validate({
      name: 'Test Location',
      address: 'Test Address',
      latitude: '91.0', // Invalid: > 90
      longitude: '181.0', // Invalid: > 180
      email: 'test@example.com',
      submission_type: 'new'
    })

    expect(result).toBe(false)
    expect(errors.value.latitude).toBeDefined()
    expect(errors.value.longitude).toBeDefined()
  })

  it('passes validation for valid data', () => {
    const { validate, errors } = useSubmission()

    const result = validate({
      name: 'Test Location',
      address: 'Test Address, Frankfurt',
      latitude: '50.1109',
      longitude: '8.6821',
      email: 'test@example.com',
      submission_type: 'new'
    })

    expect(result).toBe(true)
    expect(Object.keys(errors.value)).toHaveLength(0)
  })

  it('submits to Edge Function', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    } as Response)

    const { submit, loading, success } = useSubmission()

    const submissionData = {
      name: 'Test Location',
      address: 'Test Address, Frankfurt',
      city: 'Frankfurt',
      postal_code: '60311',
      latitude: '50.1109',
      longitude: '8.6821',
      email: 'test@example.com',
      submission_type: 'new' as const,
      description_de: 'Test description',
      website: 'https://example.com',
      categories: ['cafe', 'shop']
    }

    await submit(submissionData)

    expect(loading.value).toBe(false)
    expect(success.value).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/submit-location'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: expect.any(String)
      })
    )
  })

  it('handles submission errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid data' })
    } as Response)

    const { submit, error } = useSubmission()

    await submit({
      name: 'Test',
      address: 'Test',
      latitude: '50.1109',
      longitude: '8.6821',
      email: 'test@example.com',
      submission_type: 'new'
    })

    expect(error.value).toBeDefined()
  })

  it('handles network errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const { submit, error } = useSubmission()

    await submit({
      name: 'Test',
      address: 'Test',
      latitude: '50.1109',
      longitude: '8.6821',
      email: 'test@example.com',
      submission_type: 'new'
    })

    expect(error.value).toContain('Network error')
  })

  it('clears errors on new submission', async () => {
    const { validate, errors, clearErrors } = useSubmission()

    validate({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      email: '',
      submission_type: 'new'
    })

    expect(Object.keys(errors.value).length).toBeGreaterThan(0)

    clearErrors()

    expect(Object.keys(errors.value)).toHaveLength(0)
  })
})
