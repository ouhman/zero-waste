// Login page object

import { Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class LoginPage extends BasePage {
  // Locators
  get emailInput(): Locator {
    return this.page.locator('input[type="email"]')
  }

  get submitButton(): Locator {
    return this.page.locator('button[type="submit"]')
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto('/bulk-station/login')
    await this.waitForLoaded()
  }

  async login(email: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.submitButton.click()
  }
}
