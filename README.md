# Zero Waste Frankfurt

Interactive map for sustainable shopping and zero-waste locations in Frankfurt.

## Project Status

**Status:** Production Ready ✅

The Zero Waste Frankfurt map is a fully-featured production application with:
- 270+ sustainable locations in Frankfurt and surrounding area
- Comprehensive admin panel for location management
- Automatic data enrichment from OpenStreetMap
- Full internationalization (German/English)
- Responsive design for mobile and desktop
- 300+ unit and component tests
- E2E testing coverage

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and add your Supabase credentials
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Database Setup

1. Create a new Supabase project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Copy the contents of `supabase/schema.sql`
4. Execute the SQL in the Supabase SQL Editor
5. Verify setup:
   - Run: `SELECT COUNT(*) FROM categories;` (should return 17)
   - Run: `SELECT COUNT(*) FROM locations WHERE status = 'approved';` (should return 10)

### Development

```bash
# Run development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **Frontend:** Vue 3 (Composition API) + TypeScript + Vite
- **State Management:** Pinia
- **Routing:** Vue Router
- **Internationalization:** Vue I18n (German/English)
- **Styling:** Tailwind CSS
- **Map:** Leaflet.js with clustering
- **Backend:** Supabase (PostgreSQL + PostGIS)
- **Testing:** Vitest (unit/component) + Playwright (E2E)
- **Infrastructure:** AWS CDK (S3, CloudFront, SES)
- **Data Sources:** OpenStreetMap Nominatim API

## Project Structure

```
/
├── src/
│   ├── main.ts              # App entry point
│   ├── App.vue              # Root component
│   ├── router/
│   │   └── index.ts         # Vue Router with navigation guards
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   └── openingHoursParser.ts  # OSM hours parser
│   ├── types/
│   │   ├── database.ts      # TypeScript types from schema
│   │   └── osm.ts           # OpenStreetMap data types
│   ├── views/               # Page components
│   │   ├── MapView.vue      # Main map interface
│   │   ├── SubmitView.vue   # Location submission form
│   │   ├── AdminLogin.vue   # Admin authentication
│   │   └── admin/           # Admin section views
│   ├── components/
│   │   ├── common/          # Shared UI components
│   │   ├── map/             # Map-specific components
│   │   └── admin/           # Admin panel components
│   ├── composables/         # Vue composables
│   │   ├── useAuth.ts       # Authentication
│   │   ├── useDebounce.ts   # Debounce utility
│   │   ├── useFavorites.ts  # Favorites management
│   │   ├── useNominatim.ts  # OSM data enrichment
│   │   ├── useSearch.ts     # Location search
│   │   └── useToast.ts      # Toast notifications
│   ├── stores/              # Pinia stores
│   │   ├── admin.ts         # Admin state
│   │   ├── categories.ts    # Categories management
│   │   └── locations.ts     # Locations state
│   └── locales/             # i18n translation files
│       ├── de.json
│       └── en.json
├── tests/
│   ├── component/           # Component tests (300+ tests)
│   └── e2e/                 # Playwright E2E tests
├── supabase/
│   ├── migrations/          # SQL migrations
│   ├── functions/           # Edge Functions
│   └── schema.sql           # Database schema
├── infra/                   # AWS CDK infrastructure
│   ├── lib/
│   │   ├── frontend-stack.ts
│   │   └── email-stack.ts
│   └── bin/
│       └── infra.ts
├── docs/                    # Documentation
│   ├── supabase.md
│   ├── aws-ses.md
│   ├── navigation.md
│   ├── testing-strategy.md
│   └── components.md
└── scripts/                 # Build/deployment scripts
    └── deploy-frontend.sh
