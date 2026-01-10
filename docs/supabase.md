# Supabase Configuration & Troubleshooting

This document covers Supabase-specific configuration, common issues, and their solutions for the Zero Waste Frankfurt project.

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

**Cause:** The slug auto-generation trigger creates duplicates when submitting locations with similar names.

**Solution:** Generate slug client-side with unique suffix for pending submissions:
```typescript
function generateSlug(name: string, city: string): string {
  const base = `${name}-${city}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const suffix = Math.random().toString(36).substring(2, 8)
  return `${base}-pending-${suffix}`
}
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

## Migration Files

| File | Purpose |
|------|---------|
| `20260108_add_payment_and_hours.sql` | Adds payment_methods, opening_hours_osm, opening_hours_structured columns |
| `20260108_allow_pending_submissions.sql` | Creates INSERT policies for anon/authenticated |
| `20260108_grant_anon_insert.sql` | Grants INSERT permission to anon role |

---

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
  Send Email via AWS SES
       ↓
  User Clicks Link
       ↓
  Edge Function (verify-submission)
       ↓
  Create Location (status: pending)
       ↓
  Admin Reviews & Approves
```

### Required Supabase Secrets

Set these via `supabase secrets set`:

```bash
supabase secrets set AWS_ACCESS_KEY_ID=AKIA...
supabase secrets set AWS_SECRET_ACCESS_KEY=...
supabase secrets set AWS_REGION=eu-central-1
supabase secrets set FRONTEND_URL=https://map.zerowastefrankfurt.de
```

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
