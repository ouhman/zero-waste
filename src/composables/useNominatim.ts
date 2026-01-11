import { ref } from 'vue'
import { parseOsmOpeningHours } from '@/lib/openingHoursParser'
import type { PaymentMethods, StructuredOpeningHours } from '@/types/osm'

export interface GeocodingResult {
  lat: number
  lng: number
  displayName: string
}

export interface ReverseGeocodingResult {
  address: string
  city: string
  postalCode: string
  suburb?: string
  displayName: string
}

export interface EnrichedResult {
  lat: number
  lng: number
  address: string
  city: string
  postalCode: string
  suburb?: string
  phone?: string
  website?: string
  email?: string
  instagram?: string
  openingHours?: string
  openingHoursFormatted?: string
  openingHoursOsm?: string
  openingHoursStructured?: StructuredOpeningHours
  paymentMethods?: PaymentMethods
}

/**
 * Extract contact field with preference for contact:* namespace
 * OSM best practice: https://wiki.openstreetmap.org/wiki/Key:contact
 *
 * @param extras - OSM extratags object
 * @param field - Field name without prefix (e.g., 'phone', 'website', 'instagram')
 * @returns The value from contact:field or field, whichever is present (contact:* preferred)
 */
function extractContactField(extras: Record<string, any>, field: string): string | undefined {
  const contactKey = `contact:${field}`
  return extras[contactKey] || extras[field] || undefined
}

/**
 * Extract payment methods from OSM payment:* tags
 * https://wiki.openstreetmap.org/wiki/Key:payment
 *
 * @param extras - OSM extratags object
 * @returns PaymentMethods object with boolean flags
 */
function extractPaymentMethods(extras: Record<string, any>): PaymentMethods | undefined {
  const paymentKeys = Object.keys(extras).filter(key => key.startsWith('payment:'))

  if (paymentKeys.length === 0) {
    return undefined
  }

  const payments: PaymentMethods = {}

  // Helper to check if a value represents true
  const isTrue = (value: any): boolean => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim()
      return normalized === 'yes' || normalized === 'true'
    }
    return false
  }

  // Map OSM payment tags to our PaymentMethods interface
  const paymentMapping: Record<string, keyof PaymentMethods> = {
    'payment:cash': 'cash',
    'payment:credit_cards': 'credit_cards',
    'payment:debit_cards': 'debit_cards',
    'payment:contactless': 'contactless',
    'payment:maestro': 'maestro',
    'payment:visa': 'visa',
    'payment:mastercard': 'mastercard',
    'payment:american_express': 'american_express',
    'payment:cards': 'credit_cards', // Generic cards → credit_cards
    'payment:electronic_purses': 'contactless',
    'payment:nfc': 'contactless',
    'payment:apple_pay': 'mobile_payment',
    'payment:google_pay': 'mobile_payment',
  }

  for (const [osmKey, ourKey] of Object.entries(paymentMapping)) {
    if (extras[osmKey] && isTrue(extras[osmKey])) {
      payments[ourKey] = true
    }
  }

  return Object.keys(payments).length > 0 ? payments : undefined
}

/**
 * Day abbreviations mapping from OSM to our format
 */
const DAY_ABBREVIATIONS: Record<string, StructuredOpeningHours['entries'][0]['day']> = {
  'Mo': 'monday',
  'Tu': 'tuesday',
  'We': 'wednesday',
  'Th': 'thursday',
  'Fr': 'friday',
  'Sa': 'saturday',
  'Su': 'sunday',
}

/**
 * Parse OSM day range (e.g., "Mo-Fr" → ["monday", "tuesday", ...])
 * @param dayRange - OSM day range string (e.g., "Mo-Fr", "Sa", "Mo,We,Fr")
 * @returns Array of day names
 */
function parseDayRange(dayRange: string): StructuredOpeningHours['entries'][0]['day'][] {
  const days: StructuredOpeningHours['entries'][0]['day'][] = []

  // Handle comma-separated days (e.g., "Mo,We,Fr")
  if (dayRange.includes(',')) {
    const individualDays = dayRange.split(',').map(d => d.trim())
    for (const day of individualDays) {
      if (DAY_ABBREVIATIONS[day]) {
        days.push(DAY_ABBREVIATIONS[day])
      }
    }
    return days
  }

  // Handle range (e.g., "Mo-Fr")
  if (dayRange.includes('-')) {
    const [start, end] = dayRange.split('-').map(d => d.trim())
    const dayOrder = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
    const startIdx = dayOrder.indexOf(start)
    const endIdx = dayOrder.indexOf(end)

    if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
      for (let i = startIdx; i <= endIdx; i++) {
        days.push(DAY_ABBREVIATIONS[dayOrder[i]])
      }
    }
    return days
  }

  // Single day (e.g., "Mo")
  if (DAY_ABBREVIATIONS[dayRange]) {
    days.push(DAY_ABBREVIATIONS[dayRange])
  }

  return days
}

