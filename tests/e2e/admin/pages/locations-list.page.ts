// Locations list page object

import { Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class LocationsListPage extends BasePage {
  // Status tabs (using button role with bilingual text)
  // Note: tabs include count badges, so we match the start of the text
  get allTab(): Locator {
    return this.page.getByRole('button', { name: /^(All|Alle)/i })
  }

  get pendingTab(): Locator {
    return this.page.getByRole('button', { name: /^(Pending|Ausstehend)/i })
  }

  get approvedTab(): Locator {
    return this.page.getByRole('button', { name: /^(Approved|Genehmigt)/i })
  }

  get rejectedTab(): Locator {
    return this.page.getByRole('button', { name: /^(Rejected|Abgelehnt)/i })
  }

  // Search input (using placeholder text)
  get searchInput(): Locator {
    return this.page.getByPlaceholder(/Search locations|Orte suchen/i)
  }

  // Clear filter button (in category filter banner)
  get clearFilterButton(): Locator {
    return this.page.getByRole('button', { name: /Clear filter|Filter löschen/i })
  }

  // Location rows (table rows in tbody)
  get locationRows(): Locator {
    return this.page.locator('table tbody tr')
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto('/bulk-station/locations')
    await this.waitForLoaded()
  }

  async clearCategoryFilter(): Promise<void> {
    await this.clearFilterButton.click()
    await this.waitForLoaded()
  }

  async searchFor(query: string): Promise<void> {
    await this.searchInput.fill(query)
    // Wait for debounce
    await this.page.waitForTimeout(500)
    await this.waitForLoaded()
  }

  async clickTab(tab: 'all' | 'pending' | 'approved' | 'rejected'): Promise<void> {
    const tabButton = tab === 'all' ? this.allTab :
                      tab === 'pending' ? this.pendingTab :
                      tab === 'approved' ? this.approvedTab :
                      this.rejectedTab
    await tabButton.click()
    // Wait for the table to update after tab switch
    await this.page.waitForTimeout(500)
    await this.waitForLoaded()
  }

  getLocationRowByName(name: string): Locator {
    // Find table row containing the location name
    // Use more specific selector: table tbody tr
    return this.page.locator('table tbody tr').filter({ hasText: name }).first()
  }

  async clickEditButtonForLocation(name: string): Promise<void> {
    const row = this.getLocationRowByName(name)
    // Edit is a link, not a button
    await row.getByRole('link', { name: /^(Edit|Bearbeiten)$/i }).click()
  }

  async clickApproveButtonForLocation(name: string): Promise<void> {
    const row = this.getLocationRowByName(name)
    await row.getByRole('button', { name: /^(Approve|Genehmigen)$/i }).click()
  }

  async clickViewOnMapForLocation(name: string): Promise<void> {
    const row = this.getLocationRowByName(name)
    await row.getByRole('link', { name: /View on Map|Auf Karte anzeigen/i }).click()
  }

  async clickDeleteButtonForLocation(name: string): Promise<void> {
    const row = this.getLocationRowByName(name)
    await row.getByRole('button', { name: /^(Delete|Löschen)$/i }).click()
  }

  async getLocationCount(): Promise<number> {
    return await this.locationRows.count()
  }

  // Delete modal selectors
  get deleteModal(): Locator {
    return this.page.getByRole('heading', { name: /Delete Location|Ort löschen/i }).locator('..')
  }

  get deleteModalCancelButton(): Locator {
    return this.deleteModal.getByRole('button', { name: /Cancel|Abbrechen/i })
  }

  get deleteModalConfirmButton(): Locator {
    return this.deleteModal.getByRole('button', { name: /^(Delete|Löschen)$/i })
  }
}
