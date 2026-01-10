# Slug Generation V2 - Implementation Plan

## Overview

Replace random-suffix slugs with SEO-friendly, human-readable slugs using integer increment for collisions.

**Pattern:** `{name}-{city}-{suburb}` or `{name}-{city}-{suburb}-{n}` on collision

**Example:**
- `repair-cafe-frankfurt-am-main-bockenheim`
- `repair-cafe-frankfurt-am-main-bockenheim-2` (if collision)

**SEO rationale:** City before suburb because city has higher search volume and Google weights earlier keywords more heavily.

---

## Phase 1: PostgreSQL Slug Infrastructure (~30k tokens)

### Goal
Create database-level slug generation with atomic collision handling.

### Tasks

1. **Create `slugify` SQL function**
   - Handle German characters (ä→ae, ö→oe, ü→ue, ß→ss)
   - Normalize Unicode, remove diacritics
   - Replace non-alphanumeric with hyphens
   - Trim leading/trailing hyphens

2. **Create `generate_unique_slug` SQL function**
   - Input: `name`, `suburb`, `city`
   - Deduplicate if name already contains suburb/city
   - Check for existing slugs, increment if needed
   - Return unique slug atomically

3. **Add `suburb` column to locations table**
   - Migration to add nullable `suburb TEXT` column
   - Will be populated from Nominatim data

4. **Write SQL tests** (pgTAP or manual verification script)
   - Test German character handling
   - Test collision incrementing
   - Test deduplication logic

### Files to Create/Modify
- `supabase/migrations/YYYYMMDD_slugify_function.sql`
- `supabase/migrations/YYYYMMDD_generate_unique_slug.sql`
- `supabase/migrations/YYYYMMDD_add_suburb_column.sql`
- `scripts/test-slug-functions.sql`

### Success Criteria
```sql
SELECT generate_unique_slug('Repair Café', 'Bockenheim', 'Frankfurt am Main');
-- Returns: 'repair-cafe-bockenheim-frankfurt-am-main'

-- Insert a location with that slug, then:
SELECT generate_unique_slug('Repair Café', 'Bockenheim', 'Frankfurt am Main');
-- Returns: 'repair-cafe-bockenheim-frankfurt-am-main-2'
```

---

## Phase 2: Nominatim Suburb Extraction (~25k tokens)

### Goal
Extract and store suburb data from Nominatim for all locations.

### Tasks

1. **Update `useNominatim.ts`**
   - Extract `address.suburb` from Nominatim response
   - Add to return type and extraction logic

2. **Update submission flow**
   - Capture suburb during location enrichment
   - Pass suburb to Edge Function

3. **Update Edge Function `verify-submission`**
   - Accept suburb in submission data
   - Call `generate_unique_slug` RPC instead of JS function
   - Store suburb in locations table

4. **Unit tests for Nominatim suburb extraction**

### Files to Modify
- `src/composables/useNominatim.ts`
- `src/composables/useSubmission.ts`
- `supabase/functions/verify-submission/index.ts`
- `tests/unit/composables/useNominatim.test.ts`

### Success Criteria
- New submissions include suburb in database
- Slug generated via PostgreSQL function

---

## Phase 3: Migration Script for Existing Data (~35k tokens)

### Goal
Regenerate all existing slugs and backfill suburb data.

### Tasks

1. **Create backfill script**
   - Fetch all locations with coordinates
   - Call Nominatim to get suburb for each (rate limited: 1 req/sec)
   - Update suburb column
   - Call `generate_unique_slug` for new slug
   - Update slug column

2. **Add progress tracking and resumability**
   - Track last processed ID
   - Allow resuming if interrupted

3. **Dry-run mode**
   - Preview changes without applying

4. **Verification report**
   - Count of updated slugs
   - Any failures logged

### Files to Create
- `scripts/backfill-suburbs-and-slugs.ts`

### Success Criteria
```bash
npx ts-node scripts/backfill-suburbs-and-slugs.ts --dry-run
# Shows all changes

npx ts-node scripts/backfill-suburbs-and-slugs.ts
# Applies changes, outputs summary
```

---

## Phase 4: Cleanup & Frontend Sync (~20k tokens)

### Goal
Remove old slug code, update frontend, verify everything works.

### Tasks

1. **Remove old slug utilities**
   - Delete `src/utils/slug.ts` (no longer needed - DB handles it)
   - Delete `supabase/functions/_shared/slug.ts`
   - Update imports

2. **Update frontend location detail route**
   - Verify `/location/:slug` still works with new slugs

3. **Update admin edit**
   - Allow manual slug editing (optional override)
   - Regenerate slug button if name changes

4. **Integration tests**
   - E2E test for submission flow with new slugs
   - Verify no duplicate slugs in database

5. **Add unique constraint on slug column**
   - Migration to add `UNIQUE` constraint (after backfill)

### Files to Modify/Delete
- Delete: `src/utils/slug.ts`
- Delete: `supabase/functions/_shared/slug.ts`
- Delete: `tests/unit/utils/slug.test.ts`
- Modify: `src/views/admin/EditView.vue`
- Create: `supabase/migrations/YYYYMMDD_slug_unique_constraint.sql`

### Success Criteria
- All tests pass
- No TypeScript errors
- New submissions get clean slugs
- No duplicate slugs in database

---

## Deduplication Logic (Reference)

To avoid redundant slugs like `windelfrei-frankfurt-bockenheim-frankfurt-am-main`:

```sql
-- Pseudocode for generate_unique_slug
slugified_name := slugify(name);
slugified_suburb := slugify(suburb);
slugified_city := slugify(city);

-- Build base, avoiding duplication (city before suburb for SEO)
base := slugified_name;

IF slugified_city != '' AND NOT base LIKE '%' || slugified_city || '%' THEN
  base := base || '-' || slugified_city;
END IF;

IF slugified_suburb != '' AND NOT base LIKE '%' || slugified_suburb || '%' THEN
  base := base || '-' || slugified_suburb;
END IF;
```

**Examples:**
| Name | City | Suburb | Result |
|------|------|--------|--------|
| Repair Café | Frankfurt am Main | Bockenheim | repair-cafe-frankfurt-am-main-bockenheim |
| Windelfrei Frankfurt | Frankfurt am Main | Bockenheim | windelfrei-frankfurt-bockenheim |
| Tegut Bad Homburg | Bad Homburg | - | tegut-bad-homburg |
| Alnatura Eschborn | Eschborn | - | alnatura-eschborn |

---

## Execution Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4
   │         │         │         │
   │         │         │         └── Cleanup, constraints
   │         │         └── Backfill existing data
   │         └── Capture suburb in new submissions
   └── Database functions ready
```

Each phase is independent and deployable. Phase 3 (backfill) should run after Phase 1 & 2 are in production.

---

## Notes

- **Rate limiting**: Nominatim requires max 1 request/second
- **Rollback**: Keep old slug in `legacy_slug` column if redirect handling needed later
- **Edge cases**: Locations outside Frankfurt may not have suburb - fallback to city only