/**
 * Parse a single hours segment (e.g., "Mo-Fr 09:00-18:00")
 * @param segment - Hours segment string
 * @returns Array of opening hours entries
 */
function parseHoursSegment(segment: string): StructuredOpeningHours['entries'] {
  const entries: StructuredOpeningHours['entries'] = []

  // Remove whitespace and split into day part and time part
  const trimmed = segment.trim()
  const parts = trimmed.split(/\s+/)

  if (parts.length < 2) {
    return entries // Malformed segment
  }

  const dayPart = parts[0]
  const timePart = parts.slice(1).join(' ')

  // Parse time range (e.g., "09:00-18:00")
  const timeMatch = timePart.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/)
  if (!timeMatch) {
    return entries // No valid time range
  }

  const [, opens, closes] = timeMatch
  const days = parseDayRange(dayPart)

  // Create an entry for each day in the range
  for (const day of days) {
    entries.push({ day, opens, closes })
  }

  return entries
}

/**
 * Parse OSM opening_hours into structured JSON format
 * https://wiki.openstreetmap.org/wiki/Key:opening_hours
 *
 * @param osmHours - OSM opening_hours string (e.g., "Mo-Fr 09:00-18:00; Sa 10:00-16:00")
 * @returns Structured opening hours object or undefined if parsing fails
 */
function parseStructuredHours(osmHours: string | undefined): StructuredOpeningHours | undefined {
  if (!osmHours || osmHours.trim() === '') {
    return undefined
  }

  const trimmed = osmHours.trim()

  // Handle special case: 24/7
  if (trimmed === '24/7') {
    return {
      entries: [],
      special: '24/7'
    }
  }

  // Handle "by appointment" or similar
  if (trimmed.toLowerCase().includes('appointment')) {
    return {
      entries: [],
      special: 'by_appointment'
    }
  }

  try {
    // Split by semicolon (different day groups)
    const segments = trimmed.split(';').map(s => s.trim())
    const allEntries: StructuredOpeningHours['entries'] = []

    for (const segment of segments) {
      // Skip "off" segments (closed days)
      if (segment.includes('off')) {
        continue
      }

      const entries = parseHoursSegment(segment)
      allEntries.push(...entries)
    }

    if (allEntries.length === 0) {
      return undefined
    }

    return {
      entries: allEntries,
      special: null
    }
  } catch (e) {
    // If parsing fails, return undefined (caller can fall back to text)
    console.debug('Failed to parse opening hours:', osmHours, e)
    return undefined
  }
}

