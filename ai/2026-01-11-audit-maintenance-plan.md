# Zero Waste Frankfurt - Audit Maintenance Plan

**Created:** 2026-01-11
**Based on:** ai/2026-01-11-audit.md
**Approach:** Balanced (security + stability + quality interleaved)

---

## Overview

This plan addresses all findings from the comprehensive audit. Each phase is designed to complete within 150k tokens context window with clear, atomic deliverables.

**Total Phases:** 11
**Estimated Effort:** ~40-50 hours of AI-assisted development

---

## Phase 1: Critical Memory Leaks & Cleanup

**Subagent:** `frontend-builder`
**Priority:** Critical
**Scope:** Fix memory leaks that can cause performance degradation

### Tasks

1. **Fix useFavorites watch accumulation** (`src/composables/useFavorites.ts`)
   - Move `watch()` outside the composable function to prevent accumulation
   - Use `watchEffect` with proper cleanup or move to store-level reactivity
   - Test that favorites sync properly without memory leaks

2. **Add debounce cleanup to useNominatim** (`src/composables/useNominatim.ts`)
   - Add `onUnmounted` hook to clear pending debounce timers
   - Create cleanup function that clears all timeouts
   - Ensure no dangling timers after component unmount

3. **Add debounce cleanup to useSearch** (`src/composables/useSearch.ts`)
   - Same pattern as useNominatim
   - Add timeout reference tracking
   - Clean up on unmount

### Acceptance Criteria

- [ ] No watch accumulation in useFavorites (verify with Vue DevTools)
- [ ] All debounce timers cleaned up on component unmount
- [ ] Existing tests pass
- [ ] No console warnings about memory leaks

### Files Modified

- `src/composables/useFavorites.ts`
- `src/composables/useNominatim.ts`
- `src/composables/useSearch.ts`

---

## Phase 2: Duplicate Code Consolidation

**Subagent:** `frontend-builder`
**Priority:** High
**Scope:** Remove duplicate components and composables, establish single sources of truth

### Tasks

1. **Consolidate ErrorBoundary components**
   - Keep `src/components/common/ErrorBoundary.vue` as the single source
   - Delete `src/components/ErrorBoundary.vue`
   - Update all imports to use the common version
   - Verify error boundary works on all routes

2. **Remove duplicate Toast.vue**
   - Keep `src/components/common/ToastContainer.vue` as the toast system
   - Delete `src/components/Toast.vue` if it exists and is unused
   - Verify toast notifications work throughout the app

3. **Remove useAdmin.ts composable**
   - Verify `src/stores/admin.ts` (useAdminStore) provides all needed functionality
   - Delete `src/composables/useAdmin.ts`
   - Update any components still using useAdmin to use useAdminStore
   - Ensure admin functionality works correctly

### Acceptance Criteria

- [ ] Single ErrorBoundary component in `common/`
- [ ] Single toast system (ToastContainer)
- [ ] No useAdmin.ts composable (only useAdminStore)
- [ ] All admin views function correctly
- [ ] No broken imports

### Files Modified

- Delete: `src/components/ErrorBoundary.vue`
- Delete: `src/components/Toast.vue` (if exists)
- Delete: `src/composables/useAdmin.ts`
- Update imports in affected components

---

## Phase 3: Security Hardening (Edge Functions)

**Subagent:** `backend-builder`
**Priority:** High
**Scope:** Fix security vulnerabilities in Supabase Edge Functions

### Tasks

1. **Add coordinate validation in verify-submission**
   - Validate latitude is between -90 and 90
   - Validate longitude is between -180 and 180
   - Return 400 error with clear message for invalid coordinates
   - Add validation before database insertion

2. **Add category UUID validation**
   - Validate all category_ids are valid UUID v4 format
   - Verify categories exist in database before association
   - Return 400 error with list of invalid IDs

3. **Verify rate limiting integration**
   - Check if `check_rate_limit()` is called during login flow
   - If not integrated, add rate limit check to auth flow
   - Document the rate limiting behavior

4. **Restrict CORS to known origins**
   - Replace wildcard CORS (`*`) with specific allowed origins
   - Allow: `https://map.zerowastefrankfurt.de`, `http://localhost:*` (dev)
   - Test that production and development both work

### Acceptance Criteria

- [ ] Invalid coordinates rejected with 400 error
- [ ] Invalid category UUIDs rejected
- [ ] Rate limiting verified in auth flow
- [ ] CORS restricted to known origins
- [ ] All edge functions deploy successfully

### Files Modified

