# Zero Waste Frankfurt

Interactive map for sustainable shopping and zero-waste locations in Frankfurt.

## Project Status

**Current Phase:** Production Ready ✅ **COMPLETE**

### Recent Features

**Google Maps Data Migration** ✅ - Migrated 270 locations from Google My Maps with OSM enrichment:
- ✅ Extracted locations from KML export
- ✅ Enriched 160 locations (59%) with full OSM data (phone, website, hours, facilities)
- ✅ Reverse geocoded remaining 110 locations for addresses
- ✅ Added facilities column (toilets, wheelchair, wifi, organic, outdoor_seating, takeaway)

**Location Enrichment (Phases 1-5)** - Automatically enriches location data when users paste a Google Maps URL:
- ✅ Phase 1: Enhanced Nominatim Integration - Fetches phone, website, email, opening hours from OpenStreetMap
- ✅ Phase 2: Opening Hours Parser - Converts OSM format to German readable text
- ✅ Phase 3: Website Schema.org Enrichment - Extracts Instagram from business websites
- ✅ Phase 4: UI Polish & Error Handling - Progressive loading, field badges, accessibility
- ✅ Phase 5: Testing & Documentation - Comprehensive test coverage and documentation

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

- **Frontend:** Vue 3 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + PostGIS)
- **Map:** Leaflet.js
- **Testing:** Vitest + Vue Test Utils + Playwright (E2E)
- **Data Sources:** OpenStreetMap Nominatim API, Schema.org extraction

## Project Structure

```
/
├── src/
│   ├── main.ts              # App entry point
│   ├── App.vue              # Root component
│   ├── router/
│   │   └── index.ts         # Vue Router setup
│   ├── lib/
│   │   └── supabase.ts      # Supabase client
│   ├── types/
│   │   └── database.ts      # TypeScript types from schema
│   ├── views/
│   │   └── HomeView.vue     # Home page
│   └── components/          # Vue components
├── tests/
│   └── unit/                # Unit tests
├── supabase/
│   └── schema.sql           # Database schema
├── package.json
├── vite.config.ts
├── vitest.config.ts
└── tsconfig.json
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
- 17 categories (all confirmed categories)
- 270 locations in Frankfurt and surrounding area (migrated from Google My Maps)

## Phase 1 Deliverables

✅ Vue 3 project structure with TypeScript
✅ Supabase client configuration
✅ Database schema SQL file
✅ TypeScript types matching schema
✅ Unit tests for types and Supabase client
✅ All tests passing
✅ Development server working
✅ Build process working

## Next Steps (Phase 2)

Phase 2 will add:
- Leaflet map integration
- Display locations on map with markers
- Marker clustering
- Location detail view
- Pinia store for state management

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

### Implementation Files

**Composables:**
- `/src/composables/useNominatim.ts` - Nominatim API integration with `searchWithExtras()` method
- `/src/composables/useEnrichment.ts` - Website schema.org extraction via Supabase Edge Function

**Utilities:**
- `/src/lib/openingHoursParser.ts` - Converts OSM hours format to German readable text

**UI Components:**
- `/src/components/ui/EnrichmentStatus.vue` - Loading/success/error states with field discovery
- `/src/components/ui/FieldBadge.vue` - Source attribution badges
- `/src/components/ui/LoadingSpinner.vue` - Animated loading indicator

**Backend:**
- `/supabase/functions/enrich-location/index.ts` - Edge function for schema.org extraction

### Testing

**Unit Tests (115 tests):**
- Opening hours parser edge cases (16 tests)
- Nominatim extratags parsing (15 tests)
- Schema.org extraction (13 tests)
- UI component behavior (34 tests)

**E2E Tests (13 tests):**
- Full enrichment flow with Google Maps URL
- Loading states and error handling
- Field auto-fill and manual override
- Form submission with enriched data

```bash
# Run all unit tests
npm test

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

All tests use Vitest with jsdom environment for Vue component testing, and Playwright for E2E tests.

### Troubleshooting

**Enrichment not working:**
- Check Nominatim rate limit (1 req/sec) - debouncing is automatic
- Verify location exists in OpenStreetMap database
- Check browser console for API errors

**No data found:**
- OSM may not have extratags for this location
- Try searching the location on openstreetmap.org to verify data exists
- Manual entry is always available as fallback

**Opening hours format issues:**
- OSM uses specific format: `Mo-Fr 09:00-18:00`
- Parser handles most common formats automatically
- Complex seasonal hours may need manual adjustment

**Website enrichment fails:**
- Website may block crawlers (robots.txt)
- Schema.org data may not be present
- 5-second timeout prevents long waits
- Instagram enrichment is optional - form works without it

**CORS errors:**
- Website enrichment uses Supabase Edge Function (server-side)
- If you see CORS errors, check Edge Function deployment
- Nominatim API has CORS enabled by default

## Environment Variables

Required environment variables (see `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Contributing

This project follows strict TDD (Test-Driven Development):
1. Write tests FIRST
2. Then implement features
3. Refactor while keeping tests green

## License

ISC

## Support

For issues or questions about this phase, see the implementation plan in `mvp-implementation.md`.
