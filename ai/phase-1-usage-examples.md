# Phase 1 Composables - Usage Examples

Quick reference guide for using the new composables created in Phase 1.

---

## `useGeolocation`

### Basic Usage

```vue
<script setup lang="ts">
import { useGeolocation } from '@/composables/useGeolocation'

const { getUserLocation, loading, error, location } = useGeolocation()

async function handleNearbyClick() {
  const result = await getUserLocation()

  if (result) {
    console.log('User location:', result.lat, result.lng)
    console.log('Accuracy:', result.accuracy, 'meters')
  } else {
    console.error('Failed to get location:', error.value)
  }
}
</script>

<template>
  <button @click="handleNearbyClick" :disabled="loading">
    <span v-if="loading">Getting your location...</span>
    <span v-else>I'm nearby</span>
  </button>

  <div v-if="error" class="error">
    {{ error }}
  </div>

  <div v-if="location">
    Latitude: {{ location.lat }}<br>
    Longitude: {{ location.lng }}<br>
    Accuracy: ~{{ location.accuracy }}m
  </div>
</template>
```

### Reactive Location Updates

```typescript
import { watch } from 'vue'
import { useGeolocation } from '@/composables/useGeolocation'

const { location, getUserLocation } = useGeolocation()

// Watch for location changes
watch(location, (newLocation) => {
  if (newLocation) {
    console.log('Location updated:', newLocation)
    // Center map on new location
    centerMap(newLocation.lat, newLocation.lng)
  }
})

// Trigger location request
getUserLocation()
```

### Error Handling

```typescript
const { getUserLocation, error } = useGeolocation()

async function getLocation() {
  const result = await getUserLocation()

  if (error.value) {
    // Handle specific errors
    switch (error.value) {
      case 'Location access denied':
        showToast('Please allow location access in your browser settings')
        break
      case 'Location request timed out':
        showToast('Location request took too long. Please try again.')
        break
      case 'Geolocation is not supported by your browser':
        showToast('Your browser does not support geolocation')
        break
      default:
        showToast('Unable to get your location')
    }
  }
}
```

---

## `useOverpass`

### Basic POI Search

```vue
<script setup lang="ts">
import { useOverpass } from '@/composables/useOverpass'

const { findNearbyPOIs, loading, error, pois } = useOverpass()

async function searchNearby(lat: number, lng: number) {
  const results = await findNearbyPOIs(lat, lng, 50) // 50 meter radius

  if (results.length > 0) {
    console.log('Found', results.length, 'POIs')
    results.forEach(poi => {
      console.log(`- ${poi.name} (${poi.type})`)
    })
  } else {
    console.log('No POIs found nearby')
  }
}
</script>

<template>
  <div v-if="loading">Searching for nearby businesses...</div>

  <div v-if="error" class="error">{{ error }}</div>

  <div v-if="pois.length > 0">
    <h3>Found {{ pois.length }} businesses nearby:</h3>
    <ul>
      <li v-for="poi in pois" :key="poi.id">
        <strong>{{ poi.name }}</strong> ({{ poi.type }})<br>
        <span v-if="poi.address">{{ poi.address }}</span>
        <span v-if="poi.phone">📞 {{ poi.phone }}</span>
        <span v-if="poi.website">🌐 {{ poi.website }}</span>
      </li>
    </ul>
  </div>

  <div v-else-if="!loading">
    No businesses found at this location.
  </div>
</template>
```

### With Request Cancellation

```typescript
import { ref } from 'vue'
import { useOverpass } from '@/composables/useOverpass'

const { findNearbyPOIs } = useOverpass()
const abortController = ref<AbortController | null>(null)

async function search(lat: number, lng: number) {
  // Cancel previous request if still pending
  if (abortController.value) {
    abortController.value.abort()
  }

  // Create new abort controller
  abortController.value = new AbortController()

  const results = await findNearbyPOIs(
    lat,
    lng,
    50,
    abortController.value.signal
  )

  return results
}

// Cleanup on component unmount
onUnmounted(() => {
  if (abortController.value) {
    abortController.value.abort()
  }
})
```

### Expanding Search Radius

```typescript
import { useOverpass } from '@/composables/useOverpass'

const { findNearbyPOIs } = useOverpass()

async function findPOIsWithFallback(lat: number, lng: number) {
  // Try small radius first
  let results = await findNearbyPOIs(lat, lng, 50)

  if (results.length === 0) {
    console.log('No results at 50m, trying 100m...')
    results = await findNearbyPOIs(lat, lng, 100)
  }

  if (results.length === 0) {
    console.log('No results at 100m, trying 200m...')
    results = await findNearbyPOIs(lat, lng, 200)
  }

  return results
}
```

### Auto-fill Form from POI

```typescript
import { useOverpass, type POI } from '@/composables/useOverpass'

function autofillFromPOI(poi: POI, formData: any) {
  formData.name = poi.name
  formData.latitude = poi.lat
  formData.longitude = poi.lng

  if (poi.address) {
    formData.address = poi.address
  }

  if (poi.phone) {
    formData.phone = poi.phone
  }

  if (poi.website) {
    formData.website = poi.website
  }

  // Could also trigger additional enrichment via useNominatim
}
```

---

## Combined Usage (Geolocation + POI Search)

### "I'm nearby" → Find POIs Flow

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { useOverpass } from '@/composables/useOverpass'

