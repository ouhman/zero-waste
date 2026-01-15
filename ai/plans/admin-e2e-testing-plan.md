# Admin Area E2E Testing Plan

> **Purpose**: Comprehensive e2e testing for the admin area to prevent regressions and ensure data integrity.
> **Estimated Phases**: 4 (each ~100-150k tokens context window)
> **Principles**: DRY, KISS, YAGNI, Enterprise-grade, Extensible

---

## Overview

### Current State
- 7 basic e2e tests (no auth, no CRUD operations)
- 11 admin components, 7 admin routes
- High-complexity forms: `LocationEditForm.vue` (666 lines), `CategoryEditModal.vue` (440 lines)

### Goals
1. **Data Integrity** - Ensure saving doesn't override unchanged fields
2. **CRUD Operations** - Full coverage for locations and categories
3. **Edge Cases** - Empty states, validation errors, concurrent edits
4. **Regression Prevention** - Catch bugs before production

### Test Strategy
- **Auth**: Seed test admin user + bypass via `setSession()`
- **Data**: Pre-seed fixtures, cleanup after tests
- **Target**: Remote DEV project (`lccpndhssuemudzpfvvg`)

---

## Phase 1: Test Infrastructure & Foundation

**Goal**: Set up reusable test utilities, auth bypass, fixtures, and page objects.

**Estimated Context**: ~80-100k tokens

### Files to Create

```
tests/
  e2e/
    admin/
      fixtures/
        index.ts              # Fixture management (seed/cleanup)
        test-data.ts          # Test data constants
      helpers/
        auth.ts               # Auth bypass helper
        supabase.ts           # Direct Supabase client for tests
      pages/
        base.page.ts          # Base page object
        login.page.ts         # Login page object
        dashboard.page.ts     # Dashboard page object
        locations-list.page.ts
        location-edit.page.ts
        categories.page.ts
      admin.setup.ts          # Global setup (seed admin user)
      admin.teardown.ts       # Global teardown (cleanup)
```

### 1.1 Supabase Test Client

**File**: `tests/e2e/admin/helpers/supabase.ts`

```typescript
// Direct Supabase client for test operations
// - Seed test data
// - Cleanup after tests
// - Bypass RLS with service role key (stored in .env.test)

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.TEST_SUPABASE_URL!
const supabaseServiceKey = process.env.TEST_SUPABASE_SERVICE_KEY!

export const testSupabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  { auth: { persistSession: false } }
)
```

### 1.2 Auth Bypass Helper

**File**: `tests/e2e/admin/helpers/auth.ts`

```typescript
// Auth bypass using Supabase's setSession()
// Creates a test admin session without magic link flow

interface TestSession {
  access_token: string
  refresh_token: string
  user: { id: string; email: string }
}

export async function createTestAdminSession(): Promise<TestSession> {
  // Option 1: Generate session for seeded test user
  // Option 2: Use service role to create temp session
}

export async function injectSession(page: Page, session: TestSession): Promise<void> {
  // Inject session into localStorage before page load
  await page.addInitScript((sessionData) => {
    localStorage.setItem('sb-lccpndhssuemudzpfvvg-auth-token', JSON.stringify(sessionData))
  }, session)
}

export async function loginAsAdmin(page: Page): Promise<void> {
  const session = await createTestAdminSession()
  await injectSession(page, session)
}
```

### 1.3 Test Fixtures

**File**: `tests/e2e/admin/fixtures/test-data.ts`

```typescript
// Test data constants - single source of truth

export const TEST_ADMIN = {
  email: 'e2e-test-admin@zerowastefrankfurt.de',
  password: 'test-password-123', // Only for test env
}

export const TEST_LOCATION = {
  name: 'E2E Test Location',
  address: 'Teststraße 1',
  city: 'Frankfurt am Main',
  postal_code: '60313',
  lat: 50.1109,
  lng: 8.6821,
  description_de: 'Test Beschreibung auf Deutsch',
  description_en: 'Test description in English',
  website: 'https://test.example.com',
  phone: '+49 69 1234567',
  email: 'test@example.com',
  instagram: 'testlocation',
  status: 'pending',
  payment_methods: { cash: true, card: true, contactless: false },
  opening_hours: {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    // ... rest of week
  },
}

export const TEST_CATEGORY = {
  name_de: 'E2E Test Kategorie',
  name_en: 'E2E Test Category',
  slug: 'e2e-test-category',
  description_de: 'Beschreibung',
  description_en: 'Description',
  sort_order: 999,
}
```

**File**: `tests/e2e/admin/fixtures/index.ts`

```typescript
// Fixture management - seed and cleanup

import { testSupabase } from '../helpers/supabase'
import { TEST_LOCATION, TEST_CATEGORY, TEST_ADMIN } from './test-data'

export async function seedTestAdmin(): Promise<string> {
  // Create test admin user if not exists
  // Set admin role in user metadata
  // Return user ID
}

export async function seedTestLocation(): Promise<string> {
  // Insert test location with all fields populated
  // Return location ID for later reference
}

export async function seedTestCategory(): Promise<string> {
  // Insert test category
  // Return category ID
}

export async function cleanupTestData(): Promise<void> {
  // Delete all test data (prefix: 'e2e-test-' or 'E2E Test')
  // Order matters: locations first, then categories
}

export async function getLocationById(id: string) {
  // Fetch location with all related data for assertions
}
```

### 1.4 Base Page Object

**File**: `tests/e2e/admin/pages/base.page.ts`

```typescript
// Base page object with common methods

import { Page, Locator, expect } from '@playwright/test'

export class BasePage {
  constructor(protected page: Page) {}

  // Common elements
  get toastSuccess(): Locator {
    return this.page.locator('[data-testid="toast-success"], .toast-success')
  }

  get toastError(): Locator {
    return this.page.locator('[data-testid="toast-error"], .toast-error')
  }

  get loadingSpinner(): Locator {
    return this.page.locator('[data-testid="loading-spinner"], .animate-spin')
  }

  // Common actions
  async waitForLoaded(): Promise<void> {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 })
  }

  async expectToast(type: 'success' | 'error', textPattern?: RegExp): Promise<void> {
    const toast = type === 'success' ? this.toastSuccess : this.toastError
    await expect(toast).toBeVisible()
    if (textPattern) {
      await expect(toast).toHaveText(textPattern)
    }
  }

  async closeModal(): Promise<void> {
    await this.page.keyboard.press('Escape')
  }
}
```

### 1.5 Page Objects for Admin Pages

**Location Edit Page** (`tests/e2e/admin/pages/location-edit.page.ts`):

