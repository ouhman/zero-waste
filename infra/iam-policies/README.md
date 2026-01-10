# IAM Policies for Zero Waste Frankfurt Deployment

Minimal IAM policies for the `zerowaste-map-deployer` user.

## Policies (2 inline policies)

| Policy | Purpose | ~Size |
|--------|---------|-------|
| `cdk-core-policy.json` | CDK bootstrap, CloudFormation, SSM | ~900 chars |
| `zerowaste-resources-policy.json` | S3, CloudFront, SES, IAM user | ~700 chars |

## Setup via AWS Console

1. **IAM → Users → zerowaste-map-deployer → Permissions**
2. Click **Add permissions → Create inline policy → JSON**
3. Paste `cdk-core-policy.json` → Name: `CDKCore`
4. Repeat for `zerowaste-resources-policy.json` → Name: `ZeroWasteResources`

## Resource Scoping

- **Region:** `eu-central-1`
- **Stacks:** `ZeroWaste*`, `CDKToolkit`
- **S3:** `cdk-*`, `zerowaste-*`
- **SES:** `zerowastefrankfurt.de`
- **IAM user:** `zerowaste-ses-user`

## Verify

```bash
export AWS_PROFILE=zerowaste-map-deployer
aws sts get-caller-identity
```
