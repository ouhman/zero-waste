# Zero Waste Frankfurt - Technical Spike & Architecture

**Date:** 2025-12-18
**Status:** Research & Planning Phase
**Goal:** Build an interactive, scalable map for zero-waste shopping across Frankfurt (and eventually Germany/Europe)

---

## Project Vision

Build an open, community-driven map to help people find:
- Bulk/package-free shops
- Second-hand stores
- Repair cafes
- Zero-waste friendly businesses

**Key Goals:**
- Start with Frankfurt
- Scale to Germany-wide, then Europe
- Allow community submissions with moderation
- Enable businesses to claim and manage their profiles
- Make it embeddable for other websites (Phase 2+)
- Multi-language support (German + English)

---

## Current State

**Existing Resource:**
- Google My Maps: https://www.zerowastefrankfurt.de/karte/
- Need to migrate away from Google Maps (cost concerns)

**Project Status:**
- Domain: Already on AWS (zerowaste-frankfurt.de or similar)
- Data: Will be provided separately by owner
- Categories: **TBD - Need to define with owner** ⚠️

---

## MVP Scope (Phase 1)

### ✅ MVP Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Interactive Map** | Display locations on OpenStreetMap | Vue + Leaflet.js |
| **Category Filtering** | Filter locations by type | Vue UI + Supabase queries |
| **Search** | Search by location name/address | PostgreSQL full-text search |
| **Near Me** | Find locations within radius | PostGIS geospatial queries |
| **User Authentication** | Login/signup for submissions | Supabase Auth (email + magic links) |
| **Submit Location** | Logged-in users can submit new places | Vue form + Supabase insert |
| **Admin Moderation** | Approve/reject submissions | Simple admin panel + RLS |
| **Multi-language** | German + English | Separate DB columns + vue-i18n |

### ❌ NOT in MVP (Phase 2+)

- Embed widgets (iframe, JavaScript widget)
- User favorites
- Business claiming/verification
- Photo uploads
- Reviews/ratings
- Smart recommendations
- Email notifications
- Advanced analytics (Plausible/Umami)
- Offline support (Service Worker for map tiles & location caching)

---

## Technical Architecture

### Frontend

**Stack:**
- **Vue 3** + **Vite** + **TypeScript**
- **Vue-Leaflet** for maps
- **Leaflet.markercluster** for marker clustering (migrate to Supercluster if >10K locations)
- **OpenStreetMap** tiles (free, no API limits)
- **Pinia** for state management
- **Vue Router** for navigation
- **Vue-i18n** for translations (DE/EN)

**Key Principle: Direct Supabase Connection**
- Vue app talks DIRECTLY to Supabase
- No Lambda needed for MVP
- All CRUD operations via Supabase client
- Security via Row-Level Security (RLS)

### Backend & Database

**Supabase (PostgreSQL + PostGIS)**

Why Supabase?
- ✅ Built-in authentication
- ✅ PostgreSQL with PostGIS (geospatial queries)
- ✅ Row-Level Security (RLS)
- ✅ Auto-generated REST API
- ✅ Real-time subscriptions
- ✅ Admin UI for user management
- ✅ Free tier: 500MB DB, 50K monthly active users
- ✅ Works seamlessly with AWS frontend

**Database Schema (MVP):**