```typescript
export class LocationEditPage extends BasePage {
  // Selectors for all form sections
  get nameInput(): Locator { return this.page.locator('input[name="name"]') }
  get slugInput(): Locator { return this.page.locator('input[name="slug"]') }
  get addressInput(): Locator { return this.page.locator('input[name="address"]') }
  get cityInput(): Locator { return this.page.locator('input[name="city"]') }
  get descriptionDeInput(): Locator { return this.page.locator('textarea[name="descriptionDe"]') }
  get descriptionEnInput(): Locator { return this.page.locator('textarea[name="descriptionEn"]') }
  get websiteInput(): Locator { return this.page.locator('input[name="website"]') }
  get phoneInput(): Locator { return this.page.locator('input[name="phone"]') }
  get emailInput(): Locator { return this.page.locator('input[name="email"]') }
  get instagramInput(): Locator { return this.page.locator('input[name="instagram"]') }
  get saveButton(): Locator { return this.page.locator('button[type="submit"]') }
  get cancelButton(): Locator { return this.page.locator('button:has-text("Cancel"), button:has-text("Abbrechen")') }

  // Category checkboxes
  categoryCheckbox(slug: string): Locator {
    return this.page.locator(`input[type="checkbox"][value="${slug}"]`)
  }

  // Payment method checkboxes
  paymentCheckbox(method: string): Locator {
    return this.page.locator(`input[type="checkbox"][name="payment_${method}"]`)
  }

  // Actions
  async goto(locationId: string): Promise<void> {
    await this.page.goto(`/bulk-station/edit/${locationId}`)
    await this.waitForLoaded()
  }

  async fillBasicInfo(data: Partial<typeof TEST_LOCATION>): Promise<void> {
    if (data.name) await this.nameInput.fill(data.name)
    if (data.description_de) await this.descriptionDeInput.fill(data.description_de)
    if (data.description_en) await this.descriptionEnInput.fill(data.description_en)
  }

  async save(): Promise<void> {
    await this.saveButton.click()
    await this.expectToast('success')
  }

  async getFormValues(): Promise<Record<string, string>> {
    // Extract all form field values for comparison
    return {
      name: await this.nameInput.inputValue(),
      address: await this.addressInput.inputValue(),
      // ... all fields
    }
  }
}
```

**Categories Page** (`tests/e2e/admin/pages/categories.page.ts`):

```typescript
export class CategoriesPage extends BasePage {
  get createButton(): Locator {
    return this.page.locator('button:has-text("Create"), button:has-text("Erstellen")')
  }

  get categoryRows(): Locator {
    return this.page.locator('table tbody tr, [data-testid="category-row"]')
  }

  get editModal(): Locator {
    return this.page.locator('[data-testid="category-modal"], .modal')
  }

  // Modal form fields
  get modalNameDe(): Locator { return this.editModal.locator('input[name="nameDe"]') }
  get modalNameEn(): Locator { return this.editModal.locator('input[name="nameEn"]') }
  get modalSlug(): Locator { return this.editModal.locator('input[name="slug"]') }
  get modalDescDe(): Locator { return this.editModal.locator('textarea[name="descriptionDe"]') }
  get modalDescEn(): Locator { return this.editModal.locator('textarea[name="descriptionEn"]') }
  get modalSortOrder(): Locator { return this.editModal.locator('input[name="sortOrder"]') }
  get modalIconUpload(): Locator { return this.editModal.locator('input[type="file"]') }
  get modalSaveButton(): Locator { return this.editModal.locator('button[type="submit"]') }

  // Actions
  async goto(): Promise<void> {
    await this.page.goto('/bulk-station/categories')
    await this.waitForLoaded()
  }

  async openCreateModal(): Promise<void> {
    await this.createButton.click()
    await expect(this.editModal).toBeVisible()
  }

  async openEditModal(categorySlug: string): Promise<void> {
    await this.page.locator(`[data-category-slug="${categorySlug}"] button.edit`).click()
    await expect(this.editModal).toBeVisible()
  }

  async fillCategoryForm(data: Partial<typeof TEST_CATEGORY>): Promise<void> {
    if (data.name_de) await this.modalNameDe.fill(data.name_de)
    if (data.name_en) await this.modalNameEn.fill(data.name_en)
    if (data.slug) await this.modalSlug.fill(data.slug)
    if (data.description_de) await this.modalDescDe.fill(data.description_de)
    if (data.description_en) await this.modalDescEn.fill(data.description_en)
    if (data.sort_order) await this.modalSortOrder.fill(String(data.sort_order))
  }

  async saveModal(): Promise<void> {
    await this.modalSaveButton.click()
    await this.expectToast('success')
    await expect(this.editModal).toBeHidden()
  }
}
```

### 1.6 Global Setup/Teardown

**File**: `tests/e2e/admin/admin.setup.ts`

```typescript
import { test as setup } from '@playwright/test'
import { seedTestAdmin, seedTestLocation, seedTestCategory } from './fixtures'

setup('seed test data', async () => {
  await seedTestAdmin()
  await seedTestLocation()
  await seedTestCategory()
})
```

**File**: `tests/e2e/admin/admin.teardown.ts`

```typescript
import { test as teardown } from '@playwright/test'
import { cleanupTestData } from './fixtures'

teardown('cleanup test data', async () => {
  await cleanupTestData()
})
```

### 1.7 Playwright Config Updates

**File**: `playwright.config.ts` (updates)

```typescript
// Add admin-specific project with setup/teardown

projects: [
  {
    name: 'admin-setup',
    testMatch: /admin\.setup\.ts/,
  },
  {
    name: 'admin',
    testDir: './tests/e2e/admin',
    dependencies: ['admin-setup'],
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'admin-teardown',
    testMatch: /admin\.teardown\.ts/,
    dependencies: ['admin'],
  },
  // Keep existing projects
  {
    name: 'chromium',
    testDir: './tests/e2e',
    testIgnore: '**/admin/**',
    use: { ...devices['Desktop Chrome'] },
  },
]
```

### 1.8 Environment Setup

**File**: `.env.test.example`

```bash
# Test environment variables
TEST_SUPABASE_URL=https://lccpndhssuemudzpfvvg.supabase.co
TEST_SUPABASE_SERVICE_KEY=your-service-role-key-here
TEST_ADMIN_EMAIL=e2e-test-admin@zerowastefrankfurt.de
```

### Phase 1 Deliverables Checklist

- [ ] Test Supabase client with service role
- [ ] Auth bypass helper
- [ ] Test data constants
- [ ] Fixture seed/cleanup functions
- [ ] Base page object
- [ ] Login page object
- [ ] Dashboard page object
- [ ] Locations list page object
- [ ] Location edit page object
- [ ] Categories page object
- [ ] Global setup/teardown
- [ ] Playwright config updates
- [ ] Environment file template
- [ ] Smoke test: auth bypass works

---

## Phase 2: Location Management E2E Tests

**Goal**: Comprehensive tests for location CRUD, focusing on edit flows and data integrity.

**Estimated Context**: ~100-150k tokens

### Files to Create

```
tests/e2e/admin/
  specs/
    locations-list.spec.ts    # List, filter, search
    location-edit.spec.ts     # Edit form comprehensive tests
    location-approve.spec.ts  # Approve/reject workflow
    pending-review.spec.ts    # Quick review panel
```

### 2.1 Location List Tests

