import { test, expect } from '@playwright/test'

test.describe('Map', () => {
  test('loads and displays markers', async ({ page }) => {
    await page.goto('/')

    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 })

    // Check that markers are present
    const markers = page.locator('.leaflet-marker-icon')
    await expect(markers.first()).toBeVisible({ timeout: 10000 })
  })

  test.skip('clusters markers at low zoom', async ({ page }) => {
    // TODO: Marker clustering is not currently implemented
    // This test is skipped until clustering is added to the map
    await page.goto('/')

    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 })

    // Zoom out to trigger clustering
    // Click the zoom out button multiple times to ensure clustering
    const zoomOutButton = page.locator('.leaflet-control-zoom-out')
    await zoomOutButton.click()
    await page.waitForTimeout(300)
    await zoomOutButton.click()
    await page.waitForTimeout(300)
    await zoomOutButton.click()
    await page.waitForTimeout(500)

    // Check for cluster markers at low zoom
    const clusterMarkers = page.locator('.marker-cluster')
    const count = await clusterMarkers.count()

    // Should have at least one cluster at low zoom
    expect(count).toBeGreaterThan(0)
  })

  test('shows popup on marker click', async ({ page }) => {
    await page.goto('/')

    // Wait for map to load and markers
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 })

    // Click first visible marker
    const marker = page.locator('.leaflet-marker-icon').first()
    await marker.click()

    // Check popup appears
    await page.waitForSelector('.leaflet-popup', { timeout: 5000 })
    const popup = page.locator('.leaflet-popup')
    await expect(popup).toBeVisible()
  })

  test('navigates to detail on popup click', async ({ page }) => {
    await page.goto('/')

    // Wait for markers
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 10000 })

    // Click marker to open popup
    const marker = page.locator('.leaflet-marker-icon').first()
    await marker.click()

    // Wait for popup
    await page.waitForSelector('.leaflet-popup', { timeout: 5000 })

    // Click detail link in popup (assuming there's a link/button)
    const detailLink = page.locator('.leaflet-popup a, .leaflet-popup button').first()
    await detailLink.click()

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/location\//)
  })
})
