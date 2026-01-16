import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SESClient, SendEmailCommand } from 'npm:@aws-sdk/client-ses'
import { getAdminNotificationTemplate } from '../_shared/email-templates.ts'

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://map.zerowastefrankfurt.de',
  'http://localhost:5173', // Vite dev server
  'http://localhost:5174', // Vite dev server (alternate port)
  'http://localhost:4173', // Vite preview
]

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  }
}

// Initialize SES client
const sesClient = new SESClient({
  region: Deno.env.get('AWS_REGION') || 'eu-central-1',
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
  },
})

const FROM_EMAIL = 'noreply@zerowastefrankfurt.de'
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://map.zerowastefrankfurt.de'

interface SubmissionData {
  name: string
  address: string
  city?: string
  postal_code?: string
  suburb?: string
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
 * Notify admin of new verified submission via AWS SES
 * This should not block the main submission flow - errors are logged but not thrown
 */
async function notifyAdminNewSubmission(
  locationName: string,
  submitterEmail: string,
  submittedAt: string
): Promise<void> {
  const adminEmail = Deno.env.get('ADMIN_EMAIL')

  // If no admin email is configured, skip notification (development mode)
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not configured - skipping admin notification')
    return
  }

  const adminPanelUrl = `${FRONTEND_URL}/bulk-station/pending`
  const template = getAdminNotificationTemplate(
    locationName,
    submitterEmail,
    submittedAt,
    adminPanelUrl
  )

  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [adminEmail],
    },
    Message: {
      Subject: {
        Data: template.subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: template.html,
          Charset: 'UTF-8',
        },
        Text: {
          Data: template.text,
          Charset: 'UTF-8',
        },
      },
    },
    ConfigurationSetName: Deno.env.get('SES_CONFIGURATION_SET') || 'zerowaste-config-set',
  })

  await sesClient.send(command)
}

/**
 * Validate coordinates are within valid ranges
 */
function validateCoordinates(lat: string, lon: string): { valid: boolean; error?: string } {
  const latitude = parseFloat(lat)
  const longitude = parseFloat(lon)

  if (isNaN(latitude) || isNaN(longitude)) {
    return { valid: false, error: 'Coordinates must be valid numbers' }
  }

  if (latitude < -90 || latitude > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' }
  }

  if (longitude < -180 || longitude > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' }
  }

  return { valid: true }
}

/**
 * Validate UUID v4 format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validate category UUIDs and check if they exist in the database
 */
async function validateCategories(
  categoryIds: string[],
  supabaseClient: any
): Promise<{ valid: boolean; error?: string; invalidIds?: string[] }> {
  // First check UUID format
  const invalidUUIDs = categoryIds.filter(id => !isValidUUID(id))
  if (invalidUUIDs.length > 0) {
    return {
      valid: false,
      error: 'Invalid category UUID format',
      invalidIds: invalidUUIDs
    }
  }

  // Then check if categories exist in database
  const { data: existingCategories, error } = await supabaseClient
    .from('categories')
    .select('id')
    .in('id', categoryIds)

  if (error) {
    console.error('Error checking categories:', error)
    return { valid: false, error: 'Failed to validate categories' }
  }

  const existingIds = new Set(existingCategories?.map((c: any) => c.id) || [])
  const nonExistentIds = categoryIds.filter(id => !existingIds.has(id))

  if (nonExistentIds.length > 0) {
    return {
      valid: false,
      error: 'Some categories do not exist',
      invalidIds: nonExistentIds
    }
  }

  return { valid: true }
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

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

    // DEV ONLY: Test tokens for UI testing
    // These only work on the dev Supabase project
    const isDevEnvironment = Deno.env.get('SUPABASE_URL')?.includes('lccpndhssuemudzpfvvg')

    if (isDevEnvironment && token === 'test-success') {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'pending',
          message: 'Test verification successful',
          locationName: 'Test Location',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (isDevEnvironment && token === 'test-error') {
      return new Response(
        JSON.stringify({ error: 'This is a test error message for UI testing' }),
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

    // Validate coordinates
    const coordValidation = validateCoordinates(submissionData.latitude, submissionData.longitude)
    if (!coordValidation.valid) {
      return new Response(
        JSON.stringify({ error: coordValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate categories if provided
    if (submissionData.categories && submissionData.categories.length > 0) {
      const categoryValidation = await validateCategories(submissionData.categories, supabaseClient)
      if (!categoryValidation.valid) {
        return new Response(
          JSON.stringify({
            error: categoryValidation.error,
            invalidIds: categoryValidation.invalidIds
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Generate unique slug using PostgreSQL function
    const city = submissionData.city || 'Frankfurt'
    const suburb = submissionData.suburb || null

    const { data: slugData, error: slugError } = await supabaseClient
      .rpc('generate_unique_slug', {
        name: submissionData.name,
        suburb: suburb,
        city: city
      })

    if (slugError) {
      console.error('Error generating slug:', slugError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate slug' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create location record
    const locationData = {
      id: crypto.randomUUID(),
      slug: slugData,
      name: submissionData.name,
      address: submissionData.address,
      city: city,
      postal_code: submissionData.postal_code,
      suburb: suburb,
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
    const verifiedAt = new Date().toISOString()
    const { error: updateError } = await supabaseClient
      .from('email_verifications')
      .update({ verified_at: verifiedAt })
      .eq('id', verification.id)

    if (updateError) {
      console.error('Error updating verification:', updateError)
      // Location was already created, so don't fail
    }

    // Notify admin of new submission (non-blocking)
    try {
      await notifyAdminNewSubmission(
        submissionData.name,
        submissionData.email,
        verifiedAt
      )
    } catch (emailError) {
      // Log error but don't fail the request
      console.error('Error sending admin notification:', emailError)
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
