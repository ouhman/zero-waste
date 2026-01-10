import { test, expect } from '@playwright/test'

test.describe('Submission', () => {
  test('completes new location flow', async ({ page }) => {
    await page.goto('/submit')

    // Select "New location" radio button
    const newLocationRadio = page.locator('input[type="radio"][value="new"]')
    if (await newLocationRadio.count() > 0) {
      await newLocationRadio.click()
    }

    // Fill in form fields
    await page.fill('input[name="name"]', 'Test Location')
    await page.fill('input[name="address"]', 'Zeil 1, Frankfurt')
    await page.fill('input[name="city"]', 'Frankfurt')
    await page.fill('input[name="postalCode"]', '60313')

    // Fill description
    await page.fill('textarea[name="descriptionDe"]', 'Test Beschreibung')
    await page.fill('textarea[name="descriptionEn"]', 'Test Description')

    // Fill email
    await page.fill('input[type="email"]', 'test@example.com')

    // Select at least one category
    const categoryCheckbox = page.locator('input[type="checkbox"]').first()
    await categoryCheckbox.click()

    // Submit form
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Should show success message or redirect
    await expect(page.locator('text=/success|erfolgreich|sent|gesendet/i')).toBeVisible({ timeout: 10000 })
  })

  test('completes update location flow', async ({ page }) => {
    await page.goto('/submit')

    // Select "Update existing" radio button
    const updateRadio = page.locator('input[type="radio"][value="update"]')
    if (await updateRadio.count() > 0) {
      await updateRadio.click()

      // Wait for location selector to appear
      await page.waitForTimeout(500)

      // Select an existing location
      const locationSelect = page.locator('select, input[role="combobox"]')
      if (await locationSelect.count() > 0) {
        await locationSelect.click()
        await page.waitForTimeout(300)

        // Select first option
        const firstOption = page.locator('option, [role="option"]').nth(1)
        if (await firstOption.count() > 0) {
          await firstOption.click()
        }
      }

      // Modify a field
      await page.fill('textarea[name="descriptionDe"]', 'Updated description')

      // Fill email
      await page.fill('input[type="email"]', 'test@example.com')

      // Submit
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()

      // Should show success message
      await expect(page.locator('text=/success|erfolgreich|sent|gesendet/i')).toBeVisible({ timeout: 10000 })
    }
  })
})
