export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name_de: string
          name_en: string
          slug: string
          icon: string | null
          color: string | null
          sort_order: number | null
          created_at: string
          icon_url: string | null
          description_de: string | null
          description_en: string | null
          updated_at: string | null
          always_open: boolean | null
          icon_name: string | null
          marker_size: number | null
        }
        Insert: {
          id?: string
          name_de: string
          name_en: string
          slug: string
          icon?: string | null
          color?: string | null
          sort_order?: number | null
          created_at?: string
          icon_url?: string | null
          description_de?: string | null
          description_en?: string | null
          updated_at?: string | null
          always_open?: boolean | null
          icon_name?: string | null
          marker_size?: number | null
        }
        Update: {
          id?: string
          name_de?: string
          name_en?: string
          slug?: string
          icon?: string | null
          color?: string | null
          sort_order?: number | null
          created_at?: string
          icon_url?: string | null
          description_de?: string | null
          description_en?: string | null
          updated_at?: string | null
          always_open?: boolean | null
          icon_name?: string | null
          marker_size?: number | null
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          slug: string | null
          description_de: string | null
          description_en: string | null
          address: string
          city: string
          suburb: string | null
          postal_code: string | null
          latitude: string
          longitude: string
          website: string | null
          phone: string | null
          email: string | null
          instagram: string | null
          opening_hours_text: string | null
          payment_methods: Json | null
          opening_hours_osm: string | null
          opening_hours_structured: Json | null
          submission_type: string | null
          submitted_by_email: string | null
          related_location_id: string | null
          status: string | null
          approved_by: string | null
          rejection_reason: string | null
          admin_notes: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          description_de?: string | null
          description_en?: string | null
          address: string
          city: string
          suburb?: string | null
          postal_code?: string | null
          latitude: string
          longitude: string
          website?: string | null
          phone?: string | null
          email?: string | null
          instagram?: string | null
          opening_hours_text?: string | null
          payment_methods?: Json | null
          opening_hours_osm?: string | null
          opening_hours_structured?: Json | null
          submission_type?: string | null
          submitted_by_email?: string | null
          related_location_id?: string | null
          status?: string | null
          approved_by?: string | null
          rejection_reason?: string | null
          admin_notes?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          description_de?: string | null
          description_en?: string | null
          address?: string
          city?: string
          suburb?: string | null
          postal_code?: string | null
          latitude?: string
          longitude?: string
          website?: string | null
          phone?: string | null
          email?: string | null
          instagram?: string | null
          opening_hours_text?: string | null
          payment_methods?: Json | null
          opening_hours_osm?: string | null
          opening_hours_structured?: Json | null
          submission_type?: string | null
          submitted_by_email?: string | null
          related_location_id?: string | null
          status?: string | null
          approved_by?: string | null
          rejection_reason?: string | null
          admin_notes?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      location_categories: {
        Row: {
          location_id: string
          category_id: string
        }
        Insert: {
          location_id: string
          category_id: string
        }
        Update: {
          location_id?: string
          category_id?: string
        }
      }
      email_verifications: {
        Row: {
          id: string
          email: string
          token: string
          verified_at: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          token: string
          verified_at?: string | null
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          token?: string
          verified_at?: string | null
          expires_at?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_locations: {
        Args: {
          search_term: string
        }
        Returns: Database['public']['Tables']['locations']['Row'][]
      }
      locations_nearby: {
        Args: {
          lat: number
          lng: number
          radius_meters?: number
        }
        Returns: {
          id: string
          name: string
          slug: string
          address: string
          latitude: string
          longitude: string
          distance_meters: number
        }[]
      }
      check_rate_limit: {
        Args: {
          check_email: string
        }
        Returns: boolean
      }
      is_admin_email: {
        Args: {
          check_email: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Import and re-export types from osm.ts for convenience
import type { PaymentMethods, StructuredOpeningHours } from './osm'
export type { PaymentMethods, StructuredOpeningHours } from './osm'

// Type for submission data
export interface SubmissionData {
  name: string
  address: string
  city: string
  postal_code: string
  latitude: string
  longitude: string
  email: string
  submission_type: 'new' | 'update'
  description_de?: string
  description_en?: string
  website?: string
  phone?: string
  instagram?: string
  opening_hours_text?: string
  payment_methods?: PaymentMethods
  opening_hours_osm?: string
  opening_hours_structured?: StructuredOpeningHours
  categories?: string[]
  related_location_id?: string
}
