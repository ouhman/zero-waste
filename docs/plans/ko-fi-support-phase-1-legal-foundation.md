# Ko-fi Support Integration - Phase 1: Legal Foundation

**Status:** Ready for implementation (after Phase 0 prerequisites)

**Estimated Tokens:** ~40k
**Dependencies:** Phase 0 (Impressum decision made, virtual address acquired)
**Blocks:** Phase 2, 3

---

## 🎯 Objectives

1. Create legally compliant Impressum page (DE/EN)
2. Update Privacy Policy to mention Ko-fi data processing
3. Ensure GDPR compliance for third-party donation processing
4. Add required legal links to footer

---

## 📋 Prerequisites (from Phase 0)

Ensure these are complete before starting:

- [x] Impressum decision made (Option A chosen)
- [x] Virtual address service signed up (e.g., Online-Impressum.de)
- [x] Variables collected:
  - `{{IMPRESSUM_NAME}}`
  - `{{IMPRESSUM_ADDRESS}}`
  - `{{IMPRESSUM_CITY}}`
  - `{{IMPRESSUM_ZIP}}`
  - `{{SUPPORT_EMAIL}}`

---

## 📝 Tasks

### Task 1: Create Impressum Page Component

**File:** `src/views/ImpressumView.vue`

**Requirements:**
- Bilingual (DE primary, EN available via i18n)
- Clean, readable layout
- Mobile responsive
- Include all required TMG/DDG fields

**Required Fields (per DDG §5):**
1. Name (or organization name)
2. Full address (from virtual address service)
3. Contact email
4. Responsible for content (Verantwortlich für den Inhalt)

**Optional but recommended:**
- Disclaimer about content accuracy
- Link to Privacy Policy
- Link to EU dispute resolution platform (for e-commerce, not strictly needed)

**Template Structure:**

```vue
<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">{{ t('impressum.title') }}</h1>

    <!-- Address Section -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-4">{{ t('impressum.provider') }}</h2>
      <p>{{ IMPRESSUM_NAME }}</p>
      <p>{{ IMPRESSUM_ADDRESS }}</p>
      <p>{{ IMPRESSUM_ZIP }} {{ IMPRESSUM_CITY }}</p>
      <p>{{ IMPRESSUM_COUNTRY }}</p>
    </section>

    <!-- Contact Section -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-4">{{ t('impressum.contact') }}</h2>
      <p>{{ t('impressum.email') }}: <a :href="`mailto:${SUPPORT_EMAIL}`">{{ SUPPORT_EMAIL }}</a></p>
    </section>

    <!-- Responsible for Content -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-4">{{ t('impressum.responsible') }}</h2>
      <p>{{ IMPRESSUM_NAME }}</p>
    </section>

    <!-- Disclaimer -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-4">{{ t('impressum.disclaimer.title') }}</h2>
      <p>{{ t('impressum.disclaimer.content') }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// These would come from environment variables or config
const IMPRESSUM_NAME = '{{IMPRESSUM_NAME}}'
const IMPRESSUM_ADDRESS = '{{IMPRESSUM_ADDRESS}}'
const IMPRESSUM_CITY = '{{IMPRESSUM_CITY}}'
const IMPRESSUM_ZIP = '{{IMPRESSUM_ZIP}}'
const IMPRESSUM_COUNTRY = 'Deutschland'
const SUPPORT_EMAIL = '{{SUPPORT_EMAIL}}'
</script>
```

**Acceptance Criteria:**
- [ ] Page renders correctly on desktop and mobile
- [ ] All required DDG §5 fields present
- [ ] Email links work (mailto:)
- [ ] Bilingual support (DE/EN)
- [ ] Matches site's design system

---

### Task 2: Add i18n Translations

**Files:**
- `src/locales/de.json`
- `src/locales/en.json`

**German Translations (de.json):**

```json
{
  "impressum": {
    "title": "Impressum",
    "provider": "Anbieter",
    "contact": "Kontakt",
    "responsible": "Verantwortlich für den Inhalt",
    "email": "E-Mail",
    "disclaimer": {
      "title": "Haftungsausschluss",
      "content": "Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich. Die Informationen auf dieser Website werden regelmäßig aktualisiert, aber wir können keine Garantie für Vollständigkeit und Richtigkeit geben."
    }
  }
}
```

**English Translations (en.json):**

```json
{
  "impressum": {
    "title": "Legal Notice",
    "provider": "Provider",
    "contact": "Contact",
    "responsible": "Responsible for content",
    "email": "Email",
    "disclaimer": {
      "title": "Disclaimer",
      "content": "Despite careful content control, we assume no liability for the content of external links. The operators of the linked pages are solely responsible for their content. The information on this website is regularly updated, but we cannot guarantee completeness and accuracy."
    }
  }
}
```

**Acceptance Criteria:**
- [ ] All keys added to both language files
- [ ] Translations accurate and natural
- [ ] No missing keys (check with i18n linter if available)

