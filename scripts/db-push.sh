#!/bin/bash

# Safe Supabase DB Push Script
# Shows which environment is targeted and requires confirmation

set -e

# Project references
DEV_PROJECT="lccpndhssuemudzpfvvg"
PROD_PROJECT="rivleprddnvqgigxjyuc"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if project is linked
PROJECT_REF_FILE="supabase/.temp/project-ref"
if [ ! -f "$PROJECT_REF_FILE" ]; then
    echo -e "${YELLOW}No project linked. Linking to DEV...${NC}"
    npx supabase link --project-ref "$DEV_PROJECT"
fi

# Get current project ref
CURRENT_REF=$(cat "$PROJECT_REF_FILE")

# Determine environment
if [ "$CURRENT_REF" = "$DEV_PROJECT" ]; then
    ENV_NAME="DEV"
    ENV_COLOR="$GREEN"
elif [ "$CURRENT_REF" = "$PROD_PROJECT" ]; then
    ENV_NAME="PRODUCTION"
    ENV_COLOR="$RED"
else
    ENV_NAME="UNKNOWN"
    ENV_COLOR="$YELLOW"
fi

echo ""
echo "======================================"
echo -e "  Target: ${ENV_COLOR}${ENV_NAME}${NC}"
echo "  Project: $CURRENT_REF"
echo "======================================"
echo ""

# If production, show big warning
if [ "$ENV_NAME" = "PRODUCTION" ]; then
    echo -e "${RED}  ⚠️  WARNING: You are about to push to PRODUCTION!${NC}"
    echo ""
    read -p "  Are you SURE? Type 'yes-prod' to confirm: " CONFIRM
    if [ "$CONFIRM" != "yes-prod" ]; then
        echo ""
        echo -e "${YELLOW}Aborted. To push to DEV instead:${NC}"
        echo "  npx supabase link --project-ref $DEV_PROJECT"
        echo "  npm run db:push"
        exit 1
    fi
else
    read -p "  Push migrations to $ENV_NAME? [y/N] " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

echo ""
echo "Pushing migrations..."
npx supabase db push

echo ""
echo -e "${GREEN}Done!${NC}"
