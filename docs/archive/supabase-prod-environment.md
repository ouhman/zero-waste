# Supabase Production Environment Setup

**Created:** 2026-01-14
**Completed:** 2026-01-14
**Status:** ✅ COMPLETED
**Approach:** New Production Project + Current Project becomes Development

## Problem Statement

Currently, all database migrations are applied directly to the production Supabase project without any ability to validate them beforehand. This creates risk of:
- Breaking production with faulty migrations
- No way to test Edge Functions against a dev database
- No safe environment for testing RLS policies
- Potential data loss from migration errors

Additionally, the current project was created during initial development and may not have optimal configuration.

## Solution Overview

1. Create a **new** Supabase project in Frankfurt for **PRODUCTION**
2. Keep the **current** project as **DEVELOPMENT**
3. Migrate existing data from current → new production (one-time)
4. Set up proper environment configuration
5. Configure GitHub Actions for deployment workflows

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Development Flow                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   Local Development              Production Deployment            │
│   ┌─────────────────┐           ┌─────────────────┐              │
│   │  CURRENT Proj   │  deploy   │   NEW Project   │              │
│   │  (DEV)          │  ──────→  │  (PRODUCTION)   │              │
│   │  .env.local     │  when     │  Frankfurt      │              │
│   │                 │  ready    │  eu-central-1   │              │
│   └─────────────────┘           └─────────────────┘              │
│                                                                   │
│   - npm run dev                 - GitHub Actions deploy           │
│   - Test migrations             - Frontend via CloudFront         │
│   - Test Edge Functions         - Supabase migrations             │
│   - Safe to break               - Edge Functions                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Phase Summary

| Phase | Description | Estimated Context |
|-------|-------------|-------------------|
| 1 | Supabase CLI Initialization | ~30k tokens |
| 2 | Create Production Supabase Project | ~25k tokens |
| 3 | Data Migration | ~40k tokens |
| 4 | Environment Configuration | ~35k tokens |
| 5 | GitHub Actions Workflows | ~45k tokens |
| 6 | Frontend Deployment Update | ~25k tokens |
| 7 | Documentation & Testing | ~30k tokens |

---

# Phase 1: Supabase CLI Initialization

**Prerequisites:** Supabase CLI installed (`npm install -g supabase`)

## Objectives
- Initialize Supabase CLI configuration
- Link to current project (will become dev)
- Pull current schema as migration baseline
- Create development seed data

## Tasks

### 1.1 Initialize Supabase Project

```bash
cd /home/ouhman/projects/zerowaste-frankfurt
npx supabase init
```

This creates `supabase/config.toml` with default settings.

### 1.2 Configure config.toml

Create/update `supabase/config.toml`:

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[db.pooler]
enabled = false
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100

[studio]
enabled = true
port = 54323
api_url = "http://127.0.0.1"

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[storage]
enabled = true
file_size_limit = "50MiB"

[auth]
enabled = true
site_url = "http://127.0.0.1:5173"
additional_redirect_urls = ["https://map.zerowastefrankfurt.de"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = false
enable_anonymous_sign_ins = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false

[auth.sms]
enable_signup = false
enable_confirmations = false

[auth.external.google]
enabled = false

[edge_runtime]
enabled = true
policy = "oneshot"

[analytics]
enabled = false
port = 54327
vector_port = 54328
```

### 1.3 Link to Current Project

```bash
# Get your current project ID from Supabase dashboard
# Settings → General → Reference ID

npx supabase link --project-ref CURRENT_PROJECT_ID
```

This will prompt for the database password.

### 1.4 Pull Current Schema

```bash
# Pull the current schema as baseline
npx supabase db pull
```

This creates migration files to match the current database state.

### 1.5 Review Pulled Migrations

Check the generated migrations:
- Verify all tables are captured
- Verify RLS policies are included
- Verify functions and triggers are included

```bash
# List migrations
npx supabase migration list

# Check diff (should be empty if pull was complete)
npx supabase db diff
```

### 1.6 Create Seed Data File

Create `supabase/seed.sql` for development data:

```sql
-- Development seed data for Zero Waste Frankfurt
-- This file is only applied to development environments

-- Insert test categories (if not exists)
INSERT INTO categories (id, name, slug, icon_url)
SELECT
  gen_random_uuid(),
  name,
  slug,
  NULL
FROM (VALUES
  ('Unverpackt', 'unverpackt'),
  ('Second Hand', 'second-hand'),
  ('Repair Café', 'repair-cafe'),
  ('Bio & Regional', 'bio-regional'),
  ('Zero Waste Shop', 'zero-waste-shop')
) AS t(name, slug)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = t.slug);

