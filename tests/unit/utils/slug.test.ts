import { describe, it, expect } from 'vitest'
import { generateSlug, slugify, generateRandomSuffix } from '@/utils/slug'

describe('slugify', () => {
  describe('basic transformations', () => {
    it('converts to lowercase', () => {
      expect(slugify('Hello World')).toBe('hello-world')
    })

    it('replaces spaces with hyphens', () => {
      expect(slugify('hello world')).toBe('hello-world')
    })

    it('removes leading and trailing hyphens', () => {
      expect(slugify('  hello world  ')).toBe('hello-world')
      expect(slugify('--hello--')).toBe('hello')
    })

    it('collapses multiple hyphens', () => {
      expect(slugify('hello   world')).toBe('hello-world')
      expect(slugify('hello---world')).toBe('hello-world')
    })

    it('removes special characters', () => {
      expect(slugify('hello@world!')).toBe('hello-world')
      expect(slugify('hello & world')).toBe('hello-world')
    })

    it('preserves numbers', () => {
      expect(slugify('Test 123')).toBe('test-123')
      expect(slugify('2024 Edition')).toBe('2024-edition')
    })
  })

  describe('German characters', () => {
    it('converts ä to ae', () => {
      expect(slugify('Bäckerei')).toBe('baeckerei')
      expect(slugify('BÄCKEREI')).toBe('baeckerei')
    })

    it('converts ö to oe', () => {
      expect(slugify('Schön')).toBe('schoen')
      expect(slugify('SCHÖN')).toBe('schoen')
    })

    it('converts ü to ue', () => {
      expect(slugify('Müller')).toBe('mueller')
      expect(slugify('MÜLLER')).toBe('mueller')
    })

    it('converts ß to ss', () => {
      expect(slugify('Straße')).toBe('strasse')
      expect(slugify('Fußball')).toBe('fussball')
    })

    it('handles multiple German characters', () => {
      expect(slugify('Grüße aus München')).toBe('gruesse-aus-muenchen')
      expect(slugify('Größe')).toBe('groesse')
    })
  })

  describe('diacritics and accents', () => {
    it('removes French accents', () => {
      expect(slugify('Café')).toBe('cafe')
      expect(slugify('résumé')).toBe('resume')
      expect(slugify('naïve')).toBe('naive')
    })

    it('removes Spanish accents', () => {
      expect(slugify('señor')).toBe('senor')
      expect(slugify('niño')).toBe('nino')
    })

    it('removes other diacritics', () => {
      expect(slugify('piñata')).toBe('pinata')
      expect(slugify('crème brûlée')).toBe('creme-brulee')
    })
  })

  describe('real-world location names', () => {
    it('handles "Repair Café Bockenheim"', () => {
      expect(slugify('Repair Café Bockenheim')).toBe('repair-cafe-bockenheim')
    })

    it('handles "Unverpackt-Laden Frankfurt"', () => {
      expect(slugify('Unverpackt-Laden Frankfurt')).toBe('unverpackt-laden-frankfurt')
    })

    it('handles "Bäckerei Müller & Söhne"', () => {
      expect(slugify('Bäckerei Müller & Söhne')).toBe('baeckerei-mueller-soehne')
    })

    it('handles "Bio-Markt am Römerberg"', () => {
      expect(slugify('Bio-Markt am Römerberg')).toBe('bio-markt-am-roemerberg')
    })

    it('handles city names', () => {
      expect(slugify('Frankfurt am Main')).toBe('frankfurt-am-main')
      expect(slugify('Offenbach am Main')).toBe('offenbach-am-main')
      expect(slugify('Bad Homburg vor der Höhe')).toBe('bad-homburg-vor-der-hoehe')
    })
  })

  describe('edge cases', () => {
    it('handles empty string', () => {
      expect(slugify('')).toBe('')
    })

    it('handles string with only special characters', () => {
      expect(slugify('!@#$%')).toBe('')
    })

    it('handles string with only spaces', () => {
      expect(slugify('   ')).toBe('')
    })

    it('handles mixed case with special chars', () => {
      expect(slugify('HeLLo WoRLD!!!')).toBe('hello-world')
    })
  })
})

describe('generateRandomSuffix', () => {
  it('generates a 6-character string', () => {
    const suffix = generateRandomSuffix()
    expect(suffix).toHaveLength(6)
  })

  it('generates alphanumeric characters only', () => {
    const suffix = generateRandomSuffix()
    expect(suffix).toMatch(/^[a-z0-9]+$/)
  })

  it('generates different values on each call', () => {
    const suffixes = new Set<string>()
    for (let i = 0; i < 100; i++) {
      suffixes.add(generateRandomSuffix())
    }
    // With 100 calls, we should have at least 95 unique values
    expect(suffixes.size).toBeGreaterThan(95)
  })
})

describe('generateSlug', () => {
  it('combines name and city with random suffix', () => {
    const slug = generateSlug('Test Shop', 'Frankfurt')
    expect(slug).toMatch(/^test-shop-frankfurt-[a-z0-9]{6}$/)
  })

  it('handles German characters in name and city', () => {
    const slug = generateSlug('Bäckerei Müller', 'Frankfurt am Main')
    expect(slug).toMatch(/^baeckerei-mueller-frankfurt-am-main-[a-z0-9]{6}$/)
  })

  it('handles the original broken example correctly', () => {
    const slug = generateSlug('Repair Café Bockenheim', 'Frankfurt am Main')
    expect(slug).toMatch(/^repair-cafe-bockenheim-frankfurt-am-main-[a-z0-9]{6}$/)
  })

  it('generates unique slugs for same input', () => {
    const slug1 = generateSlug('Test', 'City')
    const slug2 = generateSlug('Test', 'City')
    expect(slug1).not.toBe(slug2)
  })

  describe('city duplication prevention', () => {
    it('avoids duplication when name ends with city', () => {
      const slug = generateSlug('Tegut | Bad Soden am Taunus', 'Bad Soden am Taunus')
      expect(slug).toMatch(/^tegut-bad-soden-am-taunus-[a-z0-9]{6}$/)
      expect(slug).not.toContain('bad-soden-am-taunus-bad-soden-am-taunus')
    })

    it('avoids duplication when name contains city with different formatting', () => {
      const slug = generateSlug('Alnatura | Eschborn', 'Eschborn')
      expect(slug).toMatch(/^alnatura-eschborn-[a-z0-9]{6}$/)
    })

    it('still appends city when name does not end with it', () => {
      const slug = generateSlug('Repair Café Bockenheim', 'Frankfurt am Main')
      expect(slug).toMatch(/^repair-cafe-bockenheim-frankfurt-am-main-[a-z0-9]{6}$/)
    })

    it('handles empty city gracefully', () => {
      const slug = generateSlug('Test Shop', '')
      expect(slug).toMatch(/^test-shop-[a-z0-9]{6}$/)
    })
  })

  describe('suffix reliability', () => {
    it('always generates exactly 6-character suffix', () => {
      // Run many times to catch edge cases
      for (let i = 0; i < 100; i++) {
        const slug = generateSlug('Test', 'City')
        const suffix = slug.split('-').pop()
        expect(suffix).toHaveLength(6)
      }
    })

    it('never ends with a hyphen', () => {
      for (let i = 0; i < 100; i++) {
        const slug = generateSlug('Test', 'City')
        expect(slug.endsWith('-')).toBe(false)
      }
    })
  })
})
