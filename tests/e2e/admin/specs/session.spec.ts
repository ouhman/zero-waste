/**
 * E2E tests for Admin Session Management
 * Consolidated tests for session persistence, logout, and user display
 */

import { test, expect } from '@playwright/test'

test.describe('Session Management', () => {
  test('maintains session across page navigation', async ({ page }) => {
    await page.goto('/bulk-station/locations')
    await page.goto('/bulk-station/categories')

    // Still logged in - navigation should be visible
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('logout clears session', async ({ page }) => {
    await page.goto('/bulk-station')

    await page.getByRole('button', { name: /Logout|Abmelden/i }).click()

    // Redirected to login
    await expect(page).toHaveURL(/\/bulk-station\/login/)
  })

  test('displays current user info', async ({ page }) => {
    await page.goto('/bulk-station')

    // Should show user email (contains @)
    await expect(page.getByText(/@/)).toBeVisible()
  })
})
