# Ko-fi Support Integration - Phase 2: Ko-fi Integration & UI

**Status:** Ready for implementation (after Phase 0 & 1)

**Estimated Tokens:** ~50k
**Dependencies:**
- Phase 0 (Ko-fi account created, variables collected)
- Phase 1 (Legal foundation in place)
**Blocks:** Phase 3

---

## 🎯 Objectives

1. Add coffee emoji (☕) to header next to "Zero Waste Frankfurt"
2. Create `/support` page with project messaging and Ko-fi integration
3. Add Ko-fi button/widget to support page
4. Add support link to footer (already in Phase 1)
5. Ensure mobile responsive design
6. Implement bilingual support (DE/EN)

---

## 📋 Prerequisites

Ensure these are complete before starting:

- [x] Phase 0: Ko-fi account created
- [x] Phase 0: Variables collected (`{{KO_FI_USERNAME}}`, `{{KO_FI_BUTTON_CODE}}`, `{{SUPPORT_EMAIL}}`)
- [x] Phase 1: Impressum page live
- [x] Phase 1: Privacy Policy updated
- [x] Phase 1: Footer links added

---

## 📝 Tasks

### Task 1: Add Coffee Emoji to Header

**Goal:** Make "Zero Waste Frankfurt ☕" clickable in the header, emoji links to `/support` page

**File:** `src/components/common/Header.vue` (or `src/App.vue` depending on structure)

**Implementation:**

```vue
<template>
  <header class="bg-white shadow-sm">
    <div class="container mx-auto px-4 py-4 flex items-center justify-between">
      <!-- Logo/Title with Coffee Emoji -->
      <div class="flex items-center gap-2">
        <router-link
          to="/"
          class="text-xl md:text-2xl font-bold text-gray-900 hover:text-primary"
        >
          Zero Waste Frankfurt
        </router-link>
        <router-link
          to="/support"
          class="text-xl md:text-2xl cursor-pointer hover:scale-110 transition-transform"
          :title="t('header.supportProject')"
          aria-label="Support this project"
        >
          ☕
        </router-link>
      </div>

      <!-- Rest of header: language switcher, menu, etc. -->
      <!-- ... -->
    </div>
  </header>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
/* Optional: Add subtle animation on hover */
.hover\:scale-110:hover {
  transform: scale(1.1);
}
</style>
```

**i18n additions:**

```json
// de.json
{
  "header": {
    "supportProject": "Projekt unterstützen"
  }
}

// en.json
{
  "header": {
    "supportProject": "Support this project"
  }
}
```

**Acceptance Criteria:**
- [ ] Coffee emoji (☕) appears next to "Zero Waste Frankfurt" in header
- [ ] Emoji is clickable and links to `/support`
- [ ] Hover shows tooltip "Support this project" / "Projekt unterstützen"
- [ ] Emoji scales slightly on hover (visual feedback)
- [ ] Works on mobile and desktop
- [ ] Maintains proper spacing and alignment

---

### Task 2: Create Support Page

**File:** `src/views/SupportView.vue`

**Requirements:**
- Welcoming, friendly tone
- Explain why support matters
- Show Ko-fi button/widget
- Bilingual (DE/EN)
- Mobile responsive

**Implementation:**

