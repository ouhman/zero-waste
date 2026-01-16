/**
 * E2E tests for Admin Locations List
 * Tests filtering, search, and navigation
 */

// @ts-nocheck - Using service role key for Supabase, types may not match
import { test, expect } from '@playwright/test'
import { LocationsListPage } from '../pages/locations-list.page'
import { seedTestLocation, cleanupLocation, testSupabase } from '../fixtures'
import { TEST_LOCATION } from '../fixtures/test-data'

test.describe('Admin Locations List', () => {
  // Run serially - tests seed/modify location data
  test.describe.configure({ mode: 'serial' })

  let page: LocationsListPage
  let testLocationIds: string[] = []

  test.beforeEach(async ({ page: p }) => {
    page = new LocationsListPage(p)
  })

  test.afterEach(async () => {
    // Cleanup all test locations created in this test
    for (const id of testLocationIds) {
      await cleanupLocation(id)
    }
    testLocationIds = []
  })

  test.describe('Filtering by Status', () => {
    test('filters locations by pending status', async ({ page: p }) => {
      // Create a pending location (seedTestLocation creates with status: 'pending')
      const pendingId = await seedTestLocation()
      testLocationIds.push(pendingId)

      // Use fresh page object to ensure data is loaded
      const listPage = new LocationsListPage(p)
      await listPage.goto()

      // Click pending tab
      await listPage.clickTab('pending')

      // Wait for our specific test location row to appear
      const row = listPage.getLocationRowByName(TEST_LOCATION.name)
      await expect(row).toBeVisible({ timeout: 10000 })

      // Should show at least our pending location
      const count = await listPage.getLocationCount()
      expect(count).toBeGreaterThanOrEqual(1)
    })

    test('filters locations by approved status', async () => {
      // Create an approved location
      const approvedId = await seedTestLocation()
      testLocationIds.push(approvedId)
      await testSupabase
        .from('locations')
        .update({ status: 'approved' })
        .eq('id', approvedId)

      await page.goto()

      // Click approved tab
      await page.clickTab('approved')

      // Should show only approved locations
      const count = await page.getLocationCount()
      expect(count).toBeGreaterThanOrEqual(1)
    })

    test('filters locations by rejected status', async () => {
      // Create a rejected location
      const rejectedId = await seedTestLocation()
      testLocationIds.push(rejectedId)
      await testSupabase
        .from('locations')
        .update({ status: 'rejected', rejection_reason: 'Test rejection' })
        .eq('id', rejectedId)

      await page.goto()

      // Click rejected tab
      await page.clickTab('rejected')

      // Should show only rejected locations
      const count = await page.getLocationCount()
      expect(count).toBeGreaterThanOrEqual(1)
    })
  })

  test.describe('Search Functionality', () => {
    test('searches locations by name', async () => {
      const locationId = await seedTestLocation()
      testLocationIds.push(locationId)

      await page.goto()

      // Search for the location by name
      await page.searchFor(TEST_LOCATION.name)

      // Should find the location
      const row = page.getLocationRowByName(TEST_LOCATION.name)
      await expect(row).toBeVisible()
    })

    test('searches locations by city', async () => {
      const locationId = await seedTestLocation()
      testLocationIds.push(locationId)

      await page.goto()

      // Search for the location by city
      await page.searchFor(TEST_LOCATION.city)

      // Should find the location
      const row = page.getLocationRowByName(TEST_LOCATION.name)
      await expect(row).toBeVisible()
    })

    test('search is debounced', async ({ page: p }) => {
      const locationId = await seedTestLocation()
      testLocationIds.push(locationId)

      const listPage = new LocationsListPage(p)
      await listPage.goto()

      // Type quickly without waiting
      await listPage.searchInput.fill('Test')
      await listPage.searchInput.fill('Test Location')

      // Wait for debounce to complete
      await p.waitForTimeout(600)

      // Should show results after debounce
      const row = await listPage.getLocationRowByName(TEST_LOCATION.name)
      await expect(row).toBeVisible()
    })

    test('shows no results for non-matching search', async () => {
      await page.goto()

      // Search for non-existent location
      await page.searchFor('NonExistentLocationXYZ123')

      // Should show no results
      const count = await page.getLocationCount()
      expect(count).toBe(0)
    })
  })

  test.describe('Navigation', () => {
    test('navigates to edit page on edit button click', async ({ page: p }) => {
      const locationId = await seedTestLocation()
      testLocationIds.push(locationId)

      const listPage = new LocationsListPage(p)
      await listPage.goto()

      // Click edit button for the location
      await listPage.clickEditButtonForLocation(TEST_LOCATION.name)

      // Should navigate to edit page
      await expect(p).toHaveURL(/\/bulk-station\/edit\//)
    })

    test('shows approve button for pending locations', async () => {
      const locationId = await seedTestLocation()
      testLocationIds.push(locationId)

      await page.goto()
      await page.clickTab('pending')

      // Should show approve button
      const row = page.getLocationRowByName(TEST_LOCATION.name)
      const approveButton = row.getByRole('button', { name: /^(Approve|Genehmigen)$/i })
      await expect(approveButton).toBeVisible()
    })

    test('does not show approve button for approved locations', async () => {
      const locationId = await seedTestLocation()
      testLocationIds.push(locationId)
      await testSupabase
        .from('locations')
        .update({ status: 'approved' })
        .eq('id', locationId)

      await page.goto()
      await page.clickTab('approved')

      // Should NOT show approve button
      const row = page.getLocationRowByName(TEST_LOCATION.name)
      const approveButton = row.getByRole('button', { name: /^(Approve|Genehmigen)$/i })
      await expect(approveButton).not.toBeVisible()
    })
  })

  test.describe('Category Filter', () => {
    test('shows clear filter button when category is selected', async ({ page: p }) => {
      // Get a category to filter by
      const { data: categories } = await testSupabase
        .from('categories')
        .select('id, slug')
        .limit(1)
        .single()

      if (!categories) {
        test.skip()
        return
      }

      const listPage = new LocationsListPage(p)

      // Navigate with category query param
      await p.goto(`/bulk-station/locations?category=${categories.id}`)

      // Should show clear filter button
      await expect(listPage.clearFilterButton).toBeVisible()
    })

    test('clears category filter on button click', async ({ page: p }) => {
      // Get a category to filter by
      const { data: categories } = await testSupabase
        .from('categories')
        .select('id, slug')
        .limit(1)
        .single()

      if (!categories) {
        test.skip()
        return
      }

      const listPage = new LocationsListPage(p)

      // Navigate with category query param
      await p.goto(`/bulk-station/locations?category=${categories.id}`)

      // Click clear filter using page object method
      await listPage.clearCategoryFilter()

      // Should remove category from URL
      await expect(p).toHaveURL(/\/bulk-station\/locations$/)
    })
  })

  test.describe('UI/UX', () => {
    test('displays status badges with correct colors', async () => {
      const locationId = await seedTestLocation()
      testLocationIds.push(locationId)

      await page.goto()
      await page.clickTab('pending')

      // Pending badge should be yellow
      const row = page.getLocationRowByName(TEST_LOCATION.name)
      const badge = row.locator('.bg-yellow-100')
      await expect(badge).toBeVisible()
    })

    test('shows formatted creation date', async () => {
      const locationId = await seedTestLocation()
      testLocationIds.push(locationId)

      await page.goto()

      const row = page.getLocationRowByName(TEST_LOCATION.name)
      // Should show a date (format: "Jan 16, 2026" or similar)
      await expect(row).toContainText(/\d{1,2}\.\s\w{3}\.?\s\d{4}|\w{3}\s\d{1,2},\s\d{4}/)
    })

    test('shows empty state when no locations match filters', async () => {
      await page.goto()

      // Search for non-existent location
      await page.searchFor('NonExistentLocationXYZ123')

      // Should show empty state message ("No locations found" / "Keine Orte gefunden")
      await expect(page.page.locator('body')).toContainText(/no locations found|keine orte gefunden/i)
    })
  })
})
