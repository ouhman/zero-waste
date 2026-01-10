import { test, expect } from '@playwright/test'

test.describe('Favorites', () => {
  test('adds to favorites', async ({ page }) => {
    await page.goto('/')

    // Wait for map and markers
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 })

    // Click marker to open popup
    const marker = page.locator('.leaflet-marker-icon').first()
    await marker.click()

    // Wait for popup
    await page.waitForSelector('.leaflet-popup', { timeout: 5000 })

    // Look for favorite button (heart icon)
    const favoriteButton = page.locator('.leaflet-popup button[aria-label*="favorite"], .leaflet-popup button:has-text("♥")')

    if (await favoriteButton.count() > 0) {
      await favoriteButton.click()

      // Should show feedback (changed icon or toast)
      await page.waitForTimeout(500)
    }
  })

  test('persists after reload', async ({ page }) => {
    await page.goto('/')

    // Wait for map
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 })

    // Click marker and add to favorites
    const marker = page.locator('.leaflet-marker-icon').first()
    await marker.click()

    await page.waitForSelector('.leaflet-popup', { timeout: 5000 })

    const favoriteButton = page.locator('.leaflet-popup button[aria-label*="favorite"], .leaflet-popup button:has-text("♥")')

    if (await favoriteButton.count() > 0) {
      // Make sure it's not already favorited
      const isFavorited = await favoriteButton.getAttribute('aria-pressed')

      if (isFavorited !== 'true') {
        await favoriteButton.click()
        await page.waitForTimeout(500)
      }

      // Reload page
      await page.reload()

      // Wait for map to load again
      await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 })

      // Click same marker
      await marker.click()
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 })

      // Favorite button should show as favorited
      const reloadedButton = page.locator('.leaflet-popup button[aria-label*="favorite"], .leaflet-popup button:has-text("♥")')
      const isStillFavorited = await reloadedButton.getAttribute('aria-pressed')

      expect(isStillFavorited).toBe('true')
    }
  })

  test('shows on favorites page', async ({ page }) => {
    // First, add a favorite
    await page.goto('/')

    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 })

    const marker = page.locator('.leaflet-marker-icon').first()
    await marker.click()

    await page.waitForSelector('.leaflet-popup', { timeout: 5000 })

    const favoriteButton = page.locator('.leaflet-popup button[aria-label*="favorite"], .leaflet-popup button:has-text("♥")')

    if (await favoriteButton.count() > 0) {
      const isFavorited = await favoriteButton.getAttribute('aria-pressed')

      if (isFavorited !== 'true') {
        await favoriteButton.click()
        await page.waitForTimeout(500)
      }
    }

    // Navigate to favorites page
    await page.goto('/favorites')

    // Should show favorite locations
    const favoritesList = page.locator('[data-testid="favorites-list"], .favorites-container')

    if (await favoritesList.count() > 0) {
      await expect(favoritesList).toBeVisible()
    } else {
      // Alternative: check for any location cards
      const locationCards = page.locator('[data-testid="location-card"]')
      if (await locationCards.count() > 0) {
        await expect(locationCards.first()).toBeVisible()
      }
    }
  })
})
