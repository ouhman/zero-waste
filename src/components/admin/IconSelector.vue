<template>
  <div class="icon-selector">
    <!-- Search Input -->
    <div class="search-container">
      <label :for="inputId" class="search-label">
        {{ $t?.('admin.iconSelector.label') || 'Select Icon' }}
      </label>
      <input
        :id="inputId"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder || $t?.('admin.iconSelector.placeholder') || 'Search icons...'"
        class="search-input"
        @input="handleSearchInput"
      />
    </div>

    <!-- Loading State -->
    <div v-if="isSearching" class="loading-container" data-test="loading">
      <div class="spinner" role="status" aria-label="Loading icons">
        <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="searchError" class="error-container" data-test="error-message">
      <p class="error-text">
        {{ $t?.('admin.iconSelector.error') || 'Failed to search icons. Please try again.' }}
      </p>
    </div>

    <!-- Search Results -->
    <div v-else-if="hasSearchResults" class="results-container" data-test="search-results">
      <div class="icons-grid" data-test="icon-grid">
        <button
          v-for="iconName in searchResults"
          :key="iconName"
          type="button"
          class="icon-button"
          :class="{ selected: modelValue === iconName }"
          :data-icon="iconName"
          :aria-label="`Select icon ${iconName}`"
          :aria-pressed="modelValue === iconName ? 'true' : 'false'"
          data-test="icon-button"
          tabindex="0"
          @click="selectIcon(iconName)"
          @keydown.enter.prevent="selectIcon(iconName)"
          @keydown.space.prevent="selectIcon(iconName)"
        >
          <Icon :icon="iconName" :width="24" :height="24" />
        </button>
      </div>
    </div>

    <!-- No Results -->
    <div v-else-if="hasSearchQuery && !hasSearchResults && !isSearching" class="empty-container" data-test="no-results">
      <p class="empty-text">
        {{ $t?.('admin.iconSelector.noResults') || 'No icons found. Try a different search term.' }}
      </p>
    </div>

    <!-- Curated Icons (shown when not searching and showSuggestions is true) -->
    <div
      v-else-if="showSuggestions && !hasSearchQuery"
      class="curated-container"
      data-test="curated-icons"
    >
      <div
        v-for="(icons, category) in curatedIcons"
        :key="category"
        class="category-section"
      >
        <h3 class="category-title" :data-test="`category-${category}`">
          {{ formatCategoryName(category) }}
        </h3>
        <div class="icons-grid" data-test="icon-grid">
          <button
            v-for="icon in icons"
            :key="icon.name"
            type="button"
            class="icon-button"
            :class="{ selected: modelValue === icon.name }"
            :data-icon="icon.name"
            :aria-label="`Select ${icon.label} icon`"
            :aria-pressed="modelValue === icon.name ? 'true' : 'false'"
            data-test="icon-button"
            tabindex="0"
            :title="icon.label"
            @click="selectIcon(icon.name)"
            @keydown.enter.prevent="selectIcon(icon.name)"
            @keydown.space.prevent="selectIcon(icon.name)"
          >
            <Icon :icon="icon.name" :width="24" :height="24" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useDebounce } from '@/composables/useDebounce'
import { CURATED_ICONS } from '@/lib/curatedIcons'

interface Props {
  modelValue: string
  placeholder?: string
  showSuggestions?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  showSuggestions: true,
})

const emit = defineEmits<Emits>()

// Generate unique ID for accessibility
const inputId = `icon-selector-${Math.random().toString(36).substring(7)}`

// Search state
const searchQuery = ref('')
const searchResults = ref<string[]>([])
const isSearching = ref(false)
const searchError = ref(false)

// Curated icons
const curatedIcons = CURATED_ICONS

// Computed properties
const hasSearchQuery = computed(() => searchQuery.value.trim().length > 0)
const hasSearchResults = computed(() => searchResults.value.length > 0)

/**
 * Search icons using Iconify API
 */
async function searchIcons(query: string) {
  if (!query.trim()) {
    searchResults.value = []
    isSearching.value = false
    return
  }

  isSearching.value = true
  searchError.value = false

  try {
    // Search using Iconify API
    const response = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=50`)

    if (!response.ok) {
      throw new Error('Search failed')
    }

    const data = await response.json()

    // API returns collections with icon lists
    // Format: { icons: ['mdi:icon1', 'lucide:icon2', ...] }
    searchResults.value = data.icons || []
  } catch (error) {
    console.error('Icon search error:', error)
    searchError.value = true
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// Debounced search function
const { debounced: debouncedSearch } = useDebounce(searchIcons, 300)

/**
 * Handle search input changes
 */
function handleSearchInput() {
  debouncedSearch(searchQuery.value)
}

/**
 * Select an icon and emit update event
 */
function selectIcon(iconName: string) {
  emit('update:modelValue', iconName)
}

/**
 * Format category name for display
 */
function formatCategoryName(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}
</script>

<style scoped>
.icon-selector {
  width: 100%;
}

/* Search Container */
.search-container {
  margin-bottom: 1rem;
}

.search-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #D1D5DB;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease;
}

.search-input:focus {
  outline: none;
  border-color: #10B981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* Loading Container */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.spinner {
  color: #10B981;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Error Container */
.error-container {
  padding: 1rem;
  background-color: #FEE2E2;
  border: 1px solid #FCA5A5;
  border-radius: 0.375rem;
}

.error-text {
  color: #991B1B;
  font-size: 0.875rem;
  margin: 0;
}

/* Empty State */
.empty-container {
  padding: 2rem;
  text-align: center;
}

.empty-text {
  color: #6B7280;
  font-size: 0.875rem;
  margin: 0;
}

/* Icons Grid */
.icons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(3rem, 1fr));
  gap: 0.5rem;
  max-height: 20rem;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.375rem;
  background-color: #F9FAFB;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  padding: 0.5rem;
  border: 2px solid transparent;
  border-radius: 0.375rem;
  background-color: #FFFFFF;
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-button:hover {
  border-color: #D1D5DB;
  background-color: #F3F4F6;
}

.icon-button:focus {
  outline: none;
  border-color: #10B981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.icon-button.selected {
  border-color: #10B981;
  background-color: #D1FAE5;
}

.icon-button.selected:hover {
  border-color: #059669;
  background-color: #A7F3D0;
}

/* Curated Icons */
.curated-container {
  max-height: 30rem;
  overflow-y: auto;
}

.category-section {
  margin-bottom: 1.5rem;
}

.category-section:last-child {
  margin-bottom: 0;
}

.category-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
  text-transform: capitalize;
}

/* Results Container */
.results-container {
  margin-top: 1rem;
}
</style>
