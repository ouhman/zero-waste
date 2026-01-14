# Phase 3 Completion Checklist - Data Migration

Use this checklist to verify Phase 3 (Data Migration) is complete.

## Pre-Migration Checks

- [x] DEV project linked: `lccpndhssuemudzpfvvg`
- [x] PROD project created: `rivleprddnvqgigxjyuc`
- [x] PROD migrations applied (from Phase 2)
- [x] PROD Edge Functions deployed (from Phase 2)

## Data Export

- [x] Full database dump created from DEV
- [x] Approved locations filtered (362 from 371 total)
- [x] Categories extracted (18 total)
- [x] Location-category relationships filtered (429 total)
- [x] Pending submissions excluded (as planned)
- [x] Auth users excluded (manual creation required)

## Data Import

- [x] PROD project cleared of test data
- [x] Categories imported (18 rows)
- [x] Locations imported (362 rows)
- [x] Location-categories imported (429 rows)
- [x] Import completed without errors

## Data Verification

- [x] Count comparison: DEV approved = PROD total
  - [x] Categories: 18 = 18 ✅
  - [x] Locations: 362 = 362 ✅
  - [x] Location-categories: 429 = 429 ✅
- [x] Sample location data matches
- [x] All PROD locations have status='approved'
- [x] Category slugs match between DEV and PROD
- [x] No duplicate records in PROD
- [x] Foreign key relationships preserved

## Documentation

- [x] Admin user creation guide (`docs/admin-user-setup.md`)
- [x] Phase 3 summary document created
- [x] Migration scripts documented
- [x] Verification process documented

## Admin User Setup (Manual - TODO)

- [ ] Admin user created in PROD Supabase Dashboard
- [ ] Admin role set via SQL query
- [ ] Admin login tested at production URL
- [ ] Admin can access `/admin/locations`
- [ ] Admin can access `/admin/categories`

## Scripts Created

- [x] `scripts/filter-approved-locations.py` - Filter export data
- [x] `scripts/import-to-prod.ts` - Import to PROD
- [x] `scripts/check-prod-data.ts` - Verify PROD counts
- [x] `scripts/check-dev-data.ts` - Verify DEV counts
- [x] `scripts/clear-prod-data.ts` - Clear PROD data
- [x] `scripts/verify-data-integrity.ts` - Compare DEV vs PROD

## Data Migration Files

- [x] `migration-export/dev-data.sql` - Full DEV dump
- [x] `migration-export/prod-data.sql` - Filtered PROD data

## Phase 3 Deliverables

- [x] Data exported from DEV ✅
- [x] Data imported to PROD ✅
- [x] Data counts verified and match ✅
- [x] Admin user creation steps documented ✅

## Cleanup (Optional)

- [ ] Remove sensitive keys from scripts (if any were hardcoded)
- [ ] Add `migration-export/` to `.gitignore`
- [ ] Clear bash history if credentials were typed

## Ready for Phase 4?

If all items above are checked (except manual admin user creation), you're ready to proceed to **Phase 4: Environment Configuration**.

---

**Phase 3 Status:** ✅ COMPLETE

**Confidence Rating:** HIGH

**Blocker Items:** None

**Manual Steps Remaining:**
1. Create admin user in PROD (see `docs/admin-user-setup.md`)

## Quick Commands for Verification

```bash
# Check PROD data
export PROD_SUPABASE_URL="https://rivleprddnvqgigxjyuc.supabase.co"
export PROD_SUPABASE_SERVICE_KEY="<your-key>"
npx tsx scripts/check-prod-data.ts

# Verify data integrity
export DEV_SUPABASE_SERVICE_KEY="<dev-key>"
npx tsx scripts/verify-data-integrity.ts

# Re-import if needed
npx tsx scripts/clear-prod-data.ts
npx tsx scripts/import-to-prod.ts
```
