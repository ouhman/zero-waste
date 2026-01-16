// Categories page object

import { Locator } from '@playwright/test'
import { BasePage } from './base.page'
import type { TEST_CATEGORY } from '../fixtures/test-data'

export class CategoriesPage extends BasePage {
  // Main page elements
  get createButton(): Locator {
    return this.page.getByRole('button', { name: /Add Category|Kategorie hinzufügen/i })
  }

  get categoryRows(): Locator {
    // Get all rows that don't contain header cells (th)
    return this.page.getByRole('row').filter({ hasNot: this.page.locator('th') })
  }

  // Modal elements - modal is a teleported div with backdrop
  // The modal content is the white rounded box inside the backdrop
  get editModal(): Locator {
    return this.page.locator('.fixed.inset-0.bg-black\\/40 > .bg-white.rounded-lg').first()
  }

  // Modal form fields
  get modalNameDe(): Locator {
    return this.editModal.getByLabel(/Name.*German|Name.*Deutsch/i)
  }

  get modalNameEn(): Locator {
    return this.editModal.getByLabel(/Name.*English|Name.*Englisch/i)
  }

  get modalSlug(): Locator {
    return this.editModal.getByLabel(/Slug/i)
  }

  get modalDescDe(): Locator {
    return this.editModal.getByLabel(/Description.*German|Beschreibung.*Deutsch/i)
  }

  get modalDescEn(): Locator {
    return this.editModal.getByLabel(/Description.*English|Beschreibung.*Englisch/i)
  }

  get modalSortOrder(): Locator {
    return this.editModal.getByLabel(/Sort Order|Sortierreihenfolge/i)
  }

  get modalIconUpload(): Locator {
    return this.editModal.locator('input[type="file"]')
  }

  get modalSaveButton(): Locator {
    return this.editModal.getByRole('button', { name: /Save|Speichern/i })
  }

  get modalCancelButton(): Locator {
    return this.editModal.getByRole('button', { name: /Cancel|Abbrechen/i })
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto('/bulk-station/categories')
    await this.waitForLoaded()
  }

  async openCreateModal(): Promise<void> {
    await this.createButton.click()
    await this.editModal.waitFor({ state: 'visible' })
  }

  async openEditModal(categorySlug: string): Promise<void> {
    // Find the row containing the slug and click its edit button
    const row = this.getCategoryRow(categorySlug)
    const editButton = row.getByRole('button', { name: /Edit|Bearbeiten/i })
    await editButton.click()
    await this.editModal.waitFor({ state: 'visible' })
  }

  async fillCategoryForm(data: Partial<typeof TEST_CATEGORY>): Promise<void> {
    if (data.name_de !== undefined) await this.modalNameDe.fill(data.name_de)
    if (data.name_en !== undefined) await this.modalNameEn.fill(data.name_en)
    if (data.slug !== undefined) await this.modalSlug.fill(data.slug)
    if (data.description_de !== undefined) await this.modalDescDe.fill(data.description_de)
    if (data.description_en !== undefined) await this.modalDescEn.fill(data.description_en)
    if (data.sort_order !== undefined) await this.modalSortOrder.fill(String(data.sort_order))
  }

  async uploadIcon(filePath: string): Promise<void> {
    await this.modalIconUpload.setInputFiles(filePath)
  }

  async saveModal(): Promise<void> {
    await this.modalSaveButton.click()
    await this.expectToast('success')
    await this.editModal.waitFor({ state: 'hidden', timeout: 5000 })
  }

  async clickDeleteButton(categorySlug: string): Promise<void> {
    // Find the row containing the slug and click its delete button
    const row = this.getCategoryRow(categorySlug)
    const deleteButton = row.getByRole('button', { name: /Delete|Löschen/i })
    await deleteButton.click()
  }

  // Delete modal elements
  get deleteModal(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: /Delete|Löschen/i })
  }

  get deleteReassignSelect(): Locator {
    return this.deleteModal.getByLabel(/Reassign.*to|zuweisen.*zu/i)
  }

  get deleteConfirmCheckbox(): Locator {
    return this.deleteModal.getByRole('checkbox', { name: /understand.*reassign|verstehe.*zugewiesen/i })
  }

  get deleteConfirmButton(): Locator {
    // Get the button with "Delete"/"Löschen" text that is NOT the cancel button
    return this.deleteModal.getByRole('button', { name: /^Delete$|^Löschen$/i })
  }

  get deleteCancelButton(): Locator {
    return this.deleteModal.getByRole('button', { name: /Cancel|Abbrechen|Close|Schließen/i })
  }

  // Delete modal actions
  async selectReassignCategory(categoryId: string): Promise<void> {
    await this.deleteReassignSelect.selectOption(categoryId)
  }

  async confirmDeleteCheckbox(): Promise<void> {
    await this.deleteConfirmCheckbox.check()
  }

  async confirmDelete(): Promise<void> {
    await this.deleteConfirmButton.click()
    await this.expectToast('success')
    await this.deleteModal.waitFor({ state: 'hidden', timeout: 5000 })
  }

  async cancelDelete(): Promise<void> {
    await this.deleteCancelButton.click()
    await this.deleteModal.waitFor({ state: 'hidden', timeout: 5000 })
  }

  // Utility methods
  async getCategoryOrder(): Promise<string[]> {
    // Get all category rows and extract slugs in display order
    const rows = await this.categoryRows.all()
    const slugs: string[] = []
    for (const row of rows) {
      const slugCell = row.locator('code')
      const slug = await slugCell.textContent()
      if (slug) slugs.push(slug.trim())
    }
    return slugs
  }

  getCategoryRow(categorySlug: string): Locator {
    // Find the row that contains a code element with the exact slug text
    // The slug is displayed in a <code> element in the table
    return this.page.getByRole('row').filter({
      has: this.page.locator('code', { hasText: categorySlug }).filter({ hasText: new RegExp(`^${this.escapeRegex(categorySlug)}$`) })
    })
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}
