import { chromium } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface BuecherschrankLocation {
  name: string
  district: string
  location_short: string
  street: string
  postal_code: string
  city: string
  additional_info?: string
}

interface ExtractionResult {
  extracted_at: string
  source_url: string
  total_count: number
  locations: BuecherschrankLocation[]
}

async function extractBuecherschraenke(): Promise<void> {
  console.log('🚀 Starting Bücherschrank extraction...\n')

  const browser = await chromium.launch({
    headless: true // Back to headless since we understand the structure
  })

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'de-DE',
  })

  const page = await context.newPage()

  const sourceUrl = 'https://frankfurt.de/themen/kultur/literatur/bibliotheken/buecherschraenke'

  try {
    console.log(`📍 Navigating to ${sourceUrl}`)
    console.log('⏳ Waiting for page to load (may take a few seconds)...\n')

    await page.goto(sourceUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    })

    // Wait for page to fully load
    await page.waitForTimeout(5000)

    // Dismiss cookie consent modal if present
    try {
      const cookieButton = await page.$('button:has-text("Alle Cookies akzeptieren"), button:has-text("Accept all cookies")')
      if (cookieButton) {
        await cookieButton.click()
        console.log('✅ Dismissed cookie consent\n')
        await page.waitForTimeout(1000)
      }
    } catch (error) {
      console.log('⚠️ No cookie consent found or already dismissed\n')
    }

    // Find all Bücherschrank accordion items by looking for accordion titles containing "Bücherschrank"
    const buecherschrankAccordions = await page.$$('a.accordion-title:has(h4:text("Bücherschrank"))')

    console.log(`📊 Found ${buecherschrankAccordions.length} Bücherschrank locations\n`)

    const locations: BuecherschrankLocation[] = []
    let successCount = 0
    let failureCount = 0

    // Extract data from each accordion
    for (let i = 0; i < buecherschrankAccordions.length; i++) {
      try {
        console.log(`[${i + 1}/${buecherschrankAccordions.length}] Processing location...`)

        // Re-query to avoid stale references
        const accordions = await page.$$('a.accordion-title:has(h4:text("Bücherschrank"))')
        const accordion = accordions[i]

        // Get the name from h4
        const nameElement = await accordion.$('h4')
        const fullName = nameElement ? (await nameElement.textContent())?.trim() || '' : ''

        if (!fullName) {
          console.log(`   ⚠️ Skipping: No name found\n`)
          failureCount++
          continue
        }

        console.log(`   Name: ${fullName}`)

        // Click to expand the accordion
        await accordion.click()
        await page.waitForTimeout(500) // Wait for animation

        // Get the corresponding content div (find the div with id matching aria-controls)
        const ariaControls = await accordion.getAttribute('aria-controls')
        if (!ariaControls) {
          console.log(`   ⚠️ Skipping: No aria-controls found\n`)
          failureCount++
          continue
        }

        // Escape ID if it starts with a digit (CSS selector requirement)
        const escapedId = /^\d/.test(ariaControls) ? `#\\3${ariaControls[0]} ${ariaControls.slice(1)}` : `#${ariaControls}`
        const contentDiv = await page.$(escapedId)
        if (!contentDiv) {
          console.log(`   ⚠️ Skipping: Content div not found\n`)
          failureCount++
          continue
        }

        // Extract address details
        const streetAddress = await contentDiv.$('.street-address')
        let street = ''
        let postalCode = ''
        let city = ''
        let additionalInfo = ''

        if (streetAddress) {
          // Get street name and number
          const streetParts = await streetAddress.$$eval('span.cnw_skip_translation', (spans) =>
            spans.slice(0, 2).map(s => s.textContent?.trim() || '').filter(t => t)
          )
          street = streetParts.join(' ')

          // Get postal code and city
          const postalCodeEl = await streetAddress.$('.postal-code')
          postalCode = postalCodeEl ? (await postalCodeEl.textContent())?.trim() || '' : ''

          const cityEl = await streetAddress.$('.locality')
          city = cityEl ? (await cityEl.textContent())?.trim() || '' : ''

          // Get additional info
          const commentsEl = await streetAddress.$('.addressComments span')
          additionalInfo = commentsEl ? (await commentsEl.textContent())?.trim() || '' : ''

          // Remove parentheses from additional info
          additionalInfo = additionalInfo.replace(/^\(|\)$/g, '')
        }

        // Parse name to extract district and location
        // Format: "Bücherschrank District - Location"
        const nameParts = fullName.replace('Bücherschrank', '').trim().split('-')
        const district = nameParts[0]?.trim() || ''
        const locationShort = nameParts.slice(1).join('-').trim() || ''

        const location: BuecherschrankLocation = {
          name: fullName,
          district,
          location_short: locationShort,
          street,
          postal_code: postalCode,
          city: city || 'Frankfurt am Main',
          additional_info: additionalInfo || undefined
        }

        locations.push(location)
        successCount++

        console.log(`   Address: ${street}, ${postalCode} ${city}`)
        if (additionalInfo) {
          console.log(`   Info: ${additionalInfo}`)
        }
        console.log(`   ✅ Extracted successfully\n`)

      } catch (error) {
        console.error(`   ❌ Failed to extract location ${i + 1}:`, error)
        failureCount++
      }
    }

    console.log(`\n📊 Extraction Summary:`)
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ❌ Failures: ${failureCount}`)
    console.log(`   📝 Total: ${locations.length}\n`)

    // Save results
    const result: ExtractionResult = {
      extracted_at: new Date().toISOString(),
      source_url: sourceUrl,
      total_count: locations.length,
      locations
    }

    const dataDir = path.join(__dirname, '../data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    const outputPath = path.join(dataDir, 'buecherschraenke-raw.json')
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))

    console.log(`💾 Data saved to: ${outputPath}`)

    // Show sample entries
    console.log('\n📋 Sample entries:')
    locations.slice(0, 3).forEach((loc, idx) => {
      console.log(`\n${idx + 1}. ${loc.name}`)
      console.log(`   District: ${loc.district}`)
      console.log(`   Location: ${loc.location_short}`)
      console.log(`   Address: ${loc.street}, ${loc.postal_code} ${loc.city}`)
      if (loc.additional_info) {
        console.log(`   Info: ${loc.additional_info}`)
      }
    })

  } catch (error) {
    console.error('❌ Fatal error during extraction:', error)
    throw error
  } finally {
    await browser.close()
  }
}

// Run the extraction
extractBuecherschraenke()
  .then(() => {
    console.log('\n✅ Extraction complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Extraction failed:', error)
    process.exit(1)
  })
