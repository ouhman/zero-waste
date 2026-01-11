import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import { createI18n } from 'vue-i18n'
import type { Database } from '@/types/database'

export type Location = Database['public']['Tables']['locations']['Row']
export type Category = Database['public']['Tables']['categories']['Row']

/**
 * Creates a mock Pinia store for tests
 */
export function createTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * Creates a mock router for tests
 */
export function createTestRouter(initialPath = '/'): Router {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'map', component: { template: '<div>Home</div>' } },
      { path: '/:slug', name: 'location-detail', component: { template: '<div>Location Detail</div>' } },
      { path: '/submit', component: { template: '<div>Submit</div>' } },
      { path: '/verify', component: { template: '<div>Verify</div>' } },
      { path: '/bulk-station', component: { template: '<div>Dashboard</div>' } },
      { path: '/bulk-station/login', component: { template: '<div>Login</div>' } },
      { path: '/bulk-station/locations', component: { template: '<div>Locations</div>' } },
      { path: '/bulk-station/pending', component: { template: '<div>Pending</div>' } },
      { path: '/bulk-station/edit/:id', component: { template: '<div>Edit</div>' } },
      { path: '/bulk-station/categories', component: { template: '<div>Categories</div>' } }
    ]
  })

  router.push(initialPath)
  return router
}

/**
 * Creates a mock i18n instance for tests
 */
export function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: {
        map: {
          title: 'Zero Waste Frankfurt',
          submitLocation: 'Submit Location',
          submitLocationShort: 'Submit'
        },
        filters: {
          title: 'Filters'
        },
        notFound: {
          title: 'Location Not Found',
          locationMessage: 'This location does not exist',
          backToMap: 'Back to Map'
        },
        admin: {
          logout: 'Logout',
          approve: 'Approve',
          reject: 'Reject',
          editButton: 'Edit',
          nav: {
            dashboard: 'Dashboard',
            locations: 'Locations',
            categories: 'Categories'
          },
          dashboard: {
            title: 'Dashboard',
            subtitle: 'Welcome to the admin panel',
            pendingLocations: 'Pending Locations',
            approvedLocations: 'Approved Locations',
            rejectedLocations: 'Rejected Locations',
            viewAll: 'View All',
            recentSubmissions: 'Recent Submissions',
            viewAllPending: 'View All Pending',
            noPending: 'No Pending Submissions',
            noPendingDescription: 'All locations have been reviewed',
            approveSuccess: 'Location approved successfully',
            approveFailed: 'Failed to approve location',
            manageLocations: 'Manage all locations',
            manageCategories: 'Manage categories'
          },
          form: {
            basicInfo: 'Basic Information',
            name: 'Name',
            slug: 'Slug',
            slugHelp: 'URL-friendly identifier',
            descriptionDe: 'Description (German)',
            descriptionEn: 'Description (English)',
            addressGeo: 'Address & Coordinates',
            address: 'Address',
            city: 'City',
            postalCode: 'ZIP Code',
            latitude: 'Latitude',
            longitude: 'Longitude',
            clickMapToSet: 'Click on map',
            contactInfo: 'Contact Information',
            website: 'Website',
            phone: 'Phone',
            email: 'Email',
            instagram: 'Instagram',
            categories: 'Categories',
            selectCategories: 'Select categories',
            paymentMethods: 'Payment Methods',
            cash: 'Cash',
            creditCard: 'Credit Card',
            debitCard: 'Debit Card',
            contactless: 'Contactless',
            mobilePayment: 'Mobile Payment',
            openingHours: 'Opening Hours',
            osmFormat: 'OSM Format',
            adminFields: 'Admin Fields',
            status: 'Status',
            statusPending: 'Pending',
            statusApproved: 'Approved',
            statusRejected: 'Rejected',
            adminNotes: 'Admin Notes',
            adminNotesHelp: 'Internal notes'
          },
          edit: {
            saveChanges: 'Save Changes'
          },
          preview: {
            pendingReview: 'Pending Review',
            type: 'Type',
            viewOnGoogleMaps: 'View on Google Maps'
          },
          categories: {
            editCategory: 'Edit Category',
            addCategory: 'Add Category',
            form: {
              nameDe: 'Name (German)',
              nameEn: 'Name (English)',
              descriptionDe: 'Description (German)',
              descriptionEn: 'Description (English)',
              color: 'Color',
              sortOrder: 'Sort Order',
              sortOrderHelp: 'Lower numbers appear first',
              icon: 'Icon',
              currentIcon: 'Current Icon',
              iconHelp: 'PNG format, max 1MB'
            },
            errors: {
              nameDeRequired: 'German name is required',
              nameEnRequired: 'English name is required',
              slugRequired: 'Slug is required',
              slugInvalid: 'Slug must contain only lowercase letters, numbers, and hyphens',
              invalidFileType: 'Only PNG files are allowed',
              fileTooLarge: 'File is too large (max 1MB)',
              saveFailed: 'Failed to save category'
            }
          }
        },
        common: {
          cancel: 'Cancel',
          loading: 'Loading',
          save: 'Save',
          created: 'Created',
          back: 'Back',
          backToMap: 'Back to Map',
          error: 'Error'
        },
        submit: {
          title: 'Submit a Location',
          subtitle: 'Help grow the Zero Waste Frankfurt community',
          email: 'Email',
          description: 'Description',
          success: 'Success!',
          checkEmail: 'Please check your email to verify your submission',
          info: 'Your submission will be reviewed before appearing on the map'
        },
        verify: {
          title: 'Verify Submission',
          success: 'Verification Successful!',
          successMessage: 'Your location has been verified and will be reviewed shortly',
          missingToken: 'Verification token is missing',
          backToMap: 'Back to Map'
        },
        location: {
          categories: 'Categories',
          openingHours: 'Opening Hours',
          paymentMethods: 'Payment Methods',
          contact: 'Contact'
        }
      }
    }
  })
}