export function useNominatim() {
  const result = ref<GeocodingResult | null>(null)
  const reverseResult = ref<ReverseGeocodingResult | null>(null)
  const enrichedResult = ref<EnrichedResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function geocode(address: string): Promise<void> {
    if (!address || address.trim() === '') {
      return
    }

    loading.value = true
    error.value = null
    result.value = null

    try {
      const params = new URLSearchParams({
        format: 'json',
        q: address,
        limit: '1',
        addressdetails: '1'
      })

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            'User-Agent': 'ZeroWasteFrankfurt/1.0'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.length === 0) {
        error.value = 'No results found'
        return
      }

      result.value = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An error occurred'
    } finally {
      loading.value = false
    }
  }

  function debouncedGeocode(address: string): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      geocode(address)
    }, 1000) // 1 second debounce (Nominatim rate limit)
  }

  /**
   * Simplify a business name by removing suffixes after common separators
   * "Die Auffüllerei - unverpackt einkaufen" → "Die Auffüllerei"
   */
  function simplifyBusinessName(name: string): string | null {
    // Remove everything after dash, pipe, or underscore (with optional spaces)
    const simplified = name.split(/\s*[-|_–—]\s*/)[0].trim()
    // Only return if it's different and not empty
    if (simplified && simplified !== name.trim()) {
      return simplified
    }
    return null
  }

  /**
   * Search with extra tags (business metadata)
   * Queries Nominatim with extratags=1 to fetch phone, website, hours, etc.
   * If no results found, retries with simplified business name.
   */
  async function searchWithExtras(query: string, lat?: number, lng?: number): Promise<void> {
    if (!query || query.trim() === '') {
      return
    }

    loading.value = true
    error.value = null
    enrichedResult.value = null

    // Try with full query first, then simplified name if no results
    const queriesToTry = [query]
    const simplifiedName = simplifyBusinessName(query)
    if (simplifiedName) {
      queriesToTry.push(simplifiedName)
    }

    let data: any[] = []
    let lastError: Error | null = null

    for (const searchQuery of queriesToTry) {
      try {
        const params = new URLSearchParams({
          format: 'json',
          q: searchQuery,
          limit: '1',
          addressdetails: '1',
          extratags: '1'
        })

        // Add lat/lon for proximity-based search if provided
        if (lat !== undefined && lng !== undefined) {
          params.append('lat', lat.toString())
          params.append('lon', lng.toString())
        }

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          {
            headers: {
              'User-Agent': 'ZeroWasteFrankfurt/1.0'
            }
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`)
        }

        data = await response.json()
        lastError = null // Clear error on successful request

        if (data.length > 0) {
          // Found results, break out of retry loop
          break
        }

        // No results, wait 1 second before retry (Nominatim rate limit)
        if (queriesToTry.indexOf(searchQuery) < queriesToTry.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (e) {
        // If this attempt fails, save error and continue to next query
        lastError = e instanceof Error ? e : new Error('An error occurred')
        console.debug(`Search for "${searchQuery}" failed:`, e)
      }
    }

    // If all requests failed with errors, report the last error
    if (lastError && data.length === 0) {
      error.value = lastError.message
      loading.value = false
      return
    }

    if (data.length === 0) {
      error.value = 'No results found'
      loading.value = false
      return
    }

    try {
      const result = data[0]
      const addr = result.address || {}
      const extras = result.extratags || {}

      // Build street address from components
      const streetParts = []
      if (addr.road) streetParts.push(addr.road)
      if (addr.house_number) streetParts.push(addr.house_number)
      const streetAddress = streetParts.join(' ')

      // Get city from various possible fields
      const city = addr.city || addr.town || addr.village || addr.municipality || ''

      // Get suburb if available
      const suburb = addr.suburb || undefined

      // Extract contact fields with preference for contact:* namespace
      const phone = extractContactField(extras, 'phone')
      const website = extractContactField(extras, 'website')
      const email = extractContactField(extras, 'email')
      const instagram = extractContactField(extras, 'instagram')

      // Extract payment methods from payment:* tags
      const paymentMethods = extractPaymentMethods(extras)

      // Parse opening hours if available
      let openingHoursFormatted: string | undefined
      let openingHoursStructured: StructuredOpeningHours | undefined
      const openingHoursOsm = extras.opening_hours || undefined

      if (openingHoursOsm) {
        // Human-readable format
        const parsed = parseOsmOpeningHours(openingHoursOsm)
        openingHoursFormatted = parsed.formatted

        // Structured format for "open now" queries
        openingHoursStructured = parseStructuredHours(openingHoursOsm)
      }

      enrichedResult.value = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        address: streetAddress,
        city: city,
        postalCode: addr.postcode || '',
        suburb,
        phone,
        website,
        email,
        instagram,
        openingHours: openingHoursOsm,
        openingHoursFormatted,
        openingHoursOsm,
        openingHoursStructured,
        paymentMethods
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An error occurred'
    } finally {
      loading.value = false
    }
  }

  /**
   * Reverse geocode: convert coordinates to address
   */
  async function reverseGeocode(lat: number, lng: number): Promise<void> {
    if (isNaN(lat) || isNaN(lng)) {
      return
    }

    loading.value = true
    error.value = null
    reverseResult.value = null

    try {
      const params = new URLSearchParams({
        format: 'json',
        lat: lat.toString(),
        lon: lng.toString(),
        addressdetails: '1'
      })

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
        {
          headers: {
            'User-Agent': 'ZeroWasteFrankfurt/1.0'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        error.value = data.error
        return
      }

      const addr = data.address || {}

      // Build street address from components
      const streetParts = []
      if (addr.road) streetParts.push(addr.road)
      if (addr.house_number) streetParts.push(addr.house_number)
      const streetAddress = streetParts.join(' ')

      // Get city from various possible fields
      const city = addr.city || addr.town || addr.village || addr.municipality || ''

      // Get suburb if available
      const suburb = addr.suburb || undefined

      reverseResult.value = {
        address: streetAddress,
        city: city,
        postalCode: addr.postcode || '',
        suburb,
        displayName: data.display_name || ''
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An error occurred'
    } finally {
      loading.value = false
    }
  }

  return {
    result,
    reverseResult,
    enrichedResult,
    loading,
    error,
    geocode,
    debouncedGeocode,
    reverseGeocode,
    searchWithExtras
  }
}
