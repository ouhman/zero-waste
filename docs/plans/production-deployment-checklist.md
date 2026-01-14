# Production Deployment Checklist

**Last Updated:** 2026-01-14
**Purpose:** Ensure safe and complete deployment to production

## Pre-Deployment Checklist

### Data Migration
- [ ] All data migrated from development to production project
- [ ] Data integrity verified (row counts match)
- [ ] Storage buckets created (`category-icons`)
- [ ] Storage files migrated (if any custom icons)
- [ ] icon_url values updated to point to production storage

### Database
- [ ] All migrations applied to production
- [ ] RLS policies verified (match development)
- [ ] Database functions and triggers working
- [ ] Test queries run successfully

### Edge Functions
- [ ] Edge Functions deployed to production
  - [ ] `submit-location`
  - [ ] `verify-submission`
- [ ] Edge Function secrets configured:
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `AWS_REGION=eu-central-1`
  - [ ] `FROM_EMAIL=noreply@zerowastefrankfurt.de`
- [ ] Test Edge Functions work (submit test location)

### Admin Access
- [ ] Admin user created in production
- [ ] Admin role set in auth.users metadata
- [ ] Admin can log in via magic link
- [ ] Admin can approve/reject locations

### GitHub Secrets
- [ ] `SUPABASE_ACCESS_TOKEN` set (production environment)
- [ ] `PROD_SUPABASE_PROJECT_ID=rivleprddnvqgigxjyuc` (production environment)
- [ ] `PROD_DB_PASSWORD` set (production environment)
- [ ] `VITE_SUPABASE_URL` set (repository secrets)
- [ ] `VITE_SUPABASE_ANON_KEY` set (repository secrets)
- [ ] `AWS_ACCESS_KEY_ID` set (repository secrets)
- [ ] `AWS_SECRET_ACCESS_KEY` set (repository secrets)
- [ ] `S3_BUCKET_NAME` set (repository secrets)
- [ ] `CLOUDFRONT_DISTRIBUTION_ID` set (repository secrets)
- [ ] `VITE_GA_MEASUREMENT_ID` set (repository secrets)

## Deployment Steps

### Step 1: Set Environment Variables

```bash
# Export production Supabase credentials
export VITE_SUPABASE_URL=https://rivleprddnvqgigxjyuc.supabase.co
export VITE_SUPABASE_ANON_KEY=<get-from-supabase-dashboard>

# Export Google Analytics ID (optional)
export VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Verify AWS profile
export AWS_PROFILE=zerowaste-map-deployer
aws sts get-caller-identity
```

### Step 2: Verify Environment Variables

```bash
echo "Supabase URL: $VITE_SUPABASE_URL"
echo "AWS Profile: $AWS_PROFILE"
# Should show production project ID
```

### Step 3: Run Deployment

```bash
cd /home/ouhman/projects/zerowaste-frankfurt
npm run deploy:frontend
```

**Expected output:**
- ✅ Environment validation passes (PRODUCTION)
- ✅ Build completes without errors
- ✅ S3 sync successful
- ✅ CloudFront invalidation created
- ✅ Deployment complete message

**Duration:** ~2-3 minutes

### Step 4: Post-Deployment Verification

Visit https://map.zerowastefrankfurt.de and verify:

#### Basic Functionality
- [ ] Site loads without errors
- [ ] Map renders with locations
- [ ] Location markers visible
- [ ] Location details open on click
- [ ] Categories filter works
- [ ] Search functionality works
- [ ] Share button works

#### Admin Functionality
- [ ] Navigate to `/admin/login`
- [ ] Request magic link
- [ ] Receive email and log in
- [ ] Dashboard loads with stats
- [ ] Can view pending locations
- [ ] Can approve/reject locations
- [ ] Can edit locations
- [ ] Can manage categories

#### Location Submission
- [ ] Navigate to submission form
- [ ] Test Google Maps link method
- [ ] Test pin-on-map method
- [ ] Receive verification email
- [ ] Click verification link
- [ ] Location appears in admin panel

