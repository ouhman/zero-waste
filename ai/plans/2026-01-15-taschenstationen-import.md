# Plan: Import Taschenstationen Locations

> **Principles:** DRY, KISS, YAGNI - keep it simple for ~27 locations

## Overview
Import ~27 Taschenstationen (bag station) locations from CSV into the Zero Waste Frankfurt map.

**Source:** `/home/ouhman/Downloads/zerowastefrankfurt/Kopie von 25-10-02 Standortliste.csv`

**Category:** 📦 Taschenstationen (teal #00796B)

**Target Environment:** DEV first, then PROD after verification

---

## Phase 1: Create Category Migration

**File:** `supabase/migrations/20260115200000_add_taschenstationen_category.sql`

```sql
INSERT INTO categories (slug, name_de, name_en, icon, color, description_de, description_en, sort_order)
SELECT 'taschenstationen', 'Taschenstationen', 'Bag Stations', '📦', '#00796B',
  'Ausgabestellen für wiederverwendbare Taschen',
  'Distribution points for reusable bags',
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'taschenstationen');
```

**Run:** `npm run db:push` → select DEV

---

## Phase 2: Single Import Script (KISS)

**File:** `scripts/import-taschenstationen.ts`

One script that does everything:
1. Parse CSV (handle malformed multiline address for Oxfam)
2. For each location:
   - Geocode via Nominatim (1 req/sec)
   - Insert to `locations` with status='approved'
   - Link to category via `location_categories`
3. Print summary

**Features:**
- `--dry-run` flag
- Skip duplicates (by name+city)
- Basic error handling (log failures, continue)

**Why single script?**
- Only 27 locations - no need for intermediate JSON files
- ~30 seconds total runtime
- Easier to maintain

---

## Files

| File | Action |
|------|--------|
| `supabase/migrations/20260115200000_add_taschenstationen_category.sql` | Create |
| `scripts/import-taschenstationen.ts` | Create |

---

## Execution

1. `npm run db:push` (push migration to DEV)
2. `npx tsx scripts/import-taschenstationen.ts --dry-run`
3. `npx tsx scripts/import-taschenstationen.ts`
4. Verify on DEV map
5. When ready: push migration + run script on PROD

---

## Notes

- Requires `SUPABASE_SERVICE_ROLE_KEY` env var
- CSV line 2-4 has malformed address (multiline) - will normalize
- Rate limit: 1 req/sec for Nominatim (~30 sec total)