```

## Database Schema

The database includes:

- **17 Categories** (Unverpackt-Läden, Second-Hand, Repair-Cafés, etc.)
- **Locations** table with geospatial support (PostGIS)
- **Location-Category** junction table (many-to-many)
- **Email Verifications** for submissions
- **Full-text search** (German language)
- **Geospatial queries** (nearby locations)
- **Row-Level Security** (RLS) policies

### Location Data

The database includes:
- 17 categories (Unverpackt-Läden, Second-Hand, Repair-Cafés, etc.)
- 270+ approved locations in Frankfurt and surrounding area
- Automatic data enrichment from OpenStreetMap Nominatim API

## Location Enrichment Feature

The app automatically enriches location data to reduce the complexity barrier for adding new locations.

### How It Works

1. **User pastes Google Maps URL** - The URL is parsed to extract location name and coordinates
2. **Nominatim enrichment** - Queries OpenStreetMap with `extratags=1` to fetch:
   - Phone number
   - Website
   - Email
   - Opening hours (converted to German format)
3. **Website enrichment** (optional) - If a website is found, extracts:
   - Instagram handle (via schema.org `sameAs`)
   - Additional contact info
4. **Auto-fill with attribution** - Fields are auto-populated with source badges ("From OpenStreetMap" / "From website")

### Data Sources

| Source | Data Available | Cost | Rate Limits |
|--------|---------------|------|-------------|
| OpenStreetMap Nominatim | phone, hours, email, website | Free | 1 req/sec (debounced) |
| Website Schema.org | hours, phone, social links | Free | Respectful crawling |
| Manual fallback | All fields | Free | N/A |

### Features

- **Progressive loading** - Shows status: "Researching location details..."
- **Field discovery animation** - "✓ Found phone... ✓ Found website..."
- **Source attribution** - Badges show where data came from
- **Manual override** - Users can clear/edit any auto-filled field
- **Graceful degradation** - Form works even if enrichment fails
- **Accessibility** - ARIA labels, keyboard navigation, screen reader support

## Testing

The project has comprehensive test coverage with 300+ tests:

### Test Structure

```
tests/
├── component/           # Component tests (~300 tests)
│   ├── admin/          # Admin components (94 tests)
│   ├── common/         # Shared components (30 tests)
│   ├── map/            # Map components (55 tests)
│   └── views/          # View components (122 tests)
└── e2e/                # End-to-end tests
    ├── admin.spec.ts
    ├── favorites.spec.ts
    ├── filter.spec.ts
    └── map.spec.ts
```

### Running Tests

```bash
# Run all unit/component tests
npm test

# Watch mode for development
npm run test:watch

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Type checking
npm run type-check
```

**Test Framework:** Vitest with jsdom for component tests, Playwright for E2E tests.

See [docs/testing-strategy.md](docs/testing-strategy.md) for detailed testing guidelines.

## Admin Panel

Comprehensive admin interface for managing locations and categories.

### Access

1. Admin users must be created manually in Supabase Dashboard
2. Login via magic link at `/admin/login`
3. Session timeout: 1 hour of inactivity

### Features

- Location approval workflow (pending/approved/rejected)
- Full location editing with map preview
- Category management with icon upload
- Toast notifications for all actions
- Mobile responsive design

See [CLAUDE.md](CLAUDE.md) for detailed admin documentation.

## Deployment

### Frontend Deployment

The frontend is hosted on AWS (S3 + CloudFront):

```bash
# Set AWS profile
export AWS_PROFILE=zerowaste-map-deployer

# Deploy frontend
npm run deploy:frontend
```

**Live URL:** https://map.zerowastefrankfurt.de

### Infrastructure

AWS CDK stacks in `infra/` directory:

1. **Frontend Stack** - S3 bucket + CloudFront distribution
2. **Email Stack** - SES domain identity + IAM credentials

See [docs/aws-ses.md](docs/aws-ses.md) for detailed infrastructure documentation.

### Supabase Edge Functions

```bash
# Deploy all Edge Functions
supabase functions deploy

# Deploy specific function
supabase functions deploy submit-location
```

## Environment Variables

Required environment variables (see `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # Optional: Get from GA4 dashboard
```

**Note:** For analytics, create separate `.env.development` and `.env.production` files with different GA4 measurement IDs to keep dev and production traffic separate.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code style guidelines
- Testing requirements
- Pull request process
- Commit message conventions

## Documentation

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contributing guidelines
- **[docs/supabase.md](docs/supabase.md)** - Supabase setup and RLS policies
- **[docs/aws-ses.md](docs/aws-ses.md)** - AWS infrastructure and deployment
- **[docs/navigation.md](docs/navigation.md)** - Map navigation and routing
- **[docs/testing-strategy.md](docs/testing-strategy.md)** - Testing guidelines
- **[docs/components.md](docs/components.md)** - Shared component documentation
- **[docs/analytics.md](docs/analytics.md)** - Google Analytics 4 integration and GDPR compliance

## License

ISC