const geolocation = useGeolocation()
const overpass = useOverpass()

const step = ref<'initial' | 'locating' | 'searching' | 'selecting'>('initial')

async function handleNearbyClick() {
  // Step 1: Get user location
  step.value = 'locating'
  const location = await geolocation.getUserLocation()

  if (!location) {
    // Handle error
    step.value = 'initial'
    return
  }

  // Step 2: Search for nearby POIs
  step.value = 'searching'
  const pois = await overpass.findNearbyPOIs(location.lat, location.lng, 50)

  // Step 3: Show POI selection
  step.value = 'selecting'
}
</script>

<template>
  <!-- Initial state -->
  <div v-if="step === 'initial'">
    <button @click="handleNearbyClick">
      I'm nearby - find my location
    </button>
  </div>

  <!-- Locating user -->
  <div v-if="step === 'locating'">
    <p>Getting your location...</p>
    <div v-if="geolocation.location.value">
      Found: {{ geolocation.location.value.lat }}, {{ geolocation.location.value.lng }}
      (±{{ geolocation.location.value.accuracy }}m)
    </div>
  </div>

  <!-- Searching for POIs -->
  <div v-if="step === 'searching'">
    <p>Looking for businesses nearby...</p>
  </div>

  <!-- POI selection -->
  <div v-if="step === 'selecting'">
    <div v-if="overpass.pois.value.length > 0">
      <h3>Is this one of these businesses?</h3>
      <div v-for="poi in overpass.pois.value" :key="poi.id">
        <button @click="selectPOI(poi)">
          {{ poi.name }} ({{ poi.type }})
        </button>
      </div>
      <button @click="enterManually">
        None of these - I'll enter the name
      </button>
    </div>
    <div v-else>
      <p>No businesses found at this location.</p>
      <button @click="enterManually">
        Continue with manual entry
      </button>
    </div>
  </div>
</template>
```

---

## Integration with Existing Composables

### Using with `useNominatim`

```typescript
import { useGeolocation } from '@/composables/useGeolocation'
import { useNominatim } from '@/composables/useNominatim'

const { getUserLocation } = useGeolocation()
const { reverseGeocode } = useNominatim()

async function getAddressFromLocation() {
  const location = await getUserLocation()

  if (location) {
    // Get address from coordinates
    const result = await reverseGeocode(location.lat, location.lng)

    if (result) {
      console.log('Address:', result.display_name)
      console.log('City:', result.address.city)
    }
  }
}
```

### Using with `useNearby` (Refactored)

```typescript
import { useNearby } from '@/composables/useNearby'

const { getUserLocation, findNearby, results } = useNearby()

async function findNearbyLocations() {
  // This now uses useGeolocation under the hood
  const location = await getUserLocation()

  if (location) {
    // Find approved locations from our database
    await findNearby(location.lat, location.lng, 5000)
    console.log('Found', results.value.length, 'locations')
  }
}
```

---

## Type Imports

```typescript
// Import types for better TypeScript support
import type { GeolocationResult } from '@/composables/useGeolocation'
import type { POI } from '@/composables/useOverpass'

// Use in function signatures
function processLocation(location: GeolocationResult) {
  console.log(`Processing: ${location.lat}, ${location.lng}`)
}

function processPOI(poi: POI) {
  console.log(`Processing: ${poi.name} at ${poi.lat}, ${poi.lng}`)
}
```

---

## Testing Examples

### Mocking `useGeolocation` in Tests

```typescript
import { vi } from 'vitest'
import { useGeolocation } from '@/composables/useGeolocation'

vi.mock('@/composables/useGeolocation', () => ({
  useGeolocation: vi.fn()
}))

// In test
vi.mocked(useGeolocation).mockReturnValue({
  getUserLocation: vi.fn().mockResolvedValue({
    lat: 50.1109,
    lng: 8.6821,
    accuracy: 10
  }),
  loading: { value: false },
  error: { value: null },
  location: { value: { lat: 50.1109, lng: 8.6821, accuracy: 10 } }
} as any)
```

### Mocking `useOverpass` in Tests

```typescript
import { vi } from 'vitest'
import { useOverpass } from '@/composables/useOverpass'

vi.mock('@/composables/useOverpass', () => ({
  useOverpass: vi.fn()
}))

// In test
vi.mocked(useOverpass).mockReturnValue({
  findNearbyPOIs: vi.fn().mockResolvedValue([
    {
      id: 123,
      name: 'Test Cafe',
      lat: 50.1109,
      lng: 8.6821,
      type: 'cafe',
      address: 'Main St 42, Frankfurt'
    }
  ]),
  loading: { value: false },
  error: { value: null },
  pois: { value: [] }
} as any)
```

---

## Best Practices

1. **Always handle errors**
   - Show user-friendly error messages
   - Provide fallback options (manual entry)

2. **Show loading states**
   - Geolocation can take several seconds
   - Overpass API requests may be slow

3. **Consider accuracy**
   - High accuracy (< 20m): Good for "I'm here now"
   - Low accuracy (> 100m): May need manual adjustment

4. **Expand search radius if needed**
   - Start with 50m
   - Fall back to 100m, then 200m if no results

5. **Cancel requests on unmount**
   - Use AbortController for Overpass requests
   - Clean up in `onUnmounted`

6. **Cache results when appropriate**
   - POI results can be cached for same location
   - User location should be fresh each time

---

**End of Usage Examples**
