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
npm run test:all       # Run all tests (unit + e2e) with minimal output
npm run type-check     # TypeScript check
npm run validate:locales # Validate i18n locale files
npm run deploy:frontend # Deploy frontend to S3/CloudFront
npm run db:push        # Push migrations (with environment confirmation)
npm run db:push:dev    # Push migrations directly to DEV
```

## Project Structure

```
src/
  components/
    common/          # Shared components (ContactInfo, PaymentMethodsBadges, etc.)
    map/             # Map-related components
    admin/           # Admin panel components
    submission/      # Location submission flow components
    BetaModal.vue    # Beta info modal with feedback form
  composables/
    useAuth.ts        # Authentication & session management
    useDebounce.ts    # Debounce utility
    useFavorites.ts   # Favorites management
    useFeedback.ts    # Beta modal feedback submission
    useGeolocation.ts # Browser geolocation API
    useNominatim.ts   # OSM data enrichment
    useOverpass.ts    # Overpass API for POI search
    useSearch.ts      # Location search
    useToast.ts       # Toast notifications
    useSubmission.ts  # Location submission
  lib/
    supabase.ts            # Supabase client
    openingHoursParser.ts  # OSM hours parser
  types/
    database.ts      # Database types (generated from Supabase)
    osm.ts           # OpenStreetMap data types
  views/             # Page components
  stores/
    admin.ts         # Admin state management
    categories.ts    # Categories with admin methods
    locations.ts     # Locations state

supabase/
  migrations/        # SQL migrations
  functions/         # Edge Functions
    submit-location/ # Submission with SES email
    verify-submission/  # Email verification
    send-feedback/   # Beta modal feedback via SES
  schema.sql         # Base database schema

tests/
  component/         # Component tests (899+ tests)
    admin/          # Admin components (94 tests)
    common/         # Shared components (30 tests)
    map/            # Map components (55 tests)
    submission/     # Submission flow components (45 tests)
    views/          # View components (122 tests)
  e2e/              # Playwright e2e tests

infra/              # AWS CDK infrastructure
  lib/
    frontend-stack.ts  # S3 + CloudFront
    email-stack.ts     # SES email
```

## Key Documentation

- **[README.md](README.md)** - Project overview and quick start
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contributing guidelines and code style
- **[docs/design-system.md](docs/design-system.md)** - Visual design specs (icons, map controls, colors)
- **[docs/supabase.md](docs/supabase.md)** - Supabase configuration, RLS policies, and troubleshooting guide
- **[docs/aws-ses.md](docs/aws-ses.md)** - AWS SES email setup and CDK infrastructure
- **[docs/navigation.md](docs/navigation.md)** - Map navigation and slug URL behavior
- **[docs/testing-strategy.md](docs/testing-strategy.md)** - Testing organization and guidelines
- **[docs/components.md](docs/components.md)** - Shared component documentation

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

This project uses separate environment files for DEV and PROD:

```
.env.development  → Loaded by `npm run dev`
.env.production   → Loaded by `npm run build`
```

Setup:
```bash
cp .env.development.example .env.development
cp .env.production.example .env.production
# Fill in ANON_KEY values from Supabase Dashboard → Settings → API
```

## Location Submission Flow

The app offers two methods for submitting new locations:

### Method 1: Google Maps Link
- Paste a Google Maps link (with or without place name)
- Tutorial guides users through copying link from mobile/desktop
- Auto-fills coordinates, address, and name
- Enriches with OSM data (phone, website, hours, Instagram)

### Method 2: Pin on Map
- Interactive Leaflet map for direct location pinning
- Search by address or "I'm nearby" button for geolocation
- Draggable marker for precise positioning
- Queries Overpass API for nearby POIs (50m radius)
- Auto-fills business details when POI selected
- Manual entry fallback if no POIs found

### Instagram Discovery
- Small helper link appears below Instagram field when empty
- Opens Google search for "{business name} instagram"
- Non-intrusive design

### Auto-Enrichment Chain
1. OSM data from Nominatim (primary source)
2. Website scraping (fallback for Instagram/hours/email)
3. Progressive status indicators during enrichment

**Key Components:**
- `SubmissionMethodSelector.vue` - Two-card method selection
- `GoogleMapsTutorial.vue` - 4-step tutorial with deep links
- `LocationPinMap.vue` - Interactive map with search/geolocation
- `NearbyPOISelector.vue` - POI selection from Overpass results
- `InstagramSearchHelper.vue` - Instagram discovery helper

**Composables:**
- `useGeolocation.ts` - Browser geolocation API
- `useOverpass.ts` - Overpass API for POI search
- `useNominatim.ts` - OSM data enrichment

See `ai/2026-01-11-enhanced-location-submission.md` for implementation plan.

## OSM Data Enrichment

The app enriches location data from OpenStreetMap via Nominatim:
- Payment methods (cash, cards, contactless, etc.)
- Opening hours (OSM format + structured JSON)
- Contact info (phone, website, email, Instagram)

See `src/composables/useNominatim.ts` for extraction logic.

## Admin Section

The admin section provides a full-featured interface for managing location submissions and categories.

### Routes

- `/admin/login` - Magic link authentication
- `/admin` - Dashboard with stats and recent submissions
- `/admin/locations` - All locations with filtering by status (pending/approved/rejected)
- `/admin/edit/:id` - Edit location with preview
- `/admin/categories` - Category management (CRUD with icon upload)

### Creating Admin Users

Admin users must be created manually in Supabase:

1. Create user via Supabase Dashboard → Authentication → Users → Add User
2. Set admin role in SQL Editor:

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@zerowastefrankfurt.de';
```

