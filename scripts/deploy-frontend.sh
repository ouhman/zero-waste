#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Deploying Zero Waste Frankfurt frontend...${NC}"

# Check AWS profile
export AWS_PROFILE=zerowaste-map-deployer

# Get S3 bucket and CloudFront distribution from CDK outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name ZeroWasteFrankfurtStack \
  --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
  --output text \
  --region eu-central-1)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name ZeroWasteFrankfurtStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
  --output text \
  --region eu-central-1)

if [ -z "$BUCKET_NAME" ] || [ -z "$DISTRIBUTION_ID" ]; then
  echo -e "${RED}❌ Failed to get bucket name or distribution ID from CloudFormation${NC}"
  exit 1
fi

echo -e "${GREEN}📦 Bucket: ${BUCKET_NAME}${NC}"
echo -e "${GREEN}🌐 Distribution: ${DISTRIBUTION_ID}${NC}"

# Build the app
echo -e "${YELLOW}📦 Building...${NC}"
npm run build

# Sync to S3
echo -e "${YELLOW}☁️  Uploading to S3...${NC}"
aws s3 sync dist/ "s3://${BUCKET_NAME}/" --delete

# Invalidate only index.html (JS/CSS files have content hashes)
echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/index.html" "/" \
  --query 'Invalidation.Id' \
  --output text

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌍 https://map.zerowastefrankfurt.de${NC}"
