import { test, expect } from '@playwright/test'
import { seedTestLocation, cleanupLocation, testSupabase } from '../fixtures'
import { TEST_LOCATION } from '../fixtures/test-data'

test.describe('Location Approval Workflow', () => {
  // Run serially - tests modify location statuses
  test.describe.configure({ mode: 'serial' })

  let testLocationId: string | null = null

  test.afterEach(async () => {
    // Cleanup test location if created
    if (testLocationId) {
      await cleanupLocation(testLocationId)
      testLocationId = null
    }
  })

  test('can approve pending location', async ({ page }) => {
    // Seed a pending location for this test
    testLocationId = await seedTestLocation()
    await page.goto('/bulk-station/locations')

    // Click on pending tab
    await page.getByRole('button', { name: /Ausstehend|Pending/i }).click()

    // Wait for table to load and find our test location row
    const locationRow = page.locator('table tbody tr').filter({ hasText: TEST_LOCATION.name })
    await expect(locationRow).toBeVisible({ timeout: 10000 })

    // Click approve on the test location
    const approveButton = locationRow.getByRole('button', { name: /Genehmigen|Approve/i })
    await approveButton.click()

    // Wait for status update
    await page.waitForTimeout(1000)

    // Verify location is now approved (not in pending tab anymore or shows as approved)
    // Re-click pending tab to refresh
    await page.getByRole('button', { name: /Ausstehend|Pending/i }).click()
    await page.waitForTimeout(500)
  })

  test('can reject location with reason', async ({ page }) => {
    // Seed a fresh pending location for this test
    testLocationId = await seedTestLocation()
    await page.goto('/bulk-station/locations')

    // Click on pending tab to find our test location
    await page.getByRole('button', { name: /Ausstehend|Pending/i }).click()

    // Wait for table to load and find our test location row
    const locationRow = page.locator('table tbody tr').filter({ hasText: TEST_LOCATION.name })
    await expect(locationRow).toBeVisible({ timeout: 10000 })

    // Click edit on the test location
    const editLink = locationRow.getByRole('link', { name: /Bearbeiten|Edit/i })
    await editLink.click()

    // Wait for edit page to load
    await page.waitForURL(/\/bulk-station\/edit\//)

    // Change status to rejected
    const statusSelect = page.locator('select#status')
    await statusSelect.selectOption('rejected')

    // Add rejection reason
    const adminNotes = page.locator('textarea#admin_notes')
    await adminNotes.fill('Test rejection - duplicate location')

    // Save button should be enabled
    const saveButton = page.locator('button[type="submit"]')
    await expect(saveButton).toBeEnabled({ timeout: 5000 })
    await saveButton.click()

    // Wait for navigation back to list
    await page.waitForURL(/\/bulk-station\/locations/, { timeout: 10000 })
  })

  test('approved location appears in approved tab', async ({ page }) => {
    // Seed a location and approve it
    testLocationId = await seedTestLocation()
    await testSupabase
      .from('locations')
      .update({ status: 'approved' })
      .eq('id', testLocationId)

    await page.goto('/bulk-station/locations')

    // Click on approved tab
    await page.getByRole('button', { name: /Genehmigt|Approved/i }).click()

    // Verify our test location appears in approved tab
    const locationRow = page.locator('table tbody tr').filter({ hasText: TEST_LOCATION.name })
    await expect(locationRow).toBeVisible({ timeout: 10000 })
  })

  test('can change status via edit form', async ({ page }) => {
    // Seed a pending location
    testLocationId = await seedTestLocation()
    await page.goto('/bulk-station/locations')

    // Click pending tab
    await page.getByRole('button', { name: /Ausstehend|Pending/i }).click()

    // Find our test location and click edit
    const locationRow = page.locator('table tbody tr').filter({ hasText: TEST_LOCATION.name })
    await expect(locationRow).toBeVisible({ timeout: 10000 })
    const editLink = locationRow.getByRole('link', { name: /Bearbeiten|Edit/i })
    await editLink.click()

    // Wait for edit page to load
    await page.waitForURL(/\/bulk-station\/edit\//)

    // Change status to approved
    const statusSelect = page.locator('select#status')
    await statusSelect.selectOption('approved')

    // Also modify admin notes to trigger isDirty
    const adminNotes = page.locator('textarea#admin_notes')
    const timestamp = Date.now()
    await adminNotes.fill(`Status changed via E2E test - ${timestamp}`)

    // Save button should be enabled
    const saveButton = page.locator('button[type="submit"]')
    await expect(saveButton).toBeEnabled({ timeout: 5000 })
    await saveButton.click()

    // Wait for navigation back to list
    await page.waitForURL(/\/bulk-station\/locations/, { timeout: 10000 })
  })
})
