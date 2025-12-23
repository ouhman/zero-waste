# Zero Waste Frankfurt - Implementation Plan

## Overview
Phased implementation of the Zero Waste Frankfurt interactive map MVP, optimized for 150k token context windows.

**Source:** `spike.md`

---

## Key Decisions

| Decision | Choice |
|----------|--------|
| **Seed Data** | Include ~10 sample Frankfurt locations + 6 categories |
| **Geocoding** | Nominatim (free, OSM-based, 1 req/sec) |
| **E2E Tests** | Phase 7 only (unit tests during development) |

---

## Phase Structure

Each phase is designed to:
- Be completable within a single 150k token context window
- Produce a testable/deployable increment
- Build on previous phases without requiring full context reload

---

## Phase 1: Project Foundation & Database Schema
**Estimated scope:** ~30k tokens

### Goals
- Set up Vue 3 + Vite + TypeScript project
- Set up CDK infrastructure project
- Create Supabase project and complete database schema
- Establish testing foundation

### Tasks

#### 1.1 Frontend Project Setup
```
/frontend
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── router/index.ts
│   ├── stores/              # Pinia stores
│   ├── composables/         # Shared composables
│   ├── components/          # Vue components
│   ├── views/               # Page components
│   ├── locales/             # i18n translations
│   │   ├── de.json
│   │   └── en.json
│   └── lib/
│       └── supabase.ts      # Supabase client
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
└── .env.example
```

**Dependencies:**
- vue, vue-router, pinia
- @supabase/supabase-js
- @vue-leaflet/vue-leaflet, leaflet, leaflet.markercluster
- vue-i18n
- vitest, @vue/test-utils

#### 1.2 CDK Infrastructure Project
```
/infra
├── lib/
│   └── frontend-stack.ts    # S3 + CloudFront
├── bin/
│   └── infra.ts
├── cdk.json
├── package.json
└── tsconfig.json
```

#### 1.3 Supabase Database Schema
Execute all SQL from spike.md:
- Categories table
- Locations table (with search_vector, slug, deleted_at)
- Location_categories junction table
- PostGIS extension + indexes
- Triggers (updated_at, slug generation)
- RLS policies (categories, locations, location_categories)
- Functions (locations_nearby, search_locations)

#### 1.4 Seed Data
Create realistic test data for development:

**Categories:**
- Unverpackt-Läden (Bulk shops)
- Second-Hand (Second-hand stores)
- Repair-Cafés (Repair cafes)
- Bio & Regional (Organic & local)
- Zero-Waste Restaurants
- Nachhaltige Mode (Sustainable fashion)

**Sample Locations (~10):**
- Gramm.genau (Nordend) - Bulk shop
- Original Unverpackt Frankfurt (Bornheim) - Bulk shop
- Oxfam Shop (Innenstadt) - Second-hand
- Repair Café Bornheim - Repair cafe
- And 6 more across Frankfurt districts

#### 1.5 Testing Foundation
- Vitest configuration
- First test: Supabase client initialization
- Test utilities setup

### Deliverables
- [ ] Running Vue dev server with basic routing
- [ ] Supabase project with complete schema
- [ ] CDK stack (not deployed yet)
- [ ] CI-ready test setup

### Exit Criteria
- `npm run dev` starts frontend
- `npm run test` passes
- Supabase tables visible in dashboard
- Can connect to Supabase from frontend

---

## Phase 2: Map Component & Location Display
**Estimated scope:** ~40k tokens

### Goals
- Interactive map with OpenStreetMap tiles
- Display locations from Supabase
- Marker clustering
- Basic location popup/detail view

### Tasks

#### 2.1 Map Component
```
/frontend/src/components/
├── map/
│   ├── MapContainer.vue       # Main map wrapper
│   ├── LocationMarker.vue     # Individual marker
│   ├── MarkerCluster.vue      # Cluster wrapper
│   └── LocationPopup.vue      # Popup content
```

#### 2.2 Location Store (Pinia)
```
/frontend/src/stores/
└── locations.ts
```
- Fetch approved locations from Supabase
- Cache locations in store
- Handle loading/error states

#### 2.3 Composables
```
/frontend/src/composables/
├── useLocations.ts           # Location fetching
├── useGeolocation.ts         # Browser geolocation
└── useMapBounds.ts           # Track visible area
```

#### 2.4 Location Detail View
```
/frontend/src/views/
└── LocationDetailView.vue    # /location/:slug
```
- Display full location info
- Link from map popup

#### 2.5 Tests
- MapContainer renders
- Location markers display
- Clustering works at different zoom levels
- Location store fetches data