- `supabase/functions/verify-submission/index.ts`
- `supabase/functions/submit-location/index.ts`
- Possibly auth-related edge functions

---

## Phase 4: Type Safety Improvements

**Subagent:** `frontend-builder`
**Priority:** High
**Scope:** Remove `as any` casts and define proper types

### Tasks

1. **Define payment_methods type**
   - Create `PaymentMethods` interface in `src/types/`
   - Include: cash, cards, contactless, etc.
   - Use in SubmissionData and Location types

2. **Define opening_hours_structured type**
   - Create `StructuredOpeningHours` interface
   - Define day-based structure with open/close times
   - Use in SubmissionData and Location types

3. **Remove `as any` casts from useAdmin.ts**
   - Replace with proper Supabase Database types
   - Use `Tables<'locations'>` pattern
   - Fix lines 54, 84, 113

4. **Remove `as any` casts from stores**
   - Fix useAdminStore (lines 75, 91)
   - Fix useCategoriesStore (line 110)
   - Fix useLocationsStore (location interface)

5. **Fix useSubmission.ts types**
   - Replace `any` in SubmissionData
   - Use proper Database types for API calls

### Acceptance Criteria

- [ ] Zero `as any` casts in codebase
- [ ] PaymentMethods type defined and used
- [ ] StructuredOpeningHours type defined and used
- [ ] `npm run type-check` passes with no errors
- [ ] All existing tests pass

### Files Modified

- `src/types/database.ts` (or new types file)
- `src/composables/useAdmin.ts`
- `src/composables/useSubmission.ts`
- `src/stores/admin.ts`
- `src/stores/categories.ts`
- `src/stores/locations.ts`

---

## Phase 5: Extract Shared Utilities

**Subagent:** `frontend-builder`
**Priority:** Medium
**Scope:** Create reusable utility composables

### Tasks

1. **Create useDebounce composable**
   - Create `src/composables/useDebounce.ts`
   - Support configurable delay
   - Auto-cleanup on unmount
   - Return debounced function and cancel method

2. **Refactor useNominatim to use useDebounce**
   - Replace manual setTimeout/clearTimeout
   - Use new composable
   - Verify geocoding still works correctly

3. **Refactor useSearch to use useDebounce**
   - Replace manual debounce implementation
   - Use new composable
   - Verify search functionality

4. **Refactor useAuth debounce (if applicable)**
   - Check for any debounce patterns
   - Migrate to useDebounce if found

5. **Add unit tests for useDebounce**
   - Test debounce timing
   - Test cancel functionality
   - Test cleanup on unmount

### Acceptance Criteria

- [ ] `useDebounce` composable created with tests
- [ ] All manual debounce code replaced
- [ ] No duplicate debounce implementations
- [ ] All composables using debounce work correctly
- [ ] Tests pass

### Files Modified

- Create: `src/composables/useDebounce.ts`
- Create: `tests/unit/composables/useDebounce.test.ts`
- Update: `src/composables/useNominatim.ts`
- Update: `src/composables/useSearch.ts`
- Update: `src/composables/useAuth.ts` (if needed)

---

## Phase 6: Extract Shared Components

**Subagent:** `frontend-builder`
**Priority:** Medium
**Scope:** Extract repeated UI patterns into reusable components

### Tasks

1. **Create ContactInfo component**
   - Extract contact info rendering from LocationDetailPanel, LocationPreview
   - Props: phone, website, email, instagram, opening_hours
   - Support different display sizes (compact, full)
   - Include icons and proper linking

2. **Create PaymentMethodsBadges component**
   - Extract payment method display from MapContainer, LocationDetailPanel, LocationPreview
   - Props: paymentMethods object
   - Display as badge/pill format
   - Support theming (light/dark backgrounds)

3. **Create PopupCard component for MapContainer**
   - Extract CSS-in-JS HTML strings from MapContainer
   - Create proper Vue component for map popups
   - Use Leaflet's `.bindPopup()` with Vue component

4. **Update all consumers**
   - Replace duplicated code with new components
   - Verify styling is consistent
   - Ensure i18n works correctly

### Acceptance Criteria

- [ ] ContactInfo component created and tested
- [ ] PaymentMethodsBadges component created
- [ ] PopupCard component for MapContainer
- [ ] No duplicate contact/payment rendering code
- [ ] Consistent styling across all usages

### Files Modified

- Create: `src/components/common/ContactInfo.vue`
- Create: `src/components/common/PaymentMethodsBadges.vue`
- Create: `src/components/map/PopupCard.vue`
- Update: `src/components/map/MapContainer.vue`
- Update: `src/components/LocationDetailPanel.vue`
- Update: `src/components/LocationPreview.vue`

