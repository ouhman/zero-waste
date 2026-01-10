import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EnrichmentRequest {
  websiteUrl: string
}

interface EnrichmentResponse {
  success: boolean
  data?: {
    instagram?: string
    phone?: string
    email?: string
    openingHours?: string
  }
  error?: string
}

interface SchemaOrgBusiness {
  '@type'?: string | string[]
  telephone?: string
  email?: string
  sameAs?: string | string[]
  openingHoursSpecification?: Array<{
    dayOfWeek?: string | string[]
    opens?: string
    closes?: string
  }>
  openingHours?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { websiteUrl }: EnrichmentRequest = await req.json()

    // Validate URL
    if (!websiteUrl || websiteUrl.trim() === '') {
      return new Response(
        JSON.stringify({ success: false, error: 'Website URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let url: URL
    try {
      url = new URL(websiteUrl)
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check robots.txt
    const robotsAllowed = await checkRobotsTxt(url)
    if (!robotsAllowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Crawling not allowed by robots.txt'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch website HTML with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    let html: string
    try {
      const response = await fetch(websiteUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ZeroWasteFrankfurt/1.0 (Location Enrichment Bot)',
          'Accept': 'text/html',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      html = await response.text()
    } catch (e) {
      if (e.name === 'AbortError') {
        return new Response(
          JSON.stringify({ success: false, error: 'Request timeout' }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw e
    } finally {
      clearTimeout(timeoutId)
    }

    // Extract schema.org data
    const enrichmentData = extractSchemaOrgData(html)

    return new Response(
      JSON.stringify({
        success: true,
        data: enrichmentData,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in enrich-location:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to enrich location'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Check if crawling is allowed by robots.txt
 */
async function checkRobotsTxt(url: URL): Promise<boolean> {
  try {
    const robotsUrl = `${url.protocol}//${url.host}/robots.txt`
    const response = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(2000), // 2 second timeout for robots.txt
    })

    if (!response.ok) {
      // If robots.txt doesn't exist, allow crawling
      return true
    }

    const robotsTxt = await response.text()

    // Very basic robots.txt parser - check for Disallow: /
    // A production version would need a proper parser
    const lines = robotsTxt.split('\n')
    let userAgentMatches = false

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase()

      if (trimmed.startsWith('user-agent:')) {
        const agent = trimmed.substring('user-agent:'.length).trim()
        userAgentMatches = agent === '*' || agent === 'zerowastefrankfurt'
      }

      if (userAgentMatches && trimmed.startsWith('disallow:')) {
        const path = trimmed.substring('disallow:'.length).trim()
        // If disallow root, return false
        if (path === '/' || path === '') {
          return false
        }
      }
    }

    return true
  } catch {
    // If we can't check robots.txt, allow crawling
    return true
  }
}

/**
 * Extract schema.org JSON-LD data from HTML
 */
function extractSchemaOrgData(html: string): EnrichmentResponse['data'] {
  const data: EnrichmentResponse['data'] = {}

  try {
    // Find all JSON-LD script tags
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    const matches = html.matchAll(jsonLdRegex)

    for (const match of matches) {
      try {
        const jsonContent = match[1].trim()
        const schema = JSON.parse(jsonContent)

        // Handle both single objects and arrays
        const schemas = Array.isArray(schema) ? schema : [schema]

        for (const item of schemas) {
          extractBusinessData(item, data)
        }
      } catch {
        // Skip malformed JSON
        continue
      }
    }
  } catch {
    // If extraction fails, return empty data
  }

  return data
}

/**
 * Extract business data from schema.org object
 */
function extractBusinessData(
  schema: SchemaOrgBusiness,
  data: EnrichmentResponse['data']
): void {
  if (!schema || typeof schema !== 'object') {
    return
  }

  // Check if this is a business type
  const type = schema['@type']
  const businessTypes = [
    'LocalBusiness',
    'Store',
    'Restaurant',
    'Cafe',
    'Shop',
    'Organization',
  ]

  const isBusinessType = Array.isArray(type)
    ? type.some((t) => businessTypes.includes(t))
    : typeof type === 'string' && businessTypes.includes(type)

  if (!isBusinessType) {
    // Recursively check nested objects
    for (const value of Object.values(schema)) {
      if (typeof value === 'object' && value !== null) {
        extractBusinessData(value as SchemaOrgBusiness, data)
      }
    }
    return
  }

  // Extract phone
  if (!data.phone && schema.telephone) {
    data.phone = String(schema.telephone)
  }

  // Extract email
  if (!data.email && schema.email) {
    data.email = String(schema.email)
  }

  // Extract Instagram from sameAs array
  if (!data.instagram && schema.sameAs) {
    const sameAsArray = Array.isArray(schema.sameAs)
      ? schema.sameAs
      : [schema.sameAs]

    for (const link of sameAsArray) {
      const linkStr = String(link)
      if (linkStr.includes('instagram.com/')) {
        data.instagram = linkStr
        break
      }
    }
  }

  // Extract opening hours
  if (!data.openingHours) {
    if (schema.openingHours) {
      data.openingHours = String(schema.openingHours)
    } else if (schema.openingHoursSpecification) {
      // Convert openingHoursSpecification to readable format
      const hoursText = formatOpeningHoursSpecification(
        schema.openingHoursSpecification
      )
      if (hoursText) {
        data.openingHours = hoursText
      }
    }
  }
}

/**
 * Format openingHoursSpecification into readable text
 */
function formatOpeningHoursSpecification(
  spec: SchemaOrgBusiness['openingHoursSpecification']
): string | null {
  if (!Array.isArray(spec) || spec.length === 0) {
    return null
  }

  try {
    const formatted = spec
      .map((hours) => {
        const days = Array.isArray(hours.dayOfWeek)
          ? hours.dayOfWeek.join(', ')
          : hours.dayOfWeek || ''

        const opens = hours.opens || ''
        const closes = hours.closes || ''

        if (!days || !opens || !closes) {
          return null
        }

        return `${days}: ${opens}-${closes}`
      })
      .filter(Boolean)
      .join(', ')

    return formatted || null
  } catch {
    return null
  }
}