-- Insert test locations
INSERT INTO locations (
  id, name, slug, address, city, suburb, lat, lng,
  description, status, created_at
)
SELECT
  gen_random_uuid(),
  'Test Location ' || i,
  'test-location-' || i || '-frankfurt-am-main',
  'Teststraße ' || i,
  'Frankfurt am Main',
  'Bockenheim',
  50.1109 + (random() * 0.05),
  8.6821 + (random() * 0.05),
  'Test location for development',
  'approved',
  NOW()
FROM generate_series(1, 5) AS i
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE slug LIKE 'test-location-%');

-- Link test locations to categories
INSERT INTO location_categories (location_id, category_id)
SELECT l.id, c.id
FROM locations l
CROSS JOIN categories c
WHERE l.slug LIKE 'test-location-%'
AND NOT EXISTS (
  SELECT 1 FROM location_categories lc
  WHERE lc.location_id = l.id AND lc.category_id = c.id
)
LIMIT 10;
```

## Deliverables
- [ ] `supabase/config.toml` configured
- [ ] CLI linked to current project
- [ ] Schema pulled as migrations
- [ ] `supabase/seed.sql` created
- [ ] All migrations tracked and verified

---

# Phase 2: Create Production Supabase Project

**Prerequisites:** Phase 1 complete, Supabase account access

## Objectives
- Create new free-tier Supabase project in Frankfurt
- Apply all migrations
- Deploy Edge Functions
- Configure secrets and storage

## Tasks

### 2.1 Create New Supabase Project (Manual)

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Configure:
   - **Name:** `zerowaste-frankfurt-prod`
   - **Database Password:** Generate strong password, save securely
   - **Region:** `eu-central-1` (Frankfurt) ← IMPORTANT
   - **Pricing Plan:** Free tier
4. Wait for project to be ready (~2 minutes)

### 2.2 Record Project Credentials

Save these values securely (needed for GitHub Secrets and deployment):

```
PROD_SUPABASE_PROJECT_ID=<Reference ID from Settings → General>
PROD_SUPABASE_URL=https://<project-id>.supabase.co
PROD_SUPABASE_ANON_KEY=<from Settings → API → anon public>
PROD_SUPABASE_SERVICE_ROLE_KEY=<from Settings → API → service_role>
PROD_DB_PASSWORD=<your database password>
```

### 2.3 Apply Migrations to Production

```bash
# Link to new production project
npx supabase link --project-ref PROD_PROJECT_ID

# Push all migrations
npx supabase db push
```

### 2.4 Deploy Edge Functions

```bash
# Deploy all Edge Functions to production
npx supabase functions deploy submit-location
npx supabase functions deploy verify-submission
```

### 2.5 Configure Edge Function Secrets

Set the same secrets as current project:

```bash
npx supabase secrets set AWS_ACCESS_KEY_ID=xxx
npx supabase secrets set AWS_SECRET_ACCESS_KEY=xxx
npx supabase secrets set AWS_REGION=eu-central-1
npx supabase secrets set FROM_EMAIL=noreply@zerowastefrankfurt.de
```

### 2.6 Create Storage Buckets

In production Supabase dashboard:
1. Go to Storage
2. Create bucket: `category-icons` (public)
3. Configure same RLS policies as current project

### 2.7 Verify Setup

```bash
# Verify migrations applied
npx supabase migration list

