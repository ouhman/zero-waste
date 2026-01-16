// Location edit page object

import { Locator } from '@playwright/test'
import { BasePage } from './base.page'
import type { TEST_LOCATION } from '../fixtures/test-data'

export class LocationEditPage extends BasePage {
  // Basic info inputs
  get nameInput(): Locator {
    return this.page.getByLabel(/^Name/)
  }

  get slugInput(): Locator {
    return this.page.getByLabel(/^Slug/)
  }

  get addressInput(): Locator {
    return this.page.getByLabel(/Street Address|Straße/)
  }

  get cityInput(): Locator {
    return this.page.getByLabel(/^City|^Stadt/)
  }

  get postalCodeInput(): Locator {
    return this.page.getByLabel(/ZIP Code|PLZ/)
  }

  get latitudeInput(): Locator {
    return this.page.getByLabel(/^Latitude|^Breitengrad/)
  }

  get longitudeInput(): Locator {
    return this.page.getByLabel(/^Longitude|^Längengrad/)
  }

  get suburbInput(): Locator {
    return this.page.getByLabel(/^Suburb|^Stadtteil/)
  }

  // Description inputs
  get descriptionDeInput(): Locator {
    return this.page.getByLabel(/Description.*German|Beschreibung.*Deutsch/i)
  }

  get descriptionEnInput(): Locator {
    return this.page.getByLabel(/Description.*English|Beschreibung.*Englisch/i)
  }

  // Contact info inputs
  get websiteInput(): Locator {
    return this.page.getByLabel(/^Website|^Webseite/)
  }

  get phoneInput(): Locator {
    return this.page.getByLabel(/^Phone|^Telefon/)
  }

  get emailInput(): Locator {
    return this.page.getByLabel(/^Email|^E-Mail/)
  }

  get instagramInput(): Locator {
    return this.page.getByLabel(/^Instagram/)
  }

  // Buttons
  get saveButton(): Locator {
    // Find by role and match either "Save Changes" or "Loading..." text
    // Using flexible regex to handle both states
    return this.page.getByRole('button', { name: /(Save Changes|Änderungen speichern|Loading\.\.\.|Lädt\.\.\.)/i })
  }

  get cancelButton(): Locator {
    return this.page.getByRole('button', { name: /Cancel|Abbrechen/i })
  }

  // Category checkboxes
  categoryCheckbox(slug: string): Locator {
    return this.page.locator(`input[type="checkbox"][value="${slug}"]`)
  }

  // Payment method checkboxes
  paymentCheckbox(method: string): Locator {
    return this.page.locator(`input[type="checkbox"][name="payment_${method}"], input[type="checkbox"][value="${method}"]`)
  }

  // Actions
  async goto(locationId: string): Promise<void> {
    await this.page.goto(`/bulk-station/edit/${locationId}`)
    await this.waitForLoaded()
  }

  async fillBasicInfo(data: Partial<typeof TEST_LOCATION>): Promise<void> {
    if (data.name !== undefined) await this.nameInput.fill(data.name)
    if (data.address !== undefined) await this.addressInput.fill(data.address)
    if (data.city !== undefined) await this.cityInput.fill(data.city)
    if (data.postal_code !== undefined) await this.postalCodeInput.fill(data.postal_code)
    if (data.description_de !== undefined) await this.descriptionDeInput.fill(data.description_de)
    if (data.description_en !== undefined) await this.descriptionEnInput.fill(data.description_en)
  }

  async fillContactInfo(data: Partial<typeof TEST_LOCATION>): Promise<void> {
    if (data.website !== undefined) await this.websiteInput.fill(data.website)
    if (data.phone !== undefined) await this.phoneInput.fill(data.phone)
    if (data.email !== undefined) await this.emailInput.fill(data.email)
    if (data.instagram !== undefined) await this.instagramInput.fill(data.instagram)
  }

  async save(): Promise<void> {
    await this.saveButton.click()
    await this.expectToast('success')
  }

  async getFormValues(): Promise<Record<string, string>> {
    return {
      name: await this.nameInput.inputValue(),
      address: await this.addressInput.inputValue(),
      city: await this.cityInput.inputValue(),
      postal_code: await this.postalCodeInput.inputValue(),
      description_de: await this.descriptionDeInput.inputValue(),
      description_en: await this.descriptionEnInput.inputValue(),
      website: await this.websiteInput.inputValue(),
      phone: await this.phoneInput.inputValue(),
      email: await this.emailInput.inputValue(),
      instagram: await this.instagramInput.inputValue(),
      latitude: await this.latitudeInput.inputValue(),
      longitude: await this.longitudeInput.inputValue(),
    }
  }

  async togglePaymentMethod(method: 'cash' | 'credit_card' | 'debit_card' | 'contactless' | 'mobile'): Promise<void> {
    const checkbox = this.page.locator(`input[type="checkbox"][value="${method}"]`)
    await checkbox.click()
  }

  async isPaymentMethodChecked(method: 'cash' | 'credit_card' | 'debit_card' | 'contactless' | 'mobile'): Promise<boolean> {
    const checkbox = this.page.locator(`input[type="checkbox"][value="${method}"]`)
    return await checkbox.isChecked()
  }

  async toggleCategory(categoryId: string): Promise<void> {
    const checkbox = this.categoryCheckbox(categoryId)
    await checkbox.click()
  }

  async isCategoryChecked(categoryId: string): Promise<boolean> {
    const checkbox = this.categoryCheckbox(categoryId)
    return await checkbox.isChecked()
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click()
  }

  async fillCoordinates(latitude: string, longitude: string): Promise<void> {
    await this.latitudeInput.fill(latitude)
    await this.longitudeInput.fill(longitude)
  }

  async getOpeningHours(): Promise<string> {
    const input = this.page.getByLabel(/OSM Format|OSM-Format/i)
    return await input.inputValue()
  }

  async setOpeningHours(hours: string): Promise<void> {
    const input = this.page.getByLabel(/OSM Format|OSM-Format/i)
    await input.fill(hours)
  }
}