#### Analytics (if enabled)
- [ ] Cookie consent banner shows
- [ ] Accepting consent enables tracking
- [ ] Events tracked in GA4 (check Real-Time reports)

### Step 5: Monitor for Issues

**First 15 minutes:**
- [ ] Check CloudWatch logs for Edge Functions
- [ ] Check Supabase Dashboard → Database → Logs
- [ ] Check browser console for JavaScript errors

**First hour:**
- [ ] Monitor for user-reported issues
- [ ] Check error tracking (if configured)
- [ ] Verify data is being written correctly

**First 24 hours:**
- [ ] Review analytics data
- [ ] Check submission volume
- [ ] Verify no degraded performance

## Rollback Procedure

If deployment fails or causes issues:

### Option 1: Quick Rollback (Frontend Only)

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# This triggers GitHub Actions to redeploy previous version
```

### Option 2: Manual Rollback

```bash
# Checkout previous working commit
git checkout <previous-commit-hash>

# Export production env vars (same as deployment)
export VITE_SUPABASE_URL=https://rivleprddnvqgigxjyuc.supabase.co
export VITE_SUPABASE_ANON_KEY=<prod-anon-key>
export AWS_PROFILE=zerowaste-map-deployer

# Deploy
npm run deploy:frontend
```

### Option 3: Database Rollback (If migration issue)

1. Create rollback migration:
   ```bash
   npx supabase migration new rollback_issue
   ```

2. Write reversal SQL in the migration file

3. Test in development:
   ```bash
   npx supabase link --project-ref lccpndhssuemudzpfvvg
   npx supabase db push
   ```

4. Deploy to production:
   ```bash
   git add supabase/migrations/*
   git commit -m "fix: rollback database changes"
   git push origin main
   # GitHub Actions deploys rollback
   ```

## Troubleshooting

### Build Fails
**Symptom:** `npm run build` errors
**Solution:**
- Check for TypeScript errors: `npm run type-check`
- Check for test failures: `npm run test`
- Verify all dependencies installed: `npm ci`

### Environment Variables Not Set
**Symptom:** Deployment script exits with "Missing required environment variables"
**Solution:**
- Run the export commands from Step 1
- Verify values with `echo $VITE_SUPABASE_URL`

### AWS Access Denied
**Symptom:** S3 sync or CloudFront invalidation fails with permission errors
**Solution:**
- Verify AWS profile: `aws sts get-caller-identity`
- Check IAM permissions in AWS Console
- Ensure profile is `zerowaste-map-deployer`

### CloudFront Caching Issues
**Symptom:** Site shows old version after deployment
**Solution:**
- Wait 1-2 minutes for invalidation to complete
- Force-refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Check CloudFront invalidation status in AWS Console

### Supabase Connection Issues
**Symptom:** Site loads but data doesn't show
**Solution:**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check browser console for CORS errors
- Verify Supabase project is active (not paused)
- Check RLS policies allow anonymous reads

### Edge Function Errors
**Symptom:** Location submission fails
**Solution:**
- Check Edge Function logs: `npx supabase functions logs submit-location`
- Verify secrets are set: `npx supabase secrets list`
- Test Edge Function manually via Supabase Dashboard
- Check SES email configuration in AWS

## Emergency Contacts

**Technical Issues:**
- Check GitHub Issues: https://github.com/yourusername/zerowaste-frankfurt/issues
- Review logs in AWS CloudWatch
- Review logs in Supabase Dashboard

**Service Status:**
- AWS Status: https://status.aws.amazon.com/
- Supabase Status: https://status.supabase.com/

## Post-Deployment Tasks

After successful deployment:

- [ ] Update deployment log with date/time
- [ ] Document any issues encountered
- [ ] Update runbook if new issues found
- [ ] Notify team of successful deployment
- [ ] Schedule follow-up monitoring check (24h)

## Notes

- **Deployment Window:** Recommended during low-traffic hours (early morning CET)
- **Notification:** Consider notifying users of scheduled maintenance if significant changes
- **Backup:** Supabase automatically backs up production database (7-day retention on free tier)
- **Rollback Time:** Frontend rollback ~5 minutes, database rollback ~10-15 minutes