### Features

- **Magic Link Auth** - Passwordless authentication with rate limiting (5 attempts per 15 minutes)
- **Session Management** - 1-hour inactivity timeout with activity tracking
- **Location Management** - Full CRUD operations, approve/reject workflow
- **Category Management** - CRUD with icon upload to Supabase Storage
- **Toast Notifications** - Success/error feedback for all actions
- **Keyboard Shortcuts** - ESC to close modals
- **Mobile Responsive** - All admin views work on mobile devices

### Key Admin Components

- `src/components/admin/AdminLayout.vue` - Shared layout with sidebar
- `src/components/admin/LocationEditForm.vue` - Full location editing
- `src/components/admin/CategoryEditModal.vue` - Category CRUD modal

### Shared Components (Created in Phase 6)

- `src/components/common/ContactInfo.vue` - Display contact information with icons
- `src/components/common/PaymentMethodsBadges.vue` - Payment method badges
- `src/components/common/ToastContainer.vue` - Toast notification system
- `src/components/common/LoadingSpinner.vue` - Loading states
- `src/components/common/EmptyState.vue` - Empty state placeholders
- `src/components/common/ErrorBoundary.vue` - Error handling wrapper

See [docs/components.md](docs/components.md) for detailed component documentation.

### Composables

- `src/composables/useAuth.ts` - Session management and logout
- `src/composables/useDebounce.ts` - Debounce utility (created in Phase 5)
- `src/composables/useFavorites.ts` - Favorites management (memory leak fixed in Phase 1)
- `src/composables/useNominatim.ts` - OSM data enrichment
- `src/composables/useSearch.ts` - Location search (memory leak fixed in Phase 1)
- `src/composables/useToast.ts` - Toast notifications

### Stores

- `src/stores/admin.ts` - Admin state management (locations CRUD)
- `src/stores/categories.ts` - Categories with admin methods
- `src/stores/locations.ts` - Locations state

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
- **send-feedback** - Receives user feedback from Beta Modal, sends via SES (rate limited: 1 per 4 min per IP)

Deploy with:
```bash
supabase functions deploy
```

## Analytics

Uses Google Analytics 4 with GDPR-compliant implementation:
- Cookie consent required before tracking (Consent Mode v2)
- IP anonymization enabled
- No personal data tracked

### Events Tracked
- `map_rendered` - Main map loaded
- `location_detail_view` - Location details opened
- `share_click` - Share button used
- `submission_started` - User begins adding location
- `submission_completed` - Location successfully submitted
- `edit_suggestion_submitted` - Edit suggestion sent

### Configuration
Single GA4 property with environment dimension for dev/prod filtering:
- Set `VITE_GA_MEASUREMENT_ID` in `.env.development` and `.env.production`
- Code automatically tags events with `environment: development` or `environment: production`
- Filter in GA4 reports by Environment dimension

### Switching Providers
Analytics uses a provider abstraction (`src/types/analytics.ts`).
To switch to Plausible/Matomo, implement `AnalyticsProvider` interface.

See [docs/analytics.md](docs/analytics.md) for detailed analytics documentation.

## Beta Modal & Feedback

The BETA badge in the header opens a modal with project information and a feedback form.

### Features
- **Glow animation** - BETA badge pulses green until first click (stored in localStorage)
- **Project info** - Explains what the project is and why it's being built
- **Feedback form** - Hidden by default, revealed via toggle link
- **Rate limiting** - 1 message per 4 minutes (client + server side)
- **Email delivery** - Feedback sent via SES to project email

### Key Files
- `src/components/BetaModal.vue` - Modal component with form
- `src/composables/useFeedback.ts` - Feedback submission and rate limiting
- `supabase/functions/send-feedback/` - Edge Function for email delivery

### localStorage Keys
- `betaModalClicked` - Tracks if user has clicked BETA badge (stops glow)
- `lastFeedbackSubmit` - Timestamp for client-side rate limiting

## Code Conventions

### Critical Rules

- **NEVER use `npx supabase db push` directly** - Always use `npm run db:push` which includes environment confirmation to prevent accidental production deployments

### i18n / Localization Rules

Vue I18n uses special syntax characters that must be escaped in translation strings:

