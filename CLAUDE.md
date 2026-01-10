# Zero Waste Frankfurt

A Vue 3 + TypeScript + Supabase application for discovering sustainable locations in Frankfurt, Germany.

## Tech Stack

- **Frontend:** Vue 3 (Composition API), TypeScript, Vite
- **State:** Pinia
- **Routing:** Vue Router
- **i18n:** Vue I18n (DE/EN)
- **Maps:** Leaflet
- **Backend:** Supabase (PostgreSQL + PostGIS)
- **Testing:** Vitest (unit), Playwright (e2e)

## Commands

```bash
npm run dev            # Start dev server
npm run build          # Production build
npm run test           # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:e2e       # Run Playwright e2e tests
npm run type-check     # TypeScript check
npm run deploy:frontend # Deploy frontend to S3/CloudFront
```

## Project Structure

```
src/
  components/       # Vue components
    map/           # Map-related components
  composables/     # Vue composables (useSubmission, useNominatim, etc.)
  lib/             # Library setup (supabase client)
  types/           # TypeScript type definitions
  views/           # Page components
  stores/          # Pinia stores

supabase/
  migrations/      # SQL migrations
  functions/       # Edge Functions
  schema.sql       # Base database schema

tests/
  unit/           # Vitest unit tests
  e2e/            # Playwright e2e tests
```

## Key Documentation

- **[docs/supabase.md](docs/supabase.md)** - Supabase configuration, RLS policies, and troubleshooting guide
- **[docs/aws-ses.md](docs/aws-ses.md)** - AWS SES email setup and CDK infrastructure

## Database

Uses Supabase with PostGIS for geospatial queries. Key tables:
- `locations` - Sustainable locations with coordinates, status, payment methods, opening hours
- `categories` - 17 location categories
- `location_categories` - Many-to-many junction table

### RLS Notes

- Anonymous users can INSERT pending locations but cannot SELECT them back
- Use client-generated UUIDs for inserts (don't rely on `.select()` after insert)
- See [docs/supabase.md](docs/supabase.md) for detailed RLS troubleshooting

## Environment Variables

Create `.env` with:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## OSM Data Enrichment

The app enriches location data from OpenStreetMap via Nominatim:
- Payment methods (cash, cards, contactless, etc.)
- Opening hours (OSM format + structured JSON)
- Contact info (phone, website, email, Instagram)

See `src/composables/useNominatim.ts` for extraction logic.

## Infrastructure (AWS CDK)

Located in `infra/` directory. Two stacks:

1. **ZeroWasteFrankfurtStack** - Frontend hosting
   - S3 bucket for static files
   - CloudFront distribution with custom domain

2. **ZeroWasteEmailStack** - Email infrastructure
   - SES domain identity (zerowastefrankfurt.de)
   - IAM user for Edge Functions
   - Credentials stored in SSM Parameter Store

### AWS Profile

All AWS CLI and CDK commands must use the `zerowaste-map-deployer` profile:

```bash
export AWS_PROFILE=zerowaste-map-deployer
```

### CDK Commands

```bash
# Always set the profile first
export AWS_PROFILE=zerowaste-map-deployer

# Bootstrap CDK (first time only)
cd infra && npx cdk bootstrap

# Deploy all stacks
cd infra && npx cdk deploy --all

# Deploy specific stack
cd infra && npx cdk deploy ZeroWasteEmailStack

# View changes before deploying
cd infra && npx cdk diff
```

## Frontend Deployment

Deploy the frontend to S3 and invalidate CloudFront cache:

```bash
npm run deploy:frontend
```

This script (in `scripts/deploy-frontend.sh`):
1. Builds the app
2. Syncs to S3 bucket
3. Invalidates CloudFront cache (`/index.html` only - JS/CSS have content hashes)

**Live URL:** https://map.zerowastefrankfurt.de

## Edge Functions (Supabase)

Located in `supabase/functions/`:

- **submit-location** - Receives submissions, stores data, sends verification email via SES
- **verify-submission** - Validates token, creates location record

Deploy with:
```bash
supabase functions deploy
```
