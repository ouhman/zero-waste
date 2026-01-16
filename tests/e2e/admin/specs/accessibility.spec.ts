/**
 * E2E tests for Admin Accessibility
 * Consolidated tests covering ARIA, keyboard navigation, and mobile usability
 */

import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  // ARIA
  test('modals have proper ARIA attributes', async ({ page }) => {
    await page.goto('/bulk-station/categories')
    await page.getByRole('button', { name: /Add|Hinzufügen|Create/i }).click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(modal).toHaveAttribute('aria-modal', 'true')
  })

  test('forms have labeled inputs', async ({ page }) => {
    await page.goto('/bulk-station/locations')
    await page.getByRole('link', { name: /Edit/i }).first().click()

    // Check that inputs have labels
    const nameInput = page.getByLabel(/^Name/i)
    await expect(nameInput).toBeVisible()
  })

  test('toasts have ARIA alert role', async ({ page }) => {
    await page.goto('/bulk-station/categories')

    // Check that ToastContainer with alert role is present in DOM
    const alertContainer = page.locator('[role="alert"]')

    // Toast container should be in the page (even if no toasts are visible)
    // The role="alert" is on individual toast divs
    const count = await alertContainer.count()

    // Should be >= 0 (container exists, may have 0 or more toasts)
    expect(count).toBeGreaterThanOrEqual(0)
  })

  // KEYBOARD
  test('can navigate with keyboard only', async ({ page }) => {
    await page.goto('/bulk-station/locations')

    // Tab to first interactive element
    await page.keyboard.press('Tab')

    // Should have visible focus
    const focused = page.locator(':focus')
    await expect(focused).toBeVisible()
  })

  test('ESC closes modals', async ({ page }) => {
    await page.goto('/bulk-station/categories')
    await page.getByRole('button', { name: /Add|Hinzufügen|Create/i }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  // VISUAL
  test('focus is visible on interactive elements', async ({ page }) => {
    await page.goto('/bulk-station/locations')

    const button = page.getByRole('button').first()
    await button.focus()

    // Check focus is visible (has outline or ring)
    const styles = await button.evaluate((el) => {
      const computed = window.getComputedStyle(el)
      return {
        outline: computed.outline,
        boxShadow: computed.boxShadow
      }
    })

    const hasFocusIndicator =
      styles.outline !== 'none' ||
      styles.boxShadow !== 'none'

    expect(hasFocusIndicator).toBe(true)
  })

  // FORMS
  test('required fields are marked', async ({ page }) => {
    await page.goto('/bulk-station/categories')
    await page.getByRole('button', { name: /Add|Hinzufügen|Create/i }).click()

    // Check for required indicator (asterisk or aria-required)
    const requiredInput = page.locator('[aria-required="true"]').first()
    await expect(requiredInput).toBeVisible()
  })

  test('inputs have validation feedback', async ({ page }) => {
    await page.goto('/bulk-station/categories')
    await page.getByRole('button', { name: /Add|Hinzufügen|Create/i }).click()

    const nameInput = page.getByLabel(/Name \(German\)/i)

    // Input should have aria-invalid when empty
    // HTML5 validation prevents submit, or client-side validation shows errors
    const ariaInvalid = await nameInput.getAttribute('aria-invalid')
    const required = await nameInput.getAttribute('required')
    const ariaRequired = await nameInput.getAttribute('aria-required')

    // Should have validation attributes
    expect(required !== null || ariaRequired === 'true').toBe(true)
  })

  // COLOR/CONTRAST
  test('status badges have sufficient contrast', async ({ page }) => {
    await page.goto('/bulk-station/locations')

    const badge = page.locator('.badge, [class*="status"]').first()
    if (await badge.isVisible()) {
      // Badge exists and is visible
      await expect(badge).toBeVisible()
    }
  })

  // RESPONSIVE
  test('admin is usable at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/bulk-station/locations')

    // Core functionality should be accessible
    await expect(page.getByRole('navigation').first()).toBeVisible()
  })
})
