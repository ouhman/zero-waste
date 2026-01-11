# Shared Components Documentation

This document provides comprehensive documentation for all shared components in the `src/components/common/` directory.

## Table of Contents

- [ContactInfo](#contactinfo)
- [PaymentMethodsBadges](#paymentmethodsbadges)
- [LoadingSpinner](#loadingspinner)
- [EmptyState](#emptystate)
- [ToastContainer](#toastcontainer)
- [ErrorBoundary](#errorboundary)
- [Usage Guidelines](#usage-guidelines)

---

## ContactInfo

Displays contact information (phone, website, email, Instagram) with icons and formatting.

**Location:** `src/components/common/ContactInfo.vue`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `phone` | `string \| null` | `undefined` | Phone number |
| `website` | `string \| null` | `undefined` | Website URL |
| `email` | `string \| null` | `undefined` | Email address |
| `instagram` | `string \| null` | `undefined` | Instagram handle (with or without @) |
| `size` | `'compact' \| 'full'` | `'full'` | Display size |
| `iconStyle` | `'emoji' \| 'svg'` | `'emoji'` | Icon style to use |
| `disableInteraction` | `boolean` | `false` | Disable interactive styles (hover, cursor) |
| `textClass` | `string` | `''` | Additional CSS classes for text |

### Features

- **Auto-formatting** - Removes `https://` and trailing `/` from URLs
- **Clickable links** - Phone, email, and website are clickable
- **Instagram integration** - Automatically formats Instagram handle and links to profile
- **Responsive** - Adapts to compact or full layouts
- **Icons** - Can use emoji or SVG icons
- **Conditional rendering** - Only renders if at least one contact method is provided

### Usage

```vue
<template>
  <!-- Full size with all contact info -->
  <ContactInfo
    phone="+49 69 123456"
    website="https://example.com"
    email="info@example.com"
    instagram="@example"
  />

  <!-- Compact size without interaction -->
  <ContactInfo
    phone="+49 69 123456"
    website="https://example.com"
    size="compact"
    disableInteraction
  />

  <!-- SVG icons instead of emojis -->
  <ContactInfo
    phone="+49 69 123456"
    email="info@example.com"
    iconStyle="svg"
  />
</template>

<script setup lang="ts">
import ContactInfo from '@/components/common/ContactInfo.vue'
</script>
```

### Examples

**Map popup:**
```vue
<ContactInfo
  :phone="location.phone"
  :website="location.website"
  :email="location.email"
  :instagram="location.instagram"
  size="compact"
  iconStyle="svg"
/>
```

**Location detail page:**
```vue
<ContactInfo
  :phone="location.phone"
  :website="location.website"
  :email="location.email"
  :instagram="location.instagram"
  size="full"
/>
```

---

## PaymentMethodsBadges

Displays payment method badges with icons and labels.

**Location:** `src/components/common/PaymentMethodsBadges.vue`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `paymentMethods` | `PaymentMethods \| null` | `undefined` | Payment methods object |
| `layout` | `'inline' \| 'wrap'` | `'wrap'` | Layout mode |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Badge size |
| `showLabel` | `boolean` | `true` | Show/hide text labels |

### PaymentMethods Type

```typescript
interface PaymentMethods {
  cash?: boolean
  debit_cards?: boolean
  credit_cards?: boolean
  contactless?: boolean
  mobile_payment?: boolean
  visa?: boolean
  mastercard?: boolean
  maestro?: boolean
  american_express?: boolean
}
```

### Features

- **Priority ordering** - Displays most common methods first (cash, debit, credit, etc.)
- **Icons** - Uses emoji icons for payment methods
- **Responsive layouts** - Wrap or inline scroll
- **Size variants** - Small, medium, large
- **Conditional rendering** - Only renders if at least one method is enabled
- **German labels** - Uses German payment method labels

### Usage

```vue
<template>
  <!-- Medium size, wrap layout -->
  <PaymentMethodsBadges
    :paymentMethods="{
      cash: true,
      debit_cards: true,
      contactless: true
    }"
  />

  <!-- Small size, inline layout, no labels -->
  <PaymentMethodsBadges
    :paymentMethods="location.payment_methods"
    size="small"
    layout="inline"
    :showLabel="false"
  />

  <!-- Large size with all options -->
  <PaymentMethodsBadges
    :paymentMethods="location.payment_methods"
    size="large"
    layout="wrap"
  />
</template>

<script setup lang="ts">
import PaymentMethodsBadges from '@/components/common/PaymentMethodsBadges.vue'
import type { PaymentMethods } from '@/types/osm'
</script>
```

### Payment Method Icons

| Method | Icon | Label (German) |
|--------|------|---------------|
| cash | 💵 | Bargeld |
| debit_cards | 💳 | EC-Karte |
| credit_cards | 💳 | Kreditkarte |
| contactless | 📡 | Kontaktlos |
| mobile_payment | 📱 | Mobile Payment |
| visa | 💳 | Visa |
| mastercard | 💳 | Mastercard |
| maestro | 💳 | Maestro |
| american_express | 💳 | American Express |

---

## LoadingSpinner

Animated loading spinner with optional text.

**Location:** `src/components/common/LoadingSpinner.vue`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Spinner size |
| `text` | `string` | `undefined` | Loading text to display |
| `centered` | `boolean` | `false` | Center spinner in container |

### Features

- **Animated rotation** - Smooth CSS animation
- **Size variants** - Small, medium, large
- **Optional text** - Display loading message
- **Centered option** - Full-width centered layout
- **Screen reader support** - Includes sr-only text for accessibility

### Usage

```vue
<template>
  <!-- Basic spinner -->
  <LoadingSpinner />

  <!-- Large spinner with text -->
  <LoadingSpinner
    size="lg"
    text="Loading locations..."
  />

  <!-- Centered full-width spinner -->
  <LoadingSpinner
    size="md"
    text="Please wait..."
    centered
  />

  <!-- Small inline spinner -->
  <LoadingSpinner size="sm" />
</template>

<script setup lang="ts">
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
</script>
```

### Examples

**Loading state in component:**
```vue
<template>
  <div>
    <LoadingSpinner v-if="loading" centered text="Loading data..." />
    <div v-else>{{ data }}</div>
  </div>
</template>
```

**Inline loading:**
```vue
<button :disabled="submitting">
  <LoadingSpinner v-if="submitting" size="sm" />
  <span v-else>Submit</span>
</button>
```

---

## EmptyState

Empty state placeholder with icon, title, description, and optional action button.

**Location:** `src/components/common/EmptyState.vue`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | **required** | Title text |
| `description` | `string` | `undefined` | Optional description |
| `actionText` | `string` | `undefined` | Action button text |
| `icon` | `Component` | `undefined` | Custom icon component |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `action` | `void` | Emitted when action button is clicked |

### Slots

| Slot | Description |
|------|-------------|
| `action` | Custom action content (overrides `actionText` prop) |

### Features

- **Default icon** - Provides a default "empty box" icon
- **Custom icon support** - Can pass custom Vue component as icon
- **Action button** - Optional call-to-action
- **Custom actions via slot** - Replace button with custom content
- **Centered layout** - Vertically and horizontally centered
- **Responsive** - Adapts to container width

### Usage

```vue
<template>
  <!-- Basic empty state -->
  <EmptyState
    title="No locations found"
    description="Try adjusting your filters"
  />

  <!-- With action button -->
  <EmptyState
    title="No favorites yet"
    description="Start adding locations to your favorites"
    actionText="Browse Locations"
    @action="router.push('/')"
  />

  <!-- Custom icon -->
  <EmptyState
    title="No results"
    :icon="SearchIcon"
  />

  <!-- Custom action slot -->
  <EmptyState title="Empty state">
    <template #action>
      <div class="flex gap-2">
        <button @click="action1">Action 1</button>
        <button @click="action2">Action 2</button>
      </div>
    </template>
  </EmptyState>
</template>

<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>
```

### Examples

**No search results:**
```vue
<EmptyState
  v-if="searchResults.length === 0"
  title="Keine Ergebnisse gefunden"
  description="Versuchen Sie eine andere Suchanfrage"
/>
```

**No favorites:**
```vue
<EmptyState
  v-if="favorites.length === 0"
  title="Noch keine Favoriten"
  description="Fügen Sie Orte zu Ihren Favoriten hinzu"
  actionText="Orte durchsuchen"
  @action="router.push('/map')"
/>
```

---

## ToastContainer

Toast notification system with auto-dismiss and manual close.

**Location:** `src/components/common/ToastContainer.vue`

### Features

- **Auto-dismiss** - Toasts automatically disappear after 5 seconds
- **Manual close** - Close button on each toast
- **Multiple toast types** - Success, error, warning, info
- **Animated entrance/exit** - Smooth slide-in from right
- **Responsive** - Adapts to mobile screens
- **Portal rendering** - Uses Teleport to body
- **ARIA support** - role="alert" for screen readers

### Usage

This component works with the `useToast` composable. Add it once to your app root:

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <RouterView />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import ToastContainer from '@/components/common/ToastContainer.vue'
</script>
```

Then use the composable in any component:

```vue
<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { success, error, warning, info } = useToast()

function handleSuccess() {
  success('Location saved successfully!')
}

function handleError() {
  error('Failed to save location')
}

function handleWarning() {
  warning('This action cannot be undone')
}

function handleInfo() {
  info('New feature available')
}
</script>
```

### Toast Types

| Type | Color | Use Case |
|------|-------|----------|
| `success` | Green | Successful operations |
| `error` | Red | Errors and failures |
| `warning` | Orange | Warnings and cautions |
| `info` | Blue | Informational messages |

### Examples

**CRUD operations:**
```typescript
// Create
const { id } = await createLocation(data)
success(`Location created: ${id}`)

// Update
await updateLocation(id, data)
success('Location updated successfully')

// Delete
await deleteLocation(id)
success('Location deleted')

// Error
try {
  await saveLocation(data)
} catch (e) {
  error('Failed to save: ' + e.message)
}
```

**Form validation:**
```typescript
if (!email) {
  error('Email is required')
  return
}

if (!isValidEmail(email)) {
  warning('Email format is invalid')
  return
}

success('Form submitted successfully')
```

---

## ErrorBoundary

Error boundary component that catches and displays errors gracefully.

**Location:** `src/components/common/ErrorBoundary.vue`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fallback` | `Component` | `undefined` | Custom fallback component |

### Slots

| Slot | Description |
|------|-------------|
| `default` | Content to wrap with error boundary |

### Features

- **Error catching** - Catches errors in child components
- **Default error UI** - Shows user-friendly error message
- **Custom fallback** - Can provide custom error component
- **Error logging** - Logs errors to console (can integrate with error tracking service)
- **Recovery option** - "Try again" button to reset error state

### Usage

```vue
<template>
  <!-- Wrap potentially error-prone content -->
  <ErrorBoundary>
    <MapContainer />
  </ErrorBoundary>

  <!-- With custom fallback -->
  <ErrorBoundary :fallback="CustomErrorComponent">
    <ComplexFeature />
  </ErrorBoundary>
</template>

<script setup lang="ts">
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import MapContainer from '@/components/map/MapContainer.vue'
</script>
```

### Examples

**Protecting map component:**
```vue
<ErrorBoundary>
  <MapContainer
    :locations="locations"
    :center="center"
  />
</ErrorBoundary>
```

**Admin section:**
```vue
<ErrorBoundary>
  <AdminDashboard />
</ErrorBoundary>
```

### Custom Fallback Component

```vue
<!-- CustomErrorFallback.vue -->
<template>
  <div class="error-fallback">
    <h2>Oops! Something went wrong</h2>
    <p>{{ error.message }}</p>
    <button @click="retry">Try Again</button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  error: Error
  retry: () => void
}

defineProps<Props>()
</script>
```

---

## Usage Guidelines

### When to Use Each Component

#### ContactInfo
- Location detail views
- Map popups
- Admin location editing
- Anywhere contact information needs to be displayed

#### PaymentMethodsBadges
- Location detail views
- Map popups
- Filter display
- Anywhere payment methods need to be shown

#### LoadingSpinner
- Async data loading
- Form submissions
- API requests
- Page loading states

#### EmptyState
- No search results
- Empty lists
- No favorites
- Missing data scenarios

#### ToastContainer
- User feedback for actions
- Success/error notifications
- CRUD operation feedback
- Form validation messages

#### ErrorBoundary
- Wrapping map components
- Protecting critical sections
- Third-party integrations
- Error-prone features

### Component Composition

Components can be composed together:

```vue
<template>
  <ErrorBoundary>
    <LoadingSpinner v-if="loading" centered text="Loading location..." />

    <EmptyState
      v-else-if="!location"
      title="Location not found"
      actionText="Back to Map"
      @action="router.push('/')"
    />

    <div v-else>
      <h1>{{ location.name }}</h1>

      <ContactInfo
        :phone="location.phone"
        :website="location.website"
        :email="location.email"
        :instagram="location.instagram"
      />

      <PaymentMethodsBadges
        :paymentMethods="location.payment_methods"
      />
    </div>
  </ErrorBoundary>

  <ToastContainer />
</template>
```

### Accessibility

All components follow accessibility best practices:

- **Semantic HTML** - Use proper HTML elements
- **ARIA labels** - Screen reader support
- **Keyboard navigation** - All interactive elements are keyboard accessible
- **Color contrast** - WCAG AA compliant
- **Focus indicators** - Visible focus states

### Performance

- **Lazy loading** - Components are tree-shakeable
- **Minimal dependencies** - No external libraries
- **Optimized rendering** - Use v-if/v-show appropriately
- **Memoization** - Computed properties for expensive operations

### Testing

All shared components have comprehensive tests. See test files in `tests/component/common/`:

- `ContactInfo.test.ts` - 15 tests
- `PaymentMethodsBadges.test.ts` - 12 tests
- `LoadingSpinner.test.ts` - 8 tests
- `EmptyState.test.ts` - 10 tests
- `ToastContainer.test.ts` - 14 tests
- `ErrorBoundary.test.ts` - 8 tests

Example test:

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContactInfo from '@/components/common/ContactInfo.vue'

describe('ContactInfo', () => {
  it('renders website link correctly', () => {
    const wrapper = mount(ContactInfo, {
      props: { website: 'https://example.com' }
    })

    const link = wrapper.find('a[href="https://example.com"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('example.com')
  })
})
```

### Style Customization

Components use scoped styles but can be customized via props:

```vue
<!-- Size variants -->
<ContactInfo size="compact" />
<LoadingSpinner size="lg" />
<PaymentMethodsBadges size="small" />

<!-- Custom classes -->
<ContactInfo textClass="text-blue-600 font-bold" />

<!-- Disable features -->
<ContactInfo disableInteraction />
<PaymentMethodsBadges :showLabel="false" />
```

### Migration from Old Components

If you find code using old/duplicate components, replace with these shared versions:

**Before:**
```vue
<div v-if="loading" class="spinner">Loading...</div>
```

**After:**
```vue
<LoadingSpinner v-if="loading" text="Loading..." />
```

**Before:**
```vue
<div v-if="items.length === 0">
  <p>No items found</p>
</div>
```

**After:**
```vue
<EmptyState
  v-if="items.length === 0"
  title="No items found"
/>
```

## Contributing

When adding new shared components:

1. Place in `src/components/common/`
2. Use TypeScript with proper types
3. Add comprehensive tests
4. Document in this file
5. Use in 3+ places before making shared
6. Follow accessibility guidelines
7. Keep dependencies minimal

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed guidelines.

## Questions?

If you have questions about components:

1. Check this documentation
2. Look at component source code
3. Check component tests for usage examples
4. Review [CONTRIBUTING.md](../CONTRIBUTING.md)
5. Ask in pull request comments