| Character | Meaning | Escape with |
|-----------|---------|-------------|
| `@` | Linked message (`@:key`) | `{'@'}` |
| `|` | Pluralization | `{'|'}` |
| `{` `}` | Interpolation | `{'{'}`  `{'}'}`|

**Common mistake**: Email placeholders like `your@email.com` will break because `@email` is interpreted as a linked message reference.

**Correct**: `your{'@'}email.com`

**Validation**: Run `npm run validate:locales` to check for syntax issues before committing.

### General Rules

- **Use TypeScript strictly** - Avoid `any` types, prefer proper type definitions
- **Memory management** - Always clean up subscriptions, timers, and event listeners in `onUnmounted`
- **Prefer composables over duplication** - Reuse logic via composables (e.g., `useDebounce`)
- **Component reuse** - Use shared components from `components/common/` before creating new ones
- **Test coverage** - Write tests for all new components and composables

### UI/UX Rules

- **Clickable elements must have pointer cursor** - All links, buttons, and interactive elements must have `cursor: pointer` to indicate they are clickable. Use `class="cursor-pointer"` (Tailwind) or inline style.
- **Accessibility** - All interactive elements need ARIA labels and keyboard navigation support
- **Loading states** - Use `LoadingSpinner` component for async operations
- **Error handling** - Wrap components in `ErrorBoundary` and show user-friendly error messages
- **Toast notifications** - Use `useToast` composable for user feedback

### Performance

- **Debounce user input** - Use `useDebounce` for search, filters, and API calls
- **AbortController for async operations** - Cancel pending requests on component unmount
- **Caching** - Cache expensive operations (geospatial queries, search results)
- **Optimistic updates** - Update UI immediately, rollback on error

### Dynamic Markers (Iconify)

Map markers use Iconify icons rendered via `@iconify/utils`. When working with icons programmatically, use the JSON API - not raw SVG fetching. See [docs/design-system.md](docs/design-system.md#dynamic-markers-iconify) for implementation details.

### Testing

- **Test organization** - Follow the structure in `tests/component/` and `tests/e2e/`
- **Component tests** - Test props, events, slots, and user interactions
- **Mock external dependencies** - Mock Supabase, Nominatim API, and router
- **E2E tests** - Test critical user flows (submit, search, admin workflow)

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/testing-strategy.md](docs/testing-strategy.md) for detailed guidelines.

## Slug Generation

SEO-friendly slugs with pattern: `{name}-{city}-{suburb}` or `{name}-{city}-{suburb}-{n}` on collision.

**Example:** `repair-cafe-frankfurt-am-main-bockenheim`

**Implementation:**
- PostgreSQL functions for atomic slug generation (`generate_unique_slug`)
- `suburb` column populated from Nominatim data
- Integer increment on collision (no random suffix)
- Automatic trigger on INSERT/UPDATE of name, city, or suburb

**Migrations:** `supabase/migrations/20260110170*`

## Development Environment

This project uses separate Supabase projects for development and production to ensure safe testing of database migrations and Edge Functions.

### Environments

| Environment | Project ID | Region | Usage |
|-------------|------------|--------|-------|
| Development | lccpndhssuemudzpfvvg | Frankfurt (eu-central-1) | Local development, testing migrations |
| Production | rivleprddnvqgigxjyuc | Frankfurt (eu-central-1) | Live site at map.zerowastefrankfurt.de |

### Local Development Setup

1. Copy `.env.development.example` to `.env.development`
2. Fill in **DEV** anon key from Supabase Dashboard
3. Run `npm run dev`
4. Look for "DEV" badge in bottom-left corner

### Database Migrations

**CRITICAL: Never use `npx supabase db push` directly. Always use the safe wrapper command.**

```bash
# Create new migration
npx supabase migration new migration_name

# Push migrations (shows environment and requires confirmation)
npm run db:push

# Or push directly to DEV (no confirmation)
npm run db:push:dev

# Production deployment happens automatically via GitHub Actions on merge to main
```

The `npm run db:push` script:
1. Detects which environment is currently linked (DEV or PROD)
2. Shows a clear confirmation prompt
3. Requires typing `yes-prod` to push to production (extra safety)
4. Auto-links to DEV if no project is linked

**Important:** Always test migrations in DEV before merging to main. See [docs/dev-environment.md](docs/dev-environment.md) for detailed workflow.

### Edge Functions

```bash
# Deploy to DEV for testing
npx supabase link --project-ref lccpndhssuemudzpfvvg
npx supabase functions deploy function-name

# Deploy to PROD (via GitHub Actions on merge to main)
# Or manually:
npx supabase link --project-ref rivleprddnvqgigxjyuc
npx supabase functions deploy function-name
```

### CI/CD Pipeline

- **Pull Requests:** Validates migration file naming, checks for dangerous operations
- **Merge to main:** Automatically deploys migrations and Edge Functions to production
- **Frontend deployment:** Manual via `npm run deploy:frontend` or GitHub Actions

See [docs/dev-environment.md](docs/dev-environment.md) for complete guide.