/**
 * Mock location factory
 */
export function createMockLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: '123',
    name: 'Test Location',
    slug: 'test-location',
    address: '123 Test Street',
    city: 'Frankfurt am Main',
    postal_code: '60311',
    latitude: '50.1109',
    longitude: '8.6821',
    description_de: 'Test Beschreibung',
    description_en: 'Test description',
    website: 'https://test.com',
    phone: '+49 123 456789',
    email: 'test@example.com',
    instagram: '@testlocation',
    opening_hours_osm: 'Mo-Fr 10:00-18:00',
    opening_hours_text: 'Monday to Friday: 10:00-18:00',
    opening_hours_structured: null,
    status: 'pending',
    admin_notes: 'Test notes',
    payment_methods: {
      cash: true,
      credit_card: false,
      debit_card: true,
      contactless: false,
      mobile_payment: false
    },
    submission_type: 'new',
    submitted_by_email: 'submitter@example.com',
    related_location_id: null,
    approved_by: null,
    rejection_reason: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
    ...overrides
  }
}

/**
 * Mock category factory
 */
export function createMockCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    name_de: 'Test Kategorie',
    name_en: 'Test Category',
    slug: 'test-category',
    icon: null,
    icon_url: null,
    color: '#3B82F6',
    sort_order: 0,
    description_de: null,
    description_en: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: null,
    ...overrides
  }
}

/**
 * Mock Supabase query builder
 */
export function createMockSupabaseQuery(
  data: any = null,
  error: any = null
) {
  const query = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: vi.fn((cb) => cb({ data, error }))
  }

  // Set final resolved value
  query.order.mockResolvedValue({ data, error })
  query.eq.mockResolvedValue({ data, error })
  query.is.mockResolvedValue({ data, error })

  return query
}

/**
 * Mock file factory
 */
export function createMockFile(
  name = 'test.png',
  size = 1024,
  type = 'image/png'
): File {
  const blob = new Blob(['test'], { type })
  const file = new File([blob], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

/**
 * Wait for async operations to complete
 */
export async function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Wait for Vue's nextTick and flush promises
 */
export async function waitFor(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
