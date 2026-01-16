// Test data constants - single source of truth for admin e2e tests

export const TEST_ADMIN = {
  email: 'e2e-test-admin@zerowastefrankfurt.de',
  // Password loaded from environment - never hardcode in source
  get password(): string {
    const pwd = process.env.TEST_ADMIN_PASSWORD
    if (!pwd) {
      throw new Error(
        'Missing TEST_ADMIN_PASSWORD environment variable. ' +
        'Add it to .env.test file.'
      )
    }
    return pwd
  },
}

export const TEST_LOCATION = {
  name: 'E2E Test Location',
  address: 'Teststraße 1',
  city: 'Frankfurt am Main',
  suburb: 'Bockenheim',
  postal_code: '60313',
  latitude: '50.1109',
  longitude: '8.6821',
  description_de: 'Test Beschreibung auf Deutsch für E2E Tests',
  description_en: 'Test description in English for E2E tests',
  website: 'https://test.example.com',
  phone: '+49 69 1234567',
  email: 'test@example.com',
  instagram: 'testlocation',
  status: 'pending',
  payment_methods: {
    cash: true,
    card: true,
    contactless: false,
    vouchers: false,
    pfand: false,
  },
  opening_hours_osm: 'Mo-Fr 09:00-18:00',
  opening_hours_structured: {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: { open: '10:00', close: '16:00' },
    sunday: null,
  },
}

export const TEST_CATEGORY = {
  name_de: 'E2E Test Kategorie',
  name_en: 'E2E Test Category',
  slug: 'e2e-test-category',
  description_de: 'Test Beschreibung für E2E Tests',
  description_en: 'Test description for E2E tests',
  sort_order: 999,
  icon_name: 'mdi:test-tube',
  color: '#4F46E5',
}
