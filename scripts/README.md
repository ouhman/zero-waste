# Scripts Directory

Utility scripts for database migrations and maintenance.

## Available Scripts

### `backfill-suburbs-and-slugs.ts`

Backfills suburb data from Nominatim and regenerates all location slugs using the new SEO-friendly format.

**Features:**
- Reverse geocodes coordinates to extract suburb data
- Calls PostgreSQL `generate_unique_slug()` for consistent slug generation
- Rate-limited to 1 req/sec (Nominatim requirement)
- Dry-run mode for safe preview
- Progress bar with ETA
- Resumability for large datasets
- Detailed statistics report

**Usage:**
```bash
# Preview changes (recommended first)
npx ts-node scripts/backfill-suburbs-and-slugs.ts --dry-run

# Apply changes to database
npx ts-node scripts/backfill-suburbs-and-slugs.ts

# Resume from specific location ID (if interrupted)
npx ts-node scripts/backfill-suburbs-and-slugs.ts --resume-from=abc-123-def
```

**Requirements:**
- Phase 1 migrations must be applied (suburb column, slug functions)
- `SUPABASE_SERVICE_ROLE_KEY` in `.env` (to bypass RLS)

**Expected Runtime:** 4-5 minutes for ~280 locations

---

### `regenerate-slugs.ts` (Legacy)

**⚠️ Deprecated**: Use `backfill-suburbs-and-slugs.ts` instead.

Regenerates slugs using the old random-suffix format. This script is kept for reference but should not be used for new migrations.

---

### `migrate-google-maps.ts`

Migrates location data from Google Maps format to OSM/Nominatim format.

---

### `clean-location-names.ts`

Cleans up location names by removing suffixes and standardizing format.

---

### `check-names.ts`

Validates location names for consistency and format issues.

---

## Environment Variables

All scripts require these environment variables in `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Required for write operations
```

## Common Patterns

### TypeScript Execution

All scripts use `ts-node` for execution:

```bash
npx ts-node scripts/script-name.ts
```

### Dry-Run Mode

Most migration scripts support `--dry-run` to preview changes:

```bash
npx ts-node scripts/script-name.ts --dry-run
```

### Database Access

Scripts use the Supabase client with service role key to bypass RLS:

```typescript
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
```

## Best Practices

1. **Always test with `--dry-run` first**
2. **Backup database before running migrations**
3. **Use service role key for admin operations**
4. **Monitor rate limits for external APIs (Nominatim)**
5. **Review statistics report after migration**
6. **Keep scripts idempotent when possible**

## Troubleshooting

### "Missing Supabase credentials" error

Ensure `.env` file exists with all required variables:
```bash
cat .env
```

### "column does not exist" error

Apply pending migrations:
```bash
npx supabase db push
```

### "Too Many Requests" from Nominatim

The backfill script includes rate limiting (1 req/sec). If still hitting limits, use `--resume-from` to continue after waiting.

### Script hangs or times out

Use `--resume-from` flag to continue from last processed location:
```bash
npx ts-node scripts/backfill-suburbs-and-slugs.ts --resume-from=<last-id>
```

## Development

### Creating a New Script

1. Create `scripts/new-script.ts`
2. Add shebang: `#!/usr/bin/env npx ts-node`
3. Import Supabase client and dotenv
4. Add proper error handling
5. Support `--dry-run` for safety
6. Make executable: `chmod +x scripts/new-script.ts`
7. Document in this README

### Testing Scripts

Test on a small subset of data first:

```typescript
const { data } = await supabase
  .from('locations')
  .select('*')
  .limit(5)  // Test with just 5 rows
```

Then gradually increase to full dataset.
