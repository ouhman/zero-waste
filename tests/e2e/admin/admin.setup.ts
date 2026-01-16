// Global setup for admin e2e tests
// Seeds test admin user and initial data
// Creates authenticated session and saves to storage state

import { test as setup } from '@playwright/test'
import { seedTestAdmin, seedTestLocation, seedTestCategory } from './fixtures'
import { createTestAdminSession, injectSession } from './helpers/auth'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const authFile = path.join(__dirname, '../../.auth/admin.json')

setup('seed admin test data and authenticate', async ({ page }) => {
  console.log('\n🌱 Seeding admin test data...')

  try {
    // 1. Create test admin user
    const adminId = await seedTestAdmin()
    console.log(`✓ Test admin created/verified: ${adminId}`)

    // 2. Create test location
    const locationId = await seedTestLocation()
    console.log(`✓ Test location created: ${locationId}`)

    // 3. Create test category
    const categoryId = await seedTestCategory()
    console.log(`✓ Test category created: ${categoryId}`)

    console.log('✓ Admin test data seeded successfully')

    // 4. Create authenticated session and save storage state
    console.log('🔐 Creating authenticated session...')
    const session = await createTestAdminSession()
    await injectSession(page, session)

    // Navigate to admin area to initialize the session in browser
    await page.goto('http://localhost:5173/bulk-station')
    await page.waitForURL(/\/bulk-station/)

    // Dismiss cookie consent banner if present
    console.log('🍪 Checking for cookie consent banner...')
    const cookieBanner = page.locator('.cookie-banner')
    try {
      // Wait briefly to see if banner appears
      await cookieBanner.waitFor({ state: 'visible', timeout: 2000 })
      console.log('Cookie banner detected, dismissing...')

      // Click "Accept" button (using the i18n key patterns)
      const acceptButton = page.locator('.cookie-banner .btn-primary')
      await acceptButton.click()

      // Wait for banner to disappear
      await cookieBanner.waitFor({ state: 'hidden', timeout: 3000 })
      console.log('✓ Cookie banner dismissed')
    } catch {
      // Banner not present or already dismissed
      console.log('✓ Cookie banner not present')
    }

    // Save signed-in state to reuse across tests (INCLUDING cookie consent)
    await page.context().storageState({ path: authFile })
    console.log(`✓ Authenticated session saved to ${authFile}\n`)
  } catch (error) {
    console.error('❌ Failed to seed test data or authenticate:', error)
    throw error
  }
})
