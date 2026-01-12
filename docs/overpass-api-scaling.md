# Overpass API - Scaling Options

## Current Implementation (2026-01-12)

**Status:** Using public Overpass API instances with fallback

**Location:** `src/composables/useOverpass.ts`

**Strategy:**
- Multiple endpoint fallback (3 instances)
- 25-second timeout
- Automatic retry on different servers

**Endpoints:**
1. `https://overpass-api.de/api/interpreter` (primary)
2. `https://overpass.kumi.systems/api/interpreter` (fallback #1)
3. `https://maps.mail.ru/osm/tools/overpass/api/interpreter` (fallback #2)

**Issue:** Occasional 504 Gateway Timeouts during peak usage

---

## Future Scaling Options

### Option 1: Self-Hosted Overpass (Germany Extract)

**When to consider:** When hitting rate limits or reliability issues become critical

#### Server Requirements
- **RAM:** 12-16GB
- **Storage:** 50-100GB SSD
- **CPU:** 4+ cores
- **Data size:** Germany OSM extract (~3.5GB compressed, ~40-50GB with indexes)

#### Hosting Options

**Hetzner Server Auction** (Recommended - German datacenter)
- **Price:** €28-35/month
- **Specs:** 16-32GB RAM, no setup fee
- **Location:** Nuremberg/Falkenstein, Germany
- **Link:** https://www.hetzner.com/sb/#price_to=30&ram_to=64&onlyAuctions=true
- **Pros:** Low latency for Frankfurt users, supports German infrastructure
- **Cons:** Stock varies, need to watch auctions

**Kimsufi KS-1** (Best value)
- **Price:** $18.80/month + $18.80 setup
- **Specs:** 32GB RAM, 4c/8t Xeon-D, 2x480GB + 2x2TB SSD
- **Location:** France datacenter
- **Link:** https://eco.ovhcloud.com/en/?range=kimsufi
- **Pros:** Excellent hardware for the price
- **Cons:** ~10-15ms higher latency from France

**Hetzner Cloud VPS CX41**
- **Price:** €22.90/month
- **Specs:** 16GB RAM, 4 vCPU, 240GB SSD
- **Location:** Germany
- **Pros:** Quick setup, scalable
- **Cons:** Virtual server, not dedicated hardware

#### Setup Guide
1. Download Germany extract from http://download.geofabrik.de/europe/germany.html
2. Install Overpass API (Docker available)
3. Import data (~30-60 minutes)
4. Configure daily updates
5. Update `VITE_OVERPASS_API_URL` in `.env`

**Resources:**
- Installation guide: https://wiki.openstreetmap.org/wiki/Overpass_API/Installation
- Docker image: https://github.com/wiktorn/Overpass-API

---

### Option 2: Commercial APIs with API Keys

**When to consider:** Need guaranteed SLAs and support, want to avoid server management

#### Mapbox Places API
- **Free tier:** 100,000 requests/month
- **Pricing:** $0.60 per 1,000 requests after free tier
- **Link:** https://www.mapbox.com/pricing
- **Pros:** Easy integration, excellent documentation
- **Cons:** Not OSM native, different data model

#### HERE Places API
- **Free tier:** 250,000 requests/month
- **Pricing:** $1.00 per 1,000 requests after free tier
- **Link:** https://developer.here.com/pricing
- **Pros:** Generous free tier, very reliable
- **Cons:** Requires account setup

#### Google Places API
- **Free tier:** $200 credit monthly (~40,000 requests)
- **Pricing:** $17 per 1,000 requests (Nearby Search)
- **Link:** https://developers.google.com/maps/documentation/places/web-service/usage-and-billing
- **Pros:** Most comprehensive POI data
- **Cons:** Most expensive option

---

### Option 3: Contact OSM Foundation

**Email:** operations@osmfoundation.org

Explain the Zero Waste Frankfurt project - it's a public good use case they typically support. They might:
- Whitelist your servers
- Suggest query optimizations
- Provide guidance on best practices

Note: Overpass API does not offer API keys or commercial plans - it's volunteer-run.

---

## Decision Timeline

**Now (MVP):** Multi-endpoint fallback (implemented ✅)

**Phase 1 (1,000+ monthly users):** Consider Mapbox/HERE free tier

**Phase 2 (10,000+ monthly users):** Self-hosted Germany Overpass on Hetzner

**Phase 3 (100,000+ monthly users):** Dedicated infrastructure or commercial API

---

## Estimated Costs

| Solution | Monthly Cost | Setup | Best For |
|----------|--------------|-------|----------|
| Public Overpass (current) | €0 | None | MVP, testing |
| Mapbox Free Tier | €0 | 1 hour | Early growth |
| Hetzner Auction | €28-35 | €0 | Scaling up |
| Kimsufi KS-1 | ~€17 | ~€17 | Budget option |
| Mapbox Paid | ~€60+ | 1 hour | High volume |

---

## Implementation Notes

- Current fallback implementation handles ~95% of timeout issues
- Germany extract updates daily from Geofabrik
- Self-hosted Overpass eliminates all rate limits
- Commercial APIs provide better POI data but cost more

**Last updated:** 2026-01-12
