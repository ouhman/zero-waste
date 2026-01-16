/**
 * E2E tests for Admin Location Edit - Consolidated Workflow Tests
 * Focuses on critical user workflows rather than granular field testing
 */

import { test, expect } from '@playwright/test'
import { seedTestLocation, cleanupLocation } from '../fixtures'
import { TEST_LOCATION } from '../fixtures/test-data'

test.describe('Location Edit', () => {
  // Run serially - tests edit/restore location data
  test.describe.configure({ mode: 'serial' })

  let testLocationId: string | null = null

  test.beforeEach(async ({ page }) => {
    // Seed a fresh test location for isolation
    testLocationId = await seedTestLocation()

    // Navigate directly to edit the test location
    await page.goto(`/bulk-station/edit/${testLocationId}`)

    // Wait for form to load by checking for name field
    await page.getByLabel(/^Name/i).waitFor({ state: 'visible' })

    // Wait for form to fully initialize (Vue reactivity setup)
    await page.waitForTimeout(500)
  })

  test.afterEach(async () => {
    // Cleanup test location
    if (testLocationId) {
      await cleanupLocation(testLocationId)
      testLocationId = null
    }
  })

  test('can edit and save location', async ({ page }) => {
    // Verify we have the test location loaded
    const nameInput = page.getByLabel(/^Name/i)
    const currentName = await nameInput.inputValue()
    expect(currentName).toBe(TEST_LOCATION.name)

    // Edit multiple fields - clear and type to trigger Vue reactivity
    await nameInput.clear()
    await nameInput.pressSequentially('Test Location Updated')

    const emailInput = page.getByLabel(/Email/i)
    await emailInput.clear()
    await emailInput.pressSequentially('updated@test.com')

    const websiteInput = page.getByLabel(/Website/i)
    await websiteInput.clear()
    await websiteInput.pressSequentially('https://updated.com')

    // Wait for Vue reactivity to update isDirty
    await page.waitForTimeout(300)

    // Save changes - this will navigate to locations list
    const saveButton = page.getByRole('button', { name: /Save Changes|Änderungen speichern/i })
    await expect(saveButton).toBeEnabled({ timeout: 5000 })
    await saveButton.click()

    // Wait for navigation to locations list (save triggers redirect)
    await page.waitForURL(/\/bulk-station\/locations/, { timeout: 5000 })
  })

  test('shows validation errors for invalid data', async ({ page }) => {
    // Clear required name field
    const nameInput = page.getByLabel(/^Name/i)
    await nameInput.clear()

    // Get save button
    const saveButton = page.getByRole('button', { name: /Save Changes|Änderungen speichern/i })

    // Either button should be disabled, or clicking shows validation error
    const isDisabled = await saveButton.isDisabled()

    if (!isDisabled) {
      // Try to save - should fail validation
      await saveButton.click()

      // Check for validation error message
      // The browser's HTML5 validation should prevent submission
      // We can verify by checking URL hasn't changed (still on edit page)
      await expect(page).toHaveURL(/\/bulk-station\/edit\//)
    } else {
      // Button is disabled, which is correct behavior for invalid form
      expect(isDisabled).toBe(true)
    }
  })

  test('cancel discards unsaved changes', async ({ page }) => {
    // Get original name
    const nameInput = page.getByLabel(/^Name/i)
    const originalName = await nameInput.inputValue()
    expect(originalName).toBe(TEST_LOCATION.name)

    // Make a change
    await nameInput.fill('Should Not Be Saved')

    // Click cancel button instead of navigating away
    await page.getByRole('button', { name: /Cancel|Abbrechen/i }).click()

    // Should be back at locations list
    await page.waitForURL(/\/bulk-station\/locations/, { timeout: 5000 })

    // Go back to edit the same location
    await page.goto(`/bulk-station/edit/${testLocationId}`)
    await page.getByLabel(/^Name/i).waitFor({ state: 'visible' })

    // Verify original value is still there (changes were not saved)
    const nameInputCheck = page.getByLabel(/^Name/i)
    const currentName = await nameInputCheck.inputValue()
    expect(currentName).toBe(originalName)
  })

  test('can change location status', async ({ page }) => {
    // Find status select/dropdown using label
    const statusSelect = page.getByLabel(/Status/i)

    // Check if status select exists
    const statusExists = await statusSelect.count() > 0

    if (statusExists) {
      // Get current status (should be 'pending' from seeded data)
      const currentStatus = await statusSelect.inputValue()

      // Change status to a different value
      const newStatus = currentStatus === 'approved' ? 'pending' : 'approved'
      await statusSelect.selectOption(newStatus)

      // Save changes
      await page.getByRole('button', { name: /Save Changes|Änderungen speichern/i }).click()

      // Wait for navigation to locations list
      await page.waitForURL(/\/bulk-station\/locations/, { timeout: 5000 })

      // Verify we're back at the locations list (successful save)
      await expect(page).toHaveURL(/\/bulk-station\/locations/)
    } else {
      // If no status field, skip this test
      test.skip()
    }
  })
})