```sql
-- Categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_de text NOT NULL,
  name_en text NOT NULL,
  slug text UNIQUE NOT NULL,  -- e.g., 'bulk-shops', 'repair-cafes'
  icon text,  -- Icon identifier
  color text,  -- Hex color for map markers
  created_at timestamptz DEFAULT now()
);

-- Locations table
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,  -- SEO-friendly URL: 'gramm-frankfurt-nordend'
  description_de text,
  description_en text,

  -- Address
  address text NOT NULL,
  city text NOT NULL,
  postal_code text,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,

  -- Contact
  website text,
  phone text,
  email text,

  -- Opening hours (free-form text for flexibility)
  opening_hours_text text,  -- e.g., "Mon-Fri 9-18, Sat 10-14"

  -- Moderation
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  rejection_reason text,

  -- Soft delete for GDPR/cleanup
  deleted_at timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Full-text search vector (auto-generated)
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('german', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('german', coalesce(description_de, '')), 'B') ||
    setweight(to_tsvector('german', coalesce(address, '')), 'C')
  ) STORED
);

-- Location-Category junction table (many-to-many)
CREATE TABLE location_categories (
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (location_id, category_id)
);

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Geospatial index
CREATE INDEX idx_locations_geography
  ON locations
  USING GIST (ST_MakePoint(longitude, latitude)::geography);

-- Other indexes
CREATE INDEX idx_locations_status ON locations(status);
CREATE INDEX idx_locations_city ON locations(city);
CREATE INDEX idx_locations_slug ON locations(slug);
CREATE INDEX idx_locations_search ON locations USING GIN (search_vector);
CREATE INDEX idx_location_categories_location ON location_categories(location_id);
CREATE INDEX idx_location_categories_category ON location_categories(category_id);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-generate SEO-friendly slug
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION generate_location_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  -- Create base slug from name and city
  base_slug := lower(regexp_replace(
    unaccent(NEW.name || '-' || NEW.city),
    '[^a-z0-9]+', '-', 'g'
  ));
  base_slug := trim(both '-' from base_slug);

  final_slug := base_slug;

  -- Handle duplicates
  WHILE EXISTS (SELECT 1 FROM locations WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER locations_generate_slug
  BEFORE INSERT OR UPDATE OF name, city ON locations
  FOR EACH ROW
  EXECUTE FUNCTION generate_location_slug();

-- Full-text search function
CREATE OR REPLACE FUNCTION search_locations(search_term text)
RETURNS SETOF locations AS $$
  SELECT *
  FROM locations
  WHERE search_vector @@ plainto_tsquery('german', search_term)
    AND status = 'approved'
    AND deleted_at IS NULL
  ORDER BY ts_rank(search_vector, plainto_tsquery('german', search_term)) DESC
$$ LANGUAGE sql STABLE;
```

**Row-Level Security (RLS) Policies:**

```sql
-- ===================
-- Categories RLS
-- ===================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify categories"
  ON categories FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ===================
-- Locations RLS
-- ===================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Public can view approved, non-deleted locations
CREATE POLICY "Anyone can view approved locations"
  ON locations FOR SELECT
  USING (status = 'approved' AND deleted_at IS NULL);

-- Authenticated users can submit locations (rate limited to 5 pending)
CREATE POLICY "Authenticated users can submit locations"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = submitted_by
    AND status = 'pending'
    AND (
      SELECT COUNT(*) FROM locations
      WHERE submitted_by = auth.uid() AND status = 'pending'
    ) < 5
  );

-- Users can view their own pending submissions
CREATE POLICY "Users can view own submissions"
  ON locations FOR SELECT
  TO authenticated
  USING (submitted_by = auth.uid());

-- Users can update their own pending submissions
CREATE POLICY "Users can update own pending submissions"
  ON locations FOR UPDATE
  TO authenticated
  USING (
    submitted_by = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    submitted_by = auth.uid()
    AND status = 'pending'
  );

-- Admins have full access
CREATE POLICY "Admins have full access"
  ON locations FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ===================
-- Location Categories RLS
-- ===================
ALTER TABLE location_categories ENABLE ROW LEVEL SECURITY;

-- Location categories follow location visibility
CREATE POLICY "Location categories are publicly readable for approved locations"
  ON location_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM locations l
      WHERE l.id = location_id
      AND l.status = 'approved'
      AND l.deleted_at IS NULL
    )
  );

-- Users can view categories for their own submissions
CREATE POLICY "Users can view categories for own submissions"
  ON location_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations l
      WHERE l.id = location_id
      AND l.submitted_by = auth.uid()
    )
  );

-- Authenticated users can add categories to their pending submissions
CREATE POLICY "Users can add categories to own pending submissions"
  ON location_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations l
      WHERE l.id = location_id
      AND l.submitted_by = auth.uid()
      AND l.status = 'pending'
    )
  );

-- Admins have full access to location categories
CREATE POLICY "Admins have full access to location categories"
  ON location_categories FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
```

