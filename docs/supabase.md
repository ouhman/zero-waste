# Supabase Configuration & Troubleshooting

This document covers Supabase-specific configuration, common issues, and their solutions for the Zero Waste Frankfurt project.

## Environment Setup

This project uses **two separate Supabase projects** for safe development and deployment:

| Environment | Project ID | Region | Purpose |
|-------------|------------|--------|---------|
| **Development** | `lccpndhssuemudzpfvvg` | Frankfurt (eu-central-1) | Local development, testing migrations |
| **Production** | `rivleprddnvqgigxjyuc` | Frankfurt (eu-central-1) | Live site (map.zerowastefrankfurt.de) |

### Why Two Projects?

- **Safe migration testing** - Test database changes in DEV before applying to PROD
- **Edge Function testing** - Deploy and debug functions without affecting users
- **RLS policy validation** - Verify security policies work correctly
- **No risk of data loss** - Mistakes in DEV don't affect real data

### Switching Between Environments

```bash
# Link to DEV (for local development)
npx supabase link --project-ref lccpndhssuemudzpfvvg

# Link to PROD (for production deployment)
npx supabase link --project-ref rivleprddnvqgigxjyuc

# Check which project is currently linked
cat supabase/.temp/project-ref
```

### Environment Files

The frontend uses separate environment files:
- `.env.development` → DEV project (loaded by `npm run dev`)
- `.env.production` → PROD project (loaded by `npm run build`)

See [dev-environment.md](dev-environment.md) for complete setup guide.

---

## Row Level Security (RLS)

### Overview

RLS is enabled on all tables. Anonymous users can:
- **SELECT** approved locations only
- **INSERT** pending locations only

### RLS Policies

#### locations table

| Policy Name | Command | Roles | Condition |
|-------------|---------|-------|-----------|
| Anyone can view approved locations | SELECT | public | `status = 'approved' AND deleted_at IS NULL` |
| Anyone can submit pending locations | INSERT | anon, authenticated | `status = 'pending'` |
| Admins have full access | ALL | authenticated | `user_metadata.role = 'admin'` |

#### location_categories table

| Policy Name | Command | Roles | Condition |
|-------------|---------|-------|-----------|
| Location categories are publicly readable | SELECT | public | Location is approved |
| Anyone can add categories to locations | INSERT | anon, authenticated | Location is pending |
| Admins have full access | ALL | authenticated | `user_metadata.role = 'admin'` |

---

## Common Issues & Solutions

### Issue 1: RLS 401 Error on INSERT (42501)

**Symptom:**
```json
{"code":"42501","message":"new row violates row-level security policy for table \"locations\""}
```

**Root Causes:**

1. **Missing GRANT permissions**
   - RLS policies define *which rows* can be inserted
   - But the role still needs table-level `GRANT INSERT` permission

   **Solution:**
   ```sql
   GRANT INSERT ON locations TO anon;
   GRANT INSERT ON location_categories TO anon;
   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
   ```

2. **Policy not explicitly targeting anon role**
   - Policies without `TO` clause apply to `public`, but this can be ambiguous

   **Solution:** Always specify roles explicitly:
   ```sql
   CREATE POLICY "Anyone can submit pending locations"
     ON locations FOR INSERT
     TO anon, authenticated  -- Explicit roles!
     WITH CHECK (status = 'pending');
   ```

3. **Supabase client uses SELECT after INSERT**
   - When using `.insert().select()`, Supabase tries to read the row back
   - If no SELECT policy allows reading the inserted row, it fails

   **Solution:** Don't use `.select()` after insert for anon users:
   ```typescript
   // BAD - triggers SELECT which fails RLS
   const { data, error } = await supabase
     .from('locations')
     .insert(locationData)
     .select()  // This fails!
     .single()

   // GOOD - insert only, generate ID client-side
   const locationId = crypto.randomUUID()
   const { error } = await supabase
     .from('locations')
     .insert({ id: locationId, ...locationData })
   ```

### Issue 2: Duplicate Slug Error (23505)

**Symptom:**
```json
{"code":"23505","message":"duplicate key value violates unique constraint \"locations_slug_key\""}
```

**Cause:** Two locations with similar names in the same area.

**Solution:** Slugs are now generated atomically by the database using `generate_unique_slug()`. This function:
- Creates SEO-friendly slugs: `{name}-{city}-{suburb}`
- Handles German characters: ä→ae, ö→oe, ü→ue, ß→ss
- Auto-increments on collision: `cafe-frankfurt-bockenheim-2`
- Deduplicates if name already contains city/suburb

The Edge Function `verify-submission` calls this via RPC:
```typescript
const { data: slug } = await supabase.rpc('generate_unique_slug', {
  name: locationName,
  suburb: suburb || '',
  city: city
})
```

---

## Testing RLS Policies

### Via SQL Editor

