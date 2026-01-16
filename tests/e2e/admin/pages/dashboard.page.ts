// Dashboard page object

import { Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class DashboardPage extends BasePage {
  // Locators
  // Stats cards are white boxes with shadow and rounded-lg, in a grid
  get statsCards(): Locator {
    return this.page.locator('.bg-white.overflow-hidden.shadow.rounded-lg')
  }

  // Pending count - find by heading text (bilingual)
  get pendingCount(): Locator {
    return this.page
      .locator('dt', { hasText: /pending|ausstehend/i })
      .locator('..')
      .locator('dd')
      .first()
  }

  // Approved count - find by heading text (bilingual)
  get approvedCount(): Locator {
    return this.page
      .locator('dt', { hasText: /approved|genehmigt/i })
      .locator('..')
      .locator('dd')
      .first()
  }

  // Recent submissions list
  get recentSubmissions(): Locator {
    return this.page.locator('h2', { hasText: /recent submissions|letzte/i }).locator('..').locator('ul')
  }

  // Recent submission items
  get recentSubmissionItems(): Locator {
    return this.recentSubmissions.locator('li')
  }

  // Quick action buttons in recent submissions
  approveButton(locationName: string): Locator {
    return this.page
      .locator('li', { hasText: locationName })
      .getByRole('button', { name: /approve|genehmigen/i })
  }

  editButton(locationName: string): Locator {
    return this.page
      .locator('li', { hasText: locationName })
      .getByRole('link', { name: /edit|bearbeiten/i })
  }

  // Quick links at the bottom
  get locationsQuickLink(): Locator {
    return this.page.getByRole('link', { name: /locations|standorte/i }).filter({ hasText: /manage/i })
  }

  get categoriesQuickLink(): Locator {
    return this.page.getByRole('link', { name: /categories|kategorien/i }).filter({ hasText: /manage/i })
  }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto('/bulk-station')
    await this.waitForLoaded()
  }
}