**File**: `tests/e2e/admin/specs/locations-list.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../helpers/auth'
import { LocationsListPage } from '../pages/locations-list.page'
import { seedTestLocation, getLocationById } from '../fixtures'

test.describe('Locations List', () => {
  let page: LocationsListPage

  test.beforeEach(async ({ page: p }) => {
    await loginAsAdmin(p)
    page = new LocationsListPage(p)
    await page.goto()
  })

  test.describe('Filtering', () => {
    test('filters by status tabs (pending/approved/rejected)', async () => {
      // Click pending tab
      await page.pendingTab.click()
      await page.waitForLoaded()
      // Assert only pending locations visible

      // Click approved tab
      await page.approvedTab.click()
      await page.waitForLoaded()
      // Assert only approved locations visible
    })

    test('filters by category', async () => {
      await page.selectCategoryFilter('unverpackt')
      await page.waitForLoaded()
      // Assert all visible locations have category
    })

    test('clears category filter', async () => {
      await page.selectCategoryFilter('unverpackt')
      await page.clearCategoryFilter()
      // Assert all locations visible again
    })
  })

  test.describe('Search', () => {
    test('searches by location name', async () => {
      await page.searchInput.fill('E2E Test')
      await page.waitForLoaded()
      // Assert only matching locations visible
    })

    test('search is debounced', async () => {
      // Type rapidly, assert only one API call
    })
  })

  test.describe('Navigation', () => {
    test('navigates to edit page on row click', async () => {
      const locationId = await seedTestLocation()
      await page.clickLocation(locationId)
      await expect(page.page).toHaveURL(`/bulk-station/edit/${locationId}`)
    })
  })
})
```

### 2.2 Location Edit Tests (Critical - Data Integrity)

**File**: `tests/e2e/admin/specs/location-edit.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../helpers/auth'
import { LocationEditPage } from '../pages/location-edit.page'
import { seedTestLocation, getLocationById, cleanupLocation } from '../fixtures'
import { TEST_LOCATION } from '../fixtures/test-data'

test.describe('Location Edit', () => {
  let page: LocationEditPage
  let locationId: string

  test.beforeEach(async ({ page: p }) => {
    await loginAsAdmin(p)
    page = new LocationEditPage(p)
    locationId = await seedTestLocation()
    await page.goto(locationId)
  })

  test.afterEach(async () => {
    await cleanupLocation(locationId)
  })

  // ============================================
  // CRITICAL: Data Integrity Tests
  // ============================================

  test.describe('Data Integrity - Field Preservation', () => {
    test('saving with no changes preserves all original values', async () => {
      // Get all original values from DB
      const originalData = await getLocationById(locationId)

      // Just click save without any changes
      await page.save()

      // Verify ALL fields are unchanged in DB
      const savedData = await getLocationById(locationId)
      expect(savedData).toMatchObject(originalData)
    })

    test('changing one field does not affect other fields', async () => {
      // Get original values
      const originalData = await getLocationById(locationId)

      // Change only the name
      await page.nameInput.fill('Updated Name Only')
      await page.save()

      // Verify only name changed, everything else preserved
      const savedData = await getLocationById(locationId)
      expect(savedData.name).toBe('Updated Name Only')
      expect(savedData.address).toBe(originalData.address)
      expect(savedData.city).toBe(originalData.city)
      expect(savedData.website).toBe(originalData.website)
      expect(savedData.phone).toBe(originalData.phone)
      expect(savedData.email).toBe(originalData.email)
      expect(savedData.instagram).toBe(originalData.instagram)
      expect(savedData.description_de).toBe(originalData.description_de)
      expect(savedData.description_en).toBe(originalData.description_en)
      expect(savedData.payment_methods).toEqual(originalData.payment_methods)
      expect(savedData.opening_hours).toEqual(originalData.opening_hours)
      expect(savedData.lat).toBe(originalData.lat)
      expect(savedData.lng).toBe(originalData.lng)
    })

    test('updating payment methods does not reset other payment methods', async () => {
      // Set initial payment methods: cash=true, card=true
      const originalData = await getLocationById(locationId)

      // Toggle only contactless
      await page.paymentCheckbox('contactless').click()
      await page.save()

      // Verify cash and card are still as before
      const savedData = await getLocationById(locationId)
      expect(savedData.payment_methods.cash).toBe(originalData.payment_methods.cash)
      expect(savedData.payment_methods.card).toBe(originalData.payment_methods.card)
      expect(savedData.payment_methods.contactless).toBe(true) // newly toggled
    })

    test('updating categories preserves non-selected categories properly', async () => {
      // Location has category A
      // Add category B
      await page.categoryCheckbox('second-category').click()
      await page.save()

      // Verify both categories are linked
      const savedData = await getLocationById(locationId)
      expect(savedData.categories).toContain('first-category')
      expect(savedData.categories).toContain('second-category')
    })

    test('opening hours are not corrupted on save', async () => {
      const originalData = await getLocationById(locationId)

      // Make unrelated change
      await page.nameInput.fill('Hours Test Location')
      await page.save()

      // Verify opening hours intact
      const savedData = await getLocationById(locationId)
      expect(savedData.opening_hours).toEqual(originalData.opening_hours)
    })
  })

  // ============================================
  // Form Validation Tests
  // ============================================

  test.describe('Validation', () => {
    test('name is required', async () => {
      await page.nameInput.clear()
      await page.saveButton.click()

      // Should show validation error, not submit
      await expect(page.page.locator('.field-error, [aria-invalid="true"]')).toBeVisible()
    })

    test('slug follows pattern [a-z0-9-]+', async () => {
      await page.slugInput.fill('Invalid Slug With Spaces!')
      await page.saveButton.click()

      // Should show validation error
      await expect(page.page.locator('.field-error')).toBeVisible()
    })

    test('coordinates are valid numbers', async () => {
      await page.page.locator('input[name="lat"]').fill('not-a-number')
      await page.saveButton.click()

      // Should show validation error
      await expect(page.page.locator('.field-error')).toBeVisible()
    })

    test('website URL is valid format', async () => {
      await page.websiteInput.fill('not-a-url')
      await page.saveButton.click()

      // Should show validation error
      await expect(page.page.locator('.field-error')).toBeVisible()
    })

    test('email is valid format', async () => {
      await page.emailInput.fill('invalid-email')
      await page.saveButton.click()

      // Should show validation error
      await expect(page.page.locator('.field-error')).toBeVisible()
    })
  })

  // ============================================
  // Edit Functionality Tests
  // ============================================

  test.describe('Edit Operations', () => {
    test('updates basic info successfully', async () => {
      await page.nameInput.fill('New Location Name')
      await page.descriptionDeInput.fill('Neue Beschreibung')
      await page.descriptionEnInput.fill('New description')
      await page.save()

      const savedData = await getLocationById(locationId)
      expect(savedData.name).toBe('New Location Name')
      expect(savedData.description_de).toBe('Neue Beschreibung')
      expect(savedData.description_en).toBe('New description')
    })

    test('updates contact info successfully', async () => {
      await page.websiteInput.fill('https://new-website.com')
      await page.phoneInput.fill('+49 69 9999999')
      await page.emailInput.fill('new@example.com')
      await page.instagramInput.fill('newinstagram')
      await page.save()

      const savedData = await getLocationById(locationId)
      expect(savedData.website).toBe('https://new-website.com')
      expect(savedData.phone).toBe('+49 69 9999999')
      expect(savedData.email).toBe('new@example.com')
      expect(savedData.instagram).toBe('newinstagram')
    })

    test('updates address and coordinates successfully', async () => {
      await page.addressInput.fill('Neue Straße 99')
      await page.cityInput.fill('Offenbach')
      await page.page.locator('input[name="lat"]').fill('50.1234')
      await page.page.locator('input[name="lng"]').fill('8.7654')
      await page.save()

      const savedData = await getLocationById(locationId)
      expect(savedData.address).toBe('Neue Straße 99')
      expect(savedData.city).toBe('Offenbach')
      expect(savedData.lat).toBe(50.1234)
      expect(savedData.lng).toBe(8.7654)
    })

    test('updates categories with checkboxes', async () => {
      // Uncheck current category
      await page.categoryCheckbox(TEST_LOCATION.categories[0]).click()
      // Check new category
      await page.categoryCheckbox('neue-kategorie').click()
      await page.save()

      const savedData = await getLocationById(locationId)
      expect(savedData.categories).toContain('neue-kategorie')
      expect(savedData.categories).not.toContain(TEST_LOCATION.categories[0])
    })

    test('updates payment methods with checkboxes', async () => {
      await page.paymentCheckbox('cash').click() // toggle off
      await page.paymentCheckbox('vouchers').click() // toggle on
      await page.save()

      const savedData = await getLocationById(locationId)
      expect(savedData.payment_methods.cash).toBe(false)
      expect(savedData.payment_methods.vouchers).toBe(true)
    })
  })

  // ============================================
  // Edge Cases
  // ============================================

  test.describe('Edge Cases', () => {
    test('handles empty optional fields gracefully', async () => {
      await page.websiteInput.clear()
      await page.phoneInput.clear()
      await page.emailInput.clear()
      await page.instagramInput.clear()
      await page.save()

      const savedData = await getLocationById(locationId)
      expect(savedData.website).toBeNull()
      expect(savedData.phone).toBeNull()
    })

    test('handles very long text in description fields', async () => {
      const longText = 'A'.repeat(5000)
      await page.descriptionDeInput.fill(longText)
      await page.save()

      const savedData = await getLocationById(locationId)
      expect(savedData.description_de).toBe(longText)
    })

    test('handles special characters in name', async () => {
      await page.nameInput.fill('Café & Restaurant "Test" <special>')
      await page.save()

      const savedData = await getLocationById(locationId)
      expect(savedData.name).toBe('Café & Restaurant "Test" <special>')
    })

    test('handles unicode/emoji in text fields', async () => {
      await page.nameInput.fill('🌱 Green Shop 🌍')
      await page.descriptionDeInput.fill('Nachhaltig einkaufen 🛒')
      await page.save()

      const savedData = await getLocationById(locationId)
      expect(savedData.name).toBe('🌱 Green Shop 🌍')
      expect(savedData.description_de).toBe('Nachhaltig einkaufen 🛒')
    })

    test('slug regenerates when name changes (if auto-slug enabled)', async () => {
      // Clear manual slug override to enable auto-slug
      // Change name
      // Verify slug updates
    })

    test('prevents duplicate slugs with increment', async () => {
      // Create another location with same name
      // Verify slug gets -2 suffix
    })
  })

  // ============================================
  // UI/UX Tests
  // ============================================

  test.describe('UI/UX', () => {
    test('shows live preview while editing', async () => {
      await page.nameInput.fill('Preview Test Name')

      // Preview panel should update
      const preview = page.page.locator('[data-testid="location-preview"]')
      await expect(preview).toContainText('Preview Test Name')
    })

    test('cancel button navigates back without saving', async () => {
      await page.nameInput.fill('Should Not Be Saved')
      await page.cancelButton.click()

      // Should navigate away
      await expect(page.page).not.toHaveURL(/edit/)

      // Data should be unchanged
      const savedData = await getLocationById(locationId)
      expect(savedData.name).not.toBe('Should Not Be Saved')
    })

    test('shows loading state during save', async () => {
      await page.nameInput.fill('Loading Test')
      await page.saveButton.click()

      // Loading spinner should appear briefly
      await expect(page.loadingSpinner).toBeVisible()
      await expect(page.loadingSpinner).toBeHidden()
    })

    test('shows success toast on save', async () => {
      await page.nameInput.fill('Toast Test')
      await page.save()

      await expect(page.toastSuccess).toBeVisible()
    })

    test('shows error toast on save failure', async () => {
      // Simulate network error or validation failure
      // Verify error toast appears
    })
  })
})
```