```vue
<template>
  <div class="max-w-3xl mx-auto px-4 py-8 md:py-12">
    <!-- Hero Section -->
    <div class="text-center mb-8">
      <h1 class="text-3xl md:text-4xl font-bold mb-4">
        {{ t('support.title') }} ☕
      </h1>
      <p class="text-lg text-gray-600 mb-6">
        {{ t('support.subtitle') }}
      </p>
    </div>

    <!-- Message Section -->
    <div class="bg-green-50 border-l-4 border-green-500 p-6 mb-8">
      <h2 class="text-xl font-semibold mb-3 text-green-900">
        {{ t('support.message.title') }}
      </h2>
      <p class="text-gray-700 mb-3">
        {{ t('support.message.intro') }}
      </p>
      <p class="text-gray-700 mb-3">
        {{ t('support.message.bigPlans') }}
      </p>
      <p class="text-gray-700">
        {{ t('support.message.helps') }}
      </p>
    </div>

    <!-- Ko-fi Widget Section -->
    <div class="bg-white rounded-lg shadow-md p-6 md:p-8 mb-8">
      <h2 class="text-2xl font-semibold mb-4 text-center">
        {{ t('support.donate.title') }}
      </h2>
      <p class="text-gray-600 text-center mb-6">
        {{ t('support.donate.options') }}
      </p>

      <!-- Ko-fi Button -->
      <div class="flex justify-center mb-6">
        <a
          :href="`https://ko-fi.com/${kofiUsername}`"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 bg-[#13C3FF] hover:bg-[#0FA8D9] text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
        >
          <span class="text-2xl">☕</span>
          <span>{{ t('support.donate.button') }}</span>
        </a>
      </div>

      <!-- Alternative: Embed Ko-fi Widget (if available) -->
      <!--
      <div v-html="kofiButtonCode" class="flex justify-center"></div>
      -->

      <p class="text-sm text-gray-500 text-center">
        {{ t('support.donate.redirect') }}
      </p>
    </div>

    <!-- What Support Covers -->
    <div class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">
        {{ t('support.covers.title') }}
      </h2>
      <ul class="space-y-3">
        <li class="flex items-start gap-3">
          <span class="text-green-600 text-xl">✓</span>
          <span class="text-gray-700">{{ t('support.covers.hosting') }}</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-green-600 text-xl">✓</span>
          <span class="text-gray-700">{{ t('support.covers.server') }}</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-green-600 text-xl">✓</span>
          <span class="text-gray-700">{{ t('support.covers.time') }}</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-green-600 text-xl">✓</span>
          <span class="text-gray-700">{{ t('support.covers.expansion') }}</span>
        </li>
      </ul>
    </div>

    <!-- FAQ / Additional Info -->
    <div class="bg-gray-50 rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-3">
        {{ t('support.faq.title') }}
      </h3>

      <div class="space-y-4">
        <div>
          <h4 class="font-semibold text-gray-900 mb-1">
            {{ t('support.faq.q1.question') }}
          </h4>
          <p class="text-gray-700 text-sm">
            {{ t('support.faq.q1.answer') }}
          </p>
        </div>

        <div>
          <h4 class="font-semibold text-gray-900 mb-1">
            {{ t('support.faq.q2.question') }}
          </h4>
          <p class="text-gray-700 text-sm">
            {{ t('support.faq.q2.answer') }}
          </p>
        </div>

        <div>
          <h4 class="font-semibold text-gray-900 mb-1">
            {{ t('support.faq.q3.question') }}
          </h4>
          <p class="text-gray-700 text-sm">
            {{ t('support.faq.q3.answer') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Thank You -->
    <div class="text-center mt-8 text-gray-600">
      <p class="text-lg">{{ t('support.thankYou') }} 💚</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Replace with actual Ko-fi username from variables
const kofiUsername = '{{KO_FI_USERNAME}}'  // e.g., 'zerowastefrank'

// Optional: If using embedded widget code
// const kofiButtonCode = '{{KO_FI_BUTTON_CODE}}'
</script>
```

**Acceptance Criteria:**
- [ ] Page renders with welcoming design
- [ ] Ko-fi button links to correct Ko-fi profile
- [ ] Button styled in Ko-fi brand color (#13C3FF)
- [ ] Mobile responsive (stacks nicely on small screens)
- [ ] All sections visible and readable
- [ ] Opens Ko-fi in new tab (target="_blank")

---

### Task 3: Add i18n Translations for Support Page

**Files:**
- `src/locales/de.json`
- `src/locales/en.json`

**German Translations (de.json):**

```json
{
  "support": {
    "title": "Unterstütze dieses Projekt",
    "subtitle": "Hilf dabei, diese Karte kostenlos und nachhaltig zu betreiben",
    "message": {
      "title": "Warum deine Unterstützung wichtig ist",
      "intro": "Diese Karte ist ein Herzensprojekt für nachhaltige Orte in Frankfurt. Sie wird komplett in Freizeit entwickelt und betrieben.",
      "bigPlans": "Wir fangen in Frankfurt an, aber wir haben große Pläne und Ideen! Von der Expansion in andere Städte bis hin zu neuen Features – mit deiner Unterstützung können wir mehr erreichen.",
      "helps": "Deine Unterstützung hilft, Serverkosten zu decken, die investierte Zeit zu würdigen und die Zukunft dieses Projekts zu sichern."
    },
    "donate": {
      "title": "Kaufe mir einen Kaffee",
      "options": "Wähle zwischen einmaliger Spende oder monatlicher Unterstützung",
      "button": "Unterstützen auf Ko-fi",
      "redirect": "Du wirst zu Ko-fi weitergeleitet, um sicher zu spenden"
    },
    "covers": {
      "title": "Was deine Unterstützung ermöglicht",
      "hosting": "Hosting-Kosten (Supabase, AWS, Domain)",
      "server": "Eigener Server für Geo-API-Anfragen (keine Rate-Limits mehr)",
      "time": "Zeit für Entwicklung, Wartung und Support",
      "expansion": "Expansion in weitere Städte und neue Features"
    },
    "faq": {
      "title": "Häufige Fragen",
      "q1": {
        "question": "Ist die Karte kostenlos?",
        "answer": "Ja! Die Karte bleibt 100% kostenlos für alle Nutzer. Unterstützung ist freiwillig und hilft nur bei den Betriebskosten."
      },
      "q2": {
        "question": "Was passiert mit meinen Daten?",
        "answer": "Ko-fi verarbeitet die Zahlung. Wir erhalten nur deinen Namen (falls angegeben) und den Betrag. Keine Zahlungsdaten werden von uns gespeichert."
      },
      "q3": {
        "question": "Kann ich auch anders helfen?",
        "answer": "Auf jeden Fall! Du kannst neue Orte vorschlagen, die Karte teilen oder Feedback geben. Jede Hilfe zählt!"
      }
    },
    "thankYou": "Vielen Dank für deine Unterstützung!"
  }
}
```

**English Translations (en.json):**

```json
{
  "support": {
    "title": "Support This Project",
    "subtitle": "Help keep this map free and sustainable",
    "message": {
      "title": "Why Your Support Matters",
      "intro": "This map is a passion project for sustainable places in Frankfurt. It's developed and operated entirely in my free time.",
      "bigPlans": "We are starting in Frankfurt but we have big plans and ideas! From expanding to other cities to adding new features – with your support, we can achieve more.",
      "helps": "Your support helps cover hosting costs, values the time invested, and secures the future of this project."
    },
    "donate": {
      "title": "Buy Me a Coffee",
      "options": "Choose between one-time donation or monthly support",
      "button": "Support on Ko-fi",
      "redirect": "You'll be redirected to Ko-fi to donate securely"
    },
    "covers": {
      "title": "What Your Support Enables",
      "hosting": "Hosting costs (Supabase, AWS, domain)",
      "server": "Dedicated server for geo API calls (no more rate limits)",
      "time": "Time for development, maintenance, and support",
      "expansion": "Expansion to other cities and new features"
    },
    "faq": {
      "title": "Frequently Asked Questions",
      "q1": {
        "question": "Is the map free?",
        "answer": "Yes! The map remains 100% free for all users. Support is voluntary and only helps with operating costs."
      },
      "q2": {
        "question": "What happens to my data?",
        "answer": "Ko-fi processes the payment. We only receive your name (if provided) and the amount. No payment data is stored by us."
      },
      "q3": {
        "question": "Can I help in other ways?",
        "answer": "Absolutely! You can suggest new locations, share the map, or give feedback. Every bit helps!"
      }
    },
    "thankYou": "Thank you so much for your support!"
  }
}
```

**Acceptance Criteria:**
- [ ] All keys added to both language files
- [ ] Translations accurate and natural sounding
- [ ] Messaging includes "big plans" note as requested
- [ ] Community-focused tone (Option C from requirements)
- [ ] No missing translation keys

---

### Task 4: Add Router Route for Support Page

**File:** `src/router/index.ts`

```typescript
{
  path: '/support',
  name: 'support',
  component: () => import('../views/SupportView.vue'),
  meta: {
    title: 'Support - Zero Waste Frankfurt',
    description: 'Support this project to help cover costs and enable future expansion'
  }
}
```

**Also add German alias (optional):**

```typescript
{
  path: '/unterstuetzen',
  redirect: '/support'
}
```

**Acceptance Criteria:**
- [ ] Route accessible at `/support`
- [ ] Optional: German alias `/unterstuetzen` works
- [ ] Meta tags set for SEO
- [ ] Page loads without errors

---

### Task 5: Update Footer (if not done in Phase 1)

**File:** `src/components/common/Footer.vue`

**Ensure support link is present with coffee emoji:**

```vue
<router-link to="/support" class="hover:text-primary cursor-pointer">
  ☕ {{ t('footer.support') }}
</router-link>
```

**Acceptance Criteria:**
- [ ] Support link visible in footer
- [ ] Coffee emoji (☕) appears before "Support"/"Unterstützen"
- [ ] Link styled consistently with other footer links
- [ ] Hover state works (color change, cursor pointer)

---

### Task 6: Optional - Ko-fi Widget Integration

**If Ko-fi provides embeddable widget code:**

Ko-fi offers different integration methods:
1. **Simple Link** (already implemented in Task 2)
2. **Button Widget** (embeddable JavaScript)
3. **Floating Button** (persistent across all pages)

**For Button Widget:**

```vue
<!-- In SupportView.vue, replace the button with: -->
<div
  id="kofi-widget-container"
  v-html="kofiButtonCode"
  class="flex justify-center"
></div>

<script setup lang="ts">
// From Ko-fi dashboard: Settings → Get Button Code
const kofiButtonCode = `{{KO_FI_BUTTON_CODE}}`  // Paste Ko-fi's embed code here
</script>
```

**For Floating Button (optional, more prominent):**

Add to `src/App.vue` or main layout:

```vue
<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  // Ko-fi floating button script
  const script = document.createElement('script')
  script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js'
  script.async = true
  document.head.appendChild(script)

  script.onload = () => {
    kofiWidgetOverlay.draw('{{KO_FI_USERNAME}}', {
      'type': 'floating-chat',
      'floating-chat.donateButton.text': 'Support',
      'floating-chat.donateButton.background-color': '#13C3FF',
      'floating-chat.donateButton.text-color': '#fff'
    })
  }
})
</script>
```

**Note:** Floating button is more prominent but might be too "in-your-face" for users. Discuss with user before implementing.

**Acceptance Criteria (if implemented):**
- [ ] Ko-fi widget renders correctly
- [ ] Widget links to correct Ko-fi profile
- [ ] Widget is mobile responsive
- [ ] No JavaScript errors in console
- [ ] Widget doesn't block important UI elements

---

## 🎨 Design Considerations

### Color Palette

- **Ko-fi Brand Blue:** `#13C3FF` (use for Ko-fi button)
- **Your Brand Green:** (existing green from site design)
- **Neutral backgrounds:** Gray-50, Green-50 for sections

