// Smoke test to verify admin e2e test infrastructure
// Tests storage state auth and basic page access

import { test, expect } from '@playwright/test'
import { DashboardPage } from './pages/dashboard.page'

test.describe('Admin E2E Infrastructure Smoke Test', () => {
  test('storage state auth works - can access admin dashboard', async ({ page }) => {
    // Storage state provides automatic authentication

    // Navigate to dashboard
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()

    // Verify we're on the dashboard (not redirected to login)
    await expect(page).toHaveURL(/\/bulk-station\/?$/)

    // Dashboard should load without errors
    await dashboardPage.waitForLoaded()
  })

  test('without auth - redirects to login', async ({ browser }) => {
    // Create a new context WITHOUT storage state
    const context = await browser.newContext({ storageState: undefined })
    const page = await context.newPage()

    // Navigate to dashboard WITHOUT auth
    await page.goto('http://localhost:5173/bulk-station')

    // Should redirect to login page
    await expect(page).toHaveURL(/\/bulk-station\/login/)

    // Login form should be visible
    await expect(page.locator('input[type="email"]')).toBeVisible()

    await context.close()
  })

  test('page objects work - can access dashboard elements', async ({ page }) => {
    // Storage state provides automatic authentication

    const dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()

    // Verify page loaded
    await expect(page).toHaveURL(/\/bulk-station\/?$/)
  })
})
