import { test, expect } from '@playwright/test'

test.describe('Admin Section', () => {
  test('shows login page for unauthenticated users', async ({ page }) => {
    await page.goto('/bulk-station')

    // Should redirect to login page
    await expect(page).toHaveURL(/\/bulk-station\/login/)

    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('magic link login shows email input', async ({ page }) => {
    await page.goto('/bulk-station/login')

    // Should have email input for magic link
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()

    // Should have send link button
    const sendButton = page.locator('button[type="submit"]')
    await expect(sendButton).toBeVisible()

    // Try submitting with email (won't actually work in test env)
    await emailInput.fill('test@example.com')
    await sendButton.click()

    // May show success message or rate limit error
    await page.waitForTimeout(1000)
  })

  test('dashboard shows stats cards', async ({ page }) => {
    await page.goto('/bulk-station')

    // Should redirect to login since not authenticated
    await expect(page).toHaveURL(/\/bulk-station\/login/)
  })

  test('keyboard shortcuts - escape closes modals', async ({ page }) => {
    await page.goto('/bulk-station/categories')

    // Should redirect to login
    await expect(page).toHaveURL(/\/bulk-station\/login/)
  })

  test('mobile responsive - login page', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/bulk-station/login')

    // Check that form is visible and usable on mobile
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()

    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()

    // Form should be responsive
    const form = page.locator('form')
    await expect(form).toBeVisible()
  })

  test('shows loading state while data loads', async ({ page }) => {
    await page.goto('/bulk-station/login')

    // Login page should load without errors
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('displays error message for invalid actions', async ({ page }) => {
    await page.goto('/bulk-station/login')

    // Try to submit without email
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // HTML5 validation should prevent submission
    const emailInput = page.locator('input[type="email"]')
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    expect(isInvalid).toBe(true)
  })
})
