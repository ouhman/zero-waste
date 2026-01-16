<template>
  <div class="category-filter">
    <button
      @click="toggleCollapse"
      class="filter-header"
    >
      <span class="filter-title">
        {{ t('filters.categories') }}
        <span v-if="selectedCategories.length > 0" class="selected-count">
          ({{ selectedCategories.length }})
        </span>
      </span>
      <div class="header-actions">
        <button
          v-if="selectedCategories.length > 0 && !isCollapsed"
          class="clear-btn"
          @click.stop="clearFilters"
        >
          {{ t('filters.clearFilters') }}
        </button>
        <svg
          :class="['chevron', { 'chevron-open': !isCollapsed }]"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </button>

    <div v-show="!isCollapsed" class="category-list">
      <label
        v-for="category in categories"
        :key="category.id"
        :class="['category-item', { 'category-item-selected': isSelected(category.slug) }]"
      >
        <span :class="['checkbox', { 'checkbox-checked': isSelected(category.slug) }]">
          <svg v-if="isSelected(category.slug)" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="category-name">
          {{ currentLocale === 'de' ? category.name_de : category.name_en }}
        </span>
        <input
          type="checkbox"
          :checked="isSelected(category.slug)"
          @change="toggleCategory(category.slug)"
          class="hidden-input"
        />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategoriesStore } from '@/stores/categories'

const props = defineProps<{
  selectedCategories: string[]
}>()

const emit = defineEmits<{
  'update:selectedCategories': [categories: string[]]
}>()

const { t, locale } = useI18n()
const categoriesStore = useCategoriesStore()

const categories = computed(() => categoriesStore.categories)
const currentLocale = computed(() => locale.value)

// Collapse state - expanded by default
const isCollapsed = ref(false)

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

onMounted(async () => {
  await categoriesStore.fetchCategories()
})

function isSelected(slug: string): boolean {
  return props.selectedCategories.includes(slug)
}

function toggleCategory(slug: string) {
  const selected = [...props.selectedCategories]
  const index = selected.indexOf(slug)

  if (index > -1) {
    selected.splice(index, 1)
  } else {
    selected.push(slug)
  }

  emit('update:selectedCategories', selected)
}

function clearFilters() {
  emit('update:selectedCategories', [])
}
</script>

<style scoped>
.category-filter {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  transition: background 0.2s, border-color 0.2s;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 14px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 12px;
}

.filter-header:hover {
  background: #f9fafb;
}

.filter-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.selected-count {
  color: #059669;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clear-btn {
  padding: 4px 8px;
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
}

.clear-btn:hover {
  color: #374151;
  background: #f3f4f6;
}

.chevron {
  width: 16px;
  height: 16px;
  color: #9ca3af;
  transition: transform 0.2s ease;
}

.chevron-open {
  transform: rotate(180deg);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px 10px;
  max-height: 280px;
  overflow-y: auto;
}

@media (min-width: 768px) {
  .category-list {
    max-height: 380px;
  }
}

@media (min-width: 1024px) {
  .category-list {
    max-height: 450px;
  }
}

.category-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin: 0 -4px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.category-item:hover {
  background: #f9fafb;
}

.category-item-selected {
  background: #ecfdf5;
}

.category-item-selected:hover {
  background: #d1fae5;
}

.checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid #d1d5db;
  background: white;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.checkbox svg {
  width: 10px;
  height: 10px;
  color: white;
}

.checkbox-checked {
  background: #059669;
  border-color: #059669;
}

.category-name {
  font-size: 14px;
  color: #374151;
  line-height: 1.4;
}

.hidden-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>

<style>
/* Dark mode styles (unscoped to work with .dark on html) */
.dark .category-filter {
  background: #1f2937 !important;
  border-color: #374151 !important;
}

.dark .filter-header:hover {
  background: #374151 !important;
}

.dark .filter-title {
  color: #f3f4f6 !important;
}

.dark .selected-count {
  color: #34d399 !important;
}

.dark .clear-btn {
  color: #9ca3af !important;
}

.dark .clear-btn:hover {
  color: #f3f4f6 !important;
  background: #4b5563 !important;
}

.dark .category-item:hover {
  background: #374151 !important;
}

.dark .category-item-selected {
  background: #064e3b !important;
}

.dark .category-item-selected:hover {
  background: #065f46 !important;
}

.dark .checkbox {
  border-color: #4b5563 !important;
  background: #374151 !important;
}

.dark .checkbox-checked {
  background: #10b981 !important;
  border-color: #10b981 !important;
}

.dark .category-name {
  color: #d1d5db !important;
}
</style>