### 2.3 Approve/Reject Tests

**File**: `tests/e2e/admin/specs/location-approve.spec.ts`

```typescript
test.describe('Location Approve/Reject', () => {
  test('approves pending location', async () => {
    // Create pending location
    // Click approve button
    // Verify status changed to approved
    // Verify approved_by set to admin user
    // Verify shows in approved tab
  })

  test('rejects pending location with reason', async () => {
    // Create pending location
    // Click reject button
    // Enter rejection reason
    // Verify status changed to rejected
    // Verify rejection_reason saved
  })

  test('approve uses optimistic update (UI updates immediately)', async () => {
    // Click approve
    // Immediately check UI shows approved
    // (before API response)
  })

  test('approve failure shows error and reverts UI', async () => {
    // Mock API failure
    // Click approve
    // Verify error toast
    // Verify UI reverts to pending state
  })
})
```

### 2.4 Pending Review Panel Tests

**File**: `tests/e2e/admin/specs/pending-review.spec.ts`

```typescript
test.describe('Pending Review Panel', () => {
  test('shows location details in side panel', async () => {
    await page.clickPendingLocation(locationId)
    await expect(page.sidePanel).toBeVisible()
    await expect(page.sidePanel).toContainText(TEST_LOCATION.name)
  })

  test('quick approve from side panel', async () => {
    await page.clickPendingLocation(locationId)
    await page.sidePanelApproveButton.click()

    // Location removed from pending list
    await expect(page.pendingList).not.toContainText(TEST_LOCATION.name)
  })

  test('quick reject from side panel', async () => {
    await page.clickPendingLocation(locationId)
    await page.sidePanelRejectButton.click()

    // Should show reason modal
    await page.rejectReasonInput.fill('Duplicate entry')
    await page.confirmRejectButton.click()

    // Location removed from pending list
    await expect(page.pendingList).not.toContainText(TEST_LOCATION.name)
  })

  test('navigates to full edit from side panel', async () => {
    await page.clickPendingLocation(locationId)
    await page.sidePanelEditButton.click()

    await expect(page.page).toHaveURL(`/bulk-station/edit/${locationId}`)
  })
})
```

### Phase 2 Deliverables Checklist

