// Base page object with common methods and locators

import { Page, Locator, expect } from '@playwright/test'

export class BasePage {
  // Expose page for direct access when needed
  public playwrightPage: Page

  constructor(protected page: Page) {
    this.playwrightPage = page
  }

  // Common toast elements
  // Toasts have role="alert" with class="toast-success" or "toast-error"
  get toastSuccess(): Locator {
    return this.page.locator('[role="alert"].toast-success').first()
  }

  get toastError(): Locator {
    return this.page.locator('[role="alert"].toast-error').first()
  }

  // Loading spinner - has role="status"
  get loadingSpinner(): Locator {
    return this.page.getByRole('status').first()
  }

  // Common modal elements - modals are teleported divs with backdrop
  // Since modals don't have role="dialog", we use the backdrop with specific structure
  get modal(): Locator {
    return this.page.locator('.fixed.inset-0.bg-black\\/40').first()
  }

  // Modal content (the white box inside the backdrop)
  get modalContent(): Locator {
    return this.page.locator('.fixed.inset-0.bg-black\\/40 > .bg-white.rounded-lg').first()
  }

  /**
   * Wait for page to finish loading
   * Waits for loading spinner to disappear
   */
  async waitForLoaded(timeout = 10000): Promise<void> {
    try {
      await this.loadingSpinner.waitFor({ state: 'visible', timeout: 1000 })
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout })
    } catch {
      // No spinner found or already hidden - page is loaded
    }
  }

  /**
   * Expect a toast message to appear
   */
  async expectToast(type: 'success' | 'error', textPattern?: string | RegExp): Promise<void> {
    const toast = type === 'success' ? this.toastSuccess : this.toastError

    await expect(toast).toBeVisible({ timeout: 5000 })

    if (textPattern) {
      await expect(toast).toContainText(textPattern)
    }
  }

  /**
   * Close modal using ESC key
   */
  async closeModal(): Promise<void> {
    await this.page.keyboard.press('Escape')
    await expect(this.modal).toBeHidden()
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern, { timeout: 5000 })
  }
}
