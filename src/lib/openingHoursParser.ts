/**
 * Opening Hours Parser
 * Converts OSM opening_hours format to human-readable German text
 *
 * OSM Format: https://wiki.openstreetmap.org/wiki/Key:opening_hours
 * Examples:
 * - "Mo-Fr 09:00-18:00" → "Mo-Fr: 9:00-18:00"
 * - "Mo-Fr 09:00-18:00; Sa 10:00-14:00" → "Mo-Fr: 9:00-18:00, Sa: 10:00-14:00"
 * - "24/7" → "24/7"
 */

export interface FormattedHours {
  raw: string
  formatted: string
}

/**
 * Parses OSM opening_hours string into human-readable format
 */
export function parseOsmOpeningHours(osmHours: string): FormattedHours {
  if (!osmHours || osmHours.trim() === '') {
    return { raw: '', formatted: '' }
  }

  const raw = osmHours

  // Handle 24/7 case
  if (osmHours.trim() === '24/7') {
    return { raw, formatted: '24/7' }
  }

  try {
    // Split by semicolon (different day groups)
    const segments = osmHours.split(';').map(s => s.trim())

    const formattedSegments = segments.map(segment => {
      return formatSegment(segment)
    })

    const formatted = formattedSegments.join(', ')

    return { raw, formatted }
  } catch (e) {
    // If parsing fails, return original
    return { raw, formatted: osmHours }
  }
}

/**
 * Format a single segment (e.g., "Mo-Fr 09:00-18:00" or "Sa 10:00-14:00")
 */
function formatSegment(segment: string): string {
  // Check if this is a closed day (e.g., "Su off" or "PH off")
  if (segment.includes(' off')) {
    const days = segment.replace(' off', '').trim()
    const formattedDays = formatDays(days)
    return `${formattedDays}: Geschlossen`
  }

  // Split into days and hours
  const parts = segment.split(' ')
  if (parts.length < 2) {
    return segment // Return as-is if malformed
  }

  const days = parts[0]
  const hours = parts.slice(1).join(' ')

  // Check if hours contain time information (has colon)
  if (!hours.includes(':')) {
    // Not a valid time format, return as-is
    return segment
  }

  const formattedDays = formatDays(days)
  const formattedHours = formatHours(hours)

  return `${formattedDays}: ${formattedHours}`
}

/**
 * Format day abbreviations (handle PH for public holidays)
 */
function formatDays(days: string): string {
  // Replace PH with German word
  return days.replace(/\bPH\b/g, 'Feiertage')
}

/**
 * Format hours (remove leading zeros, handle multiple time ranges)
 */
function formatHours(hours: string): string {
  // Replace commas with ", " for better readability
  // "08:00-12:00,14:00-18:00" → "8:00-12:00, 14:00-18:00"

  // Split by comma (multiple time ranges in same day)
  const timeRanges = hours.split(',').map(range => {
    return range.trim().replace(/\b0(\d):(\d{2})/g, '$1:$2')
  })

  return timeRanges.join(', ')
}