### Deliverables
- [ ] Interactive map centered on Frankfurt
- [ ] Markers showing all approved locations
- [ ] Marker clustering at low zoom
- [ ] Click marker → popup with basic info
- [ ] Click popup → full detail page

### Exit Criteria
- Map loads with test data
- Markers cluster/uncluster on zoom
- Detail page shows location info
- All tests pass

---

## Phase 3: Category Filtering & Search
**Estimated scope:** ~35k tokens

### Goals
- Filter locations by category
- Full-text search
- "Near me" geolocation search
- Multi-language support (DE/EN)

### Tasks

#### 3.1 Category Store & Components
```
/frontend/src/stores/
└── categories.ts

/frontend/src/components/
├── filters/
│   ├── CategoryFilter.vue     # Checkbox/chip filter
│   ├── SearchBar.vue          # Text search input
│   └── NearMeButton.vue       # Geolocation trigger
```

#### 3.2 Filter Composables
```
/frontend/src/composables/
├── useLocationFilters.ts      # Filter logic
├── useSearch.ts               # Full-text search
└── useNearby.ts               # PostGIS nearby query
```

#### 3.3 i18n Setup
```
/frontend/src/locales/
├── de.json                    # German translations
└── en.json                    # English translations

/frontend/src/plugins/
└── i18n.ts                    # Vue-i18n config
```

- Language switcher component
- URL-based locale (/de/, /en/)
- Locale detection on first visit

#### 3.4 Update Map to Use Filters
- Connect CategoryFilter to location store
- Filter markers on map
- Update URL with filter state

#### 3.5 Tests
- Category filtering logic
- Search function integration
- Nearby query with mock coordinates
- Language switching

### Deliverables
- [ ] Category filter UI (chips/checkboxes)
- [ ] Search bar with results
- [ ] "Near me" button with radius selector
- [ ] German/English language toggle
- [ ] URL reflects current filters

### Exit Criteria
- Filter by category updates map
- Search returns relevant results
- Near me shows distance-sorted results
- Language switch updates all UI text
- All tests pass

---

## Phase 4: Authentication & User Submissions
**Estimated scope:** ~45k tokens

### Goals
- User authentication (email + magic link)
- Location submission form
- User can view their submissions
- Form validation

### Tasks

#### 4.1 Auth Store & Components
```
/frontend/src/stores/
└── auth.ts

/frontend/src/components/
├── auth/
│   ├── LoginForm.vue          # Email/password login
│   ├── SignupForm.vue         # Registration
│   ├── MagicLinkForm.vue      # Passwordless option
│   └── UserMenu.vue           # Logged-in user dropdown
```

#### 4.2 Auth Composables
```
/frontend/src/composables/
└── useAuth.ts                 # Auth state & methods
```

#### 4.3 Auth Views
```
/frontend/src/views/
├── LoginView.vue
├── SignupView.vue
└── AuthCallbackView.vue       # Magic link redirect
```

#### 4.4 Submission Form
```
/frontend/src/views/
└── SubmitLocationView.vue

/frontend/src/components/
├── submission/
│   ├── LocationForm.vue       # Main form
│   ├── AddressAutocomplete.vue # Address input with Nominatim geocoding
│   ├── CategorySelect.vue     # Multi-select categories
│   └── OpeningHoursInput.vue  # Simple text input

/frontend/src/composables/
└── useNominatim.ts            # Nominatim API wrapper (1 req/sec rate limit)
```

**Nominatim Integration:**
- Free, OpenStreetMap-based geocoding
- Rate limit: 1 request per second
- No API key required
- Returns lat/lng for address validation

#### 4.5 User Dashboard
```
/frontend/src/views/
└── MySubmissionsView.vue      # List user's submissions
```

#### 4.6 Route Guards
- Protected routes (submit, my-submissions)
- Redirect to login if not authenticated

#### 4.7 Tests
- Auth flow (signup, login, logout)
- Form validation
- Submission creates pending location
- RLS blocks unauthorized access

### Deliverables
- [ ] Login/signup pages
- [ ] Magic link authentication
- [ ] Protected submission form
- [ ] Address geocoding (Nominatim)
- [ ] Multi-category selection
- [ ] "My submissions" page

### Exit Criteria
- User can register and login
- Submission creates pending location in DB
- User sees their pending submissions
- Cannot submit without auth
- All tests pass

---

## Phase 5: Admin Panel & Moderation
**Estimated scope:** ~35k tokens

### Goals
- Admin dashboard
- Approve/reject submissions
- Edit locations
- Basic admin user management

### Tasks

#### 5.1 Admin Store
```
/frontend/src/stores/
└── admin.ts                   # Admin-specific state
```