- [ ] Locations list filtering tests
- [ ] Locations list search tests
- [ ] Location edit - data integrity tests (CRITICAL)
- [ ] Location edit - validation tests
- [ ] Location edit - all field types tests
- [ ] Location edit - edge cases
- [ ] Location approve/reject workflow
- [ ] Pending review panel tests
- [ ] UI/UX tests (preview, loading, toasts)

---

## Phase 3: Category Management E2E Tests

**Goal**: Full CRUD testing for categories including icon upload, drag-and-drop reordering, and deletion with reassignment.

**Estimated Context**: ~80-100k tokens

### Files to Create

```
tests/e2e/admin/
  specs/
    categories-list.spec.ts   # List, reorder
    category-create.spec.ts   # Create with icon
    category-edit.spec.ts     # Edit form
    category-delete.spec.ts   # Delete with reassignment
  fixtures/
    test-icon.png             # Test icon file
```

### 3.1 Category List Tests

**File**: `tests/e2e/admin/specs/categories-list.spec.ts`

```typescript
test.describe('Categories List', () => {
  test('displays all categories with correct info', async () => {
    await page.goto()

    // Verify table columns: Icon, Name, Slug, Location Count, Actions
    await expect(page.categoryRows).toHaveCount(await getCategoryCount())
  })

  test('shows location count per category', async () => {
    // Verify count matches actual locations
  })

  test.describe('Drag and Drop Reorder', () => {
    test('reorders categories via drag and drop', async () => {
      const originalOrder = await page.getCategoryOrder()

      // Drag first item to third position
      await page.dragCategory(0, 2)

      // Verify new order
      const newOrder = await page.getCategoryOrder()
      expect(newOrder[2]).toBe(originalOrder[0])
    })

    test('persists reorder after page refresh', async () => {
      await page.dragCategory(0, 2)

      await page.page.reload()
      await page.waitForLoaded()

      const orderAfterRefresh = await page.getCategoryOrder()
      // Verify order persisted
    })

    test('shows optimistic update during reorder', async () => {
      // Verify UI updates immediately during drag
      // Before API completes
    })

    test('reverts on reorder failure', async () => {
      // Mock API failure
      // Attempt reorder
      // Verify order reverts
    })
  })
})
```

### 3.2 Category Create Tests

**File**: `tests/e2e/admin/specs/category-create.spec.ts`

```typescript
test.describe('Category Create', () => {
  test('creates category with all fields', async () => {
    await page.openCreateModal()

    await page.fillCategoryForm({
      name_de: 'Neue Kategorie',
      name_en: 'New Category',
      slug: 'neue-kategorie',
      description_de: 'Deutsche Beschreibung',
      description_en: 'English description',
      sort_order: 50,
    })

    await page.saveModal()

    // Verify category in list
    await expect(page.categoryRows).toContainText('Neue Kategorie')

    // Verify in database
    const category = await getCategoryBySlug('neue-kategorie')
    expect(category.name_de).toBe('Neue Kategorie')
  })

  test('creates category with icon upload', async () => {
    await page.openCreateModal()

    await page.fillCategoryForm({ name_de: 'Icon Test', slug: 'icon-test' })
    await page.uploadIcon('tests/e2e/admin/fixtures/test-icon.png')
    await page.saveModal()

    // Verify icon uploaded to Supabase Storage
    const category = await getCategoryBySlug('icon-test')
    expect(category.icon_url).toMatch(/storage.*icon-test.*\.png/)
  })

  test.describe('Validation', () => {
    test('name_de is required', async () => {
      await page.openCreateModal()
      await page.fillCategoryForm({ name_en: 'English Only' })
      await page.modalSaveButton.click()

      await expect(page.editModal.locator('.field-error')).toBeVisible()
    })

    test('slug must be unique', async () => {
      await page.openCreateModal()
      await page.fillCategoryForm({
        name_de: 'Duplicate Slug Test',
        slug: 'existing-slug', // Already exists
      })
      await page.modalSaveButton.click()

      await expect(page.toastError).toBeVisible()
    })

    test('slug validates pattern [a-z0-9-]+', async () => {
      await page.openCreateModal()
      await page.modalSlug.fill('Invalid Slug!')
      await page.modalSaveButton.click()

      await expect(page.editModal.locator('.field-error')).toBeVisible()
    })

    test('icon must be PNG format', async () => {
      await page.openCreateModal()
      await page.uploadIcon('tests/e2e/admin/fixtures/test-image.jpg') // Wrong format

      await expect(page.editModal.locator('.field-error')).toBeVisible()
    })
  })

  test('cancel closes modal without creating', async () => {
    await page.openCreateModal()
    await page.fillCategoryForm({ name_de: 'Should Not Exist' })
    await page.closeModal()

    // Verify not in list
    await expect(page.categoryRows).not.toContainText('Should Not Exist')
  })
})
```

### 3.3 Category Edit Tests

**File**: `tests/e2e/admin/specs/category-edit.spec.ts`

