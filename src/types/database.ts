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
    }
    Enums: {
      [_ in never]: never
    }
  }
}
