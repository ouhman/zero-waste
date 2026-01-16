# Admin E2E Tests

End-to-end tests for the Zero Waste Frankfurt admin area.

## Setup

### 1. Environment Variables

Create `.env.test` file in the project root:

```bash
cp .env.test.example .env.test
```

Fill in the required values:

```bash
TEST_SUPABASE_URL=https://lccpndhssuemudzpfvvg.supabase.co
TEST_SUPABASE_SERVICE_KEY=your-dev-service-role-key-here
TEST_ADMIN_EMAIL=e2e-test-admin@zerowastefrankfurt.de
```

**IMPORTANT:** These tests MUST point to the DEV Supabase project (`lccpndhssuemudzpfvvg`). Never run tests against production!

### 2. Load Environment Variables

The tests need `TEST_SUPABASE_URL` and `TEST_SUPABASE_SERVICE_KEY` to be available as environment variables.

You can load them before running tests:

```bash
# Load from .env.test
export $(grep -v '^#' .env.test | xargs)

# Or use dotenv-cli
npx dotenv -e .env.test -- npm run test:e2e:admin
```

## Running Tests

### All Admin Tests

```bash
npm run test:e2e -- --project=admin-setup --project=admin --project=admin-teardown
```

### Smoke Test Only

```bash
npm run test:e2e -- tests/e2e/admin/smoke.spec.ts
```

### Specific Test File

```bash
npm run test:e2e -- tests/e2e/admin/location-edit.spec.ts
```

### With UI Mode (Interactive)

```bash
npx playwright test --ui --project=admin
```

## Test Structure

```
tests/e2e/admin/
├── fixtures/
│   ├── index.ts          # Seed/cleanup functions
│   └── test-data.ts      # Test data constants
├── helpers/
│   ├── auth.ts           # Auth bypass helper
│   └── supabase.ts       # Test Supabase client
├── pages/
│   ├── base.page.ts      # Base page object
│   ├── login.page.ts
│   ├── dashboard.page.ts
│   ├── locations-list.page.ts
│   ├── location-edit.page.ts
│   └── categories.page.ts
├── admin.setup.ts        # Global setup (runs first)
├── admin.teardown.ts     # Global teardown (runs last)
└── smoke.spec.ts         # Smoke test to verify infrastructure
```

## How It Works

### 1. Setup Phase

Before tests run, `admin.setup.ts`:
- Creates test admin user if not exists
- Seeds test location
- Seeds test category

### 2. Test Execution

Tests use:
- **Auth Bypass**: `loginAsAdmin(page)` injects a valid session without magic link flow
- **Page Objects**: Clean abstraction for interacting with pages
- **Fixtures**: Helpers to seed/fetch/cleanup test data

Example test:

```typescript
import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'
import { DashboardPage } from './pages/dashboard.page'

test('dashboard loads', async ({ page }) => {
  await loginAsAdmin(page)

  const dashboardPage = new DashboardPage(page)
  await dashboardPage.goto()

  await expect(page).toHaveURL(/\/bulk-station\/?$/)
})
```

### 3. Teardown Phase

After all tests, `admin.teardown.ts`:
- Deletes all test data (locations, categories, junction records)
- Cleans up Supabase Storage (category icons)

## Page Objects

Page objects provide a clean API for interacting with pages:

```typescript
const dashboardPage = new DashboardPage(page)
await dashboardPage.goto()
await dashboardPage.waitForLoaded()
await expect(dashboardPage.statsCards).toBeVisible()
```

### Common Methods (from BasePage)

- `waitForLoaded()` - Wait for loading spinner to disappear
- `expectToast(type, text)` - Assert toast message appears
- `closeModal()` - Close modal with ESC key
- `waitForNavigation(url)` - Wait for URL change

## Fixtures

Fixtures help manage test data:

```typescript
import { seedTestLocation, getLocationById } from './fixtures'

// Seed data
const locationId = await seedTestLocation()

// Fetch for assertions
const location = await getLocationById(locationId)
expect(location.name).toBe('E2E Test Location')
```

## Troubleshooting

### "Test admin user not found"

Run the setup:

```bash
npm run test:e2e -- --project=admin-setup
```

### "Missing TEST_SUPABASE_URL"

Make sure `.env.test` exists and environment variables are loaded.

### Tests fail with auth errors

Verify the test admin user has `role: admin` in metadata:

```sql
SELECT raw_user_meta_data FROM auth.users
WHERE email = 'e2e-test-admin@zerowastefrankfurt.de';
```

Should return: `{"role": "admin"}`

### Wrong environment

Check that `TEST_SUPABASE_URL` contains `lccpndhssuemudzpfvvg` (DEV project).

## Best Practices

1. **Always use page objects** - Don't access locators directly in tests
2. **Use auth bypass** - Never test the actual magic link flow
3. **Clean up after yourself** - Use `cleanupTestData()` in afterEach if needed
4. **Seed data in beforeEach** - Keep tests isolated
5. **Use descriptive test names** - Make failures easy to understand

## Next Steps (Future Phases)

- Phase 2: Location CRUD and data integrity tests
- Phase 3: Category CRUD and icon upload tests
- Phase 4: Hours suggestions, session, error handling, mobile, accessibility
