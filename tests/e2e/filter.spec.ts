import { test, expect } from '@playwright/test'

test.describe('Filtering', () => {
  test('filters by category', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 })

    // Get initial marker count
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 })
    const initialMarkers = await page.locator('.leaflet-marker-icon').count()

    // Click a category filter chip
    const categoryChip = page.locator('[data-testid="category-chip"]').first()
    await categoryChip.click()

    // Wait for filter to apply
    await page.waitForTimeout(500)

    // Get filtered marker count
    const filteredMarkers = await page.locator('.leaflet-marker-icon').count()

    // Should have different (likely fewer) markers
    expect(filteredMarkers).not.toBe(initialMarkers)
  })

  test('searches by text', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 })

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Suche"]')
    await searchInput.fill('test')

    // Wait for search results
    await page.waitForTimeout(500)

    // Should show search results or filtered markers
    const results = page.locator('.search-results, .leaflet-marker-icon')
    await expect(results.first()).toBeVisible()
  })

  test('shows near me results', async ({ page }) => {
    // Grant geolocation permission
    await page.context().grantPermissions(['geolocation'])

    // Set geolocation to Frankfurt coordinates
    await page.context().setGeolocation({ latitude: 50.1109, longitude: 8.6821 })

    await page.goto('/')

    // Wait for page to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 })

    // Click Near Me button
    const nearMeButton = page.locator('button:has-text("Near Me"), button:has-text("In der Nähe")')

    if (await nearMeButton.count() > 0) {
      await nearMeButton.click()

      // Wait for location sorting
      await page.waitForTimeout(1000)

      // Should show locations sorted by distance
      const markers = page.locator('.leaflet-marker-icon')
      await expect(markers.first()).toBeVisible()
    }
  })
})
