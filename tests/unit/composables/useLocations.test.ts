import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLocations } from '@/composables/useLocations'

describe('useLocations', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('provides loading state', () => {
    const { loading } = useLocations()

    expect(loading).toBeDefined()
    expect(typeof loading.value).toBe('boolean')
  })

  it('provides error state', () => {
    const { error } = useLocations()

    expect(error).toBeDefined()
    expect(error.value).toBeNull()
  })

  it('provides locations array', () => {
    const { locations } = useLocations()

    expect(locations).toBeDefined()
    expect(Array.isArray(locations.value)).toBe(true)
  })

  it('provides fetchLocations function', () => {
    const { fetchLocations } = useLocations()

    expect(fetchLocations).toBeDefined()
    expect(typeof fetchLocations).toBe('function')
  })

  it('fetches locations and updates state', async () => {
    const { locations, loading, fetchLocations } = useLocations()

    expect(loading.value).toBe(false)

    await fetchLocations()

    expect(locations.value).toBeDefined()
    expect(loading.value).toBe(false)
  })
})
