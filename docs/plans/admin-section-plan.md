# Admin Section Implementation Plan

> **Target**: Full-featured admin section for Zero Waste Frankfurt
> **Estimated Phases**: 5 (each fits within 150k token context)
> **Principles**: DRY, KISS, YAGNI, TDD where applicable

---

## Current State Summary

### Already Implemented
- `LoginView.vue` - Password-based login (needs conversion to magic link)
- `DashboardView.vue` - Basic stats (pending/approved/rejected counts)
- `PendingView.vue` - List pending locations, approve/reject/edit buttons
- `EditView.vue` - Basic edit form using LocationForm component
- `useAdmin.ts` - Composable with `fetchPendingLocations`, `approveLocation`, `rejectLocation`, `updateLocation`
- `adminGuard.ts` - Basic auth check (doesn't verify admin role)
- Category icons stored as PNG files in `/public/icons/categories/{slug}.png`

### Needs Implementation
- Magic link authentication with rate limiting
- Session management (1h timeout with activity refresh)
- Admin role verification in guard
- Complete location editing (all fields, preview mode)
- Category CRUD with icon upload
- Email notifications for new submissions

---

## Phase 1: Authentication & Security Foundation

**Goal**: Secure magic link authentication with rate limiting and proper session handling.

### 1.1 Database Setup

**Migration**: `supabase/migrations/20260110_admin_auth.sql`

```sql
-- Rate limiting table for login attempts
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  attempts INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auth_rate_limits_email ON auth_rate_limits(email);

-- Function to check rate limit (5 attempts per 15 minutes)
CREATE OR REPLACE FUNCTION check_rate_limit(check_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rate_record RECORD;
  max_attempts INTEGER := 5;
  window_minutes INTEGER := 15;
BEGIN
  SELECT * INTO rate_record
  FROM auth_rate_limits
  WHERE email = check_email
    AND first_attempt_at > NOW() - INTERVAL '15 minutes';

  IF NOT FOUND THEN
    -- Clean old records and create new
    DELETE FROM auth_rate_limits WHERE email = check_email;
    INSERT INTO auth_rate_limits (email) VALUES (check_email);
    RETURN TRUE;
  END IF;

  IF rate_record.blocked_until IS NOT NULL AND rate_record.blocked_until > NOW() THEN
    RETURN FALSE;
  END IF;

  IF rate_record.attempts >= max_attempts THEN
    UPDATE auth_rate_limits
    SET blocked_until = NOW() + INTERVAL '15 minutes'
    WHERE email = check_email;
    RETURN FALSE;
  END IF;

  UPDATE auth_rate_limits
  SET attempts = attempts + 1
  WHERE email = check_email;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for rate limits (only authenticated admins can view)
ALTER TABLE auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view rate limits"
  ON auth_rate_limits FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
```

### 1.2 Create Admin User (Manual - One-Time)

Document the manual process to create admin user:

```sql
-- Run in Supabase SQL Editor
-- 1. Create user via Supabase Auth (Dashboard > Authentication > Users > Add User)
-- 2. Set admin role in user_metadata:
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@zerowastefrankfurt.de';
```

### 1.3 Update LoginView.vue

Convert from password to magic link:

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-center text-3xl font-extrabold text-gray-900">
          {{ t('admin.login.title') }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ t('admin.login.magicLinkDescription') }}
        </p>
      </div>

      <!-- Success state -->
      <div v-if="emailSent" class="rounded-md bg-green-50 p-4">
        <p class="text-sm text-green-800">
          {{ t('admin.login.checkEmail', { email }) }}
        </p>
      </div>

      <!-- Form state -->
      <form v-else class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div>
          <label for="email" class="sr-only">{{ t('admin.login.email') }}</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            :placeholder="t('admin.login.email')"
            :disabled="loading"
          />
        </div>

        <div v-if="errorMessage" class="rounded-md bg-red-50 p-4" role="alert">
          <p class="text-sm text-red-800">{{ errorMessage }}</p>
        </div>

        <button
          type="submit"
          class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          :disabled="loading || !email.trim()"
        >
          {{ loading ? t('common.loading') : t('admin.login.sendLink') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/lib/supabase'

const { t } = useI18n()

const email = ref('')
const loading = ref(false)
const errorMessage = ref('')
const emailSent = ref(false)

async function handleLogin() {
  loading.value = true
  errorMessage.value = ''

  try {
    // Check rate limit first
    const { data: allowed, error: rateError } = await supabase
      .rpc('check_rate_limit', { check_email: email.value })

    if (rateError || !allowed) {
      errorMessage.value = t('admin.login.rateLimited')
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`
      }
    })

    if (error) {
      errorMessage.value = error.message
      return
    }

    emailSent.value = true
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
```

### 1.4 Update adminGuard.ts

Add admin role verification and session handling:

```typescript
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { supabase } from '@/lib/supabase'

const SESSION_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour
let lastActivityTime = Date.now()

// Update activity timestamp on any navigation
export function updateActivity() {
  lastActivityTime = Date.now()
}

export async function adminGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  // Allow access to login page
  if (!to.meta.requiresAdmin) {
    next()
    return
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      next('/admin/login')
      return
    }

    // Check if session has timed out due to inactivity
    if (Date.now() - lastActivityTime > SESSION_TIMEOUT_MS) {
      await supabase.auth.signOut()
      next('/admin/login')
      return
    }

    // Verify admin role
    const userRole = session.user.user_metadata?.role
    if (userRole !== 'admin') {
      await supabase.auth.signOut()
      next('/admin/login')
      return
    }

    // Update activity and allow access
    updateActivity()
    next()
  } catch {
    next('/admin/login')
  }
}
```

### 1.5 Create useAuth Composable

`src/composables/useAuth.ts`:

```typescript
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { updateActivity } from '@/router/guards/adminGuard'
import type { User, Session } from '@supabase/supabase-js'

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart']
const SESSION_CHECK_INTERVAL = 60 * 1000 // Check every minute

export function useAuth() {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)
  const router = useRouter()

  let checkInterval: ReturnType<typeof setInterval> | null = null

  function handleActivity() {
    updateActivity()
  }

  async function checkSession() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      await logout()
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    session.value = null
    await router.push('/admin/login')
  }

  onMounted(async () => {
    // Get initial session
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    user.value = data.session?.user ?? null
    loading.value = false

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
    })

    // Track user activity
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Periodic session check
    checkInterval = setInterval(checkSession, SESSION_CHECK_INTERVAL)
  })

  onUnmounted(() => {
    ACTIVITY_EVENTS.forEach(event => {
      document.removeEventListener(event, handleActivity)
    })
    if (checkInterval) clearInterval(checkInterval)
  })

  return {
    user,
    session,
    loading,
    logout
  }
}
```

### 1.6 Add i18n Keys

Add to `src/locales/en.json` and `de.json`:

```json
{
  "admin": {
    "login": {
      "magicLinkDescription": "Enter your email to receive a login link",
      "sendLink": "Send Login Link",
      "checkEmail": "Check your email ({email}) for the login link",
      "rateLimited": "Too many attempts. Please try again in 15 minutes."
    }
  }
}
```

### 1.7 Tests

`tests/unit/composables/useAuth.spec.ts`:
- Test session initialization
- Test logout clears session
- Test activity tracking updates timestamp

`tests/unit/guards/adminGuard.spec.ts`:
- Test redirect to login when no session
- Test redirect when role is not admin
- Test allows access for valid admin session
- Test timeout after inactivity

### Phase 1 Deliverables
- [ ] Migration for rate limiting table and function
- [ ] Updated LoginView with magic link flow
- [ ] Updated adminGuard with role verification and session timeout
- [ ] useAuth composable for session management
- [ ] i18n strings for both languages
- [ ] Unit tests for auth logic

---

## Phase 2: Location Management Enhancement

**Goal**: Complete location editing with all fields, preview mode, and improved UX.

### 2.1 Create Admin Store

`src/stores/admin.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row']
type LocationWithCategories = Location & {
  location_categories?: { category_id: string }[]
}

export const useAdminStore = defineStore('admin', () => {
  const locations = ref<LocationWithCategories[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pendingLocations = computed(() =>
    locations.value.filter(l => l.status === 'pending')
  )

  const approvedLocations = computed(() =>
    locations.value.filter(l => l.status === 'approved')
  )

  const rejectedLocations = computed(() =>
    locations.value.filter(l => l.status === 'rejected')
  )

  const stats = computed(() => ({
    pending: pendingLocations.value.length,
    approved: approvedLocations.value.length,
    rejected: rejectedLocations.value.length,
    total: locations.value.length
  }))

  async function fetchLocations(status?: string) {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('locations')
        .select(`
          *,
          location_categories(category_id)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      locations.value = data || []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch locations'
    } finally {
      loading.value = false
    }
  }

  async function updateLocation(
    id: string,
    updates: Partial<Location>,
    categoryIds?: string[]
  ) {
    loading.value = true
    error.value = null

    try {
      // Update location
      const { error: updateError } = await supabase
        .from('locations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) throw updateError

      // Update categories if provided
      if (categoryIds !== undefined) {
        // Delete existing
        await supabase
          .from('location_categories')
          .delete()
          .eq('location_id', id)

        // Insert new
        if (categoryIds.length > 0) {
          await supabase
            .from('location_categories')
            .insert(categoryIds.map(cid => ({
              location_id: id,
              category_id: cid
            })))
        }
      }

      // Refresh local state
      await fetchLocations()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function approveLocation(id: string) {
    const { data: userData } = await supabase.auth.getUser()
    await updateLocation(id, {
      status: 'approved',
      approved_by: userData?.user?.id || null
    })
  }

  async function rejectLocation(id: string, reason: string) {
    await updateLocation(id, {
      status: 'rejected',
      rejection_reason: reason
    })
  }

  return {
    locations,
    loading,
    error,
    pendingLocations,
    approvedLocations,
    rejectedLocations,
    stats,
    fetchLocations,
    updateLocation,
    approveLocation,
    rejectLocation
  }
})
```

### 2.2 Create LocationEditForm Component

`src/components/admin/LocationEditForm.vue`:

A comprehensive form with all location fields:
- **Basic Info**: name, slug, descriptions (DE/EN)
- **Contact**: website, phone, email, instagram
- **Address**: address, city, postal_code, latitude, longitude
- **Map Picker**: Interactive Leaflet map for geo selection
- **Categories**: Multi-select checkboxes
- **Payment Methods**: Checkbox grid
- **Opening Hours**: OSM format input + preview
- **Admin Fields**: status, admin_notes

Features:
- Field validation
- Dirty state tracking
- Unsaved changes warning
- Auto-generate slug from name

### 2.3 Create LocationPreview Component

`src/components/admin/LocationPreview.vue`:

Shows how the location will appear:
- Map with marker
- Info card matching public view
- Payment icons
- Opening hours formatted
- Categories displayed

### 2.4 Enhanced EditView

Integrate form and preview side-by-side on larger screens:

```vue
<template>
  <AdminLayout>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">{{ t('admin.edit.form') }}</h2>
        <LocationEditForm
          v-if="location"
          :location="location"
          :categories="categories"
          :loading="saving"
          @save="handleSave"
          @update:preview="previewData = $event"
        />
      </div>

      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">{{ t('admin.edit.preview') }}</h2>
        <LocationPreview :location="previewData" />
      </div>
    </div>
  </AdminLayout>
</template>
```

### 2.5 Create AdminLayout Component

Shared layout for all admin pages:
- Sidebar navigation (Dashboard, Locations, Categories)
- Header with user info and logout
- Responsive design

### 2.6 Create LocationsListView

`src/views/admin/LocationsListView.vue`:

Full location management (not just pending):
- Tabs: All / Pending / Approved / Rejected
- Search/filter functionality
- Sortable columns
- Quick actions (approve, edit, view on map)

### 2.7 Tests

- LocationEditForm: Field validation, dirty state, form submission
- LocationPreview: Renders all fields correctly
- useAdminStore: CRUD operations, computed properties

### Phase 2 Deliverables
- [ ] Admin Pinia store with full location management
- [ ] LocationEditForm component with all fields
- [ ] LocationPreview component
- [ ] AdminLayout shared component
- [ ] Enhanced EditView with side-by-side preview
- [ ] LocationsListView for all locations
- [ ] Unit tests

---

## Phase 3: Category Management

**Goal**: Full CRUD for categories with icon upload to Supabase Storage.

### 3.1 Database Migration

`supabase/migrations/20260110_category_icons.sql`:

```sql
-- Add icon_url column (will store Supabase Storage URL)
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS icon_url TEXT,
ADD COLUMN IF NOT EXISTS description_de TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create storage bucket for category icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-icons', 'category-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Category icons are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'category-icons');

CREATE POLICY "Admins can upload category icons"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'category-icons'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can delete category icons"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'category-icons'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Update markerIcons.ts to check icon_url first, fallback to file
```

### 3.2 Update Categories Store

`src/stores/categories.ts` - Add admin methods:

```typescript
// Add to existing store
async function createCategory(category: CategoryInsert, iconFile?: File) {
  // Upload icon if provided
  let iconUrl: string | null = null
  if (iconFile) {
    iconUrl = await uploadIcon(category.slug, iconFile)
  }

  // Insert category
  const { data, error } = await supabase
    .from('categories')
    .insert({ ...category, icon_url: iconUrl })
    .select()
    .single()

  if (error) throw error
  categories.value.push(data)
  return data
}

async function updateCategory(id: string, updates: CategoryUpdate, iconFile?: File) {
  // Handle icon update
  if (iconFile) {
    updates.icon_url = await uploadIcon(updates.slug!, iconFile)
  }

  // Update category
  // ...
}

async function deleteCategory(id: string, reassignTo: string) {
  // Reassign locations to new category
  await supabase
    .from('location_categories')
    .update({ category_id: reassignTo })
    .eq('category_id', id)

  // Delete old icon from storage
  // ...

  // Delete category
  // ...
}

async function uploadIcon(slug: string, file: File): Promise<string> {
  const path = `${slug}-${Date.now()}.png`

  const { error } = await supabase.storage
    .from('category-icons')
    .upload(path, file)

  if (error) throw error

  const { data } = supabase.storage
    .from('category-icons')
    .getPublicUrl(path)

  return data.publicUrl
}
```

### 3.3 Update markerIcons.ts

```typescript
export function getCategoryIcon(
  categorySlug: string | null,
  iconUrl?: string | null
): L.Icon {
  const key = iconUrl || categorySlug || 'andere'

  if (iconCache.has(key)) {
    return iconCache.get(key)!
  }

  // Prefer icon_url from database, fallback to local file
  const url = iconUrl || `/icons/categories/${categorySlug || 'andere'}.png`

  const icon = L.icon({
    iconUrl: url,
    iconSize: ICON_SIZE,
    iconAnchor: ICON_ANCHOR,
    popupAnchor: POPUP_ANCHOR
  })

  iconCache.set(key, icon)
  return icon
}
```

### 3.4 Create CategoriesListView

`src/views/admin/CategoriesListView.vue`:

- List all categories with icons
- Reorderable (drag & drop for sort_order)
- Edit/Delete buttons
- "Add Category" button

### 3.5 Create CategoryEditModal

`src/components/admin/CategoryEditModal.vue`:

- Name (DE/EN)
- Slug (auto-generated, editable)
- Description (DE/EN)
- Color picker
- Icon upload with preview
- Sort order

### 3.6 Create CategoryDeleteModal

`src/components/admin/CategoryDeleteModal.vue`:

- Shows count of affected locations
- Lists affected location names
- Dropdown to select reassignment category
- Confirmation checkbox

### 3.7 Update Router

Add category routes:

```typescript
{
  path: 'categories',
  name: 'admin-categories',
  component: CategoriesListView,
  meta: { requiresAdmin: true }
}
```

### 3.8 Tests

- Category CRUD operations
- Icon upload/delete
- Deletion with reassignment
- Sort order updates

### Phase 3 Deliverables
- [ ] Database migration for icon storage
- [ ] Storage bucket and policies
- [ ] Updated categories store with admin methods
- [ ] Updated markerIcons.ts for dynamic icons
- [ ] CategoriesListView
- [ ] CategoryEditModal
- [ ] CategoryDeleteModal
- [ ] Unit tests

---

## Phase 4: Email Notifications

**Goal**: Notify admin when new submissions arrive.

### 4.1 Update submit-location Edge Function

`supabase/functions/submit-location/index.ts`:

After storing the submission and sending verification email to user, also notify admin:

```typescript
// Existing code: send verification email to submitter
await sendVerificationEmail(submission.email, verificationUrl)

// NEW: Notify admin of new submission
await notifyAdminNewSubmission({
  locationName: submission.name,
  submitterEmail: submission.email,
  submittedAt: new Date().toISOString()
})

async function notifyAdminNewSubmission(details: {
  locationName: string
  submitterEmail: string
  submittedAt: string
}) {
  const adminEmail = Deno.env.get('ADMIN_EMAIL')
  if (!adminEmail) return

  const subject = `[Zero Waste Map] New Location Submission: ${details.locationName}`

  const body = `
    A new location has been submitted for review.

    Location: ${details.locationName}
    Submitted by: ${details.submitterEmail}
    Submitted at: ${new Date(details.submittedAt).toLocaleString('de-DE')}

    Review it here: ${Deno.env.get('FRONTEND_URL')}/admin/pending
  `

  await sendEmail({
    to: adminEmail,
    subject,
    body
  })
}
```

### 4.2 Add Supabase Secret

```bash
supabase secrets set ADMIN_EMAIL=admin@zerowastefrankfurt.de
```

### 4.3 Prepare for Future Submitter Notifications

Create email templates that will be used when SES production access is granted:

`supabase/functions/_shared/email-templates.ts`:

```typescript
export function getApprovalEmailTemplate(locationName: string, locale: 'de' | 'en') {
  // German and English templates
  // ...
}

export function getRejectionEmailTemplate(
  locationName: string,
  reason: string,
  locale: 'de' | 'en'
) {
  // German and English templates
  // ...
}
```

### 4.4 Tests

- Edge function sends admin notification
- Email content is correct
- Handles missing ADMIN_EMAIL gracefully

### Phase 4 Deliverables
- [ ] Updated submit-location edge function
- [ ] Admin notification email logic
- [ ] Email templates prepared for future submitter notifications
- [ ] Supabase secret for admin email
- [ ] Tests for edge function

---

## Phase 5: Polish & Final Testing

**Goal**: UI polish, error handling, E2E tests, documentation.

### 5.1 UI Improvements

- Loading states for all async operations
- Toast notifications for success/error
- Empty states with helpful messages
- Keyboard shortcuts (Escape to close modals, Enter to submit)
- Mobile-responsive admin layout

### 5.2 Error Handling

- Graceful degradation when API fails
- Retry logic for transient failures
- User-friendly error messages
- Error boundary component

### 5.3 Dashboard Enhancements

- Recent submissions list (last 5)
- Quick approve buttons
- Activity feed (recent approvals/rejections)

### 5.4 E2E Tests

`tests/e2e/admin.spec.ts`:

```typescript
test.describe('Admin Section', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin (use test account)
  })

  test('can view dashboard with stats', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByText('Pending')).toBeVisible()
  })

  test('can approve a pending location', async ({ page }) => {
    // ...
  })

  test('can edit and save a location', async ({ page }) => {
    // ...
  })

  test('can create a new category', async ({ page }) => {
    // ...
  })

  test('can delete category with reassignment', async ({ page }) => {
    // ...
  })
})
```

### 5.5 Documentation

Update `CLAUDE.md` with:
- Admin section routes
- How to create admin users
- Edge function deployment notes

### 5.6 Security Audit

- Verify all admin routes are protected
- Verify RLS policies work correctly
- Test rate limiting
- Test session timeout

### Phase 5 Deliverables
- [ ] Toast notification system
- [ ] Loading states and empty states
- [ ] Error handling improvements
- [ ] Dashboard enhancements
- [ ] E2E test suite
- [ ] Documentation updates
- [ ] Security audit checklist

---

## File Structure After Implementation

```
src/
  components/
    admin/
      AdminLayout.vue
      AdminSidebar.vue
      LocationEditForm.vue
      LocationPreview.vue
      CategoryEditModal.vue
      CategoryDeleteModal.vue
      StatsCard.vue
      RecentSubmissions.vue
  composables/
    useAuth.ts              # Session management
    useAdmin.ts             # (can be deprecated, use store)
  stores/
    admin.ts                # Admin-specific state
    categories.ts           # Updated with admin methods
  views/
    admin/
      LoginView.vue         # Magic link auth
      DashboardView.vue     # Enhanced with activity
      LocationsListView.vue # All locations
      EditView.vue          # Enhanced edit with preview
      CategoriesListView.vue # Category management
  router/
    guards/
      adminGuard.ts         # Role + session verification

