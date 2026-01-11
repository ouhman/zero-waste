import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SESClient, SendEmailCommand } from 'npm:@aws-sdk/client-ses'

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://map.zerowastefrankfurt.de',
  'http://localhost:5173', // Vite dev server
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

/**
 * Send verification email via AWS SES
 */
async function sendVerificationEmail(email: string, token: string, locationName: string): Promise<void> {
  const verificationUrl = `${FRONTEND_URL}/verify?token=${token}`

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 40px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Bestätigen Sie Ihre Einreichung</h2>
    <p>Vielen Dank für Ihre Einreichung von <strong>${locationName}</strong> bei Zero Waste Frankfurt!</p>
    <p>Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den folgenden Link klicken:</p>
    <a href="${verificationUrl}" class="button">Einreichung bestätigen</a>
    <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
    <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    <p>Dieser Link ist 24 Stunden gültig.</p>
    <p>Nach der Bestätigung wird Ihre Einreichung von unserem Team geprüft.</p>
    <div class="footer">
      <p>Zero Waste Frankfurt<br>
      <a href="https://zerowastefrankfurt.de">zerowastefrankfurt.de</a></p>
    </div>
  </div>
</body>
</html>
  `

  const textBody = `
Bestätigen Sie Ihre Einreichung

Vielen Dank für Ihre Einreichung von "${locationName}" bei Zero Waste Frankfurt!

Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie den folgenden Link öffnen:
${verificationUrl}

Dieser Link ist 24 Stunden gültig.

Nach der Bestätigung wird Ihre Einreichung von unserem Team geprüft.

--
Zero Waste Frankfurt
https://zerowastefrankfurt.de
  `

  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: `Bestätigen Sie Ihre Einreichung: ${locationName}`,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
        Text: {
          Data: textBody,
          Charset: 'UTF-8',
        },
      },
    },
    // Use configuration set for bounce/complaint tracking
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role to bypass RLS
    )

    // Parse request body
    const submissionData: SubmissionData = await req.json()

    // Validate required fields
    if (!submissionData.name || !submissionData.address || !submissionData.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, address, email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(submissionData.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
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

    // Generate verification token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store verification record with submission data
    const { error: verifyError } = await supabaseClient
      .from('email_verifications')
      .insert({
        email: submissionData.email,
        token,
        expires_at: expiresAt.toISOString(),
        submission_data: submissionData, // Store full submission data
      })

    if (verifyError) {
      console.error('Error creating verification:', verifyError)
      return new Response(
        JSON.stringify({ error: 'Failed to create verification record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send verification email via SES
    try {
      await sendVerificationEmail(submissionData.email, token, submissionData.name)
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Don't fail the whole request if email fails in development
      if (Deno.env.get('DENO_ENV') !== 'development') {
        return new Response(
          JSON.stringify({ error: 'Failed to send verification email' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification email sent. Please check your inbox.',
        // In development, return the token for testing
        ...(Deno.env.get('DENO_ENV') === 'development' && { token }),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in submit-location:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
