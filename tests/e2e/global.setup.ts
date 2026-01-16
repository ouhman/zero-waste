// Global setup for non-admin e2e tests
// Dismisses cookie banner and saves storage state

import { test as setup } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const authFile = path.join(__dirname, '../.auth/user.json')

setup('dismiss cookie banner for non-admin tests', async ({ page }) => {
  console.log('\n🍪 Setting up non-admin test environment...')

  try {
    // Navigate to home page
    await page.goto('http://localhost:5173/')
    await page.waitForURL(/\/$/)

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

    // Save storage state to reuse across tests (INCLUDING cookie consent)
    await page.context().storageState({ path: authFile })
    console.log(`✓ Storage state saved to ${authFile}\n`)
  } catch (error) {
    console.error('❌ Failed to set up non-admin test environment:', error)
    throw error
  }
})
