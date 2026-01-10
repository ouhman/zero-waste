# Zero Waste Frankfurt - Infrastructure

AWS CDK infrastructure for the Zero Waste Frankfurt frontend application.

## Stack Overview

This CDK stack deploys:

- **S3 Bucket:** Private bucket for static website files
- **CloudFront Distribution:** CDN with custom domain and HTTPS
- **Origin Access Control (OAC):** Secure S3 access from CloudFront
- **ACM Certificate:** HTTPS/TLS certificate for custom domain
- **IAM Policies:** Minimal permissions for CloudFront → S3 access

## Architecture

```
User Browser
    ↓ HTTPS (TLS 1.2+)
CloudFront Distribution (map.zerowastefrankfurt.de)
    ↓ OAC (Origin Access Control)
S3 Bucket (zerowaste-frankfurt-{account-id})
    └── Static files (index.html, JS, CSS, assets)
```

## Prerequisites

- Node.js 20+
- AWS CLI v2
- AWS CDK CLI: `npm install -g aws-cdk`
- AWS account with permissions
- ACM certificate created in `us-east-1` (required for CloudFront)

## Installation

```bash
cd infra
npm install
```

## Commands

### Build TypeScript

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Synthesize CloudFormation Template

```bash
npm run synth
# or
npx cdk synth
```

### Deploy to AWS

```bash
# Set certificate ARN (required)
export CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/YOUR_CERT_ID

# Preview changes
npx cdk diff

# Deploy
npx cdk deploy
```

### Destroy Infrastructure

```bash
npx cdk destroy
```

**WARNING:** This will delete the CloudFront distribution but **RETAIN** the S3 bucket (to prevent data loss).

## Configuration

### Environment Variables

- `CERTIFICATE_ARN`: ACM certificate ARN (must be in us-east-1)
- `CDK_DEFAULT_ACCOUNT`: AWS account ID (auto-detected)
- `CDK_DEFAULT_REGION`: AWS region (default: eu-central-1)
- `ENVIRONMENT`: Environment name (default: production)

### Certificate Setup

CloudFront requires ACM certificate in **us-east-1** region:

```bash
aws acm request-certificate \
  --domain-name map.zerowastefrankfurt.de \
  --validation-method DNS \
  --region us-east-1
```

Validate via DNS and note the ARN.

## Stack Resources

| Resource | Type | Purpose |
|----------|------|---------|
| WebsiteBucket | S3::Bucket | Stores static files (private) |
| Distribution | CloudFront::Distribution | CDN with custom domain |
| OriginAccessControl | CloudFront::OriginAccessControl | Secure S3 access |
| BucketPolicy | S3::BucketPolicy | Grants CloudFront read access |

## Outputs

After deployment:

- `BucketName`: S3 bucket name (for deployment scripts)
- `DistributionId`: CloudFront distribution ID (for cache invalidation)
- `DistributionDomainName`: CloudFront domain (d123.cloudfront.net)
- `WebsiteURL`: Final website URL (https://map.zerowastefrankfurt.de)

## Testing

Run unit tests:

```bash
npm test
```

Tests verify:
- S3 bucket creation with correct security settings
- CloudFront distribution configuration
- Custom domain and HTTPS setup
- Origin Access Control (OAC) configuration
- SPA routing (404 → index.html)
- Caching policies

## Cost Estimation

**Monthly costs (low-medium traffic):**

- CloudFront: ~$1-5 (data transfer + requests)
- S3: ~$0.10 (storage + requests)
- ACM: Free
- **Total:** ~$1-6/month

Higher traffic will increase CloudFront costs proportionally.

## Security

- **S3 Bucket:** Private (no public access)
- **Access Method:** CloudFront OAC only (not legacy OAI)
- **Encryption:** S3-managed (AES-256)
- **HTTPS:** Required (HTTP redirects to HTTPS)
- **TLS Version:** Minimum TLS 1.2
- **Bucket Policy:** Scoped to specific CloudFront distribution

## Troubleshooting

### Deployment fails with "Certificate not found"

Ensure certificate is in **us-east-1** region (CloudFront requirement).

### "Access Denied" when accessing S3

Verify:
1. OAC is created
2. Bucket policy allows CloudFront service principal
3. Policy condition matches distribution ARN

### CDK bootstrap fails

Run in correct region:

```bash
cdk bootstrap aws://ACCOUNT_ID/eu-central-1
```

### Tests fail

Ensure dependencies are installed:

```bash
npm install
npm test
```

## Development Workflow

1. Make changes to `lib/frontend-stack.ts`
2. Update tests in `test/frontend-stack.test.ts`
3. Run tests: `npm test`
4. Synthesize: `npx cdk synth`
5. Deploy: `npx cdk deploy`

## CI/CD Integration

This stack is deployed automatically via GitHub Actions when code is merged to `main`. See `../.github/workflows/deploy.yml`.

## Useful CDK Commands

- `cdk ls` - List all stacks
- `cdk synth` - Synthesize CloudFormation template
- `cdk diff` - Compare deployed vs local changes
- `cdk deploy` - Deploy stack to AWS
- `cdk destroy` - Remove stack from AWS
- `cdk doctor` - Check CDK environment

## References

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [CloudFront OAC Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [ACM Certificate Validation](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html)

---

**Stack Name:** ZeroWasteFrankfurtStack
**Region:** eu-central-1
**Domain:** map.zerowastefrankfurt.de