### Typography

- Headings: Bold, friendly
- Body text: Readable, warm tone
- Button text: Clear call-to-action

### Spacing

- Generous padding on mobile (px-4, py-8)
- Wider max-width on desktop (max-w-3xl)
- Clear section separation

---

## ✅ Acceptance Criteria (Phase 2 Complete)

**Functionality:**
- [ ] Coffee emoji (☕) in header links to `/support`
- [ ] Support page accessible at `/support`
- [ ] Ko-fi button links to correct Ko-fi profile
- [ ] Footer support link works
- [ ] All links open in new tabs where appropriate
- [ ] No broken links or 404s

**Design:**
- [ ] Mobile responsive on all screen sizes
- [ ] Professional, welcoming design
- [ ] Consistent with site's design system
- [ ] Ko-fi button stands out but not overwhelming
- [ ] Proper contrast ratios (accessibility)

**Content:**
- [ ] Bilingual (DE/EN) fully implemented
- [ ] Messaging includes "big plans" note
- [ ] Community-focused tone (Option C)
- [ ] FAQ answers common questions
- [ ] All text proofread and typo-free

**Technical:**
- [ ] No console errors or warnings
- [ ] No TypeScript errors
- [ ] i18n keys all defined
- [ ] Routes work correctly
- [ ] Environment variables used for Ko-fi username

