<template>
  <div class="location-detail">
    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <p>Laden...</p>
    </div>

    <!-- Error / Not Found State -->
    <div v-else-if="!location" class="not-found">
      <h1>404 - Standort nicht gefunden</h1>
      <p>Der angeforderte Standort existiert nicht oder wurde entfernt.</p>
      <a href="/" class="back-link">← Zurück zur Karte</a>
    </div>

    <!-- Location Details -->
    <div v-else class="content">
      <header class="header">
        <h1>{{ location.name }}</h1>
        <a href="/" class="back-link">← Zurück zur Karte</a>
      </header>

      <section class="info-section">
        <h2>Adresse</h2>
        <p class="address">
          {{ location.address }}<br>
          <span v-if="location.postal_code">{{ location.postal_code }}</span>
          {{ location.city }}
        </p>
      </section>

      <!-- Categories -->
      <section v-if="categories.length > 0" class="info-section">
        <h2>Kategorien</h2>
        <div class="categories">
          <span
            v-for="category in categories"
            :key="category.id"
            class="category-badge"
          >
            {{ category.name_de }}
          </span>
        </div>
      </section>

      <!-- Description -->
      <section v-if="location.description_de" class="info-section">
        <h2>Beschreibung</h2>
        <p>{{ location.description_de }}</p>
      </section>

      <!-- Contact Info -->
      <section class="info-section">
        <h2>Kontakt</h2>
        <div class="contact-info">
          <p v-if="location.website">
            <strong>Website:</strong>
            <a :href="location.website" target="_blank" rel="noopener">
              {{ location.website }}
            </a>
          </p>
          <p v-if="location.phone">
            <strong>Telefon:</strong>
            <a :href="`tel:${location.phone}`">{{ location.phone }}</a>
          </p>
          <p v-if="location.email">
            <strong>E-Mail:</strong>
            <a :href="`mailto:${location.email}`">{{ location.email }}</a>
          </p>
          <p v-if="location.instagram">
            <strong>Instagram:</strong>
            <a
              :href="`https://instagram.com/${location.instagram.replace('@', '')}`"
              target="_blank"
              rel="noopener"
            >
              {{ location.instagram }}
            </a>
          </p>
        </div>
      </section>

      <!-- Payment Methods -->
      <section v-if="location.payment_methods" class="info-section">
        <h2>Zahlungsmethoden</h2>
        <PaymentMethods
          :payment-methods="location.payment_methods"
          size="medium"
          layout="horizontal"
          :show-label="false"
        />
      </section>

      <!-- Opening Hours -->
      <section v-if="location.opening_hours_text" class="info-section">
        <h2>Öffnungszeiten</h2>
        <p class="opening-hours">{{ location.opening_hours_text }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLocationsStore } from '@/stores/locations'
import { useSeo } from '@/composables/useSeo'
import type { Database } from '@/types/database'
import PaymentMethods from '@/components/PaymentMethods.vue'

type Category = Database['public']['Tables']['categories']['Row']

const route = useRoute()
const store = useLocationsStore()

const loading = ref(true)
const location = ref<any>(null)

const categories = computed<Category[]>(() => {
  if (!location.value?.location_categories) return []
  return location.value.location_categories
    .map((lc: any) => lc.categories)
    .filter(Boolean)
})

onMounted(async () => {
  loading.value = true

  // Ensure locations are loaded
  await store.fetchLocations()

  // Find location by slug
  const slug = route.params.slug as string
  location.value = store.getLocationBySlug(slug)

  loading.value = false
})

// Update SEO when location loads
watch(location, (newLocation) => {
  if (newLocation) {
    useSeo({
      title: `${newLocation.name} - Zero Waste Frankfurt`,
      description: newLocation.description_de || `${newLocation.name} - Nachhaltiger Standort in ${newLocation.city}`,
      url: `https://map.zerowastefrankfurt.de/location/${newLocation.slug}`
    })
  }
})
</script>

<style scoped>
.location-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.loading,
.not-found {
  text-align: center;
  padding: 3rem 1rem;
}

.not-found h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.back-link {
  color: #2563eb;
  text-decoration: none;
  font-size: 0.875rem;
}

.back-link:hover {
  text-decoration: underline;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.info-section {
  margin-bottom: 2rem;
}

.info-section h2 {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  color: #374151;
}

.address {
  line-height: 1.6;
}

.categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #e5e7eb;
  border-radius: 9999px;
  font-size: 0.875rem;
  color: #374151;
}

.contact-info p {
  margin-bottom: 0.5rem;
}

.contact-info a {
  color: #2563eb;
  text-decoration: none;
}

.contact-info a:hover {
  text-decoration: underline;
}

.opening-hours {
  white-space: pre-line;
  line-height: 1.6;
}
</style>