```typescript
test.describe('Category Edit', () => {
  let categoryId: string

  test.beforeEach(async () => {
    categoryId = await seedTestCategory()
  })

  // ============================================
  // Data Integrity (Same pattern as locations)
  // ============================================

  test.describe('Data Integrity', () => {
    test('editing one field preserves all other fields', async () => {
      const originalData = await getCategoryById(categoryId)

      await page.openEditModal(TEST_CATEGORY.slug)
      await page.modalNameDe.fill('Updated Name Only')
      await page.saveModal()

      const savedData = await getCategoryById(categoryId)
      expect(savedData.name_de).toBe('Updated Name Only')
      expect(savedData.name_en).toBe(originalData.name_en)
      expect(savedData.slug).toBe(originalData.slug)
      expect(savedData.description_de).toBe(originalData.description_de)
      expect(savedData.description_en).toBe(originalData.description_en)
      expect(savedData.sort_order).toBe(originalData.sort_order)
      expect(savedData.icon_url).toBe(originalData.icon_url)
    })

    test('updating icon deletes old icon from storage', async () => {
      // Seed category with icon
      const categoryWithIcon = await seedCategoryWithIcon()
      const oldIconUrl = categoryWithIcon.icon_url

      await page.openEditModal(categoryWithIcon.slug)
      await page.uploadIcon('tests/e2e/admin/fixtures/test-icon-2.png')
      await page.saveModal()

      // Verify old icon deleted
      const oldIconExists = await checkStorageFileExists(oldIconUrl)
      expect(oldIconExists).toBe(false)

      // Verify new icon uploaded
      const savedData = await getCategoryById(categoryWithIcon.id)
      expect(savedData.icon_url).not.toBe(oldIconUrl)
    })
  })

  test.describe('Edit Operations', () => {
    test('updates German name and description', async () => {
      await page.openEditModal(TEST_CATEGORY.slug)
      await page.modalNameDe.fill('Aktualisierter Name')
      await page.modalDescDe.fill('Aktualisierte Beschreibung')
      await page.saveModal()

      const saved = await getCategoryById(categoryId)
      expect(saved.name_de).toBe('Aktualisierter Name')
      expect(saved.description_de).toBe('Aktualisierte Beschreibung')
    })

    test('updates English name and description', async () => {
      await page.openEditModal(TEST_CATEGORY.slug)
      await page.modalNameEn.fill('Updated Name')
      await page.modalDescEn.fill('Updated description')
      await page.saveModal()

      const saved = await getCategoryById(categoryId)
      expect(saved.name_en).toBe('Updated Name')
      expect(saved.description_en).toBe('Updated description')
    })

    test('updates sort order', async () => {
      await page.openEditModal(TEST_CATEGORY.slug)
      await page.modalSortOrder.fill('25')
      await page.saveModal()

      const saved = await getCategoryById(categoryId)
      expect(saved.sort_order).toBe(25)
    })

    test('cannot change slug of existing category', async () => {
      // Slug field should be disabled in edit mode
      await page.openEditModal(TEST_CATEGORY.slug)
      await expect(page.modalSlug).toBeDisabled()
    })
  })

  test.describe('Edge Cases', () => {
    test('handles empty optional fields', async () => {
      await page.openEditModal(TEST_CATEGORY.slug)
      await page.modalDescDe.clear()
      await page.modalDescEn.clear()
      await page.saveModal()

      const saved = await getCategoryById(categoryId)
      expect(saved.description_de).toBeNull()
      expect(saved.description_en).toBeNull()
    })

    test('handles special characters in names', async () => {
      await page.openEditModal(TEST_CATEGORY.slug)
      await page.modalNameDe.fill('Spezial & "Zeichen" <test>')
      await page.saveModal()

      const saved = await getCategoryById(categoryId)
      expect(saved.name_de).toBe('Spezial & "Zeichen" <test>')
    })
  })

  test.describe('UI/UX', () => {
    test('ESC closes modal without saving', async () => {
      await page.openEditModal(TEST_CATEGORY.slug)
      await page.modalNameDe.fill('Should Not Save')
      await page.page.keyboard.press('Escape')

      await expect(page.editModal).toBeHidden()

      const saved = await getCategoryById(categoryId)
      expect(saved.name_de).not.toBe('Should Not Save')
    })

    test('shows loading state during save', async () => {
      await page.openEditModal(TEST_CATEGORY.slug)
      await page.modalNameDe.fill('Loading Test')
      await page.modalSaveButton.click()

      await expect(page.loadingSpinner).toBeVisible()
    })
  })
})
```

### 3.4 Category Delete Tests

**File**: `tests/e2e/admin/specs/category-delete.spec.ts`

```typescript
test.describe('Category Delete', () => {
  test('shows delete confirmation modal', async () => {
    await page.clickDeleteButton(TEST_CATEGORY.slug)

    await expect(page.deleteModal).toBeVisible()
    await expect(page.deleteModal).toContainText('Are you sure')
  })

  test('cannot delete "andere" (Other) category', async () => {
    // "andere" is the fallback category
    await page.clickDeleteButton('andere')

    // Should show error or button disabled
    await expect(page.toastError).toBeVisible()
    await expect(page.toastError).toContainText(/cannot delete|nicht löschen/)
  })

  test('requires reassignment category selection', async () => {
    await page.clickDeleteButton(TEST_CATEGORY.slug)

    // Should show dropdown to select reassignment category
    await expect(page.reassignDropdown).toBeVisible()
  })

  test('reassigns locations to selected category before delete', async () => {
    // Create location in test category
    const locationId = await seedLocationInCategory(TEST_CATEGORY.slug)

    await page.clickDeleteButton(TEST_CATEGORY.slug)
    await page.selectReassignCategory('andere')
    await page.confirmDelete()

    // Verify location reassigned
    const location = await getLocationById(locationId)
    expect(location.categories).toContain('andere')
    expect(location.categories).not.toContain(TEST_CATEGORY.slug)
  })

  test('deletes category and removes from list', async () => {
    await page.clickDeleteButton(TEST_CATEGORY.slug)
    await page.selectReassignCategory('andere')
    await page.confirmDelete()

    // Verify removed from list
    await expect(page.categoryRows).not.toContainText(TEST_CATEGORY.name_de)

    // Verify deleted from database
    const category = await getCategoryBySlug(TEST_CATEGORY.slug)
    expect(category).toBeNull()
  })

  test('deletes associated icon from storage', async () => {
    // Create category with icon
    const categoryWithIcon = await seedCategoryWithIcon()
    const iconUrl = categoryWithIcon.icon_url

    await page.clickDeleteButton(categoryWithIcon.slug)
    await page.selectReassignCategory('andere')
    await page.confirmDelete()

    // Verify icon deleted from storage
    const iconExists = await checkStorageFileExists(iconUrl)
    expect(iconExists).toBe(false)
  })

  test('cancel closes modal without deleting', async () => {
    await page.clickDeleteButton(TEST_CATEGORY.slug)
    await page.cancelDelete()

    await expect(page.deleteModal).toBeHidden()

    // Verify still in list
    await expect(page.categoryRows).toContainText(TEST_CATEGORY.name_de)
  })
})
```

### Phase 3 Deliverables Checklist

- [ ] Category list display tests
- [ ] Drag-and-drop reorder tests
- [ ] Category create with all fields
- [ ] Category create with icon upload
- [ ] Category create validation
- [ ] Category edit - data integrity
- [ ] Category edit operations
- [ ] Category delete with reassignment
- [ ] Cannot delete "andere" category
- [ ] Icon storage cleanup on delete/update

---

## Phase 4: Hours Suggestions, Session, & Polish

**Goal**: Complete test coverage with hours suggestions workflow, session management, error handling, and mobile responsiveness.

**Estimated Context**: ~60-80k tokens

### Files to Create

```
tests/e2e/admin/
  specs/
    hours-suggestions.spec.ts  # Hours review workflow
    session.spec.ts            # Session timeout tests
    error-handling.spec.ts     # Error scenarios
    mobile.spec.ts             # Mobile responsiveness
    accessibility.spec.ts      # A11y tests
```

### 4.1 Hours Suggestions Tests

**File**: `tests/e2e/admin/specs/hours-suggestions.spec.ts`