---

## 🧪 Testing Checklist

**Manual Testing:**

- [ ] Desktop: Header emoji visible and clickable
- [ ] Desktop: Support page renders correctly
- [ ] Desktop: Ko-fi button works
- [ ] Mobile: Header emoji doesn't break layout
- [ ] Mobile: Support page stacks nicely
- [ ] Mobile: Ko-fi button tappable and sized well
- [ ] Language switch: All content translates (DE ↔ EN)
- [ ] Footer: Support link visible on all pages
- [ ] Click Ko-fi button: Opens Ko-fi in new tab
- [ ] Hover states: All interactive elements show feedback

**Cross-browser Testing:**

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

**Regression Testing:**

- [ ] Existing routes still work
- [ ] Header doesn't break on other pages
- [ ] Footer works on all pages
- [ ] Language switcher still functional
- [ ] Map view not affected

---

## 📦 Deliverables

1. `src/views/SupportView.vue` - New support page
2. `src/components/common/Header.vue` - Updated header with coffee emoji
3. `src/components/common/Footer.vue` - Updated footer (if needed)
4. `src/router/index.ts` - Support page route
5. `src/locales/de.json` - German translations for support page
6. `src/locales/en.json` - English translations for support page
7. Optional: Ko-fi widget integration code

---

## 🚀 Next Steps