#### 5.2 Admin Views
```
/frontend/src/views/
├── admin/
│   ├── AdminDashboardView.vue # Overview stats
│   ├── PendingLocationsView.vue # Moderation queue
│   ├── LocationEditView.vue   # Edit any location
│   └── AllLocationsView.vue   # Browse all locations
```

#### 5.3 Admin Components
```
/frontend/src/components/
├── admin/
│   ├── ModerationCard.vue     # Pending location card
│   ├── ApproveRejectButtons.vue
│   ├── LocationEditForm.vue   # Full edit form
│   └── AdminStats.vue         # Dashboard widgets
```

#### 5.4 Admin Route Guard
- Check user role from JWT metadata
- Redirect non-admins

#### 5.5 Tests
- Admin can view pending locations
- Approve changes status to 'approved'
- Reject with reason
- Non-admin cannot access admin routes
- RLS policies work correctly

### Deliverables
- [ ] Admin dashboard with stats
- [ ] Pending submissions queue
- [ ] Approve/reject workflow
- [ ] Edit existing locations
- [ ] Admin-only route protection

### Exit Criteria
- Admin can moderate submissions
- Approved locations appear on map
- Rejected locations show reason to user
- Admin can edit any location
- All tests pass

---

## Phase 6: Infrastructure & Deployment
**Estimated scope:** ~25k tokens

### Goals
- Deploy CDK infrastructure
- CI/CD pipeline
- Production environment setup
- Domain + SSL

### Tasks

#### 6.1 CDK Deployment
- S3 bucket for static hosting
- CloudFront distribution
- Route53 DNS records
- ACM certificate

#### 6.2 Environment Configuration
```
/frontend/.env.production
/infra/cdk.context.json
```

#### 6.3 GitHub Actions CI/CD
```
/.github/workflows/
├── ci.yml                     # Test on PR
├── deploy-staging.yml         # Deploy to staging
└── deploy-production.yml      # Deploy to production
```

#### 6.4 Supabase Production Setup
- Production project
- Environment variables
- Database migrations script

#### 6.5 Build Optimization
- Vite build optimization
- Code splitting
- Asset optimization

### Deliverables
- [ ] Infrastructure deployed via CDK
- [ ] CI runs tests on PR
- [ ] CD deploys on merge to main
- [ ] Custom domain with HTTPS
- [ ] Production Supabase project

### Exit Criteria
- Site accessible at custom domain
- HTTPS working
- CI/CD pipeline functional
- All tests pass in CI

---

## Phase 7: Polish & Launch Prep
**Estimated scope:** ~20k tokens

### Goals
- UI/UX polish
- Error handling
- Loading states
- SEO basics
- Final testing

### Tasks

#### 7.1 UI Polish
- Consistent styling
- Responsive design check
- Loading skeletons
- Error boundaries

#### 7.2 SEO
- Meta tags (vue-meta or @unhead/vue)
- Open Graph tags
- Sitemap generation
- robots.txt

#### 7.3 Error Handling
- Global error handler
- Friendly error pages (404, 500)
- Toast notifications

#### 7.4 Performance
- Lazy load routes
- Image optimization
- Lighthouse audit

#### 7.5 E2E Tests (Playwright)
```
/tests/e2e/
├── map.spec.ts
├── search.spec.ts
├── auth.spec.ts
├── submit.spec.ts
└── admin.spec.ts
```

### Deliverables
- [ ] Polished UI across all pages
- [ ] SEO meta tags
- [ ] E2E test suite
- [ ] Lighthouse score > 90
- [ ] Error handling throughout

### Exit Criteria
- All pages responsive
- E2E tests pass
- No console errors
- Ready for user testing

---

## Data Migration (Parallel Task)

Can be done alongside Phase 5-7:
- Export data from Google My Maps
- Clean and format to match schema
- Import to Supabase
- Verify geocoding accuracy

---

## Summary

| Phase | Focus | Estimated Tokens |
|-------|-------|-----------------|
| 1 | Foundation & Schema | ~30k |
| 2 | Map & Locations | ~40k |
| 3 | Filters & Search | ~35k |
| 4 | Auth & Submissions | ~45k |
| 5 | Admin Panel | ~35k |
| 6 | Infrastructure | ~25k |
| 7 | Polish & Launch | ~20k |

**Total phases:** 7
**Each phase:** Self-contained, testable increment
**Context safety:** All phases well under 150k limit

---

## Recommended Execution Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7
                                          ↑
                              Data Migration (parallel)
```

Each phase builds directly on the previous. Start data migration once schema is stable (after Phase 1).
