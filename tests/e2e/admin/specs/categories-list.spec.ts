// Categories List E2E Tests
// Tests for category list display, sorting, and basic navigation

import { test, expect } from '@playwright/test'
import { CategoriesPage } from '../pages/categories.page'
import { seedTestCategory, cleanupTestData, getCategoryBySlug, testSupabase } from '../fixtures'

test.describe('Categories List', () => {
  // Run serially - tests share seeded category data
  test.describe.configure({ mode: 'serial' })

  let page: CategoriesPage

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new CategoriesPage(playwrightPage)
    await page.goto()
  })

  test.afterEach(async () => {
    await cleanupTestData()
  })

  test('displays all categories', async () => {
    // Should display all categories from the database
    const { data: categories } = await testSupabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    expect(categories).toBeTruthy()
    expect(categories!.length).toBeGreaterThan(0)

    // Check that table rows exist
    const rows = await page.categoryRows.all()
    expect(rows.length).toBe(categories!.length)
  })

  test('displays category information correctly', async () => {
    // Seed a test category
    const categoryId = await seedTestCategory()
    const category = await getCategoryBySlug('e2e-test-category')

    expect(category).toBeTruthy()

    // Navigate to page again to see the new category
    await page.goto()

    // Find the category row
    const row = page.getCategoryRow('e2e-test-category')

    // Check that the row displays all expected information
    await expect(row).toContainText(category!.name_de)
    await expect(row).toContainText(category!.name_en)
    await expect(row).toContainText(category!.slug)
    await expect(row).toContainText(String(category!.sort_order))
  })

  test('displays categories in sort_order', async () => {
    // Get categories from database
    const { data: categories } = await testSupabase
      .from('categories')
      .select('slug, sort_order')
      .order('sort_order', { ascending: true })

    expect(categories).toBeTruthy()

    // Get display order from page
    const displayedSlugs = await page.getCategoryOrder()

    // Compare
    const expectedSlugs = categories!.map(c => c.slug)
    expect(displayedSlugs).toEqual(expectedSlugs)
  })

  test('displays location count per category', async () => {
    // Get a category with locations
    const { data: categoryWithLocations } = await testSupabase
      .from('categories')
      .select('id, slug')
      .limit(1)
      .single()

    if (!categoryWithLocations) {
      test.skip()
      return
    }

    // Get location count
    const { count } = await testSupabase
      .from('location_categories')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryWithLocations.id)

    // Check that the count is displayed
    const row = page.getCategoryRow(categoryWithLocations.slug)

    if (count && count > 0) {
      await expect(row).toContainText(String(count))
    } else {
      await expect(row).toContainText('0')
    }
  })

  test('shows icon for each category', async () => {
    // Seed a test category with icon_name
    await seedTestCategory()
    await page.goto()

    const row = page.getCategoryRow('e2e-test-category')

    // Should display the category row (icon rendering is implementation detail)
    await expect(row).toBeVisible()

    // Check that icon_name column shows the icon name or an icon element exists
    // Icons may be rendered as SVG, img, or dynamic markers
    const hasIcon = await row.locator('svg, img, [data-testid="dynamic-marker"], .icon').count() > 0
    const showsIconName = await row.locator('code').filter({ hasText: 'mdi:' }).count() > 0

    // Either an icon element or the icon name should be visible
    expect(hasIcon || showsIconName).toBe(true)
  })

  test('shows Edit and Delete buttons for each category', async () => {
    // Seed a test category
    await seedTestCategory()
    await page.goto()

    const row = page.getCategoryRow('e2e-test-category')

    // Check for Edit button
    const editButton = row.getByRole('button', { name: /Edit|Bearbeiten/i })
    await expect(editButton).toBeVisible()

    // Check for Delete button
    const deleteButton = row.getByRole('button', { name: /Delete|Löschen/i })
    await expect(deleteButton).toBeVisible()
  })

  test('disables Delete button for "andere" (Other) category', async () => {
    // The "andere" category should not be deletable
    const row = page.getCategoryRow('andere')

    if (await row.count() === 0) {
      test.skip()
      return
    }

    const deleteButton = row.getByRole('button', { name: /Delete|Löschen/i })
    await expect(deleteButton).toBeDisabled()
  })

  test('shows Create Category button', async () => {
    await expect(page.createButton).toBeVisible()
  })

  test('opens create modal when Create button clicked', async () => {
    await page.openCreateModal()
    await expect(page.editModal).toBeVisible()
  })

  test('shows loading state while fetching categories', async ({ page: playwrightPage }) => {
    // This test is hard to capture as loading is usually very fast
    // We can at least verify that the page doesn't crash during loading

    page = new CategoriesPage(playwrightPage)

    // Navigate and verify no errors
    await page.goto()

    // Check that we eventually see category rows
    await expect(page.categoryRows.first()).toBeVisible({ timeout: 10000 })
  })

  test('location count is clickable link when > 0', async () => {
    // Get a category with locations
    const { data: categoryWithLocations } = await testSupabase
      .from('categories')
      .select('id, slug')
      .limit(1)
      .single()

    if (!categoryWithLocations) {
      test.skip()
      return
    }

    // Get location count
    const { count } = await testSupabase
      .from('location_categories')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryWithLocations.id)

    const row = page.getCategoryRow(categoryWithLocations.slug)

    if (count && count > 0) {
      // Should be a clickable link
      const link = row.locator('a:has-text("' + count + '")')
      await expect(link).toBeVisible()

      // Link should navigate to locations page with category filter
      const href = await link.getAttribute('href')
      expect(href).toContain('/bulk-station/locations')
      expect(href).toContain('category=' + categoryWithLocations.id)
    }
  })
})
