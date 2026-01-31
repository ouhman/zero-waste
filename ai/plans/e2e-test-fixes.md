# Plan: Fix E2E Test Failures

**Status:** 🔄 Pending

## Overview

39 e2e tests failing, 8 passing. Issues are pre-existing, unrelated to recent TypeScript fixes.

## Failure Categories

### 1. Auth Redirect Issues (3 tests)
**Pattern:** Tests expect redirect to `/bulk-station/login` but stay on `/bulk-station`

**Files:**
- `tests/e2e/admin/smoke.spec.ts:22` - "without auth - redirects to login"
- `tests/e2e/admin/specs/error-handling.spec.ts:86` - "redirects unauthenticated users"
- `tests/e2e/admin.spec.ts:3` - "shows login page for unauthenticated"

**Root cause:** Auth guard may not be redirecting properly, or test timing issue.

**Fix approach:** Check `src/router/index.ts` auth guards, add explicit wait for navigation.

---

### 2. Admin UI Elements Not Found (15+ tests)
**Pattern:** `getByRole('button', { name: /Add|Hinzufügen|Create/i })` times out

**Files:**
- `tests/e2e/admin/specs/accessibility.spec.ts` (7 tests)
- `tests/e2e/admin/specs/categories-list.spec.ts`
- `tests/e2e/admin/specs/categories.spec.ts`
- `tests/e2e/admin/specs/location-edit.spec.ts`
- `tests/e2e/admin/specs/locations-list.spec.ts`

**Root cause:** Button text/role changed, or page not fully loaded.

**Fix approach:**
1. Check actual button text in admin UI
2. Update selectors to match current UI
3. Add `waitForLoadState('networkidle')` before interactions

---

### 3. Session/Auth State Tests (3 tests)
**Files:**
- `tests/e2e/admin/specs/session.spec.ts` (all 3 tests)

**Root cause:** Session injection via storage state may not be working.

**Fix approach:** Verify `tests/.auth/admin.json` is valid and being used.

---

### 4. Map/Marker Tests (3 tests)
**Pattern:** `.leaflet-marker-icon` not found or popup not opening

**Files:**
- `tests/e2e/map.spec.ts` (3 tests)

**Root cause:** Markers load async, tests don't wait long enough.

**Fix approach:** Wait for markers: `await page.waitForSelector('.leaflet-marker-icon')`

---

### 5. Favorites Tests (3 tests)
**Files:**
- `tests/e2e/favorites.spec.ts` (3 tests)

**Root cause:** Depends on markers being loaded first.

**Fix approach:** Same as map tests - wait for markers before interaction.

---

### 6. Filter Tests (3 tests)
**Files:**
- `tests/e2e/filter.spec.ts` (3 tests)

**Root cause:** Category buttons or search results not found.

**Fix approach:** Check selectors match current filter UI.

---

### 7. Mobile Tests (3 tests)
**Files:**
- `tests/e2e/admin/specs/mobile.spec.ts` (3 tests)

**Root cause:** Mobile navigation elements not found.

**Fix approach:** Check mobile menu selector, may need `data-testid`.

---

## Recommended Execution Order

1. **Fix auth redirect** (unblocks many admin tests)
2. **Update admin button selectors** (fixes accessibility + CRUD tests)
3. **Add marker wait helpers** (fixes map/favorites/filter tests)
4. **Fix mobile selectors** (lower priority)

## Quick Wins

Add to `tests/e2e/admin/helpers/`:
```typescript
// Wait for admin page to be fully loaded
export async function waitForAdminPage(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('[data-testid="admin-layout"]', { timeout: 10000 })
}

// Wait for markers on map
export async function waitForMarkers(page: Page) {
  await page.waitForSelector('.leaflet-marker-icon', { timeout: 15000 })
}
```

## Verification

```bash
npm run test:e2e -- --grep "admin"  # Test admin fixes
npm run test:e2e -- --grep "map"    # Test map fixes
npm run test:e2e                    # Full suite
```