---

## Phase 7: Performance Improvements

**Subagent:** `frontend-builder`
**Priority:** Medium
**Scope:** Fix race conditions and add caching

### Tasks

1. **Add AbortController to LocationForm**
   - Create AbortController for enrichment requests
   - Cancel pending requests when URL changes rapidly
   - Cancel all requests on component unmount
   - Add loading state management

2. **Add caching to useAdminStore**
   - Add `hasFetched` flag pattern (like locations store)
   - Add `force` refresh option for explicit refetch
   - Cache data for configurable TTL
   - Prevent unnecessary refetches

3. **Implement request deduplication in useSearch**
   - Track in-flight requests by search term
   - Return existing promise for duplicate requests
   - Clear tracking when requests complete

4. **Add optimistic updates to admin store**
   - Update local state immediately on mutation
   - Rollback on server error
   - Reduce perceived latency

### Acceptance Criteria

- [ ] No race conditions in LocationForm enrichment
- [ ] Admin store caches data properly
- [ ] Search requests are deduplicated
- [ ] Optimistic updates work for approve/reject
- [ ] All existing functionality preserved

### Files Modified

- `src/components/LocationForm.vue`
- `src/stores/admin.ts`
- `src/composables/useSearch.ts`

---

## Phase 8: Component Testing - Admin

**Subagent:** `frontend-builder`
**Priority:** Medium
**Scope:** Add comprehensive tests for admin components

### Tasks

1. **Create test utilities**
   - Create `tests/utils/test-helpers.ts`
   - Add component mounting helpers with Pinia/Router
   - Add mock factories for locations, categories
   - Add Supabase mock utilities

2. **Test AdminLayout.vue**
   - Test sidebar navigation
   - Test active route highlighting
   - Test logout functionality
   - Test responsive behavior

3. **Test LocationEditForm.vue**
   - Test form field rendering
   - Test validation
   - Test submit behavior
   - Test OSM enrichment integration

4. **Test CategoryEditModal.vue**
   - Test create mode vs edit mode
   - Test form validation
   - Test icon upload
   - Test cancel/save behaviors

5. **Test PendingLocationPreviewPanel.vue**
   - Test location data display
   - Test approve/reject buttons
   - Test loading states

### Acceptance Criteria

- [ ] Test utilities created
- [ ] AdminLayout tests with 80%+ coverage
- [ ] LocationEditForm tests with 80%+ coverage
- [ ] CategoryEditModal tests with 80%+ coverage
- [ ] PendingLocationPreviewPanel tests
- [ ] All tests pass

### Files Created

- `tests/utils/test-helpers.ts`
- `tests/component/admin/AdminLayout.test.ts`
- `tests/component/admin/LocationEditForm.test.ts`
- `tests/component/admin/CategoryEditModal.test.ts`
- `tests/component/admin/PendingLocationPreviewPanel.test.ts`

---

## Phase 9: Component Testing - Common & Map

**Subagent:** `frontend-builder`
**Priority:** Medium
**Scope:** Add tests for common components and map functionality

### Tasks

1. **Test ToastContainer.vue**
   - Test toast display
   - Test auto-dismiss timing
   - Test multiple toasts
   - Test different toast types (success, error, warning)

2. **Test ErrorBoundary.vue**
   - Test error catching
   - Test error display
   - Test retry functionality
   - Test nested error handling

3. **Test MapContainer.vue (integration)**
   - Test map initialization
   - Test marker rendering
   - Test popup interactions
   - Test cluster behavior
   - Mock Leaflet appropriately

4. **Test LoadingSpinner.vue**
   - Test size variants
   - Test accessibility

5. **Test EmptyState.vue**
   - Test prop variations
   - Test slot content

### Acceptance Criteria

- [ ] ToastContainer tests complete
- [ ] ErrorBoundary tests complete
- [ ] MapContainer integration tests
- [ ] All common components tested
- [ ] 80%+ component coverage overall

### Files Created

- `tests/component/common/ToastContainer.test.ts`
- `tests/component/common/ErrorBoundary.test.ts`
- `tests/component/common/LoadingSpinner.test.ts`
- `tests/component/common/EmptyState.test.ts`
- `tests/component/map/MapContainer.test.ts`

---

## Phase 10: View-Level Testing

**Subagent:** `frontend-builder`
**Priority:** Medium
**Scope:** Add tests for main views

### Tasks

1. **Test MapView.vue**
   - Test initial load
   - Test location filtering
   - Test search integration
   - Test URL slug navigation

