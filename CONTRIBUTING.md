# Contributing to Zero Waste Frankfurt

Thank you for your interest in contributing to Zero Waste Frankfurt! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing Requirements](#testing-requirements)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Component Guidelines](#component-guidelines)
- [Performance Guidelines](#performance-guidelines)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Supabase account (for backend development)
- AWS CLI (for infrastructure changes)

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/zerowaste-frankfurt.git
   cd zerowaste-frankfurt
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Copy environment file:
   ```bash
   cp .env.example .env
   ```

5. Add your Supabase credentials to `.env`

6. Run the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, following the code style and testing guidelines

3. Run tests to ensure nothing breaks:
   ```bash
   npm test
   npm run type-check
   ```

4. Commit your changes using conventional commit format

5. Push to your fork and create a Pull Request

## Code Style

### TypeScript

- **Use strict TypeScript** - Avoid `any` types whenever possible
- **Prefer interfaces over types** for object shapes
- **Export types with components** - Co-locate types with their usage
- **Use proper type imports**:
  ```typescript
  import type { Location } from '@/types/database'
  ```

### Vue Components

- **Use Composition API** - All new components should use `<script setup>`
- **Component naming** - Use PascalCase for component files (e.g., `ContactInfo.vue`)
- **Props with TypeScript** - Define props using `defineProps<Props>()`
- **Emit events with types** - Use `defineEmits<Emits>()`
- **Extract complex logic to composables** - Keep components focused on presentation

Example component structure:

```vue
<template>
  <div class="my-component">
    <!-- Template content -->
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { MyData } from '@/types/mydata'

interface Props {
  data: MyData
  size?: 'sm' | 'md' | 'lg'
}

interface Emits {
  update: [value: string]
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const emit = defineEmits<Emits>()

// Component logic
</script>

<style scoped>
/* Component styles */
</style>
```

### Composables

- **File naming** - Use camelCase with `use` prefix (e.g., `useDebounce.ts`)
- **Return object destructuring** - Return named exports for clarity
- **Auto-cleanup** - Use `onUnmounted` to clean up subscriptions, timers, event listeners
- **JSDoc comments** - Document parameters and return values

Example composable:

```typescript
import { ref, onUnmounted } from 'vue'

/**
 * Description of what the composable does
 *
 * @param param1 - Description of parameter
 * @returns Object with methods and state
 *
 * @example
 * const { method, state } = useMyComposable('value')
 */
export function useMyComposable(param: string) {
  const state = ref<string>(param)

  function method() {
    // Logic
  }

  // Cleanup
  onUnmounted(() => {
    // Clean up resources
  })

  return {
    state,
    method
  }
}
```

### Styling

- **Use Tailwind CSS** - Prefer Tailwind utility classes over custom CSS
- **Scoped styles** - Use `<style scoped>` for component-specific styles
- **CSS custom properties** - Use CSS variables for theme colors if needed
- **Mobile-first** - Design for mobile first, then add responsive breakpoints
- **Cursor indication** - All clickable elements must have `cursor: pointer`

## Testing Requirements

All contributions must include tests. We maintain 300+ tests and expect this number to grow.

### Component Tests

**Required for:**
- All new Vue components
- Modifications to existing components

**What to test:**
- Props render correctly
- Events are emitted with correct payload
- User interactions (clicks, inputs, etc.)
- Conditional rendering
- Computed properties
- Component lifecycle

**Location:** `tests/component/`

Example test:

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  it('renders props correctly', () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test Title' }
    })
    expect(wrapper.text()).toContain('Test Title')
  })

  it('emits update event on button click', async () => {
    const wrapper = mount(MyComponent)
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update')).toBeTruthy()
  })
})
```

### Composable Tests

**Required for:**
- All new composables
- Modifications to existing composables

**What to test:**
- Return values and state
- Side effects
- Cleanup (timers, subscriptions, etc.)
- Error handling

**Location:** `tests/component/composables/`

### E2E Tests

**Required for:**
- New user flows
- Critical functionality changes

**What to test:**
- Complete user journeys
- Form submissions
- Navigation flows
- Error states

**Location:** `tests/e2e/`

### Running Tests

```bash
# Run all unit/component tests
npm test

# Watch mode for development
npm run test:watch

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui

# Type checking
npm run type-check
```

### Test Coverage

- Aim for 80%+ coverage on new code
- All components in `common/` must have tests
- All composables must have tests
- Critical views must have component tests

See [docs/testing-strategy.md](docs/testing-strategy.md) for detailed testing guidelines.

## Commit Message Format

We follow [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring (no feature or bug fix)
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Build process, dependencies, tooling
- `ci` - CI/CD changes

### Scopes

Common scopes in this project:
- `admin` - Admin panel
- `map` - Map functionality
- `search` - Search features
- `favorites` - Favorites system
- `submit` - Location submission
- `i18n` - Internationalization
- `types` - TypeScript types
- `infra` - Infrastructure/deployment

### Examples

```bash
# New feature
feat(search): add debounce to search input

# Bug fix
fix(map): prevent memory leak in marker cleanup

# Documentation
docs(contributing): add testing guidelines

# Refactoring
refactor(admin): extract shared validation logic to composable

# Performance
perf(map): add caching for geospatial queries

# Breaking change
feat(api)!: change location response format

BREAKING CHANGE: location.coords is now location.coordinates
```

## Pull Request Process

### Before Submitting

1. **Run all tests** - Ensure `npm test` passes
2. **Type check** - Ensure `npm run type-check` passes
3. **Build** - Ensure `npm run build` succeeds
4. **Self-review** - Review your own changes first
5. **Update documentation** - Update relevant docs if needed

### PR Title

Use the same format as commit messages:

```
feat(search): add debounce to search input
```

### PR Description

Include:

1. **Summary** - What does this PR do?
2. **Motivation** - Why is this change needed?
3. **Changes** - List of key changes
4. **Testing** - How was this tested?
5. **Screenshots** - For UI changes
6. **Breaking changes** - If any

Example:

```markdown
## Summary
Adds debouncing to the search input to reduce API calls and improve performance.

## Motivation
Users typing quickly were triggering excessive API calls, causing rate limiting and poor UX.

## Changes
- Created `useDebounce` composable
- Applied debounce to search input (300ms delay)
- Added tests for debounce logic
- Updated search component to use new composable

## Testing
- Unit tests for `useDebounce` composable
- Component tests for search input with debounce
- Manual testing with rapid typing

## Breaking Changes
None
```

### Review Process

1. At least one maintainer review required
2. All tests must pass
3. No merge conflicts
4. Follow-up on review comments
5. Squash commits before merge (if requested)

### After Merge

- Delete your feature branch
- Update your local main branch
- Close related issues (if any)

## Component Guidelines

### Reusing Existing Components

Before creating a new component, check if a shared component exists:

**Shared Components:**
- `LoadingSpinner` - Loading states
- `EmptyState` - Empty state placeholders
- `ErrorBoundary` - Error handling wrapper
- `ToastContainer` - Toast notifications
- `ContactInfo` - Contact information display
- `PaymentMethodsBadges` - Payment method badges

See [docs/components.md](docs/components.md) for full component documentation.

### Creating New Components

**When to create a shared component:**
- Used in 3+ places
- Reusable across different contexts
- Has clear, generic props

**Location:**
- Shared components: `src/components/common/`
- Feature-specific: `src/components/[feature]/`

**Requirements:**
- TypeScript props interface
- Proper prop defaults
- Accessibility (ARIA labels, keyboard nav)
- Responsive design
- Component tests

## Performance Guidelines

### Memory Management

- **Clean up subscriptions** - Use `onUnmounted` to clean up
- **AbortController for async** - Cancel pending requests
- **Remove event listeners** - Clean up in `onUnmounted`
- **Clear timers** - Always clear `setTimeout`/`setInterval`

Example:

```typescript
import { onMounted, onUnmounted } from 'vue'

export function useMyComposable() {
  const controller = new AbortController()

  async function fetchData() {
    const response = await fetch('/api/data', {
      signal: controller.signal
    })
    return response.json()
  }

  onUnmounted(() => {
    controller.abort()
  })

  return { fetchData }
}
```

### Optimization Techniques

- **Debounce user input** - Use `useDebounce` for search, filters
- **Cache expensive operations** - Store results in ref/reactive
- **Lazy load components** - Use dynamic imports for large components
- **Optimize images** - Use appropriate formats and sizes
- **Virtual scrolling** - For long lists (if needed)

### Avoiding Common Issues

1. **Memory leaks** - Always clean up in `onUnmounted`
2. **Infinite loops** - Be careful with watchers and computed properties
3. **Unnecessary re-renders** - Use `computed` for derived state
4. **Large bundle size** - Lazy load heavy dependencies
5. **API rate limiting** - Debounce and cache requests

## Questions?

If you have questions about contributing:

1. Check existing documentation in `docs/`
2. Review similar code in the codebase
3. Open a GitHub issue with the "question" label
4. Ask in pull request comments

Thank you for contributing to Zero Waste Frankfurt!
