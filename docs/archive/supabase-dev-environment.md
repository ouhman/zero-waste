# Supabase Development Environment Setup

**Created:** 2026-01-13
**Status:** ⚠️ SUPERSEDED
**Approach:** Separate Free Supabase Project for Development

> **Note:** This plan was superseded on 2026-01-14 by `supabase-prod-environment.md`.
>
> **Reason:** The original approach created a new DEV project while keeping the current project as PROD. The revised approach flips this: create a new PRODUCTION project (in Frankfurt) and keep the current project as DEV. This better aligns with the goal of having a fresh, properly configured production environment.
>
> See: [supabase-prod-environment.md](./supabase-prod-environment.md)

## Problem Statement

Currently, all database migrations are applied directly to the production Supabase project without any ability to validate them beforehand. This creates risk of:
- Breaking production with faulty migrations
- No way to test Edge Functions against a dev database
- No safe environment for testing RLS policies
- Potential data loss from migration errors

## Solution Overview

Create a separate free-tier Supabase development project with:
1. Proper Supabase CLI initialization
2. Automated migration workflows via GitHub Actions
3. Environment-specific configuration
4. Synced Edge Functions and RLS policies

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Git Repository                           │
├─────────────────────────────────────────────────────────────────┤
│  feature/* branches    develop branch       main branch         │
│         │                   │                    │              │
│         │                   ▼                    ▼              │
│         │         ┌─────────────────┐  ┌─────────────────┐     │
│         │         │   Dev Project   │  │  Prod Project   │     │
│         │         │  (Free Tier)    │  │  (Current)      │     │
│         │         └─────────────────┘  └─────────────────┘     │
│         │                   │                    │              │
│         └───────────────────┤                    │              │
│                             │                    │              │
│  PR Check: validate         │                    │              │
│  migrations syntax    Deploy migrations    Deploy migrations    │
│                       + Edge Functions     + Edge Functions     │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow

1. **Feature Development**: Create branch from `develop`, write migrations
2. **PR to develop**: CI validates migration syntax
3. **Merge to develop**: Migrations auto-deploy to dev project
4. **Test in dev**: Verify changes work correctly
5. **PR to main**: Review changes, ensure dev testing passed
6. **Merge to main**: Migrations auto-deploy to production

---

# Phase 1: Supabase CLI Initialization

**Estimated context:** ~40k tokens
**Prerequisites:** Supabase CLI installed

## Objectives
- Initialize Supabase CLI configuration
- Link to production project
- Pull current production schema
- Create development seed data

## Tasks

### 1.1 Initialize Supabase Project

```bash
cd /home/ouhman/projects/zerowaste-frankfurt
supabase init
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

# Development project configuration (used by CLI)
[remotes.development]
project_id = "YOUR_DEV_PROJECT_ID"

[remotes.production]
project_id = "YOUR_PROD_PROJECT_ID"
```

### 1.3 Link to Production Project

```bash
# Get your production project ID from Supabase dashboard
# Settings → General → Reference ID

supabase link --project-ref YOUR_PROD_PROJECT_ID
```

This will prompt for the database password.

### 1.4 Pull Current Schema

```bash
# Pull the current production schema as baseline
supabase db pull
```

This creates/updates migration files to match production.

### 1.5 Create Seed Data File

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

### 1.6 Verify Setup

```bash
# List migrations
supabase migration list

# Check remote connection
supabase db diff
```

## Deliverables
- [ ] `supabase/config.toml` configured
- [ ] CLI linked to production project
- [ ] Production schema pulled
- [ ] `supabase/seed.sql` created
- [ ] All migrations tracked

---

# Phase 2: Create Development Supabase Project

**Estimated context:** ~35k tokens
**Prerequisites:** Phase 1 complete, Supabase account access

## Objectives
- Create new free-tier Supabase project
- Apply all migrations
- Deploy Edge Functions
- Configure RLS policies

## Tasks

### 2.1 Create New Supabase Project (Manual)

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Configure:
   - **Name:** `zerowaste-frankfurt-dev`
   - **Database Password:** Generate strong password, save securely
   - **Region:** `eu-central-1` (Frankfurt) - same as production
   - **Pricing Plan:** Free tier
4. Wait for project to be ready (~2 minutes)

### 2.2 Record Project Credentials

Save these values (will be needed for GitHub Secrets):

```
DEV_SUPABASE_PROJECT_ID=<Reference ID from Settings → General>
DEV_SUPABASE_URL=https://<project-id>.supabase.co
DEV_SUPABASE_ANON_KEY=<from Settings → API → anon public>
DEV_SUPABASE_SERVICE_ROLE_KEY=<from Settings → API → service_role>
DEV_DB_PASSWORD=<your database password>
```

### 2.3 Apply Migrations to Dev Project

```bash
# Link to dev project temporarily
supabase link --project-ref YOUR_DEV_PROJECT_ID

# Push all migrations
supabase db push

# Apply seed data
supabase db seed
```

### 2.4 Deploy Edge Functions to Dev

```bash
# Deploy all Edge Functions to dev project
supabase functions deploy submit-location
supabase functions deploy verify-submission
```

### 2.5 Configure Edge Function Secrets

Set the same secrets as production:

```bash
supabase secrets set AWS_ACCESS_KEY_ID=xxx
supabase secrets set AWS_SECRET_ACCESS_KEY=xxx
supabase secrets set AWS_REGION=eu-central-1
supabase secrets set FROM_EMAIL=noreply@zerowastefrankfurt.de
```

**Note:** For dev, consider using a test email or Supabase's built-in Inbucket for email testing.

### 2.6 Verify RLS Policies

Run this query in both dev and prod to compare:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 2.7 Create Storage Buckets

In dev Supabase dashboard:
1. Go to Storage
2. Create bucket: `category-icons` (public)
3. Set same policies as production

## Deliverables
- [ ] Dev Supabase project created
- [ ] All credentials documented securely
- [ ] Migrations applied successfully
- [ ] Edge Functions deployed
- [ ] Edge Function secrets configured
- [ ] Storage buckets created
- [ ] RLS policies verified

---

# Phase 3: Environment Configuration

**Estimated context:** ~40k tokens
**Prerequisites:** Phase 2 complete

## Objectives
- Create environment-specific configurations
- Update frontend for multi-environment support
- Set up .env templates

## Tasks

### 3.1 Create Environment Files

Create `.env.development`:

```bash
# Development Environment - DO NOT COMMIT ACTUAL VALUES
VITE_SUPABASE_URL=https://YOUR_DEV_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key
VITE_ENVIRONMENT=development
```

Create `.env.production`:

```bash
# Production Environment - DO NOT COMMIT ACTUAL VALUES
VITE_SUPABASE_URL=https://YOUR_PROD_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
VITE_ENVIRONMENT=production
```

Create `.env.example`:

```bash
# Copy this to .env and fill in your values
# For development, use the dev project credentials
# For production deployment, GitHub Actions uses secrets

VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Set to 'development' or 'production'
VITE_ENVIRONMENT=development
```

### 3.2 Update .gitignore

Add to `.gitignore`:

```gitignore
# Environment files
.env
.env.local
.env.development.local
.env.production.local

# Keep templates
!.env.example
!.env.development
!.env.production
```

**Note:** `.env.development` and `.env.production` can be committed if they contain only template values, not actual secrets.

### 3.3 Update Supabase Client

Update `src/lib/supabase.ts` to add environment awareness:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const environment = import.meta.env.VITE_ENVIRONMENT || 'development'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Export for debugging/logging purposes
export const isDevelopment = environment === 'development'
export const isProduction = environment === 'production'

// Log environment in development
if (isDevelopment) {
  console.log(`[Supabase] Connected to ${environment} environment`)
}
```

### 3.4 Add Environment Indicator Component (Optional)

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
</script>

<template>
  <RouterView />
  <EnvironmentBadge />
</template>
```

### 3.5 Update Vite Config

Update `vite.config.ts` to handle environments:

```typescript
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode`
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    define: {
      // Make env variables available
      __DEV__: mode === 'development'
    }
  }
})
```

### 3.6 Test Environment Switching

```bash
# Run with development config
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deliverables
- [ ] `.env.example` created
- [ ] `.env.development` template created
- [ ] `.env.production` template created
- [ ] `.gitignore` updated
- [ ] Supabase client updated with environment awareness
- [ ] Environment badge component created
- [ ] Vite config updated
- [ ] Environment switching tested

---

# Phase 4: GitHub Actions Workflows

**Estimated context:** ~50k tokens
**Prerequisites:** Phase 3 complete, GitHub repo access

## Objectives
- Create migration validation workflow for PRs
- Create staging deployment workflow (develop → dev)
- Create production deployment workflow (main → prod)
- Document required GitHub secrets

## Tasks

### 4.1 Create Migration Validation Workflow

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
            filename=$(basename "$file")
            if ! [[ $filename =~ ^[0-9]{14}_[a-z_]+\.sql$ ]]; then
              echo "ERROR: Invalid migration filename: $filename"
              echo "Expected format: YYYYMMDDHHMMSS_description.sql"
              exit 1
            fi
          done
          echo "All migration filenames are valid!"

      - name: Check for syntax errors
        run: |
          echo "Checking SQL syntax..."
          for file in supabase/migrations/*.sql; do
            if ! head -1 "$file" > /dev/null 2>&1; then
              echo "ERROR: Cannot read $file"
              exit 1
            fi
            # Basic syntax checks
            if grep -qE "DROP\s+DATABASE|DROP\s+SCHEMA\s+public" "$file"; then
              echo "ERROR: Dangerous operation detected in $file"
              exit 1
            fi
          done
          echo "SQL syntax checks passed!"

      - name: Summary
        run: |
          echo "### Migration Validation Passed :white_check_mark:" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Files validated:**" >> $GITHUB_STEP_SUMMARY
          ls -1 supabase/migrations/*.sql | wc -l >> $GITHUB_STEP_SUMMARY
```

### 4.2 Create Staging Deployment Workflow

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy to Staging

on:
  push:
    branches:
      - develop
    paths:
      - 'supabase/**'

jobs:
  deploy-db:
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link to staging project
        run: |
          supabase link --project-ref ${{ secrets.DEV_SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Push migrations to staging
        run: |
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.DEV_DB_PASSWORD }}

      - name: Deploy Edge Functions
        run: |
          supabase functions deploy submit-location
          supabase functions deploy verify-submission
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Deployment summary
        run: |
          echo "### Staging Deployment Complete :rocket:" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Project:** ${{ secrets.DEV_SUPABASE_PROJECT_ID }}" >> $GITHUB_STEP_SUMMARY
          echo "**Branch:** develop" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "Migrations and Edge Functions deployed to staging." >> $GITHUB_STEP_SUMMARY
```

### 4.3 Create Production Deployment Workflow

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/**'

jobs:
  deploy-db:
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

      - name: Push migrations to production
        run: |
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.PROD_DB_PASSWORD }}

      - name: Deploy Edge Functions
        run: |
          supabase functions deploy submit-location
          supabase functions deploy verify-submission
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Deployment summary
        run: |
          echo "### Production Deployment Complete :rocket:" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Project:** ${{ secrets.PROD_SUPABASE_PROJECT_ID }}" >> $GITHUB_STEP_SUMMARY
          echo "**Branch:** main" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo ":warning: Migrations applied to PRODUCTION database." >> $GITHUB_STEP_SUMMARY
```

### 4.4 Update Existing CI Workflow

Update `.github/workflows/ci.yml` to include migration validation:

```yaml
name: CI

on:
  pull_request:
    branches:
      - main
      - develop

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
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL || 'https://example.supabase.co' }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY || 'example-key' }}

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
            filename=$(basename "$file")
            if ! [[ $filename =~ ^[0-9]{14}_[a-z_]+\.sql$ ]]; then
              echo "::error::Invalid migration filename: $filename"
              exit 1
            fi
          done
```

### 4.5 Document Required GitHub Secrets

Create documentation for secrets setup:

| Secret Name | Description | Environment |
|-------------|-------------|-------------|
| `SUPABASE_ACCESS_TOKEN` | Personal access token from Supabase dashboard | All |
| `DEV_SUPABASE_PROJECT_ID` | Development project reference ID | Staging |
| `DEV_DB_PASSWORD` | Development database password | Staging |
| `PROD_SUPABASE_PROJECT_ID` | Production project reference ID | Production |
| `PROD_DB_PASSWORD` | Production database password | Production |

### 4.6 Create GitHub Environments

In GitHub repository settings:

1. Go to Settings → Environments
2. Create `staging` environment:
   - No required reviewers (auto-deploy on develop push)
   - Add staging-specific secrets
3. Create `production` environment:
   - Add required reviewers (optional, for extra safety)
   - Add production-specific secrets

## Deliverables
- [ ] `.github/workflows/validate-migrations.yml` created
- [ ] `.github/workflows/deploy-staging.yml` created
- [ ] `.github/workflows/deploy-production.yml` created
- [ ] `.github/workflows/ci.yml` updated
- [ ] GitHub secrets documented
- [ ] GitHub environments created

---

# Phase 5: Documentation & Workflow Testing

**Estimated context:** ~30k tokens
**Prerequisites:** Phases 1-4 complete

## Objectives
- Update project documentation
- Create comprehensive developer guide
- Test full workflow end-to-end
- Create troubleshooting runbook

## Tasks

### 5.1 Create Development Environment Guide

Create `docs/dev-environment.md`:

```markdown
# Development Environment Setup

This guide explains how to work with the Zero Waste Frankfurt development environment.

## Prerequisites

- Node.js 20+
- Supabase CLI (`npm install -g supabase`)
- Access to Supabase dashboard

## Environment Overview

| Environment | Branch | Supabase Project | URL |
|-------------|--------|------------------|-----|
| Development | `develop` | zerowaste-frankfurt-dev | https://xxx.supabase.co |
| Production | `main` | zerowaste-frankfurt | https://yyy.supabase.co |

## Getting Started

### 1. Clone and Setup

\`\`\`bash
git clone <repo>
cd zerowaste-frankfurt
npm install
\`\`\`

### 2. Configure Environment

\`\`\`bash
# Copy environment template
cp .env.example .env

# Edit with your dev credentials
# Get these from Supabase dashboard → Settings → API
\`\`\`

### 3. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

## Database Workflow

### Creating a New Migration

\`\`\`bash
# Create migration file
supabase migration new my_migration_name

# Edit the file in supabase/migrations/

# Test locally (if using Docker)
supabase db reset
\`\`\`

### Migration Naming Convention

Format: `YYYYMMDDHHMMSS_description.sql`

Examples:
- `20260113120000_add_user_preferences.sql`
- `20260113130000_update_location_schema.sql`

### Deployment Flow

1. Create feature branch from `develop`
2. Add migration files
3. Open PR to `develop`
4. CI validates migration syntax
5. Merge to `develop` → auto-deploys to dev Supabase
6. Test in dev environment
7. Open PR from `develop` to `main`
8. Merge to `main` → auto-deploys to production

## Edge Functions

### Deploy to Development

\`\`\`bash
supabase link --project-ref DEV_PROJECT_ID
supabase functions deploy submit-location
\`\`\`

### Deploy to Production

Edge Functions auto-deploy via GitHub Actions when merged to `main`.

## Troubleshooting

### Migration Failed

1. Check the error message in GitHub Actions
2. Fix the SQL syntax
3. Push a fix commit

### Edge Function Not Working

\`\`\`bash
# Check function logs
supabase functions logs submit-location

# Verify secrets are set
supabase secrets list
\`\`\`

### RLS Policy Issues

Compare policies between dev and prod:

\`\`\`sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
\`\`\`
```

### 5.2 Update CLAUDE.md

Add to the existing CLAUDE.md:

```markdown
## Development Environment

This project uses separate Supabase projects for development and production.

### Environments

| Environment | Branch | Project |
|-------------|--------|---------|
| Development | `develop` | zerowaste-frankfurt-dev |
| Production | `main` | zerowaste-frankfurt |

### Workflow

1. Create feature branch from `develop`
2. Write migrations in `supabase/migrations/`
3. PR to `develop` → CI validates, auto-deploys to dev
4. Test in dev environment
5. PR to `main` → deploys to production

### Supabase CLI Commands

\`\`\`bash
# Link to dev project
supabase link --project-ref DEV_PROJECT_ID

# Create new migration
supabase migration new migration_name

# Push migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy function-name
\`\`\`

See `docs/dev-environment.md` for detailed guide.
```

### 5.3 Create develop Branch

```bash
# Create develop branch from main
git checkout main
git pull origin main
git checkout -b develop
git push -u origin develop
```

### 5.4 Test Full Workflow

1. **Create test migration:**
   ```bash
   supabase migration new test_dev_workflow
   ```

2. **Add simple SQL:**
   ```sql
   -- Test migration for dev workflow
   -- This can be safely removed after testing
   COMMENT ON TABLE locations IS 'Sustainable locations in Frankfurt';
   ```

3. **Push to develop:**
   ```bash
   git add supabase/migrations/
   git commit -m "test: verify dev environment workflow"
   git push origin develop
   ```

4. **Verify GitHub Actions:**
   - Check that deploy-staging workflow runs
   - Verify migration applied to dev project

5. **Create PR to main:**
   - Open PR from develop to main
   - Verify CI checks pass
   - Merge PR

6. **Verify production deployment:**
   - Check deploy-production workflow
   - Verify migration in production

### 5.5 Cleanup Test Migration

After verification, create a cleanup migration:

```bash
supabase migration new remove_test_comment
```

```sql
-- Remove test comment
COMMENT ON TABLE locations IS NULL;
```

## Deliverables
- [ ] `docs/dev-environment.md` created
- [ ] `CLAUDE.md` updated with dev environment section
- [ ] `develop` branch created
- [ ] Full workflow tested end-to-end
- [ ] Test migration cleaned up
- [ ] Team notified of new workflow

---

# Appendix A: GitHub Secrets Setup Guide

## Getting Supabase Access Token

1. Go to https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Name: `github-actions`
4. Copy the token (shown only once)

## Adding Secrets to GitHub

1. Go to repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret:

| Name | How to Get |
|------|------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard → Account → Access Tokens |
| `DEV_SUPABASE_PROJECT_ID` | Dev project → Settings → General → Reference ID |
| `DEV_DB_PASSWORD` | The password you set when creating dev project |
| `PROD_SUPABASE_PROJECT_ID` | Prod project → Settings → General → Reference ID |
| `PROD_DB_PASSWORD` | Your production database password |

---

# Appendix B: Security Checklist

- [ ] Production database password never shared
- [ ] GitHub secrets are encrypted
- [ ] Service role keys never in client code
- [ ] Production environment requires review (optional)
- [ ] Dev project uses same RLS policies as production
- [ ] Edge Function secrets set in both environments
- [ ] `.env` files in `.gitignore`

---

# Appendix C: Rollback Procedure

If a migration causes issues in production:

1. **Identify the problem migration**
2. **Create a rollback migration:**
   ```bash
   supabase migration new rollback_problem_migration
   ```
3. **Write reversal SQL** (DROP, ALTER, etc.)
4. **Test in dev first**
5. **Deploy to production via PR**

**Note:** Some migrations cannot be easily rolled back (data modifications, column drops with data loss). Always backup before risky migrations.

---

# Sources

- [Supabase Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments)
- [Supabase Branching](https://supabase.com/docs/guides/deployment/branching)
- [Supabase Maturity Model](https://supabase.com/docs/guides/deployment/maturity-model)
- [Supabase Pricing](https://supabase.com/pricing)
- [GitHub Discussion: Multiple Environments](https://github.com/orgs/supabase/discussions/542)
