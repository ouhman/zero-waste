// Consolidated Category Management E2E Tests
// Tests for CREATE, EDIT, DELETE, and LIST workflows

import { test, expect } from '@playwright/test'
import { CategoriesPage } from '../pages/categories.page'
import {
  seedTestCategory,
  cleanupTestData,
  getCategoryBySlug,
  getCategoryById,
  seedTestLocation,
  testSupabase
} from '../fixtures'
import { TEST_CATEGORY } from '../fixtures/test-data'

test.describe('Category Management', () => {
  // Run serially - tests modify shared category data
  test.describe.configure({ mode: 'serial' })

  let page: CategoriesPage

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new CategoriesPage(playwrightPage)
    await page.goto()
  })

  test.afterEach(async () => {
    await cleanupTestData()
  })

  // CREATE
  test('can create and verify category', async () => {
    await page.openCreateModal()

    await page.fillCategoryForm({
      name_de: 'E2E Neue Kategorie',
      name_en: 'E2E New Category',
      slug: 'e2e-neue-kategorie',
      icon_name: 'mdi:store',
    })

    await page.modalSaveButton.click()
    await page.editModal.waitFor({ state: 'hidden', timeout: 15000 })

    // Wait for save to complete
    await page.playwrightPage.waitForTimeout(1500)

    // Verify created in database
    const category = await getCategoryBySlug('e2e-neue-kategorie')
    expect(category).toBeTruthy()
    expect(category!.name_de).toBe('E2E Neue Kategorie')
  })

  // EDIT
  test('can edit category', async () => {
    const categoryId = await seedTestCategory()
    await page.goto() // Refresh to see seeded category

    await page.openEditModal(TEST_CATEGORY.slug)
    await expect(page.modalNameDe).toHaveValue(TEST_CATEGORY.name_de)

    await page.modalNameDe.clear()
    await page.modalNameDe.fill('E2E Updated')

    await page.modalSaveButton.click()
    await page.editModal.waitFor({ state: 'hidden', timeout: 10000 })

    // Verify updated
    const category = await getCategoryById(categoryId)
    expect(category!.name_de).toBe('E2E Updated')
  })

  // DELETE (no locations)
  test('can delete empty category', async () => {
    await seedTestCategory()
    await page.goto() // Refresh to see seeded category

    await page.clickDeleteButton(TEST_CATEGORY.slug)
    await expect(page.deleteModal).toBeVisible()

    await page.deleteConfirmButton.click()
    await page.deleteModal.waitFor({ state: 'hidden', timeout: 10000 })

    // Verify deleted
    const category = await getCategoryBySlug(TEST_CATEGORY.slug)
    expect(category).toBeNull()
  })

  // DELETE (with reassignment)
  test('requires reassignment for category with locations', async () => {
    const categoryId = await seedTestCategory()
    const locationId = await seedTestLocation()

    // Link location to category
    await testSupabase
      .from('location_categories')
      .delete()
      .eq('location_id', locationId)

    await testSupabase
      .from('location_categories')
      .insert({ location_id: locationId, category_id: categoryId } as any)

    // Get target category for reassignment
    const andereCategory = await getCategoryBySlug('andere')
    if (!andereCategory) {
      test.skip()
      return
    }

    await page.goto()
    await page.clickDeleteButton(TEST_CATEGORY.slug)

    // Should show reassignment UI
    await expect(page.deleteReassignSelect).toBeVisible()
    await expect(page.deleteConfirmButton).toBeDisabled()

    // Select target and confirm
    await page.selectReassignCategory(andereCategory.id)
    await page.confirmDeleteCheckbox()
    await page.deleteConfirmButton.click()
    await page.deleteModal.waitFor({ state: 'hidden', timeout: 10000 })

    // Verify category deleted
    const category = await getCategoryBySlug(TEST_CATEGORY.slug)
    expect(category).toBeNull()

    // Verify location reassigned
    const { data: locationCategories } = await testSupabase
      .from('location_categories')
      .select('category_id')
      .eq('location_id', locationId)
      .single()

    expect(locationCategories?.category_id).toBe(andereCategory.id)
  })

  // ESC closes modal
  test('ESC cancels edit without saving', async () => {
    await seedTestCategory()
    await page.goto() // Refresh to see seeded category

    await page.openEditModal(TEST_CATEGORY.slug)
    await page.modalNameDe.fill('Should Not Save')

    await page.playwrightPage.keyboard.press('Escape')
    await page.editModal.waitFor({ state: 'hidden', timeout: 5000 })

    // Verify not changed
    const category = await getCategoryBySlug(TEST_CATEGORY.slug)
    expect(category!.name_de).toBe(TEST_CATEGORY.name_de)
  })

  // LIST VIEW
  test('displays category table', async () => {
    await expect(page.playwrightPage.getByRole('table')).toBeVisible()
    await expect(page.playwrightPage.getByRole('columnheader', { name: /name|kategorie/i })).toBeVisible()
  })

  // VALIDATION
  test('validates required fields on create', async () => {
    await page.openCreateModal()

    // Try to submit empty form
    await page.modalSaveButton.click()

    // Modal should stay open (validation failed)
    await expect(page.editModal).toBeVisible()
  })

  // CRUD WORKFLOW
  test('full create-edit-delete workflow', async () => {
    // CREATE
    await page.openCreateModal()
    await page.fillCategoryForm({
      name_de: 'E2E Workflow',
      name_en: 'E2E Workflow',
      slug: 'e2e-workflow',
    })
    await page.modalSaveButton.click()
    await page.editModal.waitFor({ state: 'hidden', timeout: 10000 })

    let category = await getCategoryBySlug('e2e-workflow')
    expect(category).toBeTruthy()

    // EDIT
    await page.openEditModal('e2e-workflow')
    await page.modalNameDe.clear()
    await page.modalNameDe.fill('E2E Workflow Updated')
    await page.modalSaveButton.click()
    await page.editModal.waitFor({ state: 'hidden', timeout: 10000 })

    category = await getCategoryBySlug('e2e-workflow')
    expect(category!.name_de).toBe('E2E Workflow Updated')

    // DELETE
    await page.clickDeleteButton('e2e-workflow')
    await page.deleteConfirmButton.click()
    await page.deleteModal.waitFor({ state: 'hidden', timeout: 10000 })

    category = await getCategoryBySlug('e2e-workflow')
    expect(category).toBeNull()
  })
})
