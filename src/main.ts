import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { i18n } from './plugins/i18n'
import './index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

app.mount('#app')

// Register tile caching service worker in development to save Jawg credits
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/tile-cache-sw.js')
    .then((registration) => {
      console.log('[TileCache] Service worker registered')

      // Force update check on page load
      registration.update()

      // Expose helper to check cache status in console
      // Usage: window.checkTileCache()
      ;(window as unknown as { checkTileCache: () => Promise<void> }).checkTileCache = async () => {
        const cache = await caches.open('map-tiles-v2')
        const keys = await cache.keys()
        console.log(`[TileCache] ${keys.length} tiles cached:`)
        keys.forEach(req => {
          const url = new URL(req.url)
          console.log(`  ${url.pathname}`)
        })
      }
      console.log('[TileCache] Run window.checkTileCache() to see cached tiles')
    })
    .catch((err) => console.warn('[TileCache] Registration failed:', err))
}
