interface SeoOptions {
  title?: string
  description?: string
  image?: string
  url?: string
}

export function useSeo(options: SeoOptions = {}) {
  // SEO disabled for now - will be enabled in production build
  // Unhead v2 requires different setup
  const title = options.title || 'Zero Waste Frankfurt - Nachhaltig einkaufen'

  // Just update document title for now
  if (typeof document !== 'undefined' && title) {
    document.title = title
  }
}
