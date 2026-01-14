import { createRouter, createWebHistory } from 'vue-router'
import MapView from '@/views/MapView.vue'
import { adminGuard } from './guards/adminGuard'
import { useAnalytics } from '@/composables/useAnalytics'

// Lazy load non-critical routes for better performance
const SubmitView = () => import('@/views/SubmitView.vue')
const VerifyView = () => import('@/views/VerifyView.vue')
const FavoritesView = () => import('@/views/FavoritesView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')

// Admin routes - lazy loaded
const LoginView = () => import('@/views/admin/LoginView.vue')
const DashboardView = () => import('@/views/admin/DashboardView.vue')
const PendingView = () => import('@/views/admin/PendingView.vue')
const EditView = () => import('@/views/admin/EditView.vue')
const LocationsListView = () => import('@/views/admin/LocationsListView.vue')
const CategoriesListView = () => import('@/views/admin/CategoriesListView.vue')
const HoursSuggestionsView = () => import('@/views/admin/HoursSuggestionsView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'map',
      component: MapView
    },
    {
      path: '/location/:slug',
      name: 'location-detail',
      component: MapView
    },
    {
      path: '/submit',
      name: 'submit',
      component: SubmitView
    },
    {
      path: '/verify',
      name: 'verify',
      component: VerifyView
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: FavoritesView
    },
    {
      path: '/bulk-station',
      children: [
        {
          path: 'login',
          name: 'admin-login',
          component: LoginView
        },
        {
          path: '',
          name: 'admin-dashboard',
          component: DashboardView,
          meta: { requiresAdmin: true }
        },
        {
          path: 'pending',
          name: 'admin-pending',
          component: PendingView,
          meta: { requiresAdmin: true }
        },
        {
          path: 'locations',
          name: 'admin-locations',
          component: LocationsListView,
          meta: { requiresAdmin: true }
        },
        {
          path: 'edit/:id',
          name: 'admin-edit',
          component: EditView,
          meta: { requiresAdmin: true }
        },
        {
          path: 'categories',
          name: 'admin-categories',
          component: CategoriesListView,
          meta: { requiresAdmin: true }
        },
        {
          path: 'hours-suggestions',
          name: 'admin-hours-suggestions',
          component: HoursSuggestionsView,
          meta: { requiresAdmin: true }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView
    }
  ]
})

// Apply admin guard to protected routes
router.beforeEach(adminGuard)

// Track page views after navigation
router.afterEach((to) => {
  const { trackPageView } = useAnalytics()
  const title = typeof to.name === 'string' ? to.name : to.path
  trackPageView(to.path, title)
})

export default router
