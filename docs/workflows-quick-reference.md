# GitHub Actions Workflows - Quick Reference

Quick reference guide for GitHub Actions workflows in the Zero Waste Frankfurt project.

## Available Workflows

### 1. CI Workflow
**File:** `.github/workflows/ci.yml`
**Trigger:** Pull requests to `main`

**What it does:**
- Runs type check (`npm run type-check`)
- Runs tests (`npm run test`)
- Builds application (`npm run build`)
- Validates migration files if Supabase files changed
- Uploads build artifacts

**When to expect it:** Every PR to `main`

### 2. Validate Migrations Workflow
**File:** `.github/workflows/validate-migrations.yml`
**Trigger:** Pull requests to `main` that modify `supabase/migrations/**` or `supabase/config.toml`

**What it does:**
- Validates migration file naming convention
- Checks for dangerous SQL operations
- Posts validation summary to PR

**When to expect it:** PRs with migration changes only

### 3. Deploy Database Workflow
**File:** `.github/workflows/deploy-database.yml`
**Trigger:**
- Push to `main` that modifies `supabase/migrations/**` or `supabase/functions/**`
- Manual trigger via GitHub Actions UI

**What it does:**
- Deploys migrations to production
- Deploys Edge Functions to production
- Requires manual approval from maintainer

**When to expect it:** After merging migration/function changes to `main`

### 4. Deploy Frontend Workflow
**File:** `.github/workflows/deploy.yml`
**Trigger:** Push to `main`

**What it does:**
- Builds frontend application
- Deploys to S3
- Invalidates CloudFront cache

**When to expect it:** Every push to `main`

## Common Scenarios

### Scenario 1: Adding a New Migration

**Steps:**
1. Create migration file with correct naming:
   ```bash
   # Format: YYYYMMDDHHMMSS_description.sql
   # Example: 20260114153000_add_favorites_table.sql
   ```

2. Write migration SQL in the file

3. Test locally:
   ```bash
   supabase db reset
   ```

4. Create PR with migration file

5. Wait for `validate-migrations.yml` to run
   - Check PR for validation results
   - Fix any issues

6. Get PR approved and merge to `main`

7. Approve production deployment when prompted
   - Check GitHub Actions → Deploy Database workflow
   - Click "Review deployments" → Approve

8. Verify migration applied:
   - Check Supabase Dashboard → Table Editor
   - Or run: `supabase db diff --linked`

### Scenario 2: Deploying Edge Functions

**Steps:**
1. Create or modify Edge Function in `supabase/functions/`

2. Test locally:
   ```bash
   supabase functions serve
   ```

3. Create PR with function changes

4. Get PR approved and merge to `main`

5. Approve production deployment when prompted

6. Verify function deployed:
   - Check Supabase Dashboard → Edge Functions
   - Test function endpoint

### Scenario 3: Manual Database Deployment

**When to use:**
- Need to deploy without code changes
- Want to re-run a failed deployment

**Steps:**
1. Go to GitHub Actions tab
2. Click "Deploy Database" workflow
3. Click "Run workflow" button
4. Select options:
   - Skip migrations: `true`/`false`
   - Skip functions: `true`/`false`
5. Click "Run workflow"
6. Approve deployment when prompted
7. Monitor workflow execution

### Scenario 4: Fixing a Failed Deployment

**If migration deployment fails:**

1. Check workflow logs for error details
2. Fix the issue:
   - Invalid SQL syntax → Fix migration file
   - Missing dependencies → Add prerequisite migration
   - RLS policy conflict → Adjust policies
3. Create new migration with fix (don't modify existing)
4. Open PR and follow normal flow

**If Edge Function deployment fails:**

1. Check workflow logs for error details
2. Fix the issue:
   - Import errors → Check dependencies
   - Runtime errors → Fix function code
   - Environment variables → Add to Supabase Dashboard
3. Push fix to `main` or re-run workflow manually

## Troubleshooting

### Workflow doesn't trigger
**Check:**
- Is the file path correct? (`supabase/migrations/**` for database workflow)
- Is the branch `main`?
- Check GitHub Actions tab for disabled workflows

**Fix:**
- Ensure file is in correct directory
- Push to `main` branch or create PR to `main`
- Re-enable workflow if disabled

### Validation fails with "Invalid naming"
**Error:** Migration file doesn't follow naming convention

**Fix:**
```bash
# Correct format
20260114153000_add_favorites_table.sql

# Incorrect formats
2026-01-14-add-favorites.sql  # Hyphens not allowed
add_favorites_table.sql        # Missing timestamp
20260114_add_favorites.sql     # Timestamp too short
```

**Steps:**
1. Rename migration file to correct format
2. Commit and push
3. Validation will re-run automatically

### Deployment fails with "Invalid credentials"
**Error:** Authentication failed

**Check:**
- `SUPABASE_ACCESS_TOKEN` is valid
- `PROD_DB_PASSWORD` is correct
- Secrets are in `production` environment

**Fix:**
1. Regenerate Supabase access token
2. Reset database password if needed
3. Update secrets in GitHub
4. Re-run workflow

### "Dangerous operation detected"
**Error:** Migration contains `DROP DATABASE` or `DROP SCHEMA public`

**Why blocked:** These operations are extremely destructive

**Fix:**
- If intentional: Use more specific operations (e.g., `DROP TABLE` instead)
- If unintentional: Remove the dangerous operation
- Never drop entire database or public schema in production

## Required Permissions

### To Create PR
- Write access to repository

### To Approve PR
- Write access to repository
- Pass all CI checks

### To Approve Production Deployment
- Admin access to repository
- Added as required reviewer in `production` environment

### To Access Secrets
- Admin access to repository

## Related Documentation

- [GitHub Secrets Configuration](./plans/github-secrets.md)
- [Supabase Production Environment](./plans/supabase-prod-environment.md)
- [Phase 5 Summary](./plans/phase5-workflows-summary.md)

## Quick Links

- [GitHub Actions Tab](../../actions)
- [Environments Settings](../../settings/environments)
- [Secrets Settings](../../settings/secrets/actions)
- [Supabase Dashboard](https://supabase.com/dashboard/project/rivleprddnvqgigxjyuc)

## Cheat Sheet

### Migration File Naming
```bash
# Template
YYYYMMDDHHMMSS_description.sql

# Current timestamp in correct format
date +%Y%m%d%H%M%S
# Output: 20260114153042

# Create migration file
touch "supabase/migrations/$(date +%Y%m%d%H%M%S)_your_description.sql"
```

### Check Migration Status
```bash
# What migrations are pending?
supabase db diff --linked

# What migrations have been applied?
supabase migration list
```

### Test Before Deploying
```bash
# Test migrations locally
supabase db reset

# Test Edge Functions locally
supabase functions serve

# Validate migration syntax
supabase db lint
```

### Manual Deployment Commands
```bash
# Deploy migrations only
cd /path/to/project
supabase link --project-ref rivleprddnvqgigxjyuc
supabase db push

# Deploy specific Edge Function
supabase functions deploy <function-name> --project-ref rivleprddnvqgigxjyuc

# Deploy all Edge Functions
cd supabase/functions
for func in */; do
  supabase functions deploy ${func%/} --project-ref rivleprddnvqgigxjyuc
done
```

## Support

**Questions or Issues?**
- Check workflow logs in GitHub Actions tab
- Review documentation in `docs/plans/`
- Contact project maintainer

**Emergency Rollback?**
- Migrations cannot be automatically rolled back
- Create new migration to revert changes
- Contact Supabase support for critical issues
