# enrich-location Edge Function

Extracts schema.org JSON-LD data from business websites to enrich location information.

## Purpose

This function is called after OpenStreetMap enrichment to extract additional data that may not be available in OSM, particularly:
- Instagram/social media links
- Supplementary contact information
- Opening hours (if not in OSM)

## Endpoint

```
POST /functions/v1/enrich-location
```

## Request

```json
{
  "websiteUrl": "https://example.com"
}
```

## Response

### Success (200)
```json
{
  "success": true,
  "data": {
    "instagram": "https://instagram.com/example",
    "phone": "+49 69 123456",
    "email": "info@example.com",
    "openingHours": "Mo-Fr: 9:00-18:00"
  }
}
```

### Error (400)
```json
{
  "success": false,
  "error": "Invalid URL format"
}
```

### Error (403)
```json
{
  "success": false,
  "error": "Crawling not allowed by robots.txt"
}
```

### Error (408)
```json
{
  "success": false,
  "error": "Request timeout"
}
```

## Features

### 1. robots.txt Compliance
Checks `robots.txt` before fetching website content to respect crawling permissions.

### 2. Timeout Protection
5-second timeout to prevent hanging requests.

### 3. Schema.org Extraction
Parses `<script type="application/ld+json">` tags and extracts:
- `LocalBusiness` type schemas
- `Store`, `Restaurant`, `Cafe`, `Shop`, `Organization` types
- Social media links from `sameAs` array
- Contact information (phone, email)
- Opening hours from `openingHoursSpecification`

### 4. Error Handling
- Invalid URLs
- Network errors
- Malformed HTML
- Missing schema.org data
- Timeout errors

## Schema.org Support

### Supported Types
- LocalBusiness
- Store
- Restaurant
- Cafe
- Shop
- Organization

### Extracted Fields

| Schema.org Field | Extracted As | Notes |
|-----------------|--------------|-------|
| `telephone` | `phone` | Direct extraction |
| `email` | `email` | Direct extraction |
| `sameAs` | `instagram` | Searches for instagram.com URLs |
| `openingHours` | `openingHours` | Direct extraction |
| `openingHoursSpecification` | `openingHours` | Formatted as readable text |

### Example Schema.org

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Zero Waste Shop",
  "telephone": "+49 69 123456",
  "email": "info@example.com",
  "openingHours": "Mo-Fr 09:00-18:00",
  "sameAs": [
    "https://facebook.com/example",
    "https://instagram.com/example"
  ]
}
```

## Usage Flow

1. User pastes Google Maps URL
2. Frontend extracts coordinates and name
3. OSM enrichment fetches business metadata
4. If website found but no Instagram:
   - Call `enrich-location` with website URL
   - Extract Instagram and other missing data
   - Auto-fill form fields

## Testing

### Local Development

```bash
# Start Supabase locally
supabase start

# Serve function
supabase functions serve enrich-location --env-file .env.local

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/enrich-location' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"websiteUrl":"https://example.com"}'
```

### Manual Testing

Test with various websites:
- Small business with schema.org
- Large business with complex schema
- Website without schema.org (should return empty data)
- Website with robots.txt disallow (should return 403)
- Non-existent website (should timeout or error)

## Deployment

```bash
supabase functions deploy enrich-location
```

## Performance

- **Timeout:** 5 seconds max
- **robots.txt Check:** 2 seconds max
- **Average Response:** 1-2 seconds

## Privacy & Ethics

1. **Respects robots.txt:** Does not crawl if disallowed
2. **User-Agent:** Identifies as ZeroWasteFrankfurt bot
3. **Single Request:** Only one request per submission
4. **No Data Storage:** Does not store fetched HTML
5. **Public Data Only:** Only extracts publicly advertised information

## Error Recovery

If this function fails:
- Frontend continues without Instagram data
- User can manually add Instagram
- Other OSM data remains available
- No impact on core submission flow

## Future Enhancements

- [ ] Support more schema.org types (Museum, Park, etc.)
- [ ] Extract opening hours comments (e.g., "closed on holidays")
- [ ] Cache results for common websites
- [ ] Support for schema.org images
- [ ] Rate limiting per website domain
