// Service Worker for caching map tiles in development
// This prevents excessive API calls to Jawg during hot reloads
//
// TROUBLESHOOTING:
// - Open DevTools > Application > Service Workers to see status
// - Check "Update on reload" to force SW updates during dev
// - Open DevTools > Application > Cache Storage to see cached tiles

const CACHE_NAME = 'map-tiles-v2'
const TILE_HOSTS = [
  'tile.jawg.io',
  'basemaps.cartocdn.com'
]

// Check if URL is a map tile
function isTileRequest(url) {
  return TILE_HOSTS.some(host => url.hostname.includes(host))
}

// Normalize URL for cache key (strip access token to reduce cache misses)
function getCacheKey(url) {
  const normalized = new URL(url.href)
  // Keep the access token in the key since it's part of the unique request
  // but this ensures consistent key format
  return normalized.href
}

self.addEventListener('install', (event) => {
  console.log('[TileCache] Service worker installing...')
  // Force immediate activation without waiting for old SW to finish
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[TileCache] Service worker activated - claiming clients')
  // Delete old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('map-tiles-') && name !== CACHE_NAME)
          .map(name => {
            console.log('[TileCache] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    }).then(() => clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Debug: log all intercepted requests (comment out after confirming SW works)
  // console.log('[TileCache] Fetch intercepted:', url.hostname, url.pathname.substring(0, 50))

  // Only cache tile requests
  if (!isTileRequest(url)) {
    return
  }

  console.log('[TileCache] Tile request intercepted:', url.hostname)

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      const cacheKey = getCacheKey(url)

      // Try to get from cache first using URL string as key
      const cachedResponse = await cache.match(cacheKey)
      if (cachedResponse) {
        console.log('[TileCache] HIT:', url.pathname)
        return cachedResponse
      }

      console.log('[TileCache] MISS:', url.pathname)

      try {
        // Fetch from network - let browser handle the request naturally
        const networkResponse = await fetch(event.request)

        // Cache successful responses
        // For cross-origin requests (like tiles), response.type is 'opaque' and ok is false
        // but the request actually succeeded - we can still cache opaque responses
        if (networkResponse.ok || networkResponse.type === 'opaque') {
          // Clone before caching since response body can only be read once
          const responseToCache = networkResponse.clone()
          // Use URL string as cache key for consistent matching
          await cache.put(cacheKey, responseToCache)
          console.log('[TileCache] CACHED:', url.pathname, `(${networkResponse.type})`)
        } else {
          console.log('[TileCache] NOT CACHED (status:', networkResponse.status, '):', url.pathname)
        }

        return networkResponse
      } catch (error) {
        console.error('[TileCache] Network error:', error)
        throw error
      }
    })()
  )
})
