# Testing Strategy

This document outlines the testing strategy for Zero Waste Frankfurt, including test organization, what to test at each level, mocking strategies, and CI integration.

## Table of Contents

- [Overview](#overview)
- [Test Organization](#test-organization)
- [Testing Levels](#testing-levels)
- [E2E Testing with Playwright](#e2e-testing-with-playwright)
- [What to Test](#what-to-test)
- [Mocking Strategies](#mocking-strategies)
- [Writing Good Tests](#writing-good-tests)
- [Running Tests](#running-tests)
- [CI Integration](#ci-integration)
- [Test Coverage Goals](#test-coverage-goals)

## Overview

We maintain **300+ tests** across the codebase to ensure reliability and prevent regressions. Our testing pyramid:

```
        /\
       /  \     E2E Tests (~10 tests)
      /    \    - Critical user flows
     /------\   - Real browser testing
    /        \
   /  Component\ Component Tests (~300 tests)
  /    Tests    \  - Component behavior
 /--------------\  - User interactions
/                \ - Props, events, slots
/   Unit Tests    \
/------------------\ - Utilities, composables
                     - Pure functions
```

**Framework:**
- **Vitest** - Fast unit/component testing with jsdom
- **Vue Test Utils** - Official testing utilities for Vue 3
- **Playwright** - End-to-end browser testing

## Test Organization

```
tests/
├── component/              # Component and unit tests (300+ tests)
│   ├── admin/             # Admin components (94 tests)
│   │   ├── AdminLayout.test.ts
│   │   ├── AdminSidebar.test.ts
│   │   ├── CategoryEditModal.test.ts
│   │   └── ...
│   ├── common/            # Shared components (30 tests)
│   │   ├── ContactInfo.test.ts
│   │   ├── EmptyState.test.ts
│   │   ├── LoadingSpinner.test.ts
│   │   ├── PaymentMethodsBadges.test.ts
│   │   └── ToastContainer.test.ts
│   ├── map/               # Map components (55 tests)
│   │   └── MapContainer.test.ts
│   ├── views/             # View components (122 tests)
│   │   ├── AdminDashboardView.test.ts
│   │   ├── MapView.test.ts
│   │   ├── SubmitView.test.ts
│   │   └── VerifyView.test.ts
│   └── composables/       # Composable tests
│       └── useDebounce.test.ts
└── e2e/                   # End-to-end tests
    ├── admin.spec.ts      # Admin workflow
    ├── filter.spec.ts     # Filtering and search
    ├── map.spec.ts        # Map interactions
    └── favorites.spec.ts  # Favorites functionality
```

### Naming Conventions

- **Unit/Component tests:** `ComponentName.test.ts`
- **E2E tests:** `feature.spec.ts`
- **Test descriptions:** Use descriptive strings that explain behavior

## Testing Levels

### Unit Tests

**Purpose:** Test pure functions, utilities, and composables in isolation.

**What to test:**
- Utility functions (`lib/openingHoursParser.ts`)
- Composables (`composables/useDebounce.ts`)
- Type guards and validators
- Data transformations

**Example:**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDebounce } from '@/composables/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('delays function execution', () => {
    const mockFn = vi.fn()
    const { debounced } = useDebounce(mockFn, 300)

    debounced('test')
    expect(mockFn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(mockFn).toHaveBeenCalledWith('test')
  })

  it('cancels pending execution', () => {
    const mockFn = vi.fn()
    const { debounced, cancel } = useDebounce(mockFn, 300)

    debounced('test')
    cancel()
    vi.advanceTimersByTime(300)

    expect(mockFn).not.toHaveBeenCalled()
  })
})
```

### Component Tests

**Purpose:** Test Vue components in isolation with mocked dependencies.

**What to test:**
- Props rendering
- Events emission
- User interactions (clicks, inputs)
- Conditional rendering
- Computed properties
- Component lifecycle

**Example:**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ContactInfo from '@/components/common/ContactInfo.vue'

describe('ContactInfo', () => {
  it('renders website link correctly', () => {
    const wrapper = mount(ContactInfo, {
      props: {
        website: 'https://example.com'
      }
    })

    const link = wrapper.find('a[href="https://example.com"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('example.com')
  })

  it('renders all contact methods', () => {
    const wrapper = mount(ContactInfo, {
      props: {
        phone: '123-456-7890',
        website: 'https://example.com',
        email: 'test@example.com',
        instagram: '@testaccount'
      }
    })

    expect(wrapper.findAll('.contact-item')).toHaveLength(4)
  })

  it('does not render when no contact info provided', () => {
    const wrapper = mount(ContactInfo, {
      props: {}
    })

    expect(wrapper.find('.contact-info').exists()).toBe(false)
  })
})
```

### E2E Tests

**Purpose:** Test complete user flows in a real browser environment.

**What to test:**
- Critical user journeys
- Form submissions with validation
- Navigation flows
- Authentication flows
- Error handling

#### E2E Selector Best Practices

**DON'T add `data-testid` attributes for E2E tests.** Instead, use Playwright's recommended selector priority:

| Priority | Selector | Example | When to Use |
|----------|----------|---------|-------------|
| 1st | **Role** | `getByRole('button', { name: 'Save' })` | Interactive elements |
| 2nd | **Label** | `getByLabel('Email')` | Form inputs |
| 3rd | **Text** | `getByText('Submit')` | Static content |
| 4th | **Placeholder** | `getByPlaceholder('Search...')` | Search inputs |
| Last | **TestId** | `getByTestId('dropdown')` | Only for dynamic elements |

**Why avoid `data-testid`:**
- Tests should mirror how real users interact with your app
- `data-testid` doesn't verify correct text or accessibility
- If a role/label selector fails, it often reveals a real accessibility bug

**Example - Good vs Bad:**

```typescript
// ❌ BAD: Relies on test-specific attribute
await page.locator('[data-testid="submit-btn"]').click()
await page.locator('input[name="email"]').fill('test@example.com')

// ✅ GOOD: Uses user-facing selectors
await page.getByRole('button', { name: 'Submit' }).click()
await page.getByLabel('Email').fill('test@example.com')

// ✅ GOOD: Bilingual support with regex
await page.getByRole('button', { name: /Save|Speichern/ }).click()
await page.getByRole('tab', { name: /Pending|Ausstehend/ }).click()
```

**When `data-testid` IS appropriate:**
- Dynamic containers without semantic meaning (e.g., dropdown menus)
- Elements that have no visible text or label
- Complex widgets where role selectors are impractical

See [Playwright Locators Documentation](https://playwright.dev/docs/locators) for more details.

**Example:**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Location Submission', () => {
  test('should submit a new location successfully', async ({ page }) => {
    await page.goto('/submit')

    // Fill form using labels (accessible)
    await page.getByLabel('Name').fill('Test Location')
    await page.getByLabel('Address').fill('Test Street 123, Frankfurt')
    await page.getByLabel('Email').fill('test@example.com')

    // Select category using role
    await page.getByRole('checkbox', { name: 'Unverpackt' }).check()

    // Submit using button role
    await page.getByRole('button', { name: /Submit|Absenden/ }).click()

    // Verify success message
    await expect(page.getByText(/verification email/i)).toBeVisible()
  })

  test('should show validation errors for empty required fields', async ({ page }) => {
    await page.goto('/submit')

    // Try to submit without filling required fields
    await page.getByRole('button', { name: /Submit|Absenden/ }).click()

    // Verify error messages are visible
    await expect(page.getByRole('alert')).toHaveCount(3)
  })
})
```

## What to Test

### Component Props

✅ **Do test:**
- Props render correctly
- Default values work
- Required props validation
- Prop type validation (via TypeScript)

❌ **Don't test:**
- TypeScript type checking (handled by compiler)
- Framework internals

```typescript
it('renders title prop correctly', () => {
  const wrapper = mount(MyComponent, {
    props: { title: 'Test Title' }
  })
  expect(wrapper.text()).toContain('Test Title')
})

it('uses default size when not provided', () => {
  const wrapper = mount(MyComponent)
  expect(wrapper.classes()).toContain('size-md')
})
```

### Component Events

✅ **Do test:**
- Events are emitted
- Event payload is correct
- Events trigger on user interaction

```typescript
it('emits update event on button click', async () => {
  const wrapper = mount(MyComponent)
  await wrapper.find('button').trigger('click')

  expect(wrapper.emitted('update')).toBeTruthy()
  expect(wrapper.emitted('update')?.[0]).toEqual(['expected-value'])
})
```

### User Interactions

✅ **Do test:**
- Click events
- Form inputs
- Keyboard navigation
- Hover states (if critical)

```typescript
it('updates input value on user typing', async () => {
  const wrapper = mount(SearchInput)
  const input = wrapper.find('input')

  await input.setValue('test query')
  expect(wrapper.vm.query).toBe('test query')
})

it('submits form on Enter key', async () => {
  const wrapper = mount(SearchForm)
  const input = wrapper.find('input')

  await input.setValue('test')
  await input.trigger('keydown.enter')

  expect(wrapper.emitted('submit')).toBeTruthy()
})
```

### Conditional Rendering

✅ **Do test:**
- Show/hide based on props
- Loading states
- Error states
- Empty states

```typescript
it('shows loading spinner when loading', () => {
  const wrapper = mount(MyComponent, {
    props: { loading: true }
  })
  expect(wrapper.findComponent(LoadingSpinner).exists()).toBe(true)
})

it('shows content when not loading', () => {
  const wrapper = mount(MyComponent, {
    props: { loading: false }
  })
  expect(wrapper.find('.content').exists()).toBe(true)
})
```

### Composables

✅ **Do test:**
- Return values
- State changes
- Side effects
- Cleanup (timers, subscriptions)
- Error handling

```typescript
it('cleans up on unmount', () => {
  const { unmount } = mount({
    setup() {
      const { debounced } = useDebounce(vi.fn(), 300)
      return { debounced }
    },
    template: '<div />'
  })

  const timerSpy = vi.spyOn(global, 'clearTimeout')
  unmount()

  expect(timerSpy).toHaveBeenCalled()
})
```

### Stores (Pinia)

✅ **Do test:**
- State mutations
- Actions
- Getters
- Side effects

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { useLocationStore } from '@/stores/locations'

describe('Location Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds location to favorites', () => {
    const store = useLocationStore()
    store.addFavorite('location-id-123')

    expect(store.favorites).toContain('location-id-123')
  })
})
```

## E2E Testing with Playwright

### Overview

E2E tests run in a real browser against the dev server. They test critical user flows and catch integration issues that unit tests miss.

### Project Structure

Playwright is configured with **5 projects** that run in a specific order:

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN TEST CHAIN                           │
├─────────────────────────────────────────────────────────────────┤
│  1. admin-setup     → Seeds test data, creates auth session     │
│         ↓                                                       │
│  2. admin           → Runs admin tests (uses auth state)        │
│         ↓                                                       │
│  3. admin-teardown  → Cleans up test data                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     PUBLIC TEST CHAIN                           │
├─────────────────────────────────────────────────────────────────┤
│  4. global-setup    → Dismisses cookie banner, saves state      │
│         ↓                                                       │
│  5. chromium        → Runs public-facing tests                  │
└─────────────────────────────────────────────────────────────────┘
```

| Project | Purpose | Test Location |
|---------|---------|---------------|
| `admin-setup` | Seeds admin user, test location, test category; creates authenticated session | `tests/e2e/admin/admin.setup.ts` |
| `admin` | Admin panel tests (CRUD, approval workflow, etc.) | `tests/e2e/admin/specs/*.spec.ts` |
| `admin-teardown` | Cleans up test data from database | `tests/e2e/admin/admin.teardown.ts` |
| `global-setup` | Dismisses cookie consent banner for public tests | `tests/e2e/global.setup.ts` |
| `chromium` | Public-facing tests (map, filters, favorites) | `tests/e2e/*.spec.ts` |

### Directory Structure

```
tests/e2e/
├── admin/
│   ├── admin.setup.ts          # Seeds data + auth session
│   ├── admin.teardown.ts       # Cleanup
│   ├── fixtures/
│   │   ├── index.ts            # Export all fixtures
│   │   └── test-data.ts        # Test data factories
│   ├── helpers/
│   │   ├── auth.ts             # Session creation helpers
│   │   └── supabase.ts         # Direct DB access for seeding
│   ├── pages/                  # Page Object Models
│   │   ├── base.page.ts
│   │   ├── dashboard.page.ts
│   │   ├── locations-list.page.ts
│   │   ├── location-edit.page.ts
│   │   ├── categories.page.ts
│   │   └── login.page.ts
│   └── specs/                  # Test specifications
│       ├── accessibility.spec.ts
│       ├── error-handling.spec.ts
│       ├── location-approve.spec.ts
│       ├── location-edit.spec.ts
│       ├── locations-list.spec.ts
│       ├── mobile.spec.ts
│       └── session.spec.ts
├── global.setup.ts             # Cookie consent setup
├── filter.spec.ts              # Filter/search tests
└── map.spec.ts                 # Map interaction tests

tests/.auth/
├── admin.json                  # Admin auth state (generated)
└── user.json                   # Public user state (generated)
```

### Why Parallel Execution Is Disabled

**The Playwright config defaults to `workers: 1` (sequential execution).**

Parallel execution causes flaky failures because:

1. **Shared Database State** - Tests create, modify, and delete the same test records. Parallel tests cause race conditions:
   - Test A creates a location, Test B deletes it before Test A can verify
   - Multiple tests try to approve the same pending location

2. **Shared Auth State** - All admin tests reuse `tests/.auth/admin.json`. Parallel tests can interfere with session state.

3. **Sequential Dependencies** - Setup must complete before tests, tests must complete before teardown.

If you need to override for specific scenarios, use `--workers=N` flag.

### Running E2E Tests

#### Basic Commands

```bash
# Run ALL e2e tests (sequential, workers=1)
npm run test:e2e

# Run with Playwright UI (recommended for debugging)
npx playwright test --ui

# Run with visible browser
npx playwright test --headed
```

#### Running Specific Projects

```bash
# Run only admin tests
npx playwright test --project=admin

# Run only public tests
npx playwright test --project=chromium

# Run admin setup only (useful for debugging seeding)
npx playwright test --project=admin-setup

# Run full admin chain
npx playwright test --project=admin-setup --project=admin --project=admin-teardown
```

#### Running Specific Test Files

```bash
# Run a specific spec file
npx playwright test tests/e2e/admin/specs/location-edit.spec.ts

# Run tests matching a pattern
npx playwright test --grep "approve"

# Run a single test by title
npx playwright test --grep "should approve pending location"
```

#### Debugging

```bash
# Debug mode (step through tests)
npx playwright test --debug

# Show test report after run
npx playwright show-report

# Run with trace recording (for post-mortem debugging)
npx playwright test --trace on
```

### Environment Setup

E2E tests require a `.env.test` file with test admin credentials:

```bash
# Copy the example file
cp .env.test.example .env.test
```

Required variables in `.env.test`:

```env
# Test admin credentials (must exist in DEV Supabase)
TEST_ADMIN_EMAIL=e2e-admin@zerowastefrankfurt.de
TEST_ADMIN_PASSWORD=your-test-password

# Optional: Override Supabase URL for tests
# VITE_SUPABASE_URL=https://your-dev-project.supabase.co
```

**Note:** The test admin user must be manually created in Supabase DEV with the admin role. See [CLAUDE.md](../CLAUDE.md#creating-admin-users) for instructions.

### Writing New E2E Tests

#### For Admin Tests

1. Add test data factories to `tests/e2e/admin/fixtures/test-data.ts`
2. Create Page Object Models in `tests/e2e/admin/pages/`
3. Write specs in `tests/e2e/admin/specs/`

Example spec:

```typescript
import { test, expect } from '@playwright/test'
import { LocationsListPage } from '../pages/locations-list.page'

test.describe('Location Management', () => {
  let locationsPage: LocationsListPage

  test.beforeEach(async ({ page }) => {
    locationsPage = new LocationsListPage(page)
    await locationsPage.goto()
  })

  test('should filter locations by status', async () => {
    await locationsPage.filterByStatus('pending')
    await expect(locationsPage.locationRows).toHaveCount(1)
  })
})
```

#### For Public Tests

Add specs directly to `tests/e2e/`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Map Filters', () => {
  test('should filter by category', async ({ page }) => {
    await page.goto('/')

    // Use role-based selectors
    await page.getByRole('button', { name: /Filter|Filtern/i }).click()
    await page.getByRole('checkbox', { name: /Unverpackt/i }).check()

    // Verify filter applied
    await expect(page.getByRole('button', { name: /1 filter/i })).toBeVisible()
  })
})
```

### CI Configuration

Tests always run with `workers: 1` (see `playwright.config.ts`):

```typescript
// Always use 1 worker - tests share database state and auth sessions
workers: 1,
```

The GitHub Actions workflow runs:

```yaml
- name: Run E2E tests
  run: npm run test:e2e
  env:
    TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
    TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "Browser not installed" | Run `npx playwright install chromium` |
| Auth state not found | Run `--project=admin-setup` first |
| Cookie banner interfering | Check `global.setup.ts` ran successfully |
| Test data not cleaned up | Run `--project=admin-teardown` manually |
| Session expired | Delete `tests/.auth/admin.json` and re-run setup |
| Slug constraint violation | Run cleanup: `npx playwright test --project=admin-teardown` |

## Mocking Strategies

### Mocking Supabase

Create a mock Supabase client for tests:

```typescript
// tests/mocks/supabase.ts
import { vi } from 'vitest'

export const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null })
  })),
  auth: {
    signInWithOtp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn()
  }
}

// In component test
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))
```

### Mocking Vue Router

```typescript
import { mount } from '@vue/test-utils'
import { vi } from 'vitest'

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  currentRoute: { value: { params: {}, query: {} } }
}

const wrapper = mount(MyComponent, {
  global: {
    mocks: {
      $router: mockRouter,
      $route: mockRouter.currentRoute.value
    }
  }
})
```

### Mocking Vue I18n

```typescript
const mockI18n = {
  global: {
    mocks: {
      $t: (key: string) => key, // Returns translation key
      $tc: (key: string, count: number) => `${key}_${count}`,
      $te: () => true
    }
  }
}

const wrapper = mount(MyComponent, mockI18n)
```

### Mocking External APIs

```typescript
import { vi } from 'vitest'

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'mock data' })
  })
) as any

// Or use MSW (Mock Service Worker) for more complex scenarios
```

### Mocking Leaflet

```typescript
vi.mock('leaflet', () => ({
  map: vi.fn(() => ({
    setView: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn()
  })),
  marker: vi.fn(() => ({
    addTo: vi.fn(),
    bindPopup: vi.fn()
  })),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn()
  }))
}))
```

## Writing Good Tests

### Test Structure

Follow the **AAA pattern** (Arrange, Act, Assert):

```typescript
it('does something', async () => {
  // Arrange: Set up test data and mount component
  const wrapper = mount(MyComponent, {
    props: { value: 'initial' }
  })

  // Act: Perform action
  await wrapper.find('button').trigger('click')

  // Assert: Verify outcome
  expect(wrapper.emitted('update')).toBeTruthy()
})
```

### Descriptive Test Names

✅ Good:
```typescript
it('shows error message when email is invalid')
it('emits update event with correct payload on submit')
it('disables submit button when form is invalid')
```

❌ Bad:
```typescript
it('works')
it('test email')
it('button test')
```

### One Assertion Per Concept

✅ Good:
```typescript
it('renders all contact methods', () => {
  const wrapper = mount(ContactInfo, { props: { ... } })
  expect(wrapper.findAll('.contact-item')).toHaveLength(4)
})

it('makes contact items clickable', () => {
  const wrapper = mount(ContactInfo, { props: { ... } })
  expect(wrapper.find('.contact-item').classes()).toContain('interactive')
})
```

❌ Bad:
```typescript
it('renders contact info correctly', () => {
  const wrapper = mount(ContactInfo, { props: { ... } })
  expect(wrapper.findAll('.contact-item')).toHaveLength(4)
  expect(wrapper.find('.contact-item').classes()).toContain('interactive')
  expect(wrapper.text()).toContain('example.com')
  // Too many unrelated assertions
})
```

### Setup and Teardown

```typescript
import { describe, it, beforeEach, afterEach, vi } from 'vitest'

describe('MyComponent', () => {
  beforeEach(() => {
    // Set up before each test
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks()
    vi.clearAllTimers()
  })

  it('test case', () => {
    // Test implementation
  })
})
```

### Async Testing

```typescript
// Use async/await for asynchronous operations
it('fetches data on mount', async () => {
  const wrapper = mount(MyComponent)

  // Wait for component to update after async operation
  await wrapper.vm.$nextTick()

  expect(wrapper.text()).toContain('Loaded data')
})

// Or use promises
it('handles API errors', () => {
  const wrapper = mount(MyComponent)

  return wrapper.vm.fetchData().catch((error) => {
    expect(error.message).toBe('API Error')
  })
})
```

## Running Tests

### Local Development

```bash
# Run all component/unit tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Run specific test file
npm test ContactInfo.test.ts

# Run tests matching pattern
npm test -- --grep "ContactInfo"

# Run with coverage
npm test -- --coverage

# E2E tests (see "E2E Testing with Playwright" section for details)
npm run test:e2e

# E2E admin tests only
npx playwright test --project=admin

# E2E tests with UI
npx playwright test --ui

# Type checking
npm run type-check
```

### Debugging Tests

```typescript
// Add .only to run a single test
it.only('focuses on this test', () => {
  // This is the only test that will run
})

// Skip a test
it.skip('skips this test', () => {
  // This test will be skipped
})

// Use console.log in tests
it('debugs with console', () => {
  const wrapper = mount(MyComponent)
  console.log(wrapper.html()) // Print component HTML
  console.log(wrapper.vm) // Print component instance
})
```

### Vitest UI

```bash
# Run tests with interactive UI
npx vitest --ui
```

Opens a browser interface for running and debugging tests.

## CI Integration

### GitHub Actions Workflow

Tests run automatically on every push and pull request:

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Run unit tests
        run: npm test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Build
        run: npm run build
```

### Pre-commit Hooks

Set up with Husky (optional):

```bash
# Install Husky
npm install --save-dev husky

# Initialize
npx husky init

# Add pre-commit hook
echo "npm test" > .husky/pre-commit
```

## Test Coverage Goals

### Current Coverage

- **Component tests:** 300+ tests
- **E2E tests:** ~10 critical flows

### Coverage Targets

| Category | Target | Current |
|----------|--------|---------|
| Components (common/) | 100% | ~90% |
| Composables | 100% | ~80% |
| Views | 80% | ~70% |
| Utilities | 100% | ~90% |
| Overall | 80% | ~75% |

### Measuring Coverage

```bash
# Generate coverage report
npm test -- --coverage

# View HTML report
open coverage/index.html
```

### Coverage Requirements

**Must have tests:**
- All components in `components/common/`
- All composables
- All utility functions
- All Pinia stores

**Should have tests:**
- All views
- All admin components
- Critical user flows (E2E)

**Nice to have:**
- Edge cases
- Error scenarios
- Accessibility tests

## Best Practices Summary

1. **Write tests first** - Follow TDD when possible
2. **Test behavior, not implementation** - Don't test private methods
3. **Keep tests simple** - One concept per test
4. **Use descriptive names** - Tests are documentation
5. **Mock external dependencies** - Keep tests isolated
6. **Clean up after tests** - Avoid side effects
7. **Run tests before committing** - Catch issues early
8. **Maintain high coverage** - Aim for 80%+
9. **Test edge cases** - Empty states, errors, boundaries
10. **Keep tests fast** - Use mocks, avoid real API calls

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles/)

## Questions?

If you have questions about testing:

1. Check this document
2. Look at existing tests for examples
3. Review the [CONTRIBUTING.md](../CONTRIBUTING.md) guide
4. Ask in pull request comments
