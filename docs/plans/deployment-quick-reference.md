# Deployment Quick Reference

**Last Updated:** 2026-01-14

Quick commands for deploying Zero Waste Frankfurt to production.

## Prerequisites

- AWS CLI configured with `zerowaste-map-deployer` profile
- Production Supabase credentials available
- GitHub secrets configured (for automated deployment)

## Manual Frontend Deployment

```bash
# 1. Set environment variables (copy these exactly)
export VITE_SUPABASE_URL=https://rivleprddnvqgigxjyuc.supabase.co
export VITE_SUPABASE_ANON_KEY=<get-from-supabase-dashboard>
export VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
export AWS_PROFILE=zerowaste-map-deployer

# 2. Verify environment
echo "URL: $VITE_SUPABASE_URL"
echo "Profile: $AWS_PROFILE"
aws sts get-caller-identity

# 3. Deploy
cd /home/ouhman/projects/zerowaste-frankfurt
npm run deploy:frontend

# 4. Verify
curl -I https://map.zerowastefrankfurt.de
# Should return 200 OK
```

**Duration:** ~2-3 minutes

## Automated Deployment (GitHub Actions)

```bash
# Option 1: Push changes (auto-deploys if frontend files changed)
git add src/
git commit -m "feat: your changes"
git push origin main

# Option 2: Manual trigger via GitHub UI
# Go to: Actions → Deploy Frontend → Run workflow → Run workflow
```

**Duration:** ~4-5 minutes

## Database Deployment

```bash
# 1. Create migration
npx supabase migration new your_migration_name

# 2. Edit migration file in supabase/migrations/

# 3. Test in development
npx supabase link --project-ref lccpndhssuemudzpfvvg
npx supabase db push

# 4. Deploy to production (via GitHub Actions)
git add supabase/migrations/
git commit -m "feat: add database migration"
git push origin main
# GitHub Actions automatically deploys to production
```

## Edge Functions Deployment

```bash
# Development
npx supabase link --project-ref lccpndhssuemudzpfvvg
npx supabase functions deploy submit-location

# Production (via GitHub Actions)
git add supabase/functions/
git commit -m "feat: update edge function"
git push origin main
# GitHub Actions automatically deploys to production
```

## Rollback

### Frontend Rollback

```bash
# Quick rollback (revert last commit)
git revert HEAD
git push origin main
# GitHub Actions redeploys previous version

# Manual rollback (to specific commit)
git checkout <commit-hash>
export VITE_SUPABASE_URL=https://rivleprddnvqgigxjyuc.supabase.co
export VITE_SUPABASE_ANON_KEY=<prod-anon-key>
export AWS_PROFILE=zerowaste-map-deployer
npm run deploy:frontend
```

### Database Rollback

```bash
# 1. Create rollback migration
npx supabase migration new rollback_issue

# 2. Write reversal SQL in the migration file

# 3. Test in dev
npx supabase link --project-ref lccpndhssuemudzpfvvg
npx supabase db push

# 4. Deploy to prod
git add supabase/migrations/
git commit -m "fix: rollback database changes"
git push origin main
```

## Get Supabase Credentials

```bash
# Production URL and keys
# Go to: https://supabase.com/dashboard/project/rivleprddnvqgigxjyuc/settings/api

# Production database password
# Go to: https://supabase.com/dashboard/project/rivleprddnvqgigxjyuc/settings/database
# Click "Reset database password" if needed
```

## Get AWS Bucket/Distribution IDs

```bash
export AWS_PROFILE=zerowaste-map-deployer

# S3 Bucket
aws cloudformation describe-stacks \
  --stack-name ZeroWasteFrankfurtStack \
  --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
  --output text \
  --region eu-central-1

# CloudFront Distribution
aws cloudformation describe-stacks \
  --stack-name ZeroWasteFrankfurtStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
  --output text \
  --region eu-central-1
```

## Monitoring

### Check Frontend

```bash
# Site status
curl -I https://map.zerowastefrankfurt.de

# CloudFront invalidation status
aws cloudfront list-invalidations \
  --distribution-id <DISTRIBUTION_ID> \
  --max-items 5
```

### Check Database

```bash
# Link to production
npx supabase link --project-ref rivleprddnvqgigxjyuc

# Check migrations status
npx supabase migration list

# Check for drift
npx supabase db diff
```

### Check Edge Functions

```bash
# Link to production
npx supabase link --project-ref rivleprddnvqgigxjyuc

# View logs
npx supabase functions logs submit-location --tail
npx supabase functions logs verify-submission --tail

# List secrets
npx supabase secrets list
```

## Troubleshooting

### Deployment Script Fails

```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
echo $AWS_PROFILE

# Check AWS credentials
aws sts get-caller-identity

# Test build locally
npm run build
```

### GitHub Actions Fails

```bash
# Check workflow logs in GitHub UI
# Go to: Actions → Failed workflow → View logs

# Verify secrets in GitHub
# Go to: Settings → Secrets and variables → Actions

# Test locally with same commands
npm ci
npm run type-check
npm run test
npm run build
```

### Site Not Updating

```bash
# Check CloudFront invalidation status
aws cloudfront list-invalidations \
  --distribution-id <DISTRIBUTION_ID>

# Force CloudFront invalidation
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"

# Clear browser cache
# Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

### Database Migration Fails

```bash
# Check Supabase Dashboard logs
# Go to: https://supabase.com/dashboard/project/rivleprddnvqgigxjyuc/logs

# Test migration locally
npx supabase link --project-ref lccpndhssuemudzpfvvg
npx supabase db push

# Check for SQL errors in migration file
```

## Environment Projects

| Environment | Project ID | URL |
|-------------|------------|-----|
| Development | `lccpndhssuemudzpfvvg` | https://lccpndhssuemudzpfvvg.supabase.co |
| Production | `rivleprddnvqgigxjyuc` | https://rivleprddnvqgigxjyuc.supabase.co |

## Important URLs

- **Live Site:** https://map.zerowastefrankfurt.de
- **Admin Login:** https://map.zerowastefrankfurt.de/admin/login
- **Supabase Dashboard (Prod):** https://supabase.com/dashboard/project/rivleprddnvqgigxjyuc
- **Supabase Dashboard (Dev):** https://supabase.com/dashboard/project/lccpndhssuemudzpfvvg
- **AWS Console (CloudFront):** https://console.aws.amazon.com/cloudfront
- **AWS Console (S3):** https://console.aws.amazon.com/s3
- **GitHub Actions:** https://github.com/yourusername/zerowaste-frankfurt/actions

## Related Documentation

- [Production Deployment Checklist](./production-deployment-checklist.md) - Full deployment guide
- [GitHub Secrets Configuration](./github-secrets.md) - Required secrets
- [Supabase Production Environment](./supabase-prod-environment.md) - Environment setup
- [Development Environment Guide](./supabase-dev-environment.md) - Local development

## Support

If deployment issues persist:

1. Check service status:
   - AWS: https://status.aws.amazon.com/
   - Supabase: https://status.supabase.com/
   - GitHub: https://www.githubstatus.com/

2. Review logs:
   - CloudWatch (AWS)
   - Supabase Dashboard → Logs
   - GitHub Actions → Workflow runs

3. Rollback if critical:
   - Use rollback procedures above
   - Investigate issue after rollback
