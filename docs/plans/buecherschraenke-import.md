# Bücherschränke Import Plan

## Overview

Add 82 public bookcases (Bücherschränke) from the City of Frankfurt's official list to the Zero Waste Frankfurt map.

**Source:** https://frankfurt.de/themen/kultur/literatur/bibliotheken/buecherschraenke

## Data Summary

- **Total locations:** 82
- **Type:** Public bookcases for free book exchange (24/7)
- **Coverage:** All Frankfurt districts
- **Data available per location:**
  - Name (e.g., "Bücherschrank Altstadt - Buchgasse")
  - District (extracted from name)
  - Street/Location (extracted from name)
  - Full address available by clicking each tab

## Implementation Phases

### Phase 1: Category Setup

**Task:** Create a new category for Bücherschränke

| Field | Value |
|-------|-------|
| name_de | Bücherschrank |
| name_en | Public Bookcase |
| slug | buecherschrank |
| icon | 📚 (or custom icon) |
| color | #8B4513 (brown) or similar |
| description_de | Offene Bücherschränke zum kostenlosen Tauschen und Ausleihen von Büchern |
| description_en | Public bookcases for free book exchange |

**Method:** Admin panel or direct SQL insert

### Phase 2: Data Extraction Script

**Task:** Create a Node.js script to extract full addresses

```
scripts/extract-buecherschraenke.ts
```

**Approach:**
1. Navigate to main page with Playwright
2. Click each tab to reveal address details
3. Extract: name, street, postal code, additional info
4. Save to JSON file

**Output format:**
```json
{
  "locations": [
    {
      "name": "Bücherschrank Altstadt - Buchgasse",
      "district": "Altstadt",
      "street": "Buchgasse 2",
      "postal_code": "60311",
      "city": "Frankfurt am Main",
      "additional_info": "An der Kreuzung Buchgasse/Alte Mainzer Gasse"
    }
  ]
}
```

### Phase 3: Geocoding

**Task:** Convert addresses to lat/lng coordinates

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| **A) Nominatim (OSM)** | Free, no API key, already used in app | Rate limited (1 req/sec) |
| **B) Frankfurt Stadtplan API** | Coordinates in URL | Different projection (UTM), needs conversion |
| **C) Google Geocoding** | Accurate | Costs money, needs API key |

**Recommendation:** Option A (Nominatim) with rate limiting

**Implementation:**
1. Add geocoding step to extraction script
2. Query: `{street}, {postal_code} Frankfurt am Main, Germany`
3. Store lat/lng in JSON output
4. Manual verification for any failed geocodes

### Phase 4: Import Script

**Task:** Create import script to insert locations into Supabase

```
scripts/import-buecherschraenke.ts
```

**Steps:**
1. Read extracted JSON data
2. For each location:
   - Generate slug from name
   - Insert into `locations` table with status='approved'
   - Link to Bücherschrank category in `location_categories`
3. Log results (success/failures)

**Location data mapping:**
```typescript
{
  name: "Bücherschrank Altstadt - Buchgasse",
  address: "Buchgasse 2",
  city: "Frankfurt am Main",
  suburb: "Altstadt",
  postal_code: "60311",
  latitude: "50.1234",
  longitude: "8.5678",
  status: "approved",
  description_de: "Offener Bücherschrank - 24/7 geöffnet. An der Kreuzung Buchgasse/Alte Mainzer Gasse",
  description_en: "Public bookcase - open 24/7",
  opening_hours_osm: "24/7",
  website: "https://frankfurt.de/themen/kultur/literatur/bibliotheken/buecherschraenke"
}
```

### Phase 5: Verification

**Task:** Verify imported data

1. Check map displays all 82 locations
2. Verify category filter works
3. Spot-check 5-10 locations for correct positioning
4. Test search functionality

## Alternative Approaches

### Option A: Manual Entry via Admin Panel
- **Pros:** No code needed, uses existing UI
- **Cons:** Very tedious (82 locations), error-prone

### Option B: CSV Import
- **Pros:** Simple format, easy to review
- **Cons:** Would need to build CSV import feature

### Option C: Automated Script (Recommended)
- **Pros:** Fast, reproducible, can re-run if source updates
- **Cons:** One-time development effort

## Files to Create

```
scripts/
  extract-buecherschraenke.ts    # Playwright extraction
  geocode-buecherschraenke.ts    # Nominatim geocoding
  import-buecherschraenke.ts     # Supabase import
data/
  buecherschraenke-raw.json      # Extracted data
  buecherschraenke-geocoded.json # With coordinates
```

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Category | 5 min (admin panel) |
| Phase 2: Extraction | Script already mostly done from exploration |
| Phase 3: Geocoding | Add rate-limited Nominatim calls |
| Phase 4: Import | Supabase insert script |
| Phase 5: Verification | Manual spot-checks |

## Questions to Resolve

1. **Category icon:** Use emoji (📚) or upload custom SVG?
2. **Duplicates:** Check if any Bücherschränke already exist in database?
3. **Updates:** How to handle future updates from source? (Re-run script vs manual)
4. **Special cases:** "Kinderbücherschrank" - same category or separate?

## Raw Data (82 locations)

