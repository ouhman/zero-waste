/**
 * Types for location enrichment (website schema.org extraction)
 */

export interface EnrichmentRequest {
  websiteUrl: string
}

export interface EnrichmentData {
  instagram?: string
  phone?: string
  email?: string
  openingHours?: string
}

export interface EnrichmentResponse {
  success: boolean
  data?: EnrichmentData
  error?: string
}

export interface EnrichmentState {
  loading: boolean
  error: string | null
  data: EnrichmentData | null
}