```typescript
test.describe('Hours Suggestions', () => {
  let suggestionId: string
  let locationId: string

  test.beforeEach(async () => {
    locationId = await seedTestLocation()
    suggestionId = await seedHoursSuggestion(locationId)
    await loginAsAdmin(page)
  })

  test('displays pending suggestions list', async () => {
    await page.goto('/bulk-station/hours-suggestions')
    await expect(page.suggestionRows).toHaveCount(1)
  })

  test('shows suggestion details with location info', async () => {
    await page.goto('/bulk-station/hours-suggestions')

    const row = page.suggestionRows.first()
    await expect(row).toContainText(TEST_LOCATION.name)
    await expect(row).toContainText('Monday')
    await expect(row).toContainText('09:00 - 18:00')
  })

  test.describe('Approve Flow', () => {
    test('approves suggestion and updates location hours', async () => {
      const originalLocation = await getLocationById(locationId)

      await page.goto('/bulk-station/hours-suggestions')
      await page.approvesuggestion(suggestionId)

      // Verify suggestion status changed
      const suggestion = await getHoursSuggestionById(suggestionId)
      expect(suggestion.status).toBe('approved')

      // Verify location hours updated
      const updatedLocation = await getLocationById(locationId)
      expect(updatedLocation.opening_hours).not.toEqual(originalLocation.opening_hours)
    })

    test('approve with admin note', async () => {
      await page.goto('/bulk-station/hours-suggestions')
      await page.approveSuggestionWithNote(suggestionId, 'Verified via phone call')

      const suggestion = await getHoursSuggestionById(suggestionId)
      expect(suggestion.admin_note).toBe('Verified via phone call')
    })
  })

  test.describe('Reject Flow', () => {
    test('rejects suggestion without updating location', async () => {
      const originalLocation = await getLocationById(locationId)

      await page.goto('/bulk-station/hours-suggestions')
      await page.rejectSuggestion(suggestionId, 'Incorrect information')

      // Verify suggestion rejected
      const suggestion = await getHoursSuggestionById(suggestionId)
      expect(suggestion.status).toBe('rejected')

      // Verify location unchanged
      const location = await getLocationById(locationId)
      expect(location.opening_hours).toEqual(originalLocation.opening_hours)
    })
  })

  test.describe('Data Integrity', () => {
    test('approving suggestion preserves other location fields', async () => {
      const originalLocation = await getLocationById(locationId)

      await page.goto('/bulk-station/hours-suggestions')
      await page.approveSuggestion(suggestionId)

      const updatedLocation = await getLocationById(locationId)
      expect(updatedLocation.name).toBe(originalLocation.name)
      expect(updatedLocation.address).toBe(originalLocation.address)
      expect(updatedLocation.website).toBe(originalLocation.website)
      // ... all other fields preserved
    })
  })

  test.describe('Filtering', () => {
    test('filters by status (pending/approved/rejected)', async () => {
      // Create suggestions in different statuses
      const pendingSuggestion = await seedHoursSuggestion(locationId, 'pending')
      const approvedSuggestion = await seedHoursSuggestion(locationId, 'approved')

      await page.goto('/bulk-station/hours-suggestions')

      // Default shows pending
      await expect(page.suggestionRows).toHaveCount(1)

      // Show approved
      await page.statusFilter.selectOption('approved')
      await expect(page.suggestionRows).toHaveCount(1)
    })
  })
})
```

### 4.2 Session Management Tests

**File**: `tests/e2e/admin/specs/session.spec.ts`

```typescript
test.describe('Session Management', () => {
  test('redirects to login when session expires', async () => {
    await loginAsAdmin(page)
    await page.goto('/bulk-station')

    // Clear session
    await page.evaluate(() => {
      localStorage.removeItem('sb-lccpndhssuemudzpfvvg-auth-token')
    })

    // Navigate to protected route
    await page.goto('/bulk-station/locations')

    // Should redirect to login
    await expect(page).toHaveURL(/\/bulk-station\/login/)
  })

  test('tracks activity and resets timeout', async () => {
    await loginAsAdmin(page)
    await page.goto('/bulk-station')

    // Get initial last activity
    const initialActivity = await page.evaluate(() => {
      return localStorage.getItem('admin_last_activity')
    })

    // Wait and perform action
    await page.waitForTimeout(1000)
    await page.click('button') // Any interaction

    // Activity should be updated
    const newActivity = await page.evaluate(() => {
      return localStorage.getItem('admin_last_activity')
    })

    expect(Number(newActivity)).toBeGreaterThan(Number(initialActivity))
  })

  test('logs out after 1 hour inactivity', async () => {
    await loginAsAdmin(page)
    await page.goto('/bulk-station')

    // Set last activity to 61 minutes ago
    await page.evaluate(() => {
      const oneHourAgo = Date.now() - (61 * 60 * 1000)
      localStorage.setItem('admin_last_activity', String(oneHourAgo))
    })

    // Navigate (which triggers check)
    await page.goto('/bulk-station/locations')

    // Should redirect to login
    await expect(page).toHaveURL(/\/bulk-station\/login/)
  })

  test('logout button clears session and redirects', async () => {
    await loginAsAdmin(page)
    await page.goto('/bulk-station')

    await page.click('[data-testid="logout-button"]')

    // Should redirect to login
    await expect(page).toHaveURL(/\/bulk-station\/login/)

    // Session should be cleared
    const session = await page.evaluate(() => {
      return localStorage.getItem('sb-lccpndhssuemudzpfvvg-auth-token')
    })
    expect(session).toBeNull()
  })

  test('displays logged-in user email in header', async () => {
    await loginAsAdmin(page)
    await page.goto('/bulk-station')

    await expect(page.locator('[data-testid="user-email"]')).toContainText(TEST_ADMIN.email)
  })
})
```

### 4.3 Error Handling Tests

**File**: `tests/e2e/admin/specs/error-handling.spec.ts`

```typescript
test.describe('Error Handling', () => {
  test.describe('Network Errors', () => {
    test('shows error toast on network failure', async () => {
      await loginAsAdmin(page)

      // Intercept and fail API call
      await page.route('**/rest/v1/locations**', route => route.abort())

      await page.goto('/bulk-station/locations')

      await expect(page.toastError).toBeVisible()
    })

    test('retains form data on save failure', async () => {
      await loginAsAdmin(page)
      const locationId = await seedTestLocation()

      await page.goto(`/bulk-station/edit/${locationId}`)
      await page.locator('input[name="name"]').fill('New Name')

      // Intercept and fail save
      await page.route('**/rest/v1/locations**', route => {
        if (route.request().method() === 'PATCH') {
          route.abort()
        } else {
          route.continue()
        }
      })

      await page.click('button[type="submit"]')

      // Form should still have the new value
      await expect(page.locator('input[name="name"]')).toHaveValue('New Name')
    })
  })

  test.describe('Validation Errors', () => {
    test('displays field-level errors', async () => {
      await loginAsAdmin(page)
      const locationId = await seedTestLocation()

      await page.goto(`/bulk-station/edit/${locationId}`)
      await page.locator('input[name="email"]').fill('invalid-email')
      await page.click('button[type="submit"]')

      await expect(page.locator('.field-error')).toBeVisible()
    })
  })

  test.describe('404 Handling', () => {
    test('shows 404 for non-existent location', async () => {
      await loginAsAdmin(page)
      await page.goto('/bulk-station/edit/non-existent-id')

      await expect(page.locator('text=/not found|nicht gefunden/i')).toBeVisible()
    })
  })

  test.describe('Permission Errors', () => {
    test('shows error when non-admin tries to access', async () => {
      // Login as regular user (not admin)
      await loginAsRegularUser(page)
      await page.goto('/bulk-station')

      // Should redirect to login or show error
      await expect(page).toHaveURL(/\/bulk-station\/login/)
    })
  })
})
```

### 4.4 Mobile Responsiveness Tests

