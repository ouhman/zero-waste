# E2E Testing Guide - Zero Waste Frankfurt

This guide explains how to run and maintain E2E tests for the Zero Waste Frankfurt application.

## Setup

E2E tests are already configured. Just install Playwright browsers if not already done:

```bash
npx playwright install chromium
```

## Running E2E Tests

### Basic Usage

```bash
# Run all E2E tests
npm run test:e2e

# Run with interactive UI
npm run test:e2e:ui
```

### Advanced Usage

```bash
# Run specific test file
npx playwright test tests/e2e/map.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run only failed tests
npx playwright test --last-failed

# Generate HTML report
npx playwright show-report
```

## Test Files

### Map Tests (`tests/e2e/map.spec.ts`)
- Loads and displays markers
- Clusters markers at low zoom
- Shows popup on marker click
- Navigates to detail on popup click

### Filter Tests (`tests/e2e/filter.spec.ts`)
- Filters by category
- Searches by text
- Shows near me results

### Submission Tests (`tests/e2e/submit.spec.ts`)
- Completes new location flow
- Completes update location flow

### Admin Tests (`tests/e2e/admin.spec.ts`)
- Logs in as admin
- Approves pending location
- Rejects pending location
- Edits existing location

### Favorites Tests (`tests/e2e/favorites.spec.ts`)
- Adds to favorites
- Persists after reload
- Shows on favorites page

## Configuration

Playwright configuration is in `playwright.config.ts`:

```typescript
{
  testDir: './tests/e2e',
  baseURL: 'http://localhost:5173',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true
  }
}
```

The dev server starts automatically when running E2E tests.

## Writing New E2E Tests

### Template

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('/path')

    // Interact
    await page.click('button')

    // Assert
    await expect(page.locator('.result')).toBeVisible()
  })
})
```

### Best Practices

1. **Use data-testid attributes** for stable selectors
   ```html
   <button data-testid="submit-button">Submit</button>
   ```

2. **Wait for elements** before interacting
   ```typescript
   await page.waitForSelector('.map-container')
   ```

3. **Use meaningful test names**
   - ✅ `test('filters locations by category')`
   - ❌ `test('test1')`

4. **Keep tests independent**
   - Each test should work in isolation
   - Don't rely on order of execution

5. **Clean up test data**
   - Reset state after tests if needed

## Debugging Tests

### Visual Debugging

```bash
# Run with browser visible
npx playwright test --headed

# Run in debug mode (step through)
npx playwright test --debug
```

### Screenshots on Failure

Playwright automatically takes screenshots when tests fail. Find them in:
```
test-results/
```

### Trace Viewer

```bash
# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## CI Integration

To run E2E tests in CI (GitHub Actions):

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Common Issues

### Port Already in Use

If port 5173 is busy, update `playwright.config.ts`:

```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:5174', // Change port
  port: 5174
}
```

### Tests Fail on Fresh Database

Some tests expect data to exist. Seed your database first:

```bash
# Run database seeding
# (Your seed script here)
```

### Admin Tests Fail

Admin tests require valid credentials. Update tests with your admin credentials or mock auth.

## Performance

### Parallel Execution

By default, tests run in parallel. Control with:

```typescript
// playwright.config.ts
export default defineConfig({
  workers: 4, // Number of parallel workers
})
```

### Test Timeout

Default timeout is 30s. Adjust if needed:

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000) // 60 seconds
  // ...
})
```

## Selectors

### Priority Order

1. **data-testid** (most stable)
   ```typescript
   page.locator('[data-testid="submit-btn"]')
   ```

2. **ARIA labels** (accessible)
   ```typescript
   page.locator('button[aria-label="Submit"]')
   ```

3. **Text content** (user-facing)
   ```typescript
   page.locator('button:has-text("Submit")')
   ```

4. **CSS classes** (least stable)
   ```typescript
   page.locator('.submit-button')
   ```

## Resources

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors](https://playwright.dev/docs/selectors)
- [Debugging](https://playwright.dev/docs/debug)

---

**Happy Testing! 🎭**