After Phase 2 is complete and tested:

→ **Proceed to Phase 3: Polish & Analytics**

Phase 3 will add:
- Analytics tracking for Ko-fi button clicks
- A/B testing setup (if desired)
- Performance optimization
- Final UX polish and bug fixes

---

## 📝 Implementation Notes

### Variable Replacement

Replace these before implementation:

```bash
KO_FI_USERNAME="zerowastefrank"  # Your actual Ko-fi username
KO_FI_BUTTON_CODE="<script>...</script>"  # From Ko-fi dashboard (if using widget)
```

### Environment Variables (Recommended)

Add to `.env`:

```bash
VITE_KO_FI_USERNAME=zerowastefrank
```

Use in code:

```typescript
const kofiUsername = import.meta.env.VITE_KO_FI_USERNAME || 'zerowastefrank'
```

### Ko-fi Setup Reminders

Before testing:
1. Verify Ko-fi account is active
2. Ensure both one-time and recurring donations are enabled
3. Test a small donation yourself to verify flow works
4. Check Ko-fi email notifications are configured

---

## 🎯 Success Metrics (for Phase 3)

Track these after Phase 2 is live:

- Number of clicks on coffee emoji in header
- Number of clicks on footer support link
- Number of visits to `/support` page
- Number of clicks on Ko-fi button
- Actual donations received (via Ko-fi dashboard)

These metrics will inform Phase 3 optimizations.
