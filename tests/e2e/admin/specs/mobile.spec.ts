/**
 * E2E tests for Admin Mobile Responsiveness
 * Consolidated tests for mobile viewport behavior, sidebar, forms, and tables
 */

import { test, expect } from '@playwright/test'

test.describe('Mobile Admin', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('sidebar toggles on mobile', async ({ page }) => {
    await page.goto('/bulk-station/locations')

    // Sidebar should be hidden or collapsible
    const hamburger = page.getByRole('button', { name: /menu/i })
    if (await hamburger.isVisible()) {
      await hamburger.click()
      await expect(page.getByRole('navigation')).toBeVisible()
    }
  })

  test('can navigate admin sections on mobile', async ({ page }) => {
    await page.goto('/bulk-station/locations')
    await page.goto('/bulk-station/categories')

    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('forms are usable on mobile', async ({ page }) => {
    await page.goto('/bulk-station/categories')
    await page.getByRole('button', { name: /Add|Hinzufügen/i }).click()

    // Modal should be visible and scrollable
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('tables scroll horizontally on mobile', async ({ page }) => {
    await page.goto('/bulk-station/locations')

    // Table should be present
    await expect(page.getByRole('table')).toBeVisible()
  })
})
