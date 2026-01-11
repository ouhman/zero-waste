/**
 * PopupCard - Generates HTML for Leaflet map popups
 *
 * Since Leaflet popups require HTML strings (not Vue components),
 * this utility generates consistent popup HTML for map markers.
 */

import type { Database } from '@/types/database'
import type { PaymentMethods } from '@/types/osm'
import { PAYMENT_METHOD_ICONS } from '@/types/osm'

type Location = Database['public']['Tables']['locations']['Row'] & {
  location_categories?: {
    categories: Database['public']['Tables']['categories']['Row']
  }[]
}

interface PopupCardOptions {
  showDetailsButton?: boolean
  showShareButton?: boolean
  showDirectionsButton?: boolean
}

/**
 * Format payment methods as HTML
 */
function formatPaymentMethodsHTML(paymentMethods: any): string {
  if (!paymentMethods || typeof paymentMethods !== 'object') return ''

  const enabledMethods: Array<{ icon: string; key: string }> = []

  // Priority order for display (most common first)
  const priorityOrder: (keyof PaymentMethods)[] = [
    'cash',
    'debit_cards',
    'credit_cards',
    'contactless'
  ]

  for (const key of priorityOrder) {
    if (paymentMethods[key]) {
      enabledMethods.push({
        key,
        icon: PAYMENT_METHOD_ICONS[key]
      })
    }
  }

  if (enabledMethods.length === 0) return ''

  const iconsHtml = enabledMethods
    .map(method => `<span style="display: inline-block; margin-right: 4px;">${method.icon}</span>`)
    .join('')

  return `
    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; color: #64748b; font-size: 13px;">
      ${iconsHtml}
    </div>
  `
}

/**
 * Format contact info as HTML
 */
function formatContactInfoHTML(location: Location): string {
  let html = ''

  if (location.website) {
    const displayUrl = location.website.replace(/^https?:\/\//, '').replace(/\/$/, '')
    html += `
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 13px;">
        <span>🌐</span>
        <a href="${location.website}" target="_blank" rel="noopener" style="color: #2563eb; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${displayUrl}
        </a>
      </div>
    `
  }

  if (location.phone) {
    html += `
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 13px;">
        <span>📞</span>
        <a href="tel:${location.phone}" style="color: #2563eb; text-decoration: none;">${location.phone}</a>
      </div>
    `
  }

  if (location.email) {
    html += `
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 13px;">
        <span>✉️</span>
        <a href="mailto:${location.email}" style="color: #2563eb; text-decoration: none;">${location.email}</a>
      </div>
    `
  }

  if (location.instagram) {
    const instagramHandle = location.instagram.replace('@', '')
    html += `
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 13px;">
        <span>📸</span>
        <a href="https://instagram.com/${instagramHandle}" target="_blank" rel="noopener" style="color: #2563eb; text-decoration: none;">${location.instagram}</a>
      </div>
    `
  }

  return html
}

/**
 * Format categories as HTML
 */
function formatCategoriesHTML(location: Location): string {
  const categories = location.location_categories
    ?.map(lc => lc.categories?.name_de)
    .filter(Boolean) || []

  if (categories.length === 0) return ''

  const categoriesHtml = categories
    .map(cat => `
      <span style="
        display: inline-block;
        padding: 2px 8px;
        background: #f0fdf4;
        color: #15803d;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
      ">${cat}</span>
    `)
    .join('')

  return `
    <div style="margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 4px;">
      ${categoriesHtml}
    </div>
  `
}

/**
 * Generate popup HTML for a location
 */
export function generatePopupHTML(
  location: Location,
  options: PopupCardOptions = {}
): string {
  const {
    showDetailsButton = true,
    showShareButton = true,
    showDirectionsButton = true
  } = options

  const lat = parseFloat(location.latitude)
  const lng = parseFloat(location.longitude)

  const categoriesHTML = formatCategoriesHTML(location)
  const contactHTML = formatContactInfoHTML(location)
  const paymentMethodsHTML = formatPaymentMethodsHTML(location.payment_methods)

  // Build description section
  const descriptionHTML = location.description_de
    ? `
      <p style="margin: 10px 0; font-size: 13px; color: #475569; line-height: 1.4;">
        ${location.description_de.length > 120
          ? location.description_de.substring(0, 120) + '...'
          : location.description_de}
      </p>
    `
    : ''

  // Build opening hours section
  const openingHoursHTML = location.opening_hours_text
    ? `
      <div style="display: flex; align-items: start; gap: 6px; margin-bottom: 8px; color: #64748b; font-size: 13px;">
        <span>🕐</span>
        <span>${location.opening_hours_text}</span>
      </div>
    `
    : ''

  // Build action buttons
  const actionsHTML = []

  if (showDetailsButton) {
    actionsHTML.push(`
      <button
        class="location-details-btn"
        data-location-id="${location.id}"
        style="
          flex: 1;
          display: inline-block;
          padding: 8px 12px;
          background: #10b981;
          color: white;
          border: none;
          font-size: 13px;
          font-weight: 500;
          border-radius: 6px;
          text-align: center;
          cursor: pointer;
        "
      >
        Details →
      </button>
    `)
  }

  if (showShareButton) {
    actionsHTML.push(`
      <button
        class="location-share-btn"
        data-location-id="${location.id}"
        style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          background: #f1f5f9;
          color: #475569;
          border: none;
          font-size: 13px;
          border-radius: 6px;
          cursor: pointer;
        "
        title="Teilen"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      </button>
    `)
  }

  if (showDirectionsButton) {
    actionsHTML.push(`
      <a
        href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=bicycling"
        target="_blank"
        rel="noopener"
        style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          background: #f1f5f9;
          color: #475569;
          text-decoration: none;
          font-size: 13px;
          border-radius: 6px;
        "
        title="Route planen"
      >
        🚲
      </a>
    `)
  }

  const actionsRowHTML = actionsHTML.length > 0
    ? `
      <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; gap: 8px;">
        ${actionsHTML.join('')}
      </div>
    `
    : ''

  return `
    <div style="min-width: 250px; max-width: 300px;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1e293b;">
        ${location.name}
      </h3>

      ${categoriesHTML}

      <div style="display: flex; align-items: start; gap: 6px; margin-bottom: 8px; color: #64748b; font-size: 13px;">
        <span>📍</span>
        <span>${location.address}${location.postal_code ? `, ${location.postal_code}` : ''} ${location.city || 'Frankfurt'}</span>
      </div>

      ${openingHoursHTML}

      ${paymentMethodsHTML}

      ${contactHTML}

      ${descriptionHTML}

      ${actionsRowHTML}
    </div>
  `
}
