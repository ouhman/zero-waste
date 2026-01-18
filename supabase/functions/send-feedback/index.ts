import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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

interface FeedbackData {
  message: string
  email?: string
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
const TO_EMAIL = 'zerowastehello.u1khz@passmail.net'

// In-memory rate limiting
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 240000 // 4 minutes = 240000ms
const MAX_REQUESTS = 1 // 1 request per 4 minutes

/**
 * Get client IP address from request headers
 */
function getClientIP(req: Request): string {
  // Check various headers for IP address
  const xForwardedFor = req.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim()
  }

  const xRealIp = req.headers.get('x-real-ip')
  if (xRealIp) {
    return xRealIp
  }

  // Fallback to 'unknown' if no IP found
  return 'unknown'
}

/**
 * Check if request should be rate limited
 * Cleans up old entries to prevent memory leaks
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []

  // Filter out timestamps outside the rate limit window
  const recentTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  )

  // Clean up old entries from the map periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, values] of rateLimitMap.entries()) {
      const filtered = values.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)
      if (filtered.length === 0) {
        rateLimitMap.delete(key)
      } else {
        rateLimitMap.set(key, filtered)
      }
    }
  }

  // Check if limit exceeded
  if (recentTimestamps.length >= MAX_REQUESTS) {
    return true
  }

  // Add current timestamp and update map
  recentTimestamps.push(now)
  rateLimitMap.set(ip, recentTimestamps)

  return false
}

/**
 * Format timestamp in German locale
 */
function formatTimestamp(): string {
  return new Date().toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

/**
 * Send feedback email via AWS SES
 */
async function sendFeedbackEmail(message: string, email?: string): Promise<void> {
  const timestamp = formatTimestamp()

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 20px; border-radius: 6px 6px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 6px 6px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #374151; }
    .value { margin-top: 5px; padding: 10px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; }
    .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">Neues Feedback: Zero Waste Frankfurt</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Zeitstempel:</div>
        <div class="value">${timestamp}</div>
      </div>
      <div class="field">
        <div class="label">Nachricht:</div>
        <div class="value">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
      </div>
      ${email ? `
      <div class="field">
        <div class="label">E-Mail für Antwort:</div>
        <div class="value"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
      </div>
      ` : `
      <div class="field">
        <div class="label">E-Mail für Antwort:</div>
        <div class="value"><em>Nicht angegeben</em></div>
      </div>
      `}
      <div class="footer">
        <p>Dieses Feedback wurde über die Beta-Version von map.zerowastefrankfurt.de gesendet.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `

  const textBody = `
Neues Feedback: Zero Waste Frankfurt

Zeitstempel: ${timestamp}

Nachricht:
${message}

${email ? `E-Mail für Antwort: ${email}` : 'E-Mail für Antwort: Nicht angegeben'}

--
Dieses Feedback wurde über die Beta-Version von map.zerowastefrankfurt.de gesendet.
  `

  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [TO_EMAIL],
    },
    Message: {
      Subject: {
        Data: 'Feedback: Zero Waste Frankfurt',
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

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(req)

    // Check rate limit
    if (isRateLimited(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const feedbackData: FeedbackData = await req.json()

    // Validate required fields
    if (!feedbackData.message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate message length (minimum 10 characters)
    if (feedbackData.message.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Message must be at least 10 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format if provided
    if (feedbackData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(feedbackData.email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Send feedback email via SES
    try {
      await sendFeedbackEmail(feedbackData.message, feedbackData.email)
    } catch (emailError) {
      console.error('Error sending feedback email:', emailError)
      // Don't fail the whole request if email fails in development
      if (Deno.env.get('DENO_ENV') !== 'development') {
        return new Response(
          JSON.stringify({ error: 'Failed to send feedback email' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-feedback:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