supabase/
  migrations/
    20260110_admin_auth.sql
    20260110_category_icons.sql
  functions/
    submit-location/        # Updated with admin notification
    _shared/
      email-templates.ts

tests/
  unit/
    composables/useAuth.spec.ts
    stores/admin.spec.ts
    guards/adminGuard.spec.ts
  e2e/
    admin.spec.ts
```

---

## Execution Notes

1. **Run phases sequentially** - Each phase builds on the previous
2. **Test after each phase** - Run `npm test` and verify manually
3. **Deploy migrations carefully** - Always backup before running
4. **Use `/checkpoint`** - Clear context between phases if needed
5. **Commit after each phase** - Use conventional commits

---

## Design Decisions (Finalized)

1. **Default category for reassignment**: Use "Other" (`andere`) category. Ensure this category exists and cannot be deleted.

2. **Icon format**: PNG only. Validate file type on upload, reject non-PNG files with clear error message.

3. **Slug editing**: Yes, allow editing slugs for existing locations BUT show a warning modal:
   - Warning text: "Changing the slug will break existing links to this location. Anyone who bookmarked or shared the old URL will get a 404 error."
   - Show the old URL and the new URL side by side
   - Require explicit confirmation checkbox: "I understand this will break existing links"
   - For approved locations, the warning should be more prominent (yellow/orange background)
