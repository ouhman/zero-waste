# Phase 2: Quick Action Items

**Status:** ⚠️ 2 MANUAL STEPS REQUIRED

## 1️⃣ Configure Edge Function Secrets (5 min)

```bash
# Get AWS credentials from SSM
export AWS_PROFILE=zerowaste-map-deployer

ACCESS_KEY=$(aws ssm get-parameter \
  --name "/zerowaste/ses/access-key-id" \
  --with-decryption \
  --query "Parameter.Value" \
  --output text)

SECRET_KEY=$(aws ssm get-parameter \
  --name "/zerowaste/ses/secret-access-key" \
  --with-decryption \
  --query "Parameter.Value" \
  --output text)

# Set in production Supabase
npx supabase link --project-ref rivleprddnvqgigxjyuc
npx supabase secrets set AWS_ACCESS_KEY_ID="$ACCESS_KEY"
npx supabase secrets set AWS_SECRET_ACCESS_KEY="$SECRET_KEY"
npx supabase secrets set AWS_REGION=eu-central-1

# Verify
npx supabase secrets list
```

✅ Done when you see: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` in the list

---

## 2️⃣ Create Storage Bucket (2 min)

1. Go to: https://supabase.com/dashboard/project/rivleprddnvqgigxjyuc/storage
2. Click "Create a new bucket"
3. Configure:
   - **Name:** `category-icons`
   - **Public:** ✅ Yes
   - **File size limit:** 5 MB
   - **Allowed MIME types:** `image/png, image/jpeg, image/svg+xml`
4. Click "Create bucket"

### Set RLS Policies

Go to: https://supabase.com/dashboard/project/rivleprddnvqgigxjyuc/storage/policies

Click "New Policy" and add these two policies:

**Policy 1: Public Read**
```sql
CREATE POLICY "Category icons are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'category-icons');
```

**Policy 2: Admin Write**
```sql
CREATE POLICY "Admins can manage category icons"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'category-icons' AND
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
```

✅ Done when you see 2 policies listed for `category-icons` bucket

---

## Verification Checklist

Once both actions complete, verify:

```bash
# Check secrets
npx supabase link --project-ref rivleprddnvqgigxjyuc
npx supabase secrets list
# Should show: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION

# Check migrations
npx supabase migration list
# Should show 19 migrations with both Local and Remote columns filled

# Check schema
npx supabase db diff
# Should output: "No schema changes found"
```

Visit dashboard:
- ✅ Storage: https://supabase.com/dashboard/project/rivleprddnvqgigxjyuc/storage
  - Bucket `category-icons` exists and is public
- ✅ Functions: https://supabase.com/dashboard/project/rivleprddnvqgigxjyuc/functions
  - `submit-location` and `verify-submission` deployed

---

## Then Proceed to Phase 3

Once verified, Phase 2 is complete. Proceed to Phase 3: Data Migration

See: `/home/ouhman/projects/zerowaste-frankfurt/docs/plans/supabase-prod-environment.md` (Phase 3 section)

---

**Estimated Total Time:** 7 minutes
**Documents Created:**
- ✅ `/home/ouhman/projects/zerowaste-frankfurt/docs/plans/phase2-completion-report.md`
- ✅ `/home/ouhman/projects/zerowaste-frankfurt/docs/plans/phase2-secrets-setup.md`
- ✅ `/home/ouhman/projects/zerowaste-frankfurt/docs/plans/phase2-quick-actions.md` (this file)