**File**: `tests/e2e/admin/specs/mobile.spec.ts`

```typescript
test.describe('Mobile Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await loginAsAdmin(page)
  })

  test('sidebar collapses on mobile', async ({ page }) => {
    await page.goto('/bulk-station')

    // Sidebar should be hidden initially
    await expect(page.locator('[data-testid="sidebar"]')).toBeHidden()

    // Menu button should be visible
    await expect(page.locator('[data-testid="menu-button"]')).toBeVisible()
  })

  test('sidebar opens on menu button click', async ({ page }) => {
    await page.goto('/bulk-station')

    await page.click('[data-testid="menu-button"]')

    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
  })

  test('location edit form is usable on mobile', async ({ page }) => {
    const locationId = await seedTestLocation()
    await page.goto(`/bulk-station/edit/${locationId}`)

    // All form fields should be visible and usable
    await expect(page.locator('input[name="name"]')).toBeVisible()

    // Form should scroll properly
    await page.locator('input[name="instagram"]').scrollIntoViewIfNeeded()
    await expect(page.locator('input[name="instagram"]')).toBeVisible()
  })

  test('category modal fits mobile viewport', async ({ page }) => {
    await page.goto('/bulk-station/categories')
    await page.click('[data-testid="create-category-button"]')

    const modal = page.locator('[data-testid="category-modal"]')
    await expect(modal).toBeVisible()

    // Modal should not overflow viewport
    const modalBox = await modal.boundingBox()
    expect(modalBox!.width).toBeLessThanOrEqual(375)
  })

  test('tables scroll horizontally on mobile', async ({ page }) => {
    await page.goto('/bulk-station/locations')

    // Table container should have overflow scroll
    const tableContainer = page.locator('.table-container')
    await expect(tableContainer).toHaveCSS('overflow-x', 'auto')
  })
})
```

### 4.5 Accessibility Tests

**File**: `tests/e2e/admin/specs/accessibility.spec.ts`

```typescript
test.describe('Accessibility', () => {
  test('all form inputs have labels', async ({ page }) => {
    await loginAsAdmin(page)
    const locationId = await seedTestLocation()
    await page.goto(`/bulk-station/edit/${locationId}`)

    const inputs = await page.locator('input:not([type="hidden"])').all()
    for (const input of inputs) {
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const label = page.locator(`label[for="${id}"]`)

      // Either has associated label or aria-label
      const hasLabel = ariaLabel || await label.count() > 0
      expect(hasLabel).toBe(true)
    }
  })

  test('keyboard navigation works in forms', async ({ page }) => {
    await loginAsAdmin(page)
    const locationId = await seedTestLocation()
    await page.goto(`/bulk-station/edit/${locationId}`)

    // Tab through form fields
    await page.keyboard.press('Tab')
    await expect(page.locator('input[name="name"]')).toBeFocused()

    await page.keyboard.press('Tab')
    // Next field should be focused
  })

  test('modals trap focus', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/bulk-station/categories')
    await page.click('[data-testid="create-category-button"]')

    // Tab should cycle within modal
    const modal = page.locator('[data-testid="category-modal"]')
    await expect(modal).toBeFocused()

    // Pressing Tab multiple times should keep focus in modal
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const focused = await page.evaluate(() => document.activeElement?.closest('[data-testid="category-modal"]'))
      expect(focused).not.toBeNull()
    }
  })

  test('error messages are announced to screen readers', async ({ page }) => {
    await loginAsAdmin(page)
    const locationId = await seedTestLocation()
    await page.goto(`/bulk-station/edit/${locationId}`)

    await page.locator('input[name="email"]').fill('invalid')
    await page.click('button[type="submit"]')

    // Error should have role="alert" or aria-live
    const error = page.locator('.field-error')
    const role = await error.getAttribute('role')
    const ariaLive = await error.getAttribute('aria-live')

    expect(role === 'alert' || ariaLive === 'polite').toBe(true)
  })
})
```

### Phase 4 Deliverables Checklist

- [ ] Hours suggestions list display
- [ ] Hours approve/reject workflow
- [ ] Hours approval updates location correctly
- [ ] Session timeout after 1 hour
- [ ] Session activity tracking
- [ ] Logout functionality
- [ ] Network error handling
- [ ] Validation error display
- [ ] 404 page handling
- [ ] Mobile sidebar collapse
- [ ] Mobile form usability
- [ ] Modal mobile viewport
- [ ] Keyboard navigation
- [ ] Screen reader support

---

## Summary

| Phase | Focus | Estimated Context | Key Tests |
|-------|-------|-------------------|-----------|
| 1 | Infrastructure | ~80-100k | Auth bypass, fixtures, page objects |
| 2 | Locations | ~100-150k | CRUD, data integrity, validation |
| 3 | Categories | ~80-100k | CRUD, icons, drag-drop, delete |
| 4 | Polish | ~60-80k | Hours, session, errors, mobile, a11y |

### Critical Data Integrity Tests (Priority)

These tests specifically address the "saving overrides default values" bug:

1. **`location-edit.spec.ts`**: "saving with no changes preserves all original values"
2. **`location-edit.spec.ts`**: "changing one field does not affect other fields"
3. **`location-edit.spec.ts`**: "updating payment methods does not reset other payment methods"
4. **`location-edit.spec.ts`**: "opening hours are not corrupted on save"
5. **`category-edit.spec.ts`**: "editing one field preserves all other fields"
6. **`hours-suggestions.spec.ts`**: "approving suggestion preserves other location fields"

### Execution Order

```bash
# Run all phases sequentially
/execute-plan ai/plans/admin-e2e-testing-plan.md

# Or run individually
# Phase 1: npm run test:e2e -- --grep "admin/fixtures"
# Phase 2: npm run test:e2e -- --grep "admin/specs/location"
# Phase 3: npm run test:e2e -- --grep "admin/specs/categor"
# Phase 4: npm run test:e2e -- --grep "admin/specs/(hours|session|error|mobile|access)"
```

---

## Appendix: Test Data Cleanup

To ensure test isolation and prevent data pollution:

```typescript
// In fixtures/index.ts
export async function cleanupTestData(): Promise<void> {
  const testSupabase = getTestSupabase()

  // Order matters due to foreign keys
  await testSupabase
    .from('location_categories')
    .delete()
    .like('location_id', 'e2e-%')

  await testSupabase
    .from('hours_suggestions')
    .delete()
    .like('location_id', 'e2e-%')

  await testSupabase
    .from('locations')
    .delete()
    .or('name.ilike.E2E Test%,name.ilike.e2e-%')

  await testSupabase
    .from('categories')
    .delete()
    .or('slug.ilike.e2e-%,name_de.ilike.E2E Test%')

  // Cleanup storage
  const { data: files } = await testSupabase.storage
    .from('category-icons')
    .list('', { search: 'e2e-' })

  if (files?.length) {
    await testSupabase.storage
      .from('category-icons')
      .remove(files.map(f => f.name))
  }
}
```

---

*Plan created: 2026-01-15*
*Author: Claude Code*
*Version: 1.0*
