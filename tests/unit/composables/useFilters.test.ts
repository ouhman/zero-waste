import { describe, it, expect } from 'vitest'
import { useFilters } from '@/composables/useFilters'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row'] & {
  location_categories?: {
    categories: Database['public']['Tables']['categories']['Row']
  }[]
}

describe('useFilters', () => {
  const mockLocations: Location[] = [
    {
      id: '1',
      name: 'Location 1',
      slug: 'location-1',
      description_de: null,
      description_en: null,
      address: 'Address 1',
      city: 'Frankfurt',
      postal_code: '60311',
      latitude: '50.1109',
      longitude: '8.6821',
      website: null,
      phone: null,
      email: null,
      instagram: null,
      opening_hours_text: null,
      payment_methods: null,
      opening_hours_osm: null,
      opening_hours_structured: null,
      submission_type: null,
      submitted_by_email: null,
      related_location_id: null,
      status: 'approved',
      approved_by: null,
      rejection_reason: null,
      admin_notes: null,
      deleted_at: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      location_categories: [
        { categories: { id: '1', slug: 'unverpackt', name_de: 'Unverpackt', name_en: 'Bulk Store', icon: null, color: null, sort_order: 1, created_at: '2024-01-01' } }
      ]
    },
    {
      id: '2',
      name: 'Location 2',
      slug: 'location-2',
      description_de: null,
      description_en: null,
      address: 'Address 2',
      city: 'Frankfurt',
      postal_code: '60311',
      latitude: '50.1109',
      longitude: '8.6821',
      website: null,
      phone: null,
      email: null,
      instagram: null,
      opening_hours_text: null,
      payment_methods: null,
      opening_hours_osm: null,
      opening_hours_structured: null,
      submission_type: null,
      submitted_by_email: null,
      related_location_id: null,
      status: 'approved',
      approved_by: null,
      rejection_reason: null,
      admin_notes: null,
      deleted_at: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      location_categories: [
        { categories: { id: '2', slug: 'reparatur', name_de: 'Reparatur', name_en: 'Repair', icon: null, color: null, sort_order: 2, created_at: '2024-01-01' } }
      ]
    },
    {
      id: '3',
      name: 'Location 3',
      slug: 'location-3',
      description_de: null,
      description_en: null,
      address: 'Address 3',
      city: 'Frankfurt',
      postal_code: '60311',
      latitude: '50.1109',
      longitude: '8.6821',
      website: null,
      phone: null,
      email: null,
      instagram: null,
      opening_hours_text: null,
      payment_methods: null,
      opening_hours_osm: null,
      opening_hours_structured: null,
      submission_type: null,
      submitted_by_email: null,
      related_location_id: null,
      status: 'approved',
      approved_by: null,
      rejection_reason: null,
      admin_notes: null,
      deleted_at: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      location_categories: [
        { categories: { id: '1', slug: 'unverpackt', name_de: 'Unverpackt', name_en: 'Bulk Store', icon: null, color: null, sort_order: 1, created_at: '2024-01-01' } },
        { categories: { id: '2', slug: 'reparatur', name_de: 'Reparatur', name_en: 'Repair', icon: null, color: null, sort_order: 2, created_at: '2024-01-01' } }
      ]
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
    const locationsWithoutCategories: Location[] = [
      { ...mockLocations[0], location_categories: [] }
    ]

    const { filterByCategories } = useFilters()

    const result = filterByCategories(locationsWithoutCategories, ['unverpackt'])

    expect(result).toHaveLength(0)
  })
})
