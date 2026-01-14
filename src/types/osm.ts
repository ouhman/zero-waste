/**
 * Types for OpenStreetMap data enrichment
 * Payment methods, opening hours, and contact information
 */

/**
 * Payment methods extracted from OSM payment:* tags
 * All fields are optional since not all locations support all payment types
 */
export interface PaymentMethods {
  cash?: boolean              // payment:cash
  credit_cards?: boolean      // payment:credit_cards
  debit_cards?: boolean       // payment:debit_cards (EC-Karten in Germany)
  contactless?: boolean       // payment:contactless (NFC/tap to pay)
  maestro?: boolean          // payment:maestro
  visa?: boolean             // payment:visa
  mastercard?: boolean       // payment:mastercard
  american_express?: boolean // payment:american_express
  mobile_payment?: boolean   // payment:mobile_payment (Apple/Google Pay)
}

/**
 * Single opening hours entry for a specific day
 */
export interface OpeningHoursEntry {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  opens: string | null   // Format: "HH:MM" (24-hour), null = closed
  closes: string | null  // Format: "HH:MM" (24-hour), null = closed
}

/**
 * Structured opening hours parsed from OSM opening_hours tag
 * Enables programmatic "open now" checks and advanced filtering
 */
export interface StructuredOpeningHours {
  entries: OpeningHoursEntry[]
  special?: '24/7' | 'by_appointment' | null  // Special cases like always open or by appointment
}

/**
 * OSM contact fields with preference for contact:* namespace
 * https://wiki.openstreetmap.org/wiki/Key:contact
 */
export interface OSMContactFields {
  phone?: string        // contact:phone or phone
  email?: string        // contact:email or email
  website?: string      // contact:website or website
  instagram?: string    // contact:instagram
  facebook?: string     // contact:facebook
  twitter?: string      // contact:twitter
}

/**
 * Extended location data from OSM enrichment
 * Used during the enrichment process before saving to database
 */
export interface OSMEnrichedData {
  // Contact information
  contact?: OSMContactFields

  // Payment methods
  paymentMethods?: PaymentMethods

  // Opening hours (three formats)
  openingHoursOsm?: string                    // Raw OSM format: "Mo-Fr 09:00-18:00"
  openingHoursStructured?: StructuredOpeningHours  // Parsed JSON for queries
  openingHoursText?: string                   // Human-readable fallback
}

/**
 * Day abbreviations used in OSM opening_hours tag
 * https://wiki.openstreetmap.org/wiki/Key:opening_hours
 */
export const OSM_DAY_ABBREVIATIONS: Record<string, OpeningHoursEntry['day']> = {
  'Mo': 'monday',
  'Tu': 'tuesday',
  'We': 'wednesday',
  'Th': 'thursday',
  'Fr': 'friday',
  'Sa': 'saturday',
  'Su': 'sunday',
}

/**
 * Payment method labels for UI display (German)
 */
export const PAYMENT_METHOD_LABELS_DE: Record<keyof PaymentMethods, string> = {
  cash: 'Bargeld',
  credit_cards: 'Kreditkarten',
  debit_cards: 'EC-Karten',
  contactless: 'Kontaktlos',
  maestro: 'Maestro',
  visa: 'Visa',
  mastercard: 'Mastercard',
  american_express: 'American Express',
  mobile_payment: 'Mobile Payment',
}

/**
 * Payment method labels for UI display (English)
 */
export const PAYMENT_METHOD_LABELS_EN: Record<keyof PaymentMethods, string> = {
  cash: 'Cash',
  credit_cards: 'Credit Cards',
  debit_cards: 'Debit Cards',
  contactless: 'Contactless',
  maestro: 'Maestro',
  visa: 'Visa',
  mastercard: 'Mastercard',
  american_express: 'American Express',
  mobile_payment: 'Mobile Payment',
}

/**
 * Payment method icons (emoji) for UI display
 */
export const PAYMENT_METHOD_ICONS: Record<keyof PaymentMethods, string> = {
  cash: '💵',
  credit_cards: '💳',
  debit_cards: '🏧',
  contactless: '📱',
  maestro: '💳',
  visa: '💳',
  mastercard: '💳',
  american_express: '💳',
  mobile_payment: '📱',
}
