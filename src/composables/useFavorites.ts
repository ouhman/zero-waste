import { ref, watch, type WatchStopHandle } from 'vue'

const STORAGE_KEY = 'zerowaste-favorites'

// Shared state across all component instances
let favorites = ref<string[]>([])
let initialized = false
let watchStopHandle: WatchStopHandle | null = null

// Function to reset state (for testing)
export function _resetFavoritesState() {
  if (watchStopHandle) {
    watchStopHandle()
    watchStopHandle = null
  }
  favorites = ref<string[]>([])
  initialized = false
}

// Initialize function called on first use
function initializeFavorites() {
  if (initialized) return

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      favorites.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load favorites from localStorage:', error)
    favorites.value = []
  }

  // Set up watcher (only once at module level to prevent accumulation)
  watchStopHandle = watch(
    favorites,
    (newFavorites) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites))
      } catch (error) {
        console.error('Failed to save favorites to localStorage:', error)
      }
    },
    { deep: true }
  )

  initialized = true
}

export function useFavorites() {
  // Lazy initialization on first call
  initializeFavorites()

  function addFavorite(locationId: string) {
    if (!favorites.value.includes(locationId)) {
      favorites.value.push(locationId)
    }
  }

  function removeFavorite(locationId: string) {
    const index = favorites.value.indexOf(locationId)
    if (index > -1) {
      favorites.value.splice(index, 1)
    }
  }

  function toggleFavorite(locationId: string) {
    if (isFavorite(locationId)) {
      removeFavorite(locationId)
    } else {
      addFavorite(locationId)
    }
  }

  function isFavorite(locationId: string): boolean {
    return favorites.value.includes(locationId)
  }

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite
  }
}