```
1. Bücherschrank Altstadt - Buchgasse
2. Bücherschrank Bahnhofsviertel - Gallusanlage (englischsprachig)
3. Bücherschrank Bergen-Enkheim - Triebstraße/Leuchte (Enkheim)
4. Bücherschrank Berkersheim - Am Dachsberg
5. Bücherschrank Bockenheim - Kirchplatz
6. Bücherschrank Bockenheim - Kollwitzstraße
7. Bücherschrank Bockenheim - Friedrich-Naumann-Platz (Kuhwaldsiedlung)
8. Bücherschrank Bockenheim - Leipziger Straße
9. Bücherschrank Bonames/Kalbach - Tower Café
10. Bücherschrank Bonames - Platz am Wendelsgarten
11. Bücherschrank Bornheim - Berger Straße
12. Bücherschrank Bornheim - Friedberger Warte
13. Bücherschrank Bornheim - Im Prüfling
14. Bücherschrank Dornbusch - Albert-Schweitzer-Siedlung
15. Bücherschrank Dornbusch - Jean-Paul-Straße
16. Bücherschrank Dornbusch - Platenstraße
17. Bücherschrank Dornbusch - Eschersheimer Landstraße 248
18. Bücherschrank Eckenheim - Gelnhäuser Straße
19. Bücherschrank Eckenheim - Gießener Straße 44
20. Bücherschrank Eckenheim - Porthstraße
21. Bücherschrank Eckenheim - Sigmund-Freud-Straße
22. Bücherschrank Eschersheim - Am Weißen Stein
23. Bücherschrank Eschersheim - Im Geeren
24. Bücherschrank Eschersheim - Niedwiesenstraße
25. Bücherschrank Fechenheim - Ankergasse
26. Bücherschrank Fechenheim - Langenselbolder Straße/Birsteiner Straße
27. Bücherschrank Frankfurter Berg - Malvenweg
28. Bücherschrank Gallus - Ackermannstraße
29. Bücherschrank Gallus - Anspacher Straße
30. Bücherschrank Gallus - Golub-Lebedenko-Platz
31. Bücherschrank Gallus - Schneidhainer Straße
32. Bücherschrank Ginnheim - Ginnheimer Kirchplatz
33. Bücherschrank Ginnheim - Höhenblick
34. Bücherschrank Griesheim - Alte Falterstraße
35. Bücherschrank Gutleutviertel - Schönstraße
36. Bücherschrank Gutleutviertel - Werftstraße
37. Bücherschrank Harheim - Alter Harheimer Kirchplatz
38. Bücherschrank Hausen - Kleine Nelkenstraße
39. Bücherschrank Höchst - Andreasplatz
40. Bücherschrank Heddernheim - Hadrianstraße
41. Bücherschrank Heddernheim - Karl-Perott-Platz
42. Bücherschrank Kalbach - Kalbacher Hauptstraße
43. Bücherschrank Niederursel - Kupferhammer (Mertonviertel)
44. Bücherschrank Nied - Alt-Nied 1
45. Bücherschrank Nied - Neumarkt
46. Bücherschrank Nieder-Erlenbach - Am Bürgerbrunnen
47. Kinderbücherschrank Nieder-Eschbach - Ben-Gurion-Ring 39
48. Bücherschrank Nieder-Eschbach - Deuil-La-Barre-Straße 26
49. Bücherschrank Niederrad - Bruchfeldstraße
50. Bücherschrank Niederursel - Ecke Weißkirchener Weg / Gerhart-Hauptmann-Ring
51. Bücherschrank Niederursel - Kultur- und Sozialzentrum
52. Bücherschrank Nordend-Ost - Hallgartenstraße
53. Bücherschrank Nordend-Ost - Merianplatz
54. Bücherschrank Nordend-West - Glauburgstraße
55. Bücherschrank Nordend-West - Holzhausenpark
56. Bücherschrank Nordend-West - Maria-Ward-Platz
57. Bücherschrank Nordend-West - Oeder Weg/Bornwiesenweg
58. Bücherschrank Oberrad - Buchrainplatz
59. Bücherschrank Ostend - Parlamentsplatz
60. Bücherschrank Ostend - Paul-Arnsberg-Platz
61. Bücherschrank Praunheim - In der Römerstadt 272
62. Bücherschrank Praunheim - Siedlung Westhausen
63. Bücherschrank Preungesheim - Gravensteiner-Platz
64. Bücherschrank Preungesheim - Wegscheidestraße
65. Bücherschrank Rödelheim - Arthur-Stern-Platz
66. Bücherschrank Riedberg - Riedbergplatz
67. Bücherschrank Riederwald - Raiffeisenstraße
68. Bücherschrank Sachsenhausen - Dreieichstraße
69. Bücherschrank Sachsenhausen - An der Lukaskirche
70. Bücherschrank Sachsenhausen-Süd - Mailänder Straße/Grethenweg
71. Bücherschrank Sachsenhausen-Nord - Schweizer Platz
72. Bücherschrank Sachsenhausen - Walther-von-Cronberg-Platz
73. Bücherschrank Seckbach - Atzelbergplatz
74. Bücherschrank Seckbach - Wilhelmshöher Straße 149
75. Bücherschrank Sindlingen - Richard-Weidlich-Platz
76. Bücherschrank Sossenheim - Carl-Sonnenschein-Siedlung
77. Bücherschrank Sossenheim - Sossenheimer Riedstraße
78. Bücherschrank Schwanheim - Bürgerhaus Goldstein
79. Bücherschrank Unterliederbach - An der Ludwig-Erhard-Schule
80. Bücherschrank Unterliederbach - Sieringstraße 54
81. Bücherschrank Westend - Odina-Bott-Platz
82. Bücherschrank Zeilsheim - Bechtenwaldstraße
```
