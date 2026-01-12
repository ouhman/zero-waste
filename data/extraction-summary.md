# Bücherschränke Data Extraction Summary

**Date:** 2026-01-12  
**Script:** scripts/extract-buecherschraenke.ts  
**Source:** https://frankfurt.de/themen/kultur/literatur/bibliotheken/buecherschraenke

## Extraction Results

- **Total locations:** 82 / 82 (100% success rate)
- **Locations with additional info:** 17 locations
- **Missing postal codes:** 1 (Nordend-West - Holzhausenpark)

## Data Quality

All extracted locations have:
- ✅ Name
- ✅ District
- ✅ Location short name
- ✅ Street address
- ⚠️  Postal code (1 missing)
- ✅ City (all set to "Frankfurt am Main")
- ➕ Additional info (optional, present in 17 locations)

## Sample Data

```json
{
  "name": "Bücherschrank Altstadt - Buchgasse",
  "district": "Altstadt",
  "location_short": "Buchgasse",
  "street": "Buchgasse 2",
  "postal_code": "60311",
  "city": "Frankfurt am Main",
  "additional_info": "An der Kreuzung Buchgasse/Alte Mainzer Gasse"
}
```

## Districts with Most Locations

```
Nordend: 6
Sachsenhausen: 5
Bockenheim: 4
Dornbusch: 4
Eckenheim: 4
```

## Next Steps

1. ✅ Phase 2 complete: Raw data extracted
2. 🔄 Phase 3: Geocode addresses using Nominatim API
3. 📥 Phase 4: Import into Supabase database

## Notes

- The extraction script handles cookie consent automatically
- CSS selector escaping implemented for IDs starting with digits
- All 82 locations extracted successfully on first complete run
- One location (Holzhausenpark) has no postal code on the website - will need manual lookup during geocoding