**Geospatial Queries (PostGIS Functions):**

```sql
-- Find locations within radius
CREATE OR REPLACE FUNCTION locations_nearby(
  lat decimal,
  lng decimal,
  radius_meters integer DEFAULT 5000
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  address text,
  latitude decimal,
  longitude decimal,
  distance_meters integer
) AS $$
  SELECT
    l.id,
    l.name,
    l.slug,
    l.address,
    l.latitude,
    l.longitude,
    ST_Distance(
      ST_MakePoint(l.longitude, l.latitude)::geography,
      ST_MakePoint(lng, lat)::geography
    )::integer as distance_meters
  FROM locations l
  WHERE ST_DWithin(
    ST_MakePoint(l.longitude, l.latitude)::geography,
    ST_MakePoint(lng, lat)::geography,
    radius_meters
  )
  AND l.status = 'approved'
  AND l.deleted_at IS NULL
  ORDER BY distance_meters
$$ LANGUAGE sql STABLE;
```

### AWS Infrastructure (CDK)

**Hosting:**
- **S3** - Static website hosting
- **CloudFront** - CDN for global distribution, HTTPS
- **Route53** - DNS (domain already on AWS)
- **Certificate Manager** - SSL/TLS certificate

**No Lambda in MVP!**

**CDK Stack Structure:**

```typescript
// lib/frontend-stack.ts
export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // S3 bucket for static website
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',  // SPA routing
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      }),
      removalPolicy: cdk.RemovalPolicy.RETAIN
    })

    // CloudFront Origin Access Identity
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI')

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'CDN', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity: oai
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5)
        }
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,  // Europe + US
      domainNames: [domainName],
      certificate: certificate
    })

    // Output URLs
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: distribution.distributionDomainName
    })

    new cdk.CfnOutput(this, 'BucketName', {
      value: websiteBucket.bucketName
    })
  }
}
```

**Deployment:**

```bash
# Deploy infrastructure
npm run cdk:deploy

# Build and upload Vue app
npm run build
aws s3 sync dist/ s3://<bucket-name>/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <dist-id> \
  --paths "/*"
```

### Authentication Flow

**Supabase Auth (Email + Magic Links):**

```typescript
// In Vue app
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Sign up
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password'
})

// Sign in
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
})

// Magic link (passwordless)
await supabase.auth.signInWithOtp({
  email: 'user@example.com'
})

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Sign out
await supabase.auth.signOut()
```

**User Roles:**

Stored in `auth.users.user_metadata`:

```json
{
  "role": "user"  // or "admin"
}
```

Set via Supabase Dashboard or SQL:

```sql
-- Promote user to admin
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@zerowaste-frankfurt.de';
```

---

## Multi-Language Strategy

**Two-pronged approach:**

1. **Database content** - Separate columns for DE/EN
2. **UI strings** - vue-i18n

**Database:**

```sql
-- Content translations in columns
CREATE TABLE locations (
  name text NOT NULL,  -- Usually same in all languages
  description_de text,
  description_en text,
  -- ...
);

CREATE TABLE categories (
  name_de text NOT NULL,
  name_en text NOT NULL,
  slug text UNIQUE  -- Language-agnostic
);
```

**Vue i18n:**

```typescript
// locales/de.json
{
  "nav.home": "Startseite",
  "nav.map": "Karte",
  "filter.categories": "Kategorien filtern",
  "location.submit": "Ort hinzufügen",
  "location.name": "Name",
  "location.address": "Adresse",
  "search.placeholder": "Suche nach Orten..."
}

// locales/en.json
{
  "nav.home": "Home",
  "nav.map": "Map",
  "filter.categories": "Filter categories",
  "location.submit": "Submit location",
  "location.name": "Name",
  "location.address": "Address",
  "search.placeholder": "Search for locations..."
}
```

**URL Strategy:**
- `/` - Detect browser language
- `/de/` - German
- `/en/` - English

---

## Analytics (MVP)

**Keep it simple for MVP - no custom tracking needed:**

| Source | What it provides |
|--------|-----------------|
| **Supabase Dashboard** | API calls, active users, database size |
| **CloudFront Logs** | Page views, geographic distribution, popular pages |

