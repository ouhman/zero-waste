# Plan: Fix All TypeScript Errors (188 total)

**Status:** ✅ Complete (2026-01-31)

## Overview

The codebase has 188 TypeScript errors caused by:
1. Missing centralized type exports (`src/types/index.ts`)
2. Inconsistent Location type definitions across files
3. Test mocks missing new database fields
4. Unused imports and implicit any types

## Phase 1: Create Type Infrastructure

### 1.1 Create `src/types/index.ts`
Re-export all types from individual files for centralized imports.

```typescript
export * from './database'
export * from './osm'
export * from './hours'
export * from './marker'
export * from './analytics'
export * from './consent'
export * from './enrichment'
```

### 1.2 Update `tests/utils/test-helpers.ts`
Add missing fields to mock factories:
- Add `suburb` to location mocks
- Add `always_open`, `icon_name`, `marker_size` to category mocks

**Files:**
- `src/types/index.ts` (create)
- `tests/utils/test-helpers.ts`

---

## Phase 2: Fix Source File Errors (14 errors)

### 2.1 `src/stores/admin.ts` (5 errors)
- Fix import: `@/types` → `@/types/hours`
- Fix Supabase query type assertions for `.update()` calls

### 2.2 `src/composables/useNominatim.ts` (1 error)
- Import or define `OpeningHoursEntry` type

### 2.3 `src/components/LocationForm.vue` (1 error)
- Fix function call with wrong number of arguments

### 2.4 `src/components/SearchBar.vue` (1 error)
- Fix type mismatch in useDebounce call

### 2.5 `src/components/admin/HoursSuggestionsList.vue` (1 error)
- Add type annotation for `s` parameter

### 2.6 `src/components/submission/VideoPlayer.vue` (1 error)
- Remove unused `watch` import

### 2.7 `src/views/MapView.vue` (1 error)
- Fix Location type mismatch (suburb field)

### 2.8 `src/views/admin/LocationsListView.vue` (1 error)
- Fix `.value` access on non-ref

### 2.9 `src/views/admin/PendingView.vue` (1 error)
- Fix `location_categories` type compatibility

**Files:**
- `src/stores/admin.ts`
- `src/composables/useNominatim.ts`
- `src/components/LocationForm.vue`
- `src/components/SearchBar.vue`
- `src/components/admin/HoursSuggestionsList.vue`
- `src/components/submission/VideoPlayer.vue`
- `src/views/MapView.vue`
- `src/views/admin/LocationsListView.vue`
- `src/views/admin/PendingView.vue`

---

## Phase 3: Fix Test File Errors (~174 errors)

### 3.1 Update Test Helpers
- Update `createMockLocation()` to include `suburb`
- Update `createMockCategory()` to include `always_open`, `icon_name`, `marker_size`
- Ensure PaymentMethods type compatibility

### 3.2 Fix Admin Tests
**Files with `.value` access issues:**
- `tests/component/ModerationQueue.test.ts`
- `tests/component/views/AdminDashboardView.test.ts`

### 3.3 Fix MapView Tests
**Files:** `tests/component/views/MapView.test.ts`
- Fix Location type mismatches
- Fix component internal access (use proper test patterns)

### 3.4 Fix Component Tests with Mock Data Issues
- `tests/component/AdminLogin.test.ts` - Fix boolean vs null types
- `tests/component/admin/PendingLocationPreviewPanel.test.ts` - Add missing category fields
- `tests/component/map/MapContainer.test.ts` - Add missing category fields
- `tests/component/common/HoursSuggestionModal.spec.ts` - Add missing prop

### 3.5 Remove Unused Imports/Variables
Multiple test files have unused imports (vi, h, beforeEach, etc.)

**Files:**
- `tests/component/common/DynamicMarker.spec.ts`
- `tests/component/common/EmptyState.test.ts`
- `tests/component/common/ErrorBoundary.test.ts`
- `tests/component/common/ToastContainer.test.ts`
- `tests/component/composables/useGeolocation.spec.ts`
- `tests/component/composables/useOverpass.spec.ts`
- `tests/component/map/MapContainer.test.ts`
- `tests/component/submission/NearbyPOISelector.spec.ts`
- `tests/component/admin/IconSelector.spec.ts`

### 3.6 Fix Unit Test Type Issues
- `tests/unit/types.test.ts` - Add missing fields to mocks
- `tests/unit/stores/admin.test.ts` - Fix mock types
- `tests/unit/stores/categories.test.ts` - Add missing category fields
- `tests/unit/types/hours.test.ts` - Add missing fields
- `tests/utils/test-helpers.ts` - Fix vi import and suburb type

---

## Execution Order

1. **Phase 1** - Type infrastructure (unblocks many other fixes)
2. **Phase 2** - Source files (critical for app)
3. **Phase 3** - Test files (can be done incrementally)

## Estimated Scope

| Phase | Files | Errors |
|-------|-------|--------|
| Phase 1 | 2 | ~10 |
| Phase 2 | 9 | 14 |
| Phase 3 | ~25 | ~174 |
| **Total** | **~36** | **188** |

## Verification

After each phase, run:
```bash
npm run type-check
```

Final verification:
```bash
npm run test
npm run build
```
