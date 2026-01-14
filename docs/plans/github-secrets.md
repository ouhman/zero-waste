# GitHub Secrets Configuration

This document lists all required GitHub secrets for CI/CD workflows in the Zero Waste Frankfurt project.

## Required Secrets

### Supabase Production Deployment

These secrets are required for the `deploy-database.yml` workflow to deploy migrations and Edge Functions to production.

| Secret Name | Description | How to Obtain | Environment |
|-------------|-------------|---------------|-------------|
| `SUPABASE_ACCESS_TOKEN` | Personal access token from Supabase account | Supabase Dashboard → Account → Access Tokens → Generate New Token | `production` |
| `PROD_SUPABASE_PROJECT_ID` | Production Supabase project reference ID | Value: `rivleprddnvqgigxjyuc` | `production` |
| `PROD_DB_PASSWORD` | Production database password | Supabase Dashboard → Project Settings → Database → Password (set during project creation) | `production` |

### Frontend Deployment (AWS)

These secrets are required for the `deploy.yml` and `deploy-frontend.yml` workflows to deploy the frontend to S3 and CloudFront.

| Secret Name | Description | How to Obtain | Environment |
|-------------|-------------|---------------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM user access key ID | AWS IAM Console → Users → zerowaste-map-deployer → Security credentials | Repository |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM user secret access key | AWS IAM Console → Users → zerowaste-map-deployer → Security credentials | Repository |
| `S3_BUCKET_NAME` | S3 bucket name for frontend files | AWS S3 Console or CDK output | Repository |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID | AWS CloudFront Console or CDK output | Repository |
| `VITE_SUPABASE_URL` | Production Supabase project URL | Supabase Dashboard → Project Settings → API → Project URL | Repository |
| `VITE_SUPABASE_ANON_KEY` | Production Supabase anonymous key | Supabase Dashboard → Project Settings → API → Project API keys → anon public | Repository |

## Setting Up GitHub Secrets

### Repository Secrets

1. Navigate to your repository on GitHub
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name and value
5. Click **Add secret**

### Environment Secrets (Production)

For additional security, some secrets are stored in the `production` environment:

1. Navigate to your repository on GitHub
2. Go to **Settings** → **Environments**
3. Click on **production** (or create it if it doesn't exist)
4. Under **Environment secrets**, click **Add secret**
5. Enter the secret name and value
6. Click **Add secret**

**Production environment configuration:**
- **Protection rules:** Require approval from maintainers before deployment
- **Deployment branches:** Only `main` branch can deploy

## How to Get Supabase Access Token

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click on your profile icon (top right)
3. Select **Account** from dropdown
4. Navigate to **Access Tokens** tab
5. Click **Generate New Token**
6. Give it a descriptive name (e.g., "GitHub Actions - Zero Waste Frankfurt")
7. Set expiration (recommended: 1 year or no expiration for production)
8. Copy the token immediately (it won't be shown again)
9. Add it to GitHub as `SUPABASE_ACCESS_TOKEN`

## How to Get Production Database Password

**Option 1: Retrieve from Password Manager**
If you saved the password during project creation, retrieve it from your password manager.

**Option 2: Reset Password**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your production project (`rivleprddnvqgigxjyuc`)
3. Go to **Settings** → **Database**
4. Under **Database Password**, click **Reset database password**
5. Copy the new password
6. Update `PROD_DB_PASSWORD` secret in GitHub

**Warning:** Resetting the password will invalidate any existing connections using the old password. Update all services that connect to the database.

## Security Best Practices

### Secret Management
- Never commit secrets to the repository
- Use environment-specific secrets (dev vs prod)
- Rotate secrets periodically (every 6-12 months)
- Use least-privilege IAM policies for AWS credentials

### Access Control
- Limit GitHub repository access to trusted team members
- Use environment protection rules for production deployments
- Require code review before merging to main branch
- Enable two-factor authentication on all accounts

### Monitoring
- Monitor GitHub Actions workflow runs for failures
- Set up alerts for deployment failures
- Review workflow logs regularly for suspicious activity
- Audit secret access logs periodically

## Troubleshooting

### "Invalid credentials" errors in workflow
1. Verify secret names match exactly (case-sensitive)
2. Check if secrets have expired (Supabase access tokens)
3. Ensure secrets are configured in correct environment (`production` vs repository)
4. Re-generate and update the secret if necessary

### Database deployment fails
1. Verify `PROD_SUPABASE_PROJECT_ID` is correct (`rivleprddnvqgigxjyuc`)
2. Check if `PROD_DB_PASSWORD` is up-to-date
3. Test connection locally: `supabase link --project-ref <ID> --password <PASSWORD>`
4. Check Supabase Dashboard for project status (paused, inactive, etc.)

### Frontend deployment fails
1. Verify AWS credentials have correct permissions
2. Check if S3 bucket and CloudFront distribution exist
3. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are from production project
4. Test AWS credentials locally: `aws s3 ls`

## Related Documentation

- [Supabase Production Environment Setup](./supabase-prod-environment.md)
- [Supabase Development Environment Setup](./supabase-dev-environment.md)
- [AWS Infrastructure Documentation](../../infra/README.md)
- [GitHub Actions Workflows](../../.github/workflows/)

## Changelog

- **2026-01-14**: Initial documentation created for Phase 5 (GitHub Actions Workflows)
