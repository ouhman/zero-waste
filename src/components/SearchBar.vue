<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('map.searchPlaceholder')"
        class="search-input"
        @input="handleSearch"
        @keydown.enter="handleEnter"
        @keydown.escape="clearSearch"
      />
      <button
        v-if="searchQuery && !loading"
        @click="clearSearch"
        class="clear-button"
        type="button"
        :aria-label="t('map.clearSearch')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div v-if="loading" class="spinner" />
    </div>

    <div v-if="results.length > 0" class="search-results">
      <div class="results-header">
        {{ t('map.resultsFound', results.length, { count: results.length }) }}
      </div>
      <div
        v-for="location in results"
        :key="location.id"
        class="result-item"
        @click="selectLocation(location)"
      >
        <div class="result-name">{{ location.name }}</div>
        <div class="result-address">{{ location.address }}</div>
      </div>
    </div>

    <div v-if="searchQuery && results.length === 0 && !loading" class="no-results">
      {{ t('map.noResults') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSearch } from '@/composables/useSearch'

// Use runtime emit definition to avoid deep type instantiation
const emit = defineEmits(['select'])

const { t } = useI18n()
const { results, loading, debouncedSearch } = useSearch()

const searchQuery = ref('')

function handleSearch() {
  debouncedSearch(searchQuery.value)
}

function handleEnter() {
  // If there's exactly one result, select it
  // If there are multiple results, select the first one
  if (results.value.length > 0) {
    selectLocation(results.value[0])
  }
}

function selectLocation(location: (typeof results.value)[number]) {
  emit('select', location)
  searchQuery.value = ''
  results.value = []
}

function clearSearch() {
  searchQuery.value = ''
  results.value = []
}
</script>

<style scoped>
.search-bar {
  position: relative;
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  color: #1f2937;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #9ca3af;
  pointer-events: none;
}

.clear-button {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  padding: 0;
  background: #e5e7eb;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.clear-button:hover {
  background: #d1d5db;
}

.clear-button svg {
  width: 12px;
  height: 12px;
  color: #6b7280;
}

.spinner {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border: 2px solid #e5e7eb;
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

.search-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  max-height: min(500px, 60vh);
  overflow-y: auto;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.search-results::after {
  content: '';
  flex-shrink: 0;
  min-height: 300px;
}

.results-header {
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
}

.result-item {
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.15s;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background: #f9fafb;
}

.result-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
  font-size: 14px;
}

.result-address {
  font-size: 13px;
  color: #6b7280;
}

.no-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
}
</style>