```sql
-- Test as anon role
SET ROLE anon;

-- Test INSERT (without RETURNING to avoid SELECT check)
INSERT INTO locations (name, address, city, latitude, longitude, status, email, submitted_by_email, submission_type)
VALUES ('Test', 'Test Address', 'Frankfurt', 50.12, 8.69, 'pending', 'test@test.com', 'test@test.com', 'new');

-- Reset role
RESET ROLE;
```

**Important:** `RETURNING` clause triggers SELECT permission check, so omit it when testing INSERT policies.

### Verify Policies Exist

```sql
SELECT
  polname as policy_name,
  CASE polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  polpermissive as is_permissive,
  polroles::regrole[] as roles,
  pg_get_expr(polwithcheck, polrelid) as with_check_expr
FROM pg_policy
WHERE polrelid = 'locations'::regclass;
```

### Verify Grants

```sql
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'locations'
AND grantee = 'anon';
```

---

## Supabase CLI

The Supabase CLI is available via npx (no global install needed).

### Link to Project First

Always link to the correct project before running commands:

```bash
# For development work
npx supabase link --project-ref lccpndhssuemudzpfvvg

# For production deployment
npx supabase link --project-ref rivleprddnvqgigxjyuc
```

### Common Commands

```bash
# Check migration status
npx supabase migration list

# Push pending migrations to linked project
npx supabase db push

# Create new migration
npx supabase migration new description_here

# Mark a migration as applied (if applied manually)
npx supabase migration repair <version> --status applied

# Mark a migration as reverted
npx supabase migration repair <version> --status reverted

# Generate TypeScript types
npx supabase gen types typescript --project-id lccpndhssuemudzpfvvg > src/types/database.ts
```

**Migration naming convention:** Use `YYYYMMDDHHmmss_description.sql` format for unique timestamps.

### Deployment Workflow

1. Create and test migrations in **DEV** first
2. Commit migrations to git
3. Create PR to `main` branch
4. GitHub Actions auto-deploys to **PROD** on merge

See [dev-environment.md](dev-environment.md) for detailed workflow.

---

## Migration Files

| File | Purpose |
|------|---------|
| `20260108180000_add_payment_and_hours.sql` | Adds payment_methods, opening_hours_osm, opening_hours_structured columns |
| `20260108203600_grant_anon_insert.sql` | Grants INSERT permission to anon role |
| `20260108204800_allow_pending_submissions.sql` | Creates INSERT policies for anon/authenticated |
| `20260108210500_add_submission_data.sql` | Adds submission_data column to email_verifications |
| `20260109215300_add_facilities.sql` | Adds facilities support |
| `20260110113400_admin_auth.sql` | Admin authentication setup |
| `20260110115800_category_icons.sql` | Category icon support |
| `20260110154000_is_admin_email.sql` | Admin email check function |
| `20260110163100_fix_search_prefix.sql` | Fixes search to support prefix/substring matching |
| `20260110170000_add_suburb_column.sql` | Adds suburb column to locations |
| `20260110170100_slugify_function.sql` | German-aware slugify() function |
| `20260110170200_generate_unique_slug.sql` | Atomic slug generation with collision handling |
| `20260110170300_update_slug_trigger.sql` | Auto-generate slugs on INSERT/UPDATE |
| `20260110180000_slug_unique_constraint.sql` | Adds UNIQUE constraint to slug column |

---

## Email Verification Flow

### Architecture

```
User Submits Form
       ↓
  Edge Function (submit-location)
       ↓
  Store in email_verifications (with submission_data)
       ↓
  Send Verification Email to User via AWS SES
       ↓
  User Clicks Link
       ↓
  Edge Function (verify-submission)
       ↓
  Create Location (status: pending)
       ↓
  Send Notification Email to Admin via AWS SES
       ↓
  Admin Reviews in Admin Panel
       ↓
  Admin Approves/Rejects Location
```

### Required Supabase Secrets

Secrets must be set on **both DEV and PROD** projects. Link to the project first, then set secrets:

```bash
# Link to project (DEV or PROD)
npx supabase link --project-ref <project-id>

# Set secrets
npx supabase secrets set AWS_ACCESS_KEY_ID=AKIA...
npx supabase secrets set AWS_SECRET_ACCESS_KEY=...
npx supabase secrets set AWS_REGION=eu-central-1
npx supabase secrets set FROM_EMAIL=noreply@zerowastefrankfurt.de

# Verify secrets are set
npx supabase secrets list
```

**Note:**
- Secrets are project-specific - set them on both DEV and PROD
- `FROM_EMAIL` is used as the sender address for verification emails
- AWS credentials are stored in SSM Parameter Store (see [aws-ses.md](aws-ses.md))

### Database Migration

Run this migration to add submission_data storage:

```sql
ALTER TABLE email_verifications
ADD COLUMN IF NOT EXISTS submission_data JSONB;
```

---

## References

- [Supabase Discussion #6765 - RLS INSERT issue](https://github.com/orgs/supabase/discussions/6765)
- [Supabase RLS troubleshooting](https://nikofischer.com/supabase-error-row-level-security-policy)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