# Check for any drift
npx supabase db diff
```

Compare RLS policies between projects:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Deliverables
- [ ] Production Supabase project created in Frankfurt
- [ ] All credentials documented securely
- [ ] Migrations applied successfully
- [ ] Edge Functions deployed
- [ ] Edge Function secrets configured
- [ ] Storage bucket created with policies
- [ ] RLS policies verified

---

# Phase 3: Data Migration

**Prerequisites:** Phase 2 complete

## Objectives
- Export data from current project
- Transform storage URLs
- Import data to production project
- Verify data integrity

## Data Migration Scope

| Table | Migrate | Notes |
|-------|---------|-------|
| `categories` | ✅ Yes | All categories |
| `locations` | ✅ Yes | All approved locations only |
| `location_categories` | ✅ Yes | Junction table (for migrated locations) |
| `pending_submissions` | ❌ No | Ephemeral verification data |
| Storage: `category-icons` | ✅ Yes | If any custom icons uploaded |
| `auth.users` | ❌ No | Recreate admin manually |

## Tasks

### 3.1 Export Data from Current Project

Create `scripts/export-data.sql`:

```sql
-- Export categories
COPY (
  SELECT id, name, slug, description, icon_url, color, sort_order,
         created_at, description_de, description_en, name_de, name_en
  FROM categories
  ORDER BY sort_order, name
) TO STDOUT WITH CSV HEADER;

-- Export approved locations
COPY (
  SELECT id, name, slug, address, city, suburb, lat, lng,
         description, status, phone, website, email, instagram,
         payment_methods, opening_hours, opening_hours_raw,
         created_at, updated_at, verification_token
  FROM locations
  WHERE status = 'approved'
  ORDER BY created_at
) TO STDOUT WITH CSV HEADER;

-- Export location_categories for approved locations
COPY (
  SELECT lc.location_id, lc.category_id
  FROM location_categories lc
  JOIN locations l ON l.id = lc.location_id
  WHERE l.status = 'approved'
) TO STDOUT WITH CSV HEADER;
```

### 3.2 Create Data Export Script

Create `scripts/migrate-data.sh`:

```bash
#!/bin/bash
set -e

# Configuration
CURRENT_PROJECT_ID="YOUR_CURRENT_PROJECT_ID"
PROD_PROJECT_ID="YOUR_PROD_PROJECT_ID"
EXPORT_DIR="./migration-export"

echo "=== Zero Waste Frankfurt Data Migration ==="
echo ""

# Create export directory
mkdir -p "$EXPORT_DIR"

echo "Step 1: Exporting data from current project..."

# Link to current project
npx supabase link --project-ref "$CURRENT_PROJECT_ID"

# Export categories
echo "  - Exporting categories..."
npx supabase db dump --data-only -t categories > "$EXPORT_DIR/categories.sql"

# Export approved locations
echo "  - Exporting approved locations..."
psql "$DATABASE_URL" -c "\COPY (SELECT * FROM locations WHERE status = 'approved') TO '$EXPORT_DIR/locations.csv' WITH CSV HEADER"

# Export location_categories
echo "  - Exporting location_categories..."
psql "$DATABASE_URL" -c "\COPY (SELECT lc.* FROM location_categories lc JOIN locations l ON l.id = lc.location_id WHERE l.status = 'approved') TO '$EXPORT_DIR/location_categories.csv' WITH CSV HEADER"

echo ""
echo "Step 2: Switching to production project..."

# Link to production project
npx supabase link --project-ref "$PROD_PROJECT_ID"

echo ""
echo "Step 3: Importing data to production..."

# Import in order (respecting foreign keys)
echo "  - Importing categories..."
psql "$DATABASE_URL" -f "$EXPORT_DIR/categories.sql"

echo "  - Importing locations..."
psql "$DATABASE_URL" -c "\COPY locations FROM '$EXPORT_DIR/locations.csv' WITH CSV HEADER"

echo "  - Importing location_categories..."
psql "$DATABASE_URL" -c "\COPY location_categories FROM '$EXPORT_DIR/location_categories.csv' WITH CSV HEADER"

echo ""
echo "=== Migration complete! ==="
echo "Exported files are in: $EXPORT_DIR"
```

### 3.3 Handle Storage Migration (if needed)

If any categories have custom icons uploaded:

```bash
#!/bin/bash
# scripts/migrate-storage.sh

