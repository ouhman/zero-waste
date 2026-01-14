# Phase 3 Event Tracking - Manual Testing Checklist

## Prerequisites

1. **Set GA Measurement ID** in `.env`:
   ```bash
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

2. **Enable Debug Mode** (optional, for detailed console logs):
   - Open browser DevTools Console
   - Events will show in console if debug mode is enabled in GoogleAnalyticsProvider

3. **Open Google Analytics Real-Time View**:
   - Go to Google Analytics → Reports → Real-time → Events
   - Keep this open in a separate tab to verify events

## Testing Checklist

### ✅ 1. Map Rendered Event
**Steps:**
1. Navigate to homepage `/`
2. Wait for map to load

**Expected:**
- Event `map_rendered` fires once
- No parameters
- Should only fire once even if you interact with the map

**Verify in GA:** Real-time → Events → See "map_rendered"

---

### ✅ 2. Location Detail View Event
**Steps:**
1. Click on any location marker on the map
2. Wait for LocationDetailPanel to open

**Expected:**
- Event `location_detail_view` fires
- Parameters:
  - `location_slug`: e.g., "repair-cafe-bockenheim"
  - `category`: e.g., "repair-cafe" (if location has category)

**Verify in GA:** Real-time → Events → See "location_detail_view" with parameters

**Repeat:**
- Click different location → should track new slug
- Close and reopen same location → should track again

---

### ✅ 3. Share Click Event (Native Share)
**Steps:**
1. Open a location detail panel
2. Click the share button (share icon)
3. Click the green "Share" button (if on mobile) or any social media icon

**Expected:**
- Event `share_click` fires
- Parameters:
  - `method`: "native"
  - `location_slug`: e.g., "repair-cafe-bockenheim"

**Verify in GA:** Real-time → Events → See "share_click" with method="native"

---

### ✅ 4. Share Click Event (Clipboard)
**Steps:**
1. Open a location detail panel
2. Click the share button (share icon)
3. Click the "Copy" button next to the URL field

**Expected:**
- Event `share_click` fires
- Parameters:
  - `method`: "clipboard"
  - `location_slug`: e.g., "repair-cafe-bockenheim"

**Verify in GA:** Real-time → Events → See "share_click" with method="clipboard"

---

### ✅ 5. Submission Started Event (Google Maps)
**Steps:**
1. Navigate to `/submit`
2. Click on the "Google Maps Link" method card

**Expected:**
- Event `submission_started` fires
- Parameters:
  - `method`: "google_maps"

**Verify in GA:** Real-time → Events → See "submission_started" with method="google_maps"

---

### ✅ 6. Submission Started Event (Pin on Map)
**Steps:**
1. Navigate to `/submit`
2. Click on the "Pin on Map" method card

**Expected:**
- Event `submission_started` fires
- Parameters:
  - `method`: "pin_on_map"

**Verify in GA:** Real-time → Events → See "submission_started" with method="pin_on_map"

---

### ✅ 7. Submission Completed Event
**Steps:**
1. Navigate to `/submit`
2. Select either submission method (Google Maps or Pin on Map)
3. Fill out the entire form with valid data
4. Submit the form and wait for success message

**Expected:**
- Event `submission_completed` fires
- Parameters:
  - `method`: "google_maps" or "pin_on_map" (depending on method selected in step 2)

**Verify in GA:** Real-time → Events → See "submission_completed" with correct method

**Note:** Only fires on successful submission, not on validation errors or failures.

---

### ✅ 8. Edit Suggestion Submitted Event
**Steps:**
1. Open a location detail panel
2. Scroll to "Opening Hours" section
3. Click the "Suggest edit" link (if hours are missing or need correction)
4. Fill out the hours suggestion form
5. Click "Submit"

**Expected:**
- Event `edit_suggestion_submitted` fires
- Parameters:
  - `location_slug`: e.g., "repair-cafe-bockenheim"

**Verify in GA:** Real-time → Events → See "edit_suggestion_submitted" with location_slug

**Note:** Only fires on successful submission, not on validation errors or failures.

---

## Browser Console Verification

If you have debug mode enabled, you should see console logs like:

```
[Analytics] Track event: map_rendered {}
[Analytics] Track event: location_detail_view { location_slug: "repair-cafe-bockenheim", category: "repair-cafe" }
[Analytics] Track event: share_click { method: "clipboard", location_slug: "repair-cafe-bockenheim" }
[Analytics] Track event: submission_started { method: "google_maps" }
[Analytics] Track event: submission_completed { method: "google_maps" }
[Analytics] Track event: edit_suggestion_submitted { location_slug: "repair-cafe-bockenheim" }
```

## Common Issues

### Events Not Showing in GA
- **Check:** Is `VITE_GA_MEASUREMENT_ID` set correctly?
- **Check:** Is consent granted? (Cookie consent banner)
- **Check:** Is the app running on localhost? (Some GA configs block localhost)
- **Wait:** Real-time events can take 5-10 seconds to appear

### Events Firing Multiple Times
- **Map Rendered:** Should only fire once - check `mapTracked` flag is working
- **Other Events:** Multiple firings are expected if user repeats actions

### Missing Parameters
- **Check:** Location has a valid `slug` (not null in database)
- **Check:** Category exists for location (for `location_detail_view`)

## Success Criteria

All 8 events should:
- ✅ Fire when expected
- ✅ Include correct parameters
- ✅ Show up in Google Analytics Real-Time view
- ✅ Not fire on errors or cancellations
- ✅ Only track after user consents (if consent banner is shown)
