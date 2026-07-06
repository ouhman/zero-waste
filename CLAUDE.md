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
  composables/       # Vue composables (useAuth, useDebounce, useFeedback, etc.)
  lib/               # Utilities (supabase client, openingHoursParser)
  types/             # TypeScript types (database, osm)
  views/             # Page components
  stores/            # Pinia stores (admin, categories, locations)

supabase/
  migrations/        # SQL migrations
  functions/         # Edge Functions (submit-location, verify-submission, send-feedback)

tests/
  component/         # Component tests (899+ tests)
  e2e/               # Playwright e2e tests

infra/               # AWS CDK infrastructure
```

## Documentation

| Document | Description |
|----------|-------------|
| [README.md](README.md) | Project overview and quick start |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributing guidelines and code style |
| [docs/deployment.md](docs/deployment.md) | AWS CDK deployment guide |
| [docs/dev-environment.md](docs/dev-environment.md) | DEV/PROD environment setup |
| [docs/supabase.md](docs/supabase.md) | Supabase configuration and RLS policies |
| [docs/supabase-cli.md](docs/supabase-cli.md) | Supabase CLI quick reference |
| [docs/testing-strategy.md](docs/testing-strategy.md) | Testing organization and guidelines |
| [docs/e2e-testing-guide.md](docs/e2e-testing-guide.md) | E2E testing quick start |
| [docs/analytics.md](docs/analytics.md) | Google Analytics 4 implementation |
| [docs/design-system.md](docs/design-system.md) | Visual design specs and icons |
| [docs/components.md](docs/components.md) | Shared component documentation |
| [docs/navigation.md](docs/navigation.md) | Map navigation and slug URLs |
| [docs/aws-ses.md](docs/aws-ses.md) | AWS SES email setup |
| [docs/admin-user-setup.md](docs/admin-user-setup.md) | Creating admin users |
| [docs/troubleshooting.md](docs/troubleshooting.md) | Known issues and open platform-side blockers |

## Database

Uses Supabase with PostGIS for geospatial queries. Key tables:
- `locations` - Sustainable locations with coordinates, status, payment methods, opening hours
- `categories` - 17 location categories
- `location_categories` - Many-to-many junction table

**RLS Notes:** Anonymous users can INSERT pending locations but cannot SELECT them back. Use client-generated UUIDs for inserts. See [docs/supabase.md](docs/supabase.md) for details.

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

Two methods for submitting new locations:

1. **Google Maps Link** - Paste link, auto-fills coordinates/address/name, enriches with OSM data
2. **Pin on Map** - Interactive Leaflet map with search, geolocation, Overpass API for nearby POIs

See `ai/2026-01-11-enhanced-location-submission.md` for implementation details.

## Admin Section

Routes: `/admin/login`, `/admin`, `/admin/locations`, `/admin/edit/:id`, `/admin/categories`

Features: email OTP auth (6–8 digit code, app-flexible), session management (1-hour timeout), location CRUD, category management.

Login email delivery has two out-of-repo requirements that have failed together before — the Magic Link template must emit `{{ .Token }}` (not a link), and the recipient must be a verified SES identity (SES sandbox). See [docs/admin-user-setup.md#login-email-delivery](docs/admin-user-setup.md#login-email-delivery).

See [docs/admin-user-setup.md](docs/admin-user-setup.md) for creating admin users.

## Infrastructure

AWS CDK stacks in `infra/`:
- **ZeroWasteFrankfurtStack** - S3 + CloudFront for frontend
- **ZeroWasteEmailStack** - SES for email

**AWS Profile:** Always use `zerowaste-map-deployer` profile.

See [docs/deployment.md](docs/deployment.md) for full deployment guide.

## Edge Functions

Located in `supabase/functions/`:
- **submit-location** - Receives submissions, stores data, sends verification email via SES
- **verify-submission** - Validates token, creates location record
- **send-feedback** - Beta modal feedback via SES (rate limited: 1 per 4 min per IP)

Deploy: `supabase functions deploy`

## Code Conventions

### Critical Rules

- **NEVER use `npx supabase db push` directly** - Always use `npm run db:push` which includes environment confirmation
- **Extensions go in `extensions`, never `public`** - Always write `CREATE EXTENSION ... WITH SCHEMA extensions;`. Schema-qualify calls (`extensions.ST_MakePoint(...)`) in indexes and functions so they don't depend on a role's `search_path`. See [docs/supabase.md#extension-placement](docs/supabase.md#extension-placement) for the why and the incident that motivated this rule.

### i18n / Localization

Vue I18n special characters must be escaped:

| Character | Meaning | Escape with |
|-----------|---------|-------------|
| `@` | Linked message | `{'@'}` |
| `|` | Pluralization | `{'|'}` |
| `{` `}` | Interpolation | `{'{'}` `{'}'}` |

**Example:** `your{'@'}email.com` (not `your@email.com`)

**Validation:** Run `npm run validate:locales` before committing.

### General Rules

- **Use TypeScript strictly** - Avoid `any` types
- **Memory management** - Clean up subscriptions, timers in `onUnmounted`
- **Prefer composables** - Reuse logic via composables
- **Component reuse** - Use shared components from `components/common/`
- **Test coverage** - Write tests for all new components and composables

### UI/UX Rules

- **Clickable elements must have pointer cursor** - Use `cursor-pointer` class
- **Accessibility** - All interactive elements need ARIA labels
- **Loading states** - Use `LoadingSpinner` component
- **Toast notifications** - Use `useToast` composable

### Performance

- **Debounce user input** - Use `useDebounce` for search, API calls
- **AbortController** - Cancel pending requests on component unmount
- **Caching** - Cache expensive operations (geospatial queries)

### Dynamic Markers (Iconify)

Map markers use Iconify icons via `@iconify/utils`. Use JSON API, not raw SVG fetching. See [docs/design-system.md](docs/design-system.md#dynamic-markers-iconify).

### Testing

See [docs/testing-strategy.md](docs/testing-strategy.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## Slug Generation

SEO-friendly slugs: `{name}-{city}-{suburb}` with integer increment on collision.

**Example:** `repair-cafe-frankfurt-am-main-bockenheim`

PostgreSQL functions handle atomic generation. See migrations `20260110170*`.

## Development Environment

Separate Supabase projects for DEV and PROD:

| Environment | Project ID | Usage |
|-------------|------------|-------|
| Development | lccpndhssuemudzpfvvg | Local development, testing migrations |
| Production | rivleprddnvqgigxjyuc | Live site at map.zerowastefrankfurt.de |

### Database Migrations

**CRITICAL: Never use `npx supabase db push` directly.**

```bash
npx supabase migration new migration_name  # Create migration
npm run db:push                            # Push with confirmation
npm run db:push:dev                        # Push directly to DEV
```

Production deployment happens automatically via GitHub Actions on merge to main.

See [docs/dev-environment.md](docs/dev-environment.md) for complete workflow.