CURRENT_PROJECT_URL="https://CURRENT.supabase.co"
PROD_PROJECT_URL="https://PROD.supabase.co"
BUCKET="category-icons"

# List files in current project storage
# Download each file
# Upload to production project storage
# Update icon_url in categories table

# Note: This may require using the Supabase JS client or REST API
# because CLI doesn't have direct storage copy commands
```

Create `scripts/migrate-storage.ts` for programmatic migration:

```typescript
import { createClient } from '@supabase/supabase-js'

const CURRENT_URL = 'https://CURRENT.supabase.co'
const CURRENT_SERVICE_KEY = 'xxx'
const PROD_URL = 'https://PROD.supabase.co'
const PROD_SERVICE_KEY = 'xxx'

const currentClient = createClient(CURRENT_URL, CURRENT_SERVICE_KEY)
const prodClient = createClient(PROD_URL, PROD_SERVICE_KEY)

async function migrateStorage() {
  // List all files in category-icons bucket
  const { data: files, error } = await currentClient.storage
    .from('category-icons')
    .list()

  if (error || !files) {
    console.log('No files to migrate or error:', error)
    return
  }

  for (const file of files) {
    console.log(`Migrating: ${file.name}`)

    // Download from current
    const { data: fileData } = await currentClient.storage
      .from('category-icons')
      .download(file.name)

    if (!fileData) continue

    // Upload to production
    await prodClient.storage
      .from('category-icons')
      .upload(file.name, fileData, { upsert: true })
  }

  // Update icon_url values in production to point to new storage
  const { data: categories } = await prodClient
    .from('categories')
    .select('id, slug, icon_url')
    .not('icon_url', 'is', null)

  if (categories) {
    for (const cat of categories) {
      if (cat.icon_url?.includes(CURRENT_URL)) {
        const newUrl = cat.icon_url.replace(CURRENT_URL, PROD_URL)
        await prodClient
          .from('categories')
          .update({ icon_url: newUrl })
          .eq('id', cat.id)
        console.log(`Updated icon_url for ${cat.slug}`)
      }
    }
  }

  console.log('Storage migration complete!')
}

migrateStorage()
```

### 3.4 Verify Data Integrity

Run verification queries on both projects:

```sql
-- Count comparison
SELECT 'categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'locations', COUNT(*) FROM locations WHERE status = 'approved'
UNION ALL
SELECT 'location_categories', COUNT(*) FROM location_categories lc
  JOIN locations l ON l.id = lc.location_id WHERE l.status = 'approved';

-- Sample data check
SELECT name, slug, city FROM locations LIMIT 5;

-- Check category icons
SELECT slug, icon_url FROM categories WHERE icon_url IS NOT NULL;
```

### 3.5 Create Admin User in Production

After migration, create admin user:

1. Go to Production Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Enter admin email address
4. Run SQL in Production SQL Editor:

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@zerowastefrankfurt.de';
```

## Deliverables
- [ ] Export scripts created
- [ ] Categories exported and imported
- [ ] Approved locations exported and imported
- [ ] Location-category relationships migrated
- [ ] Storage files migrated (if any)
- [ ] icon_url values updated (if any)
- [ ] Data counts verified
- [ ] Admin user created in production

---

# Phase 4: Environment Configuration

**Prerequisites:** Phase 3 complete

## Objectives
- Create environment-specific configurations
- Update frontend for multi-environment support
- Set up .env templates

## Tasks

### 4.1 Create Environment Files

Create `.env.example`:

```bash
# Copy this to .env and fill in your values
# For local development, use the DEV project credentials

VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Explicitly set environment (auto-detected from URL in production)
# VITE_ENVIRONMENT=development
```

Create `.env.development.local.example`:

```bash
# Local development configuration
# Copy to .env or .env.local

# DEV Supabase Project (current project)
VITE_SUPABASE_URL=https://CURRENT_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key

# Analytics (optional for dev)
# VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4.2 Update .gitignore

Ensure these are in `.gitignore`:

```gitignore
# Environment files with secrets
.env
.env.local
.env.*.local