---

### Task 3: Add Router Route

**File:** `src/router/index.ts`

Add route for Impressum page:

```typescript
{
  path: '/impressum',
  name: 'impressum',
  component: () => import('../views/ImpressumView.vue'),
  meta: {
    title: 'Impressum - Zero Waste Frankfurt',
    description: 'Legal notice and provider information'
  }
}
```

**Also add English alias:**

```typescript
{
  path: '/legal-notice',
  redirect: '/impressum'
}
```

**Acceptance Criteria:**
- [ ] Route accessible at `/impressum`
- [ ] English alias `/legal-notice` redirects correctly
- [ ] Meta tags set for SEO
- [ ] Page loads without errors

---

### Task 4: Update Privacy Policy

**File:** `src/views/PrivacyView.vue` (or create if doesn't exist)

**Add section about Ko-fi data processing:**

```markdown
## External Payment Processing / Zahlungsabwicklung durch Dritte

This website uses Ko-fi (Ko-fi Labs Limited, UK) to accept voluntary support and donations. When you use Ko-fi:

- You will be redirected to Ko-fi's website (ko-fi.com)
- Ko-fi processes your payment information (credit card, PayPal, etc.)
- We receive only your name, email (if you choose to provide), and donation amount
- Ko-fi has its own Privacy Policy: https://ko-fi.com/privacy
- Ko-fi may use cookies and tracking on their platform
- We do not store or process payment information directly

For more information about how Ko-fi processes your data, please refer to their Privacy Policy.

---

Diese Website nutzt Ko-fi (Ko-fi Labs Limited, UK) um freiwillige Unterstützung und Spenden zu empfangen. Wenn Sie Ko-fi nutzen:

- Werden Sie auf die Ko-fi-Website (ko-fi.com) weitergeleitet
- Ko-fi verarbeitet Ihre Zahlungsinformationen (Kreditkarte, PayPal, etc.)
- Wir erhalten nur Ihren Namen, E-Mail (falls Sie diese angeben) und den Spendenbetrag
- Ko-fi hat eine eigene Datenschutzerklärung: https://ko-fi.com/privacy
- Ko-fi kann Cookies und Tracking auf ihrer Plattform verwenden
- Wir speichern oder verarbeiten keine Zahlungsinformationen direkt

Weitere Informationen zur Datenverarbeitung durch Ko-fi finden Sie in deren Datenschutzerklärung.
```

**Acceptance Criteria:**
- [ ] Ko-fi section added to Privacy Policy
- [ ] Links to Ko-fi's privacy policy included
- [ ] Bilingual (DE/EN)
- [ ] GDPR-compliant language
- [ ] Clear explanation of data flow

---

### Task 5: Update Footer Links

**File:** `src/components/common/Footer.vue` (or wherever footer is)

**Add Impressum link to footer navigation:**

```vue
<footer class="bg-gray-100 py-6 mt-auto">
  <div class="container mx-auto px-4">
    <nav class="flex flex-wrap justify-center gap-4 text-sm">
      <router-link to="/about" class="hover:text-primary">
        {{ t('footer.about') }}
      </router-link>
      <router-link to="/impressum" class="hover:text-primary">
        {{ t('footer.impressum') }}
      </router-link>
      <router-link to="/privacy" class="hover:text-primary">
        {{ t('footer.privacy') }}
      </router-link>
      <router-link to="/support" class="hover:text-primary">
        ☕ {{ t('footer.support') }}
      </router-link>
      <router-link to="/contact" class="hover:text-primary">
        {{ t('footer.contact') }}
      </router-link>
    </nav>

    <p class="text-center text-xs text-gray-600 mt-4">
      © 2024-{{ new Date().getFullYear() }} Zero Waste Frankfurt
    </p>
  </div>
</footer>
```

**i18n additions:**

```json
// de.json
{
  "footer": {
    "about": "Über uns",
    "impressum": "Impressum",
    "privacy": "Datenschutz",
    "support": "Unterstützen",
    "contact": "Kontakt"
  }
}

// en.json
{
  "footer": {
    "about": "About",
    "impressum": "Legal Notice",
    "privacy": "Privacy",
    "support": "Support",
    "contact": "Contact"
  }
}
```

**Acceptance Criteria:**
- [ ] Impressum link visible in footer
- [ ] Link styled consistently with other footer links
- [ ] Mobile responsive (wraps gracefully)
- [ ] Coffee emoji (☕) on support link for visual consistency

---

### Task 6: Create Privacy Policy Page (if missing)

**Only if `/privacy` route doesn't exist yet**

**File:** `src/views/PrivacyView.vue`

**Basic structure:**

```vue
<template>
  <div class="max-w-4xl mx-auto px-4 py-8 prose prose-sm md:prose-base">
    <h1>{{ t('privacy.title') }}</h1>

    <section>
      <h2>{{ t('privacy.general.title') }}</h2>
      <p>{{ t('privacy.general.content') }}</p>
    </section>

    <!-- Add sections: Data Collection, Supabase, Ko-fi, Cookies, GDPR Rights -->

    <section>
      <h2>{{ t('privacy.kofi.title') }}</h2>
      <p v-html="t('privacy.kofi.content')"></p>
    </section>

    <section>
      <h2>{{ t('privacy.rights.title') }}</h2>
      <p>{{ t('privacy.rights.content') }}</p>
    </section>

    <section>
      <h2>{{ t('privacy.contact.title') }}</h2>
      <p>{{ t('privacy.contact.email') }}: <a :href="`mailto:${SUPPORT_EMAIL}`">{{ SUPPORT_EMAIL }}</a></p>
    </section>
  </div>
</template>
```

**Acceptance Criteria:**
- [ ] Covers: Supabase, Ko-fi, cookies, user rights (GDPR Art. 15-21)
- [ ] Bilingual (DE/EN)
- [ ] Contact email for privacy requests
- [ ] Last updated date shown

---

## ✅ Acceptance Criteria (Phase 1 Complete)

- [ ] Impressum page created and accessible at `/impressum`
- [ ] All required DDG §5 fields present and accurate
- [ ] Privacy Policy updated with Ko-fi section
- [ ] Footer links include Impressum and Support
- [ ] All pages mobile responsive
- [ ] Bilingual support (DE/EN) complete
- [ ] No console errors or warnings
- [ ] All links work (mailto:, internal routes)
- [ ] Passes basic accessibility checks (semantic HTML, contrast)

---

## 🧪 Testing Checklist

**Manual Testing:**

- [ ] Visit `/impressum` - page loads correctly
- [ ] Verify all address information displays correctly
- [ ] Click email link - opens mail client with correct address
- [ ] Test language switching (DE ↔ EN)
- [ ] Check footer links work on all pages
- [ ] Mobile: Footer wraps gracefully, all links tappable
- [ ] Privacy page mentions Ko-fi data processing

**Regression Testing:**

- [ ] Existing routes still work
- [ ] Navigation still functional
- [ ] No broken links in footer
- [ ] i18n doesn't break on other pages

---

## 📦 Deliverables

1. `src/views/ImpressumView.vue` - New Impressum page
2. `src/views/PrivacyView.vue` - Updated/created Privacy Policy
3. `src/router/index.ts` - Routes for Impressum and Privacy
4. `src/locales/de.json` - German translations
5. `src/locales/en.json` - English translations
6. `src/components/common/Footer.vue` - Updated footer with new links

---

## 🚀 Next Steps

After Phase 1 is complete and tested:

→ **Proceed to Phase 2: Ko-fi Integration & UI**

Phase 2 will add:
- Ko-fi button integration
- Coffee emoji in header (Zero Waste Frankfurt ☕)
- `/support` page with messaging
- Footer support link (already added in Phase 1)

---

## 📝 Notes

**Variable Replacement:**

Before implementation, replace all `{{VARIABLE}}` placeholders:

```bash
IMPRESSUM_NAME="Zero Waste Frankfurt"  # Or your name
IMPRESSUM_ADDRESS="[Address from Online-Impressum.de]"
IMPRESSUM_CITY="[City from virtual address]"
IMPRESSUM_ZIP="[ZIP from virtual address]"
SUPPORT_EMAIL="hello@zerowastefrankfurt.de"  # Or your email
```

**Important:** Never commit sensitive personal information to git. Consider using environment variables:

```typescript
// src/config/impressum.ts
export const IMPRESSUM_CONFIG = {
  name: import.meta.env.VITE_IMPRESSUM_NAME || 'Zero Waste Frankfurt',
  address: import.meta.env.VITE_IMPRESSUM_ADDRESS,
  city: import.meta.env.VITE_IMPRESSUM_CITY,
  zip: import.meta.env.VITE_IMPRESSUM_ZIP,
  email: import.meta.env.VITE_SUPPORT_EMAIL
}
```

Then add to `.env`:

```bash
VITE_IMPRESSUM_NAME="Zero Waste Frankfurt"
VITE_IMPRESSUM_ADDRESS="..."
VITE_IMPRESSUM_CITY="..."
VITE_IMPRESSUM_ZIP="..."
VITE_SUPPORT_EMAIL="..."
```

And `.env` to `.gitignore` (should already be there).

---

**Legal Disclaimer:**

This plan provides technical implementation guidance. It is NOT legal advice. For legal certainty:
- Consult a German lawyer specializing in internet law
- Have your Impressum and Privacy Policy reviewed
- Ensure compliance with current DDG, DSGVO (GDPR), and TTDSG requirements

**Useful Resources:**
- [eRecht24 Impressum Generator](https://www.e-recht24.de/impressum-generator.html) (German)
- [Datenschutz-Generator](https://datenschutz-generator.de/) (Privacy Policy, German)
- [GDPR Privacy Policy Template](https://gdpr.eu/privacy-notice/)
