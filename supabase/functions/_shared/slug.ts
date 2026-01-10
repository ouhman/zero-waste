/**
 * Slug generation utility for URL-safe identifiers
 *
 * Handles German characters (ä, ö, ü, ß) and other diacritics properly.
 *
 * NOTE: This is a copy of src/utils/slug.ts for Deno Edge Functions.
 * Keep both files in sync when making changes.
 */

/**
 * Character replacements for German umlauts and special characters.
 * These should be replaced BEFORE Unicode normalization to preserve intent.
 */
const GERMAN_REPLACEMENTS: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
  Ä: 'ae',
  Ö: 'oe',
  Ü: 'ue',
}

/**
 * Generate a URL-safe slug from a name and city.
 *
 * @param name - The location name
 * @param city - The city name (included to prevent collisions across cities)
 * @returns A URL-safe slug in format: {name}-{city}-{random6}
 *
 * @example
 * generateSlug('Repair Café Bockenheim', 'Frankfurt am Main')
 * // => 'repair-cafe-bockenheim-frankfurt-am-main-x7k2m9'
 *
 * // Avoids city duplication when name already contains city:
 * generateSlug('Tegut | Bad Soden am Taunus', 'Bad Soden am Taunus')
 * // => 'tegut-bad-soden-am-taunus-x7k2m9'
 */
export function generateSlug(name: string, city: string): string {
  const slugifiedName = slugify(name)
  const slugifiedCity = slugify(city)

  // Avoid city duplication if name already ends with the city
  let base: string
  if (slugifiedCity && slugifiedName.endsWith(slugifiedCity)) {
    base = slugifiedName
  } else if (slugifiedCity) {
    base = `${slugifiedName}-${slugifiedCity}`
  } else {
    base = slugifiedName
  }

  // Add random suffix to avoid collisions
  const suffix = generateRandomSuffix()
  return `${base}-${suffix}`
}

/**
 * Convert a string to a URL-safe slug.
 *
 * @param text - The text to slugify
 * @returns A URL-safe slug
 *
 * @example
 * slugify('Café Müller')
 * // => 'cafe-mueller'
 */
export function slugify(text: string): string {
  let result = text

  // 1. Replace German special characters first (before any case conversion)
  for (const [char, replacement] of Object.entries(GERMAN_REPLACEMENTS)) {
    result = result.split(char).join(replacement)
  }

  // 2. Convert to lowercase
  result = result.toLowerCase()

  // 3. Normalize Unicode and remove diacritics (é → e, ñ → n, etc.)
  result = result
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  // 4. Replace any non-alphanumeric characters with hyphens
  result = result.replace(/[^a-z0-9]+/g, '-')

  // 5. Remove leading/trailing hyphens
  result = result.replace(/^-+|-+$/g, '')

  return result
}

/**
 * Generate a random 6-character alphanumeric suffix.
 * Uses multiple random calls to ensure we always get 6 characters.
 */
export function generateRandomSuffix(): string {
  // Generate enough random characters to ensure we get 6
  // Math.random() can return 0, so we combine multiple calls
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
