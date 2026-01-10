# Zero Waste Frankfurt - Deployment Guide

This guide covers deploying the Zero Waste Frankfurt application to AWS using CDK.

## Table of Contents

- [Prerequisites](#prerequisites)
- [AWS Infrastructure Setup](#aws-infrastructure-setup)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [DNS Configuration](#dns-configuration)
- [Manual Deployment](#manual-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Rollback Procedure](#rollback-procedure)
- [Monitoring](#monitoring)

---

## Prerequisites

### Required Tools

- Node.js 20+ installed
- AWS CLI v2 installed
- AWS CDK CLI installed: `npm install -g aws-cdk`
- Git configured
- AWS account with appropriate permissions

### Required AWS Permissions

Your AWS user/role needs:
- S3 (create/manage buckets)
- CloudFront (create/manage distributions)
- ACM (view certificates)
- IAM (create roles/policies for CloudFront)
- CloudFormation (deploy stacks)

### AWS Credentials

Configure AWS credentials:

```bash
aws configure --profile zerowaste-frankfurt
```

Or export environment variables:

```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=eu-central-1
```

---

## AWS Infrastructure Setup

### Step 1: Create ACM Certificate (HTTPS)

**IMPORTANT:** ACM certificate for CloudFront must be created in **us-east-1** region.

```bash
# Switch to us-east-1
aws acm request-certificate \
  --domain-name map.zerowastefrankfurt.de \
  --validation-method DNS \
  --region us-east-1

# Note the CertificateArn from output
```

You'll receive a certificate ARN like:
```
arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012
```

### Step 2: Validate Certificate

AWS will provide DNS records (CNAME) for validation. Add these to your DNS provider:

```bash
# Get validation records
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:123456789012:certificate/YOUR_CERT_ID \
  --region us-east-1
```

Add the CNAME record to your DNS (e.g., Cloudflare, Route53, etc.).

Wait for validation (can take 5-30 minutes):

```bash
aws acm wait certificate-validated \
  --certificate-arn arn:aws:acm:us-east-1:123456789012:certificate/YOUR_CERT_ID \
  --region us-east-1
```

### Step 3: Bootstrap CDK

Bootstrap CDK in your AWS account (only needed once per account/region):

```bash
cd infra

# Bootstrap for eu-central-1 (where S3/CloudFront will be)
cdk bootstrap aws://ACCOUNT_ID/eu-central-1
```

Replace `ACCOUNT_ID` with your AWS account ID (find with `aws sts get-caller-identity`).

### Step 4: Deploy Infrastructure

Set the certificate ARN:

```bash
export CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/YOUR_CERT_ID
```

Deploy the stack:

```bash
cd infra

# Review changes
cdk diff

# Deploy
cdk deploy --require-approval never
```

This creates:
- S3 bucket for static files (private)
- CloudFront distribution with OAC
- Origin Access Control (OAC) for secure S3 access
- Custom domain configuration
- HTTPS with your ACM certificate

### Step 5: Note the Outputs

After deployment, CDK will output:

```
Outputs:
ZeroWasteFrankfurtStack.BucketName = zerowaste-frankfurt-123456789012
ZeroWasteFrankfurtStack.DistributionId = E1234567890ABC
ZeroWasteFrankfurtStack.DistributionDomainName = d1234567890abc.cloudfront.net
ZeroWasteFrankfurtStack.WebsiteURL = https://map.zerowastefrankfurt.de
```

**Save these values** - you'll need them for:
- GitHub secrets
- DNS configuration

---

## GitHub Secrets Configuration

Add these secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

### Required Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key for deployment | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalr...` |
| `S3_BUCKET_NAME` | S3 bucket name (from CDK output) | `zerowaste-frankfurt-123456789012` |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID (from CDK output) | `E1234567890ABC` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |

### How to Create AWS Deployment User

For security, create a dedicated IAM user for GitHub Actions:

```bash
# Create user
aws iam create-user --user-name github-actions-zerowaste

# Attach permissions (adjust as needed)
aws iam put-user-policy --user-name github-actions-zerowaste --policy-name DeploymentPolicy --policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::zerowaste-frankfurt-*",
        "arn:aws:s3:::zerowaste-frankfurt-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}'

# Create access key
aws iam create-access-key --user-name github-actions-zerowaste
```

Use the returned `AccessKeyId` and `SecretAccessKey` for GitHub secrets.

---

## DNS Configuration

Point your domain to CloudFront:

### Using Cloudflare (or other DNS provider)

1. Go to your DNS provider's dashboard
2. Add a CNAME record:
   - **Type:** CNAME
   - **Name:** `map` (for `map.zerowastefrankfurt.de`)
   - **Target:** `d1234567890abc.cloudfront.net` (from CDK output)
   - **Proxy status:** DNS only (orange cloud OFF in Cloudflare)
   - **TTL:** Auto or 1 hour

3. Wait for DNS propagation (can take 5 minutes to 48 hours)

### Using AWS Route53

If your domain is on Route53:

```bash
# Get your hosted zone ID
aws route53 list-hosted-zones

# Create alias record (use CloudFront distribution domain from CDK output)
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "map.zerowastefrankfurt.de",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d1234567890abc.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

(Note: `Z2FDTNDATAQYW2` is always the hosted zone ID for CloudFront)

### Verify DNS

```bash
# Check DNS propagation
dig map.zerowastefrankfurt.de

# Or use online tool: https://dnschecker.org
```

---

## Manual Deployment

To deploy manually (outside GitHub Actions):

### 1. Build the Application

```bash
cd /path/to/zerowaste-frankfurt

# Create production env file
cp .env.production.example .env.production
# Edit .env.production with your Supabase credentials

# Install and build
npm ci
npm run build
```

### 2. Upload to S3

```bash
# Set bucket name
BUCKET_NAME=zerowaste-frankfurt-123456789012

# Upload all files except index.html (with long cache)
aws s3 sync dist/ s3://$BUCKET_NAME/ \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html"

# Upload index.html with no-cache (for SPA routing)
aws s3 cp dist/index.html s3://$BUCKET_NAME/index.html \
  --cache-control "public,max-age=0,must-revalidate"
```

### 3. Invalidate CloudFront Cache

```bash
DISTRIBUTION_ID=E1234567890ABC

aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### 4. Verify Deployment

```bash
# Check website
curl -I https://map.zerowastefrankfurt.de

# Should return: HTTP/2 200
```

---

## CI/CD Pipeline

The project includes automated CI/CD via GitHub Actions:

### CI Workflow (Pull Requests)

**File:** `.github/workflows/ci.yml`

**Triggers:** On pull request to `main`

**Steps:**
1. Checkout code
2. Install dependencies
3. Run type check
4. Run tests (118 tests)
5. Build application
6. Upload build artifacts

### CD Workflow (Deployments)

**File:** `.github/workflows/deploy.yml`

**Triggers:** On push to `main` (after PR merge)

**Steps:**
1. Checkout code
2. Install dependencies
3. Run tests
4. Build application with production env vars
5. Upload to S3
6. Invalidate CloudFront cache
7. Generate deployment summary

### Testing the Pipeline

1. Create a feature branch:
   ```bash
   git checkout -b feature/test-deployment
   ```

2. Make a change and push:
   ```bash
   git add .
   git commit -m "Test: Update deployment pipeline"
   git push origin feature/test-deployment
   ```

3. Create a PR on GitHub
   - CI workflow will run automatically
   - Verify all tests pass

4. Merge the PR
   - CD workflow will deploy to production
   - Check the Actions tab for deployment status

---

## Rollback Procedure

If deployment fails or introduces bugs:

### Option 1: Revert Git Commit

```bash
# Find the last good commit
git log --oneline

# Revert to that commit
git revert HEAD

# Push to main (triggers auto-deployment)
git push origin main
```

### Option 2: Re-deploy Previous Build

```bash
# Checkout the last good commit
git checkout PREVIOUS_COMMIT_SHA

# Build and deploy manually
npm run build
# ... follow manual deployment steps above
```

### Option 3: S3 Versioning (if enabled)

If you enabled S3 versioning:

```bash
# List object versions
aws s3api list-object-versions \
  --bucket zerowaste-frankfurt-123456789012 \
  --prefix index.html

# Restore previous version (copy version ID from above)
aws s3api copy-object \
  --copy-source "zerowaste-frankfurt-123456789012/index.html?versionId=VERSION_ID" \
  --bucket zerowaste-frankfurt-123456789012 \
  --key index.html
```

---

## Monitoring

### CloudWatch Metrics

Monitor CloudFront in AWS CloudWatch:

- **Requests:** Number of requests
- **BytesDownloaded:** Data transfer
- **ErrorRate:** 4xx and 5xx errors

```bash
# View CloudFront metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --dimensions Name=DistributionId,Value=E1234567890ABC \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

### CloudFront Logs (Optional)

Enable CloudFront access logs:

```bash
# Create logging bucket
aws s3 mb s3://zerowaste-frankfurt-logs-123456789012 --region eu-central-1

# Update distribution config to enable logging (via AWS Console or CDK)
```

### Cost Monitoring

Set up billing alerts:

1. Go to AWS Billing Dashboard
2. Create budget: $10/month (adjust as needed)
3. Set email alerts at 80% and 100%

**Estimated monthly costs:**
- CloudFront: ~$1-5 (depends on traffic)
- S3: ~$0.10 (minimal with low traffic)
- ACM: Free
- **Total:** ~$1-6/month for low-medium traffic

---

## Troubleshooting

### Issue: Certificate validation stuck

**Solution:**
- Verify DNS CNAME records are correct
- Wait up to 30 minutes
- Check `aws acm describe-certificate` status

### Issue: DNS not resolving

**Solution:**
- Wait for DNS propagation (up to 48 hours)
- Use `dig map.zerowastefrankfurt.de` to check
- Verify CNAME points to correct CloudFront domain

### Issue: 403 Forbidden errors

**Solution:**
- Check S3 bucket policy allows CloudFront access
- Verify OAC is correctly configured
- Check CloudFront distribution is enabled

### Issue: Stale content after deployment

**Solution:**
- Verify CloudFront invalidation ran
- Check cache headers on S3 objects
- Hard refresh browser (Ctrl+Shift+R)

### Issue: GitHub Actions deployment fails

**Solution:**
- Check GitHub secrets are set correctly
- Verify AWS credentials have required permissions
- Check S3 bucket name and CloudFront distribution ID

---

## Security Best Practices

1. **Use dedicated IAM user** for GitHub Actions (principle of least privilege)
2. **Rotate AWS access keys** every 90 days
3. **Enable MFA** on AWS root account
4. **Monitor CloudTrail** for unusual API activity
5. **Keep Supabase keys** in GitHub secrets (never commit to git)
6. **Use HTTPS only** (CloudFront redirects HTTP → HTTPS)
7. **Enable CloudFront WAF** (optional, for production traffic)

---

## Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/your-org/zerowaste-frankfurt/issues)
- AWS Support: If infrastructure-related
- Supabase Support: If database-related

---

**Last Updated:** January 2026
