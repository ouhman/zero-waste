# Quick Deployment Guide

**For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

## One-Time Setup

### 1. Create ACM Certificate (us-east-1)

```bash
aws acm request-certificate \
  --domain-name map.zerowastefrankfurt.de \
  --validation-method DNS \
  --region us-east-1
```

Validate via DNS, then save the certificate ARN.

### 2. Bootstrap CDK

```bash
cd infra
cdk bootstrap
```

### 3. Deploy Infrastructure

```bash
export CERTIFICATE_ARN=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID
cd infra
cdk deploy
```

Save outputs: `BucketName`, `DistributionId`

### 4. Configure DNS

Add CNAME record:
- Name: `map`
- Target: CloudFront domain from CDK outputs

### 5. Set GitHub Secrets

Add to repository secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Regular Deployment

### Automatic (Recommended)

```bash
git add .
git commit -m "Your changes"
git push origin main
```

CI/CD pipeline will test and deploy automatically.

### Manual

```bash
# Build
npm run build

# Deploy
aws s3 sync dist/ s3://BUCKET_NAME/ --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html"

aws s3 cp dist/index.html s3://BUCKET_NAME/index.html \
  --cache-control "public,max-age=0,must-revalidate"

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id DIST_ID \
  --paths "/*"
```

---

## Rollback

```bash
git revert HEAD
git push origin main
```

---

## Verify Deployment

```bash
curl -I https://map.zerowastefrankfurt.de
# Should return: HTTP/2 200
```

---

## Costs

~$1-6/month for low-medium traffic