**Phase 2+ (if needed):**
- Add [Plausible](https://plausible.io/) or [Umami](https://umami.is/) - privacy-friendly, no cookie consent required (~€9/month)
- Both are GDPR-compliant out of the box
- Can self-host Umami for free

---

## Testing Strategy (TDD)

### Unit Tests
- **Vitest** for Vue components and composables
- Test coverage: 80%+ for business logic

```typescript
// Example: __tests__/useLocationFilters.test.ts
import { describe, it, expect } from 'vitest'
import { useLocationFilters } from '@/composables/useLocationFilters'

describe('useLocationFilters', () => {
  it('filters locations by category', () => {
    const { filterByCategory } = useLocationFilters()
    const locations = [
      { id: 1, categories: ['bulk-shops', 'organic'] },
      { id: 2, categories: ['repair-cafes'] },
      { id: 3, categories: ['bulk-shops', 'second-hand'] }
    ]
    const filtered = filterByCategory(locations, ['bulk-shops'])
    expect(filtered).toHaveLength(2)
    expect(filtered.map(l => l.id)).toEqual([1, 3])
  })

  it('filters by multiple categories (OR logic)', () => {
    const { filterByCategory } = useLocationFilters()
    const locations = [
      { id: 1, categories: ['bulk-shops'] },
      { id: 2, categories: ['repair-cafes'] }
    ]
    const filtered = filterByCategory(locations, ['bulk-shops', 'repair-cafes'])
    expect(filtered).toHaveLength(2)
  })
})
```

### Integration Tests
- **Playwright** for E2E testing
- Test critical user flows:
  - User can view map and filter locations
  - User can register and submit location
  - Admin can approve/reject submissions

```typescript
// tests/e2e/submit-location.spec.ts
import { test, expect } from '@playwright/test'

test('authenticated user can submit location', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')

  // Submit location
  await page.goto('/submit')
  await page.fill('[name="name"]', 'Test Shop')
  await page.fill('[name="address"]', 'Teststr. 1, Frankfurt')
  await page.click('button[type="submit"]')

  // Verify success
  await expect(page.locator('.success-message')).toBeVisible()
})
```

### Database Tests
- Use Supabase test project or local PostgreSQL
- Test RLS policies
- Test PostGIS functions

```typescript
// tests/database/rls.test.ts
test('non-admin cannot approve locations', async () => {
  const { error } = await supabase
    .from('locations')
    .update({ status: 'approved' })
    .eq('id', testLocationId)

  expect(error).toBeDefined()
  expect(error.code).toBe('42501')  // insufficient_privilege
})
```

---

## Security Best Practices

### Frontend Security
- ✅ Environment variables for API keys (never commit)
- ✅ Content Security Policy (CSP) headers via CloudFront
- ✅ Input validation and sanitization
- ✅ XSS prevention (Vue handles this by default)
- ✅ HTTPS only (enforced by CloudFront)

### Backend Security (Supabase)
- ✅ Row-Level Security (RLS) on all tables
- ✅ API keys stored as environment variables
- ✅ JWT tokens for authentication (handled by Supabase)
- ✅ CORS configured properly
- ✅ Rate limiting (Supabase built-in)
- ✅ SQL injection prevention (parameterized queries)

### Secrets Management
- ✅ AWS Secrets Manager for sensitive values
- ✅ CDK retrieves secrets at deploy time
- ✅ Never commit `.env` files

```typescript
// CDK: Load secrets
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'

const supabaseSecret = secretsmanager.Secret.fromSecretNameV2(
  this,
  'SupabaseSecret',
  'zerowaste/supabase'
)
```

---

## Scalability Considerations

### Database Scalability
- **PostGIS spatial indexes** - Fast geospatial queries even with 100K+ locations
- **Partitioning** - Can partition `locations` by city if needed at scale
- **Read replicas** - Supabase supports read replicas for heavy traffic
- **Connection pooling** - Supabase Pooler for high concurrency

### Frontend Scalability
- **CloudFront CDN** - Global edge caching
- **Lazy loading** - Load map markers in viewport only
- **Marker clustering** - Cluster nearby markers at low zoom levels
- **Code splitting** - Lazy load admin panel, submission form

### Data Migration Path
- **Start:** Supabase free tier (500MB, plenty for MVP)
- **Growth:** Supabase Pro ($25/mo, 8GB database)
- **Scale:** Self-hosted PostgreSQL if needed (Supabase uses standard Postgres - easy export)

---

## Phase 2+ Features (Future)

### Embed Widgets

**iFrame Embed:**
```html
<iframe src="https://map.zerowaste-frankfurt.de/embed?city=frankfurt&lang=de"
        width="100%" height="600px"></iframe>
```

**JavaScript Widget:**
```html
<script src="https://cdn.zerowaste-frankfurt.de/widget.js"></script>
<script>
  ZeroWasteMap.create({
    container: '#map',
    city: 'frankfurt',
    categories: ['bulk-shops']
  })
</script>
```

### Business Claiming

**Extended schema:**
```sql
CREATE TABLE business_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id),
  claimed_by uuid REFERENCES auth.users(id),
  verification_method text,  -- 'email', 'phone', 'document'
  verification_data jsonb,
  status text DEFAULT 'pending',  -- 'pending', 'verified', 'rejected'
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id)
);
```

### User Favorites

```sql
CREATE TABLE user_favorites (
  user_id uuid REFERENCES auth.users(id),
  location_id uuid REFERENCES locations(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, location_id)
);
```

### Smart Recommendations (Lambda)

When needed, add Lambda functions:

```typescript
// lambda/recommendations/handler.ts
export async function handler(event: APIGatewayEvent) {
  const user = verifySupabaseToken(event.headers.authorization)

  // Get user's favorite categories
  const userActivity = await getUserActivity(user.userId)

  // ML-based recommendations
  const recommendations = await getRecommendations(userActivity)

  return {
    statusCode: 200,
    body: JSON.stringify(recommendations)
  }
}
```

**CDK for Lambda (when needed):**

```typescript
// lib/api-stack.ts
const apiLambda = new lambda.Function(this, 'RecommendationsAPI', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'recommendations.handler',
  code: lambda.Code.fromAsset('lambda'),
  environment: {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_JWT_SECRET: supabaseJwtSecret
  }
})

const api = new apigateway.RestApi(this, 'API')
const recommendations = api.root.addResource('recommendations')
recommendations.addMethod('GET', new apigateway.LambdaIntegration(apiLambda))
```

---

## Questions for Owner

### Categories
- [ ] What categories do you currently use on the Google Map?
- [ ] Examples: Bulk shops, Repair cafes, Second-hand stores, Zero-waste restaurants, etc.
- [ ] Do you need subcategories? (e.g., "Shops" > "Bulk", "Clothing", "Furniture")
- [ ] Icon preferences for each category?

### Data Import
- [ ] How many locations are currently on the Google Map?
- [ ] Can you export the data, or should we scrape it?
- [ ] Are there existing descriptions in German and English?
- [ ] Who originally added these locations?

### Moderation & Admin
- [ ] Who will be the initial admins?
- [ ] How many people need admin access?
- [ ] What's the expected submission volume? (locations per week)
- [ ] Approval criteria? (What makes a location eligible?)

### Business Claiming (Phase 2)
- [ ] Should businesses be able to self-service claim their profiles?
- [ ] What verification method? (Email to business domain, phone call, document upload?)
- [ ] Can businesses edit all fields or just specific ones?

### Multi-language
- [ ] Are all current locations described in both DE and EN?
- [ ] Who will translate new submissions?
- [ ] Future languages? (Turkish, Arabic, etc. for diverse communities?)

### Embed & Partnerships
- [ ] Which websites would you like to partner with?
- [ ] Any specific requirements for the embed widget?
- [ ] Should embedded maps show all locations or be filterable?

### Analytics & Privacy
- [ ] What metrics are most important? (total views, popular locations, search terms?)
- [ ] Privacy policy - do you have one? Need help creating one?
- [ ] GDPR compliance - cookie consent needed?

### Domain & Branding
- [ ] Exact domain name?
- [ ] Branding guidelines? (colors, logo, fonts)
- [ ] Favicon, social media preview images?

---

## Next Steps

### 1. Owner Consultation
- Review this spike document with owner
- Answer questions listed above
- Define categories together
- Get access to existing data

### 2. Project Setup
- [ ] Create GitHub repository
- [ ] Set up project structure (Vue + CDK)
- [ ] Create Supabase project
- [ ] Configure AWS credentials

### 3. MVP Development (TDD)
- [ ] Set up Vitest + Playwright
- [ ] Database schema + migrations
- [ ] Authentication flow
- [ ] Map component with Leaflet
- [ ] Location listing and filtering
- [ ] Submission form
- [ ] Admin panel
- [ ] Multi-language setup

### 4. Data Migration
- [ ] Extract data from Google Maps
- [ ] Clean and format data
- [ ] Import to Supabase
- [ ] Verify geocoding accuracy

### 5. Deployment
- [ ] CDK infrastructure deployment
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Domain + SSL certificate
- [ ] Production deployment

### 6. Testing & Launch
- [ ] E2E testing
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Soft launch (beta users)
- [ ] Public launch

---

## Cost Estimation

### MVP (First Year)

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Free tier | €0 |
| AWS S3 | Static hosting (~10GB/mo) | €0.23/mo |
| AWS CloudFront | ~50GB transfer | €4.25/mo |
| AWS Route53 | Hosted zone | €0.50/mo |
| Domain | Existing | €0 |
| **Total** | | **~€5/month = €60/year** |

### Scale (Germany-wide, 50K locations, 10K users/mo)

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Pro | €23/mo |
| AWS S3 | Static hosting | €1/mo |
| AWS CloudFront | ~500GB transfer | €42/mo |
| AWS Route53 | Hosted zone | €0.50/mo |
| AWS Lambda | (if added) | ~€5/mo |
| **Total** | | **~€70/month = €840/year** |

Still very cost-effective!

---

## Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Frontend Framework** | Vue 3 + Vite + TypeScript | Modern, fast, type-safe, excellent DX |
| **Map Library** | Leaflet.js + Vue-Leaflet | Free, lightweight, no API limits |
| **Marker Clustering** | Leaflet.markercluster | Easy integration, migrate to Supercluster if >10K locations |
| **Map Tiles** | OpenStreetMap | Free, open-source, community-maintained |
| **Backend/Database** | Supabase (PostgreSQL + PostGIS) | Managed service, excellent DX, RLS, geospatial support |
| **Full-text Search** | PostgreSQL tsvector + GIN | Built-in, no external service, German language support |
| **Authentication** | Supabase Auth | Built-in, secure, supports email + magic links |
| **Infrastructure** | AWS CDK (TypeScript) | Type-safe IaC, best for AI assistance |
| **Hosting** | S3 + CloudFront | Cost-effective, scalable, global CDN |
| **State Management** | Pinia | Official Vue state library, simple, type-safe |
| **Testing** | Vitest + Playwright | Fast unit tests, reliable E2E tests |
| **i18n** | Vue-i18n | Standard Vue internationalization |
| **Analytics** | CloudFront logs + Supabase dashboard | No custom tracking in MVP, add Plausible/Umami later if needed |
| **Lambda** | Not in MVP | Add only when needed (Phase 2+) |

---

## Resources & Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Vue 3 Docs](https://vuejs.org/)
- [Vue-Leaflet](https://vue-leaflet.github.io/Vue-Leaflet/)
- [Leaflet.js](https://leafletjs.com/)
- [AWS CDK Docs](https://docs.aws.amazon.com/cdk/)
- [PostGIS](https://postgis.net/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)

---

## Notes

- Architecture is designed to scale from Frankfurt to Europe without major rewrites
- No vendor lock-in: Supabase uses standard PostgreSQL (easy to migrate)
- MVP can launch with **zero Lambda functions** - everything via Supabase direct
- Security built-in via Row-Level Security (RLS)
- Cost-effective: ~€5/month for MVP, ~€70/month at Germany scale
- Open to community contributions while maintaining quality through moderation