2. **Test SubmitView.vue**
   - Test form display
   - Test multi-step flow
   - Test submission process
   - Test success/error states

3. **Test AdminDashboardView.vue**
   - Test stats display
   - Test recent submissions list
   - Test navigation to details

4. **Test VerifyView.vue**
   - Test token validation
   - Test success/error display
   - Test redirect behavior

### Acceptance Criteria

- [ ] MapView tests complete
- [ ] SubmitView tests complete
- [ ] AdminDashboardView tests complete
- [ ] VerifyView tests complete
- [ ] View coverage at 80%+

### Files Created

- `tests/component/views/MapView.test.ts`
- `tests/component/views/SubmitView.test.ts`
- `tests/component/views/AdminDashboardView.test.ts`
- `tests/component/views/VerifyView.test.ts`

---

## Phase 11: Documentation Updates

**Subagent:** `general-purpose`
**Priority:** Low
**Scope:** Update project documentation

### Tasks

1. **Update README.md**
   - Update project status to Phase 5
   - Fix test count claims
   - Update "Next Steps" section
   - Add badges (build, tests, coverage)

2. **Update CLAUDE.md**
   - Clarify slug generation status
   - Update any outdated information
   - Add any new commands or conventions

3. **Create CONTRIBUTING.md**
   - Code style guidelines
   - PR process
   - Testing requirements
   - Commit message format (conventional commits)

4. **Create Testing Strategy document**
   - Test organization (unit, component, e2e)
   - What to test at each level
   - Mocking strategies
   - CI integration

5. **Create Component Documentation**
   - Document all shared components in `common/`
   - Props, events, slots
   - Usage examples

### Acceptance Criteria

- [ ] README.md is accurate and current
- [ ] CLAUDE.md is up to date
- [ ] CONTRIBUTING.md created
- [ ] Testing Strategy document created
- [ ] Component documentation complete

### Files Modified/Created

- Update: `README.md`
- Update: `CLAUDE.md`
- Create: `CONTRIBUTING.md`
- Create: `docs/testing-strategy.md`
- Create: `docs/components.md`

---

## Execution Notes

### How to Execute

Use the global `/execute-plan` command:

```bash
/execute-plan ai/2026-01-11-audit-maintenance-plan.md
```

### Phase Dependencies

```
Phase 1 (Memory Leaks)
    ↓
Phase 2 (Consolidation) ──→ Phase 3 (Security) [parallel possible]
    ↓
Phase 4 (Type Safety)
    ↓
Phase 5 (Utilities) ──→ Phase 6 (Components) [sequential]
    ↓
Phase 7 (Performance)
    ↓
Phase 8 (Admin Tests) ──→ Phase 9 (Common Tests) ──→ Phase 10 (View Tests)
    ↓
Phase 11 (Documentation)
```

### Success Metrics

After completing all phases:

| Metric | Before | Target |
|--------|--------|--------|
| `as any` casts | 8+ | 0 |
| Duplicate components | 3 | 0 |
| Memory leaks | 3 | 0 |
| Component test coverage | 13% | 80% |
| Security vulnerabilities | 4 | 0 |

### Rollback Strategy

Each phase creates atomic changes. If a phase fails:

1. `git stash` or `git checkout .` to revert changes
2. Review failure reason
3. Fix and re-run phase

---

## Appendix: Files Inventory

### Files to Delete

- `src/components/ErrorBoundary.vue`
- `src/components/Toast.vue` (if exists)
- `src/composables/useAdmin.ts`

### Files to Create

- `src/composables/useDebounce.ts`
- `src/components/common/ContactInfo.vue`
- `src/components/common/PaymentMethodsBadges.vue`
- `src/components/map/PopupCard.vue`
- `tests/utils/test-helpers.ts`
- `tests/component/admin/*.test.ts` (4 files)
- `tests/component/common/*.test.ts` (4 files)
- `tests/component/map/MapContainer.test.ts`
- `tests/component/views/*.test.ts` (4 files)
- `CONTRIBUTING.md`
- `docs/testing-strategy.md`
- `docs/components.md`

### Major Files Modified

- `src/composables/useFavorites.ts`
- `src/composables/useNominatim.ts`
- `src/composables/useSearch.ts`
- `src/composables/useSubmission.ts`
- `src/stores/admin.ts`
- `src/stores/categories.ts`
- `src/stores/locations.ts`
- `src/components/LocationForm.vue`
- `src/components/map/MapContainer.vue`
- `supabase/functions/verify-submission/index.ts`
- `supabase/functions/submit-location/index.ts`
