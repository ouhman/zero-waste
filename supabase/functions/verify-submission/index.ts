import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubmissionData {
  name: string
  address: string
  city?: string
  postal_code?: string
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
  payment_methods?: any
  opening_hours_osm?: string
  opening_hours_structured?: any
  categories?: string[]
  related_location_id?: string
}

/**
 * Generate a URL-safe slug from text
 */
function generateSlug(name: string, city: string): string {
  const base = `${name}-${city}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Add random suffix to avoid collisions
  const suffix = Math.random().toString(36).substring(2, 8)
  return `${base}-${suffix}`
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role to bypass RLS
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse request body
    const { token } = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find verification record with submission data
    const { data: verification, error: verifyError } = await supabaseClient
      .from('email_verifications')
      .select('*')
      .eq('token', token)
      .is('verified_at', null)
      .single()

    if (verifyError || !verification) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if token expired
    if (new Date(verification.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token has expired. Please submit again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get submission data
    const submissionData: SubmissionData = verification.submission_data
    if (!submissionData) {
      return new Response(
        JSON.stringify({ error: 'No submission data found for this token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create location record
    const city = submissionData.city || 'Frankfurt'
    const locationData = {
      id: crypto.randomUUID(),
      slug: generateSlug(submissionData.name, city),
      name: submissionData.name,
      address: submissionData.address,
      city: city,
      postal_code: submissionData.postal_code,
      latitude: submissionData.latitude,
      longitude: submissionData.longitude,
      description_de: submissionData.description_de,
      description_en: submissionData.description_en,
      website: submissionData.website,
      phone: submissionData.phone,
      email: submissionData.email,
      instagram: submissionData.instagram,
      opening_hours_text: submissionData.opening_hours_text,
      payment_methods: submissionData.payment_methods,
      opening_hours_osm: submissionData.opening_hours_osm,
      opening_hours_structured: submissionData.opening_hours_structured,
      submission_type: submissionData.submission_type,
      submitted_by_email: submissionData.email,
      status: 'pending', // Requires admin approval
      related_location_id: submissionData.related_location_id,
    }

    const { error: insertError } = await supabaseClient
      .from('locations')
      .insert(locationData)

    if (insertError) {
      console.error('Error creating location:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create location record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert categories if provided
    if (submissionData.categories && submissionData.categories.length > 0) {
      const categoryInserts = submissionData.categories.map(categoryId => ({
        location_id: locationData.id,
        category_id: categoryId,
      }))

      const { error: categoryError } = await supabaseClient
        .from('location_categories')
        .insert(categoryInserts)

      if (categoryError) {
        console.error('Error adding categories:', categoryError)
        // Don't fail the whole request if categories fail
      }
    }

    // Mark verification as complete
    const { error: updateError } = await supabaseClient
      .from('email_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verification.id)

    if (updateError) {
      console.error('Error updating verification:', updateError)
      // Location was already created, so don't fail
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: 'pending',
        message: 'Vielen Dank! Ihre Einreichung wurde bestätigt und wird von unserem Team geprüft.',
        locationName: submissionData.name,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in verify-submission:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
