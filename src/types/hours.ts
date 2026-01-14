import type { StructuredOpeningHours } from './osm'

/**
 * Hours suggestion submitted by users to correct location opening hours
 */
export interface HoursSuggestion {
  id: string
  location_id: string
  suggested_hours: StructuredOpeningHours
  note: string | null
  ip_hash: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at: string | null
  reviewed_by: string | null
  admin_note: string | null
  created_at: string
  updated_at: string
}

/**
 * Data required to insert a new hours suggestion
 */
export interface HoursSuggestionInsert {
  location_id: string
  suggested_hours: StructuredOpeningHours
  note?: string
  ip_hash: string
}

/**
 * Hours suggestion with location information for admin review list
 */
export interface HoursSuggestionWithLocation extends HoursSuggestion {
  location: {
    id: string
    name: string
    slug: string
    opening_hours_structured: StructuredOpeningHours | null
  }
}