# Keep example files
!.env.example
!.env.*.example

# Migration exports
migration-export/
```

### 4.3 Update Supabase Client (if needed)

Check current `src/lib/supabase.ts` for any changes needed:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Environment detection based on URL
export const isProduction = supabaseUrl.includes('PROD_PROJECT_ID')
export const isDevelopment = !isProduction

// Log environment in development (for debugging)
if (isDevelopment && import.meta.env.DEV) {
  console.log('[Supabase] Connected to DEVELOPMENT environment')
}
```

### 4.4 Create Environment Badge Component

Create `src/components/common/EnvironmentBadge.vue`:

```vue
<script setup lang="ts">
import { isDevelopment } from '@/lib/supabase'
</script>

<template>
  <div
    v-if="isDevelopment"
    class="fixed bottom-4 left-4 z-50 rounded bg-amber-500 px-2 py-1 text-xs font-bold text-white shadow-lg"
  >
    DEV
  </div>
</template>
```

Add to `App.vue`:

```vue
<script setup lang="ts">
import EnvironmentBadge from '@/components/common/EnvironmentBadge.vue'
// ... other imports
</script>

<template>
  <RouterView />
  <ToastContainer />
  <EnvironmentBadge />
</template>
```

### 4.5 Document Environment Variables for Deployment

Create reference for deployment:

**Local Development (.env):**
```
VITE_SUPABASE_URL=https://CURRENT_PROJECT.supabase.co  ← DEV
VITE_SUPABASE_ANON_KEY=dev-anon-key
```

**Production Deployment (GitHub Secrets / Build):**
```
VITE_SUPABASE_URL=https://PROD_PROJECT.supabase.co     ← PROD
VITE_SUPABASE_ANON_KEY=prod-anon-key
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Deliverables
- [ ] `.env.example` created
- [ ] `.env.development.local.example` created
- [ ] `.gitignore` updated
- [ ] Supabase client updated with environment detection
- [ ] Environment badge component created
- [ ] Environment variables documented

---

# Phase 5: GitHub Actions Workflows

**Prerequisites:** Phase 4 complete, GitHub repo access

## Objectives
- Create migration validation workflow for PRs
- Create production deployment workflow
- Document required GitHub secrets

## Tasks

### 5.1 Create Migration Validation Workflow

Create `.github/workflows/validate-migrations.yml`:

```yaml
name: Validate Migrations

