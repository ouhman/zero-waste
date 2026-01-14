#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Deploying Zero Waste Frankfurt frontend...${NC}"

# Source .env.production if it exists
if [ -f ".env.production" ]; then
  echo -e "${GREEN}📄 Loading .env.production${NC}"
  set -a
  source .env.production
  set +a
fi

# Validate required environment variables
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}❌ Error: Missing required environment variables${NC}"
  echo ""
  echo "Either create .env.production or export these variables:"
  echo "  - VITE_SUPABASE_URL"
  echo "  - VITE_SUPABASE_ANON_KEY"
  echo ""
  exit 1
fi

# Show which environment is being deployed
echo -e "${GREEN}📍 Environment Configuration:${NC}"
echo -e "   Supabase URL: ${VITE_SUPABASE_URL}"
if [[ "$VITE_SUPABASE_URL" == *"rivleprddnvqgigxjyuc"* ]]; then
  echo -e "   ${GREEN}✅ Deploying to PRODUCTION${NC}"
elif [[ "$VITE_SUPABASE_URL" == *"lccpndhssuemudzpfvvg"* ]]; then
  echo -e "   ${YELLOW}⚠️  Deploying to DEVELOPMENT${NC}"
else
  echo -e "   ${YELLOW}⚠️  Unknown environment${NC}"
fi
echo ""

# AWS configuration
export AWS_PROFILE=zerowaste-map-deployer
export AWS_PAGER=""  # Disable pagination (no need to press 'q')

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
