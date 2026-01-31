import { describe, it, expect } from 'vitest'
import { useFilters } from '@/composables/useFilters'
import { createMockLocation, createMockCategory } from '../../utils/test-helpers'
import type { Location } from '../../utils/test-helpers'

describe('useFilters', () => {
  const cat1 = createMockCategory({ id: '1', slug: 'unverpackt', name_de: 'Unverpackt', name_en: 'Bulk Store' })
  const cat2 = createMockCategory({ id: '2', slug: 'reparatur', name_de: 'Reparatur', name_en: 'Repair' })

  const mockLocations: (Location & { location_categories?: { categories: any }[] })[] = [
    {
      ...createMockLocation({ id: '1', name: 'Location 1', slug: 'location-1' }),
      location_categories: [{ categories: cat1 }]
    },
    {
      ...createMockLocation({ id: '2', name: 'Location 2', slug: 'location-2' }),
      location_categories: [{ categories: cat2 }]
    },
    {
      ...createMockLocation({ id: '3', name: 'Location 3', slug: 'location-3' }),
      location_categories: [{ categories: cat1 }, { categories: cat2 }]
    }
  ]

  it('filters locations by single category', () => {
    const { filterByCategories } = useFilters()

    const result = filterByCategories(mockLocations, ['unverpackt'])

    expect(result).toHaveLength(2)
    expect(result.map(l => l.id)).toContain('1')
    expect(result.map(l => l.id)).toContain('3')
  })

  it('filters locations by multiple categories (OR logic)', () => {
    const { filterByCategories } = useFilters()

    const result = filterByCategories(mockLocations, ['unverpackt', 'reparatur'])

    expect(result).toHaveLength(3)
  })

  it('returns all locations when no filter selected', () => {
    const { filterByCategories } = useFilters()

    const result = filterByCategories(mockLocations, [])

    expect(result).toHaveLength(3)
  })

  it('returns empty array when no matches', () => {
    const { filterByCategories } = useFilters()

    const result = filterByCategories(mockLocations, ['non-existent'])

    expect(result).toHaveLength(0)
  })

  it('handles locations without categories', () => {
    const locationsWithoutCategories = [
      { ...createMockLocation({ id: mockLocations[0].id }), location_categories: [] }
    ]

    const { filterByCategories } = useFilters()

    const result = filterByCategories(locationsWithoutCategories, ['unverpackt'])

    expect(result).toHaveLength(0)
  })
})