on:
  pull_request:
    paths:
      - 'supabase/migrations/**'
      - 'supabase/config.toml'

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Validate migration files
        run: |
          echo "Checking migration file naming convention..."
          for file in supabase/migrations/*.sql; do
            [ -e "$file" ] || continue
            filename=$(basename "$file")
            if ! [[ $filename =~ ^[0-9]{14}_[a-z_]+\.sql$ ]]; then
              echo "ERROR: Invalid migration filename: $filename"
              echo "Expected format: YYYYMMDDHHMMSS_description.sql"
              exit 1
            fi
          done
          echo "All migration filenames are valid!"

      - name: Check for dangerous operations
        run: |
          echo "Checking for dangerous SQL operations..."
          for file in supabase/migrations/*.sql; do
            [ -e "$file" ] || continue
            if grep -qiE "DROP\s+DATABASE|DROP\s+SCHEMA\s+public|TRUNCATE" "$file"; then
              echo "ERROR: Dangerous operation detected in $file"
              exit 1
            fi
          done
          echo "No dangerous operations found!"

      - name: Summary
        run: |
          echo "### Migration Validation Passed ✅" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Files validated:** $(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)" >> $GITHUB_STEP_SUMMARY
```

### 5.2 Create Database Deployment Workflow

Create `.github/workflows/deploy-database.yml`:

```yaml
name: Deploy Database

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/migrations/**'
      - 'supabase/functions/**'

  workflow_dispatch:
    inputs:
      deploy_functions:
        description: 'Deploy Edge Functions'
        required: false
        default: 'true'
        type: boolean

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link to production project
        run: |
          supabase link --project-ref ${{ secrets.PROD_SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Push migrations
        run: |
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.PROD_DB_PASSWORD }}

      - name: Deploy Edge Functions
        if: ${{ github.event.inputs.deploy_functions != 'false' }}
        run: |
          supabase functions deploy submit-location
          supabase functions deploy verify-submission
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Deployment summary
        run: |
          echo "### Production Deployment Complete 🚀" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Branch:** main" >> $GITHUB_STEP_SUMMARY
          echo "**Migrations:** Applied" >> $GITHUB_STEP_SUMMARY
          echo "**Edge Functions:** Deployed" >> $GITHUB_STEP_SUMMARY
```

### 5.3 Update CI Workflow

Update `.github/workflows/ci.yml` if it exists, or create it:

```yaml
name: CI

on:
  pull_request:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run type-check

      - name: Run tests
        run: npm run test

      - name: Build application
        run: npm run build
        env:
          VITE_SUPABASE_URL: https://example.supabase.co
          VITE_SUPABASE_ANON_KEY: example-key-for-build

  validate-migrations:
    runs-on: ubuntu-latest
    if: contains(github.event.pull_request.changed_files, 'supabase/')

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Validate migrations
        run: |
          for file in supabase/migrations/*.sql; do
            [ -e "$file" ] || continue
            filename=$(basename "$file")
            if ! [[ $filename =~ ^[0-9]{14}_[a-z_]+\.sql$ ]]; then
              echo "::error::Invalid migration filename: $filename"
              exit 1
            fi
          done
```

### 5.4 Document Required GitHub Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SUPABASE_ACCESS_TOKEN` | Personal access token | Supabase Dashboard → Account → Access Tokens |
| `PROD_SUPABASE_PROJECT_ID` | Production project ID | Prod project → Settings → General → Reference ID |
| `PROD_DB_PASSWORD` | Production DB password | The password set when creating production project |

### 5.5 Create GitHub Environment

In GitHub repository settings:

1. Go to Settings → Environments
2. Create `production` environment
3. (Optional) Add required reviewers for extra safety
4. Add the secrets above to this environment

## Deliverables
- [x] `.github/workflows/validate-migrations.yml` created
- [x] `.github/workflows/deploy-database.yml` created
- [x] `.github/workflows/ci.yml` updated
- [x] GitHub secrets documented (`docs/plans/github-secrets.md`)
- [ ] GitHub environment created (requires manual setup by maintainer)

---

# Phase 6: Frontend Deployment Update

**Prerequisites:** Phase 5 complete

## Objectives
- Update frontend deployment to use production Supabase
- Update CloudFront/S3 deployment script
- Verify production deployment

## Tasks

### 6.1 Update Deploy Script

Update `scripts/deploy-frontend.sh`:

```bash
#!/bin/bash
set -e

# Ensure production environment variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set"
  echo ""
  echo "For production deployment, set:"
  echo "  export VITE_SUPABASE_URL=https://PROD_PROJECT.supabase.co"
  echo "  export VITE_SUPABASE_ANON_KEY=your-prod-anon-key"
  exit 1
fi

echo "=== Deploying to Production ==="
echo "Supabase URL: $VITE_SUPABASE_URL"
echo ""

# Build
echo "Building..."
npm run build

# Deploy to S3
echo "Deploying to S3..."
aws s3 sync dist/ s3://zerowaste-frankfurt-frontend/ --delete

# Invalidate CloudFront
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/index.html"

echo ""
echo "=== Deployment Complete ==="
echo "Live URL: https://map.zerowastefrankfurt.de"
```

### 6.2 Create Production Deployment Checklist

Before deploying to production with new Supabase project:

1. [ ] All data migrated and verified
2. [ ] Edge Functions deployed and secrets set
3. [ ] Admin user created in production
4. [ ] Test Edge Functions work (submit a test location)
5. [ ] Export production env vars:
   ```bash
   export VITE_SUPABASE_URL=https://PROD_PROJECT.supabase.co
   export VITE_SUPABASE_ANON_KEY=prod-anon-key
   export VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   export AWS_PROFILE=zerowaste-map-deployer
   ```
6. [ ] Run deployment:
   ```bash
   npm run deploy:frontend
   ```
7. [ ] Verify site works at https://map.zerowastefrankfurt.de
8. [ ] Test admin login
9. [ ] Test location submission flow

### 6.3 Update GitHub Actions Frontend Deployment (Optional)

If you want automated frontend deployment, create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'public/**'
      - 'index.html'
      - 'vite.config.ts'
      - 'package.json'

  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.PROD_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.PROD_SUPABASE_ANON_KEY }}
          VITE_GA_MEASUREMENT_ID: ${{ secrets.VITE_GA_MEASUREMENT_ID }}

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-central-1

      - name: Deploy to S3
        run: aws s3 sync dist/ s3://zerowaste-frankfurt-frontend/ --delete

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/index.html"
```

## Deliverables
- [ ] Deploy script updated
- [ ] Production deployment checklist created
- [ ] (Optional) GitHub Actions frontend deployment created
- [ ] Production deployment verified

---

# Phase 7: Documentation & Testing

**Prerequisites:** Phase 6 complete

## Objectives
- Update project documentation
- Test full workflow end-to-end
- Create troubleshooting guide

## Tasks

### 7.1 Update CLAUDE.md

Add to CLAUDE.md:

```markdown
## Development Environment

This project uses separate Supabase projects for development and production.

### Environments

| Environment | Project | Usage |
|-------------|---------|-------|
| Development | zerowaste-frankfurt (current) | Local dev, testing |
| Production | zerowaste-frankfurt-prod | Live site |

### Local Development

1. Copy `.env.example` to `.env`
2. Fill in DEV project credentials (current project)
3. Run `npm run dev`

### Database Migrations

```bash
# Create new migration
npx supabase migration new migration_name

# Test locally (link to dev project)
npx supabase link --project-ref DEV_PROJECT_ID
npx supabase db push

# Production deployment happens via GitHub Actions on merge to main
```

### Edge Functions

```bash
# Deploy to dev for testing
npx supabase link --project-ref DEV_PROJECT_ID
npx supabase functions deploy function-name

# Production deployment happens via GitHub Actions on merge to main
```

See `docs/dev-environment.md` for detailed guide.
```

### 7.2 Create Development Environment Guide

Create `docs/dev-environment.md`:

```markdown
# Development Environment Guide

## Overview

| Environment | Supabase Project | Branch | Usage |
|-------------|------------------|--------|-------|
| Development | zerowaste-frankfurt | any | Local development, testing |
| Production | zerowaste-frankfurt-prod | main | Live site |

## Getting Started

### 1. Clone and Setup

```bash
git clone <repo>
cd zerowaste-frankfurt
npm install
```

### 2. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit with DEV credentials (get from Supabase dashboard)
# VITE_SUPABASE_URL=https://DEV_PROJECT.supabase.co
# VITE_SUPABASE_ANON_KEY=your-dev-key
```

### 3. Run Development Server

```bash
npm run dev
```

You should see a "DEV" badge in the bottom-left corner.

## Database Workflow

### Creating a Migration

```bash
# Create migration file
npx supabase migration new add_new_feature

# Edit the file in supabase/migrations/
# Test by pushing to dev project
npx supabase link --project-ref DEV_PROJECT_ID
npx supabase db push
```

### Migration Naming Convention

Format: `YYYYMMDDHHMMSS_description.sql`
- Use lowercase
- Use underscores for spaces
- Be descriptive

Examples:
- `20260114120000_add_user_preferences.sql`
- `20260114130000_update_location_schema.sql`

### Deploying to Production

1. Push your changes to a feature branch
2. Create PR to `main`
3. CI validates migrations
4. Merge to `main`
5. GitHub Actions automatically deploys migrations to production

## Edge Functions

### Local Development

```bash
# Link to dev project
npx supabase link --project-ref DEV_PROJECT_ID

# Deploy function
npx supabase functions deploy function-name

# View logs
npx supabase functions logs function-name
```

### Secrets

Dev and prod have separate secrets. Set them per-project:

```bash
npx supabase secrets set KEY=value
npx supabase secrets list
```

## Troubleshooting

### Migration Failed

1. Check error in GitHub Actions log
2. Fix the SQL
3. Push fix commit

### Can't Connect to Supabase

1. Verify `.env` has correct values
2. Check Supabase dashboard - project might be paused (free tier)
3. Verify you're using DEV credentials for local dev

### Edge Function Not Working

```bash
# Check logs
npx supabase functions logs function-name --tail

# Verify secrets
npx supabase secrets list
```
```

### 7.3 Test Full Workflow

1. **Test local development:**
   - Verify `.env` points to DEV project
   - Run `npm run dev`
   - Verify DEV badge shows
   - Test basic functionality

2. **Test migration workflow:**
   ```bash
   # Create test migration
   supabase migration new test_workflow

   # Add harmless SQL
   echo "COMMENT ON TABLE locations IS 'Test comment';" > supabase/migrations/$(date +%Y%m%d%H%M%S)_test_workflow.sql

   # Push to dev
   supabase link --project-ref DEV_PROJECT_ID
   supabase db push

   # Verify in Supabase dashboard
   ```

3. **Test production site:**
   - Visit https://map.zerowastefrankfurt.de
   - Verify all locations display
   - Test admin login
   - Test location submission

### 7.4 Clean Up Test Migration

```bash
# Create cleanup migration
npx supabase migration new remove_test_comment

# Content: COMMENT ON TABLE locations IS NULL;

# Push to both environments
```

## Deliverables
- [ ] CLAUDE.md updated with environment section
- [ ] `docs/dev-environment.md` created
- [ ] Local development tested
- [ ] Migration workflow tested
- [ ] Production site verified
- [ ] Test migration cleaned up

---

# Appendix A: GitHub Secrets Reference

| Secret | Environment | Description |
|--------|-------------|-------------|
| `SUPABASE_ACCESS_TOKEN` | All | Personal access token from Supabase account |
| `PROD_SUPABASE_PROJECT_ID` | production | Production project reference ID |
| `PROD_SUPABASE_URL` | production | `https://xxx.supabase.co` |
| `PROD_SUPABASE_ANON_KEY` | production | Production anon/public key |
| `PROD_DB_PASSWORD` | production | Production database password |
| `AWS_ACCESS_KEY_ID` | production | For S3/CloudFront deployment |
| `AWS_SECRET_ACCESS_KEY` | production | For S3/CloudFront deployment |
| `CLOUDFRONT_DISTRIBUTION_ID` | production | CloudFront distribution ID |
| `VITE_GA_MEASUREMENT_ID` | production | Google Analytics ID |

---

# Appendix B: Security Checklist

- [ ] Production database password stored securely
- [ ] GitHub secrets encrypted (never in code)
- [ ] Service role keys never in client code
- [ ] `.env` files in `.gitignore`
- [ ] Admin users created manually (not via migration)
- [ ] RLS policies identical in dev and prod
- [ ] Edge Function secrets set in both environments

---

# Appendix C: Rollback Procedure

If a production deployment causes issues:

1. **Identify the problem**
   - Check GitHub Actions logs
   - Check Supabase dashboard logs

2. **Create rollback migration**
   ```bash
   supabase migration new rollback_problem
   ```

3. **Write reversal SQL**
   - DROP added tables/columns
   - Restore removed data (if backed up)
   - Revert schema changes

4. **Test in dev first**
   ```bash
   supabase link --project-ref DEV_PROJECT_ID
   supabase db push
   ```

5. **Deploy to production**
   - Push to main branch
   - GitHub Actions deploys rollback

**Warning:** Some operations can't be easily rolled back (data deletion, column drops). Always backup before risky migrations.

---

# Appendix D: Quick Reference

```bash
# Link to dev
npx supabase link --project-ref DEV_PROJECT_ID

# Link to prod
npx supabase link --project-ref PROD_PROJECT_ID

# Create migration
npx supabase migration new name_here

# Push migrations
npx supabase db push

# Deploy Edge Function
npx supabase functions deploy function-name

# View function logs
npx supabase functions logs function-name --tail

# List secrets
npx supabase secrets list

# Set secret
npx supabase secrets set KEY=value
```
