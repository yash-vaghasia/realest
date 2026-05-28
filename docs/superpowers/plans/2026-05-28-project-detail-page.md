# Project Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public-facing `/projects/[slug]` page with inline JSON-LD, revalidation hooks, and a lead-form stub — Phase 2.1 + 2.2 + 2.3 of [PLAN.md](../../../PLAN.md) shipped together.

**Architecture:** Server Components render every section from the Payload Local API with explicit `depth` + `select`. Logic lives in `src/lib/*.ts` (testable). Layout primitives live in `src/components/layout/`, listing sections in `src/components/listing/`, Lexical rendering in `src/components/lexical/`. The only client component is `StickyMobileCTA.tsx` (IntersectionObserver, never `window.scroll`). JSON-LD is inlined server-side. Revalidation runs in collection `afterChange` / `afterDelete` hooks.

**Tech Stack:** Next.js 15 App Router, React 19, Payload 3.45, Tailwind 3, `@phosphor-icons/react`, `@tailwindcss/typography`, `@payloadcms/richtext-lexical/react`, Vitest (new — for the four logic units that are non-obvious to get right).

**Authoritative spec:** [2026-05-28-project-detail-page-design.md](../specs/2026-05-28-project-detail-page-design.md). When this plan and the spec disagree, the spec wins.

**Brand guardrails:** [CLAUDE.md](../../../CLAUDE.md) — locked palette (no other colors), single shadow, 6/8 radii, no carousels for critical content, no gradients, no stacked shadows, no emoji icons, no banned copy ("dream home", "world-class", etc.), zero em-dashes in any user-visible string.

---

## Task 1: Install dependencies + wire global config

**Files:**
- Modify: `package.json` (deps + scripts)
- Modify: `tailwind.config.ts` (add typography plugin)
- Modify: `next.config.mjs` (add R2 `remotePatterns`)
- Create: `vitest.config.ts`

- [ ] **Step 1: Install dependencies**

```bash
pnpm add @phosphor-icons/react @tailwindcss/typography
pnpm add -D vitest @vitejs/plugin-react jsdom
```

- [ ] **Step 2: Add scripts to `package.json`**

In `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Wire typography plugin in `tailwind.config.ts`**

Add `import typography from '@tailwindcss/typography'` at the top, then `plugins: [typography]` at the bottom, replacing the empty `plugins: []`.

- [ ] **Step 4: Add R2 `remotePatterns` in `next.config.mjs`**

```js
// next.config.mjs
const r2Public = process.env.R2_PUBLIC_BASE_URL
const r2Host = r2Public ? new URL(r2Public).hostname : undefined

const nextConfig = {
  experimental: { reactCompiler: true },
  images: {
    remotePatterns: r2Host
      ? [{ protocol: 'https', hostname: r2Host }]
      : [],
  },
}

export default nextConfig
```

(Existing experimental `reactCompiler` flag must be preserved.)

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
})
```

- [ ] **Step 6: Run typecheck to confirm config compiles**

```bash
pnpm typecheck
```
Expected: clean exit. If `next.config.mjs` references `process.env` issue, ensure parsing happens at runtime.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml tailwind.config.ts next.config.mjs vitest.config.ts
git commit -m "chore: add phosphor + typography + vitest, wire R2 remotePatterns"
```

---

## Task 2: `src/lib/indian-numerals.ts` — INR formatter (TDD)

**Files:**
- Create: `src/lib/indian-numerals.ts`
- Test: `tests/lib/indian-numerals.test.ts`

INR formatter that maps a raw integer (`95_00_000`) to display strings (`₹95 L`, `₹2.5 Cr`, `₹1.45 Cr`). Indian conventions, NOT US (`95L` not `9.5M`).

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/indian-numerals.test.ts
import { describe, it, expect } from 'vitest'
import { formatINRShort, formatINRFull } from '@/lib/indian-numerals'

describe('formatINRShort', () => {
  it('renders lakhs', () => {
    expect(formatINRShort(95_00_000)).toBe('₹95 L')
    expect(formatINRShort(75_00_000)).toBe('₹75 L')
  })
  it('renders crores with one decimal when not whole', () => {
    expect(formatINRShort(1_25_00_000)).toBe('₹1.25 Cr')
    expect(formatINRShort(1_45_00_000)).toBe('₹1.45 Cr')
    expect(formatINRShort(7_50_00_000)).toBe('₹7.5 Cr')
  })
  it('renders whole crores without decimal', () => {
    expect(formatINRShort(2_00_00_000)).toBe('₹2 Cr')
  })
  it('rounds lakhs to integer', () => {
    expect(formatINRShort(95_50_000)).toBe('₹96 L')
  })
  it('handles null', () => {
    expect(formatINRShort(null)).toBe('')
    expect(formatINRShort(undefined)).toBe('')
  })
})

describe('formatINRFull', () => {
  it('renders Indian-grouped numerals', () => {
    expect(formatINRFull(1_25_00_000)).toBe('₹1,25,00,000')
    expect(formatINRFull(95_00_000)).toBe('₹95,00,000')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/lib/indian-numerals.test.ts
```
Expected: FAIL with "Cannot find module '@/lib/indian-numerals'".

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/indian-numerals.ts
const LAKH = 100_000
const CRORE = 100 * LAKH

export function formatINRShort(inr: number | null | undefined): string {
  if (inr == null || Number.isNaN(inr)) return ''
  if (inr >= CRORE) {
    const cr = inr / CRORE
    const rounded = Math.round(cr * 100) / 100
    return `₹${Number.isInteger(rounded) ? rounded : rounded.toString().replace(/0+$/, '').replace(/\.$/, '')} Cr`
  }
  const lakhs = Math.round(inr / LAKH)
  return `₹${lakhs} L`
}

export function formatINRFull(inr: number | null | undefined): string {
  if (inr == null || Number.isNaN(inr)) return ''
  return `₹${inr.toLocaleString('en-IN')}`
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/lib/indian-numerals.test.ts
```
Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/indian-numerals.ts tests/lib/indian-numerals.test.ts
git commit -m "feat(lib): Indian INR formatter (lakh/crore)"
```

---

## Task 3: `src/lib/jsonld.ts` — JSON-LD builders + `[SEED]` filter (TDD, CRITICAL)

**Files:**
- Create: `src/lib/jsonld.ts`
- Test: `tests/lib/jsonld.test.ts`

Three builders: `realEstateListing`, `faqPage`, `breadcrumbList`. The brand-integrity guard lives here: `[SEED]`-prefixed RERA numbers MUST NOT appear in `RealEstateListing.additionalProperty`. Tests enforce this.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/jsonld.test.ts
import { describe, it, expect } from 'vitest'
import { realEstateListing, faqPage, breadcrumbList } from '@/lib/jsonld'

const baseProject = {
  name: 'Lodha Park',
  slug: 'lodha-park-worli',
  price_from_inr: 7_50_00_000,
  price_to_inr: 22_00_00_000,
  rera_number: 'P51800067890',
  rera_authority: 'maharera' as const,
  hero_image: null,
  status: 'new_launch' as const,
  configurations: [
    { bhk: '3 BHK', carpet_sqft: 1450 },
    { bhk: '4 BHK', carpet_sqft: 2100 },
  ],
}
const city = { name: 'Mumbai', slug: 'mumbai' }
const locality = { name: 'Worli', slug: 'worli' }
const builder = { name: 'Lodha', slug: 'lodha' }

const ctx = { siteUrl: 'https://realest.co.in', project: baseProject, city, locality, builder }

describe('realEstateListing JSON-LD', () => {
  it('emits @type, name, url, offers', () => {
    const ld = realEstateListing(ctx)
    expect(ld['@type']).toBe('RealEstateListing')
    expect(ld.name).toBe('Lodha Park')
    expect(ld.url).toBe('https://realest.co.in/projects/lodha-park-worli')
    expect(ld.offers.priceCurrency).toBe('INR')
    expect(ld.offers.lowPrice).toBe(7_50_00_000)
    expect(ld.offers.highPrice).toBe(22_00_00_000)
  })

  it('emits real RERA in additionalProperty', () => {
    const ld = realEstateListing(ctx)
    const rera = ld.additionalProperty.find((p) => p.name === 'RERA')
    expect(rera).toBeTruthy()
    expect(rera!.value).toBe('P51800067890')
  })

  it('OMITS [SEED]-prefixed RERA from additionalProperty (brand-integrity guard)', () => {
    const seeded = { ...ctx, project: { ...baseProject, rera_number: '[SEED] P51800067890' } }
    const ld = realEstateListing(seeded)
    const rera = ld.additionalProperty.find((p) => p.name === 'RERA')
    expect(rera).toBeUndefined()
  })

  it('omits image when hero_image is null', () => {
    const ld = realEstateListing(ctx)
    expect(ld.image).toBeUndefined()
  })
})

describe('faqPage JSON-LD', () => {
  it('renders mainEntity from faqs array', () => {
    const ld = faqPage([
      { question: 'When is possession?', answer: 'Dec 2028.' },
      { question: 'RERA?', answer: 'Yes.' },
    ])
    expect(ld['@type']).toBe('FAQPage')
    expect(ld.mainEntity).toHaveLength(2)
    expect(ld.mainEntity[0].name).toBe('When is possession?')
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe('Dec 2028.')
  })

  it('returns null for empty faqs', () => {
    expect(faqPage([])).toBeNull()
  })
})

describe('breadcrumbList JSON-LD', () => {
  it('lists Home > City > Locality > Project with positions', () => {
    const ld = breadcrumbList(ctx)
    expect(ld['@type']).toBe('BreadcrumbList')
    expect(ld.itemListElement).toHaveLength(4)
    expect(ld.itemListElement[0].name).toBe('Home')
    expect(ld.itemListElement[1].name).toBe('Mumbai')
    expect(ld.itemListElement[2].name).toBe('Worli')
    expect(ld.itemListElement[3].name).toBe('Lodha Park')
    expect(ld.itemListElement[3].position).toBe(4)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/lib/jsonld.test.ts
```
Expected: FAIL with "Cannot find module '@/lib/jsonld'".

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/jsonld.ts
type City = { name: string; slug: string }
type Locality = { name: string; slug: string }
type Builder = { name: string; slug: string }
type Configuration = { bhk: string; carpet_sqft?: number | null }
type Project = {
  name: string
  slug: string
  status: 'pre_launch' | 'new_launch' | 'under_construction'
  price_from_inr: number
  price_to_inr?: number | null
  rera_number?: string | null
  rera_authority?: string | null
  hero_image?: { url?: string; width?: number; height?: number } | null
  configurations?: Configuration[] | null
}

export type LdContext = {
  siteUrl: string
  project: Project
  city: City
  locality: Locality
  builder: Builder
}

const SEED_PREFIX = '[SEED]'

export function realEstateListing(ctx: LdContext) {
  const { siteUrl, project, city, locality, builder } = ctx
  const url = `${siteUrl}/projects/${project.slug}`

  const additionalProperty: Array<{ '@type': 'PropertyValue'; name: string; value: string | number }> = []
  if (project.rera_number && !project.rera_number.startsWith(SEED_PREFIX)) {
    additionalProperty.push({ '@type': 'PropertyValue', name: 'RERA', value: project.rera_number })
  }
  for (const c of project.configurations ?? []) {
    additionalProperty.push({ '@type': 'PropertyValue', name: 'Configuration', value: c.bhk })
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: project.name,
    url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: locality.name,
      addressRegion: city.name,
      addressCountry: 'IN',
    },
    brand: { '@type': 'Organization', name: builder.name },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: project.price_from_inr,
      highPrice: project.price_to_inr ?? project.price_from_inr,
    },
    image: project.hero_image?.url
      ? { '@type': 'ImageObject', url: project.hero_image.url, width: project.hero_image.width, height: project.hero_image.height }
      : undefined,
    additionalProperty,
  }
}

export function faqPage(faqs: Array<{ question: string; answer: string }>) {
  if (!faqs || faqs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

export function breadcrumbList(ctx: LdContext) {
  const { siteUrl, project, city, locality } = ctx
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: city.name, item: `${siteUrl}/${city.slug}` },
      { '@type': 'ListItem', position: 3, name: locality.name, item: `${siteUrl}/${city.slug}/${locality.slug}` },
      { '@type': 'ListItem', position: 4, name: project.name, item: `${siteUrl}/projects/${project.slug}` },
    ],
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/lib/jsonld.test.ts
```
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/jsonld.ts tests/lib/jsonld.test.ts
git commit -m "feat(lib): JSON-LD builders with [SEED] RERA guard"
```

---

## Task 4: `src/lib/intro-template.ts` — 50-word answer-first block (TDD)

**Files:**
- Create: `src/lib/intro-template.ts`
- Test: `tests/lib/intro-template.test.ts`

Templated 50-word block under H1. Vary sentence shape by status. Cap at 50 words by construction (not by truncation).

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/intro-template.test.ts
import { describe, it, expect } from 'vitest'
import { buildIntro } from '@/lib/intro-template'

const seed = {
  name: 'Godrej Hill Retreat',
  status: 'pre_launch' as const,
  city: 'Navi Mumbai',
  locality: 'Kharghar',
  builder: 'Godrej Properties',
  price_from_inr: 95_00_000,
  configurations: [{ bhk: '1 BHK' }, { bhk: '2 BHK' }],
  possession_target: { month: '3', year: 2030 },
}

describe('buildIntro', () => {
  it('mentions name, locality, city, builder, price-from', () => {
    const s = buildIntro(seed)
    expect(s).toContain('Godrej Hill Retreat')
    expect(s).toContain('Kharghar')
    expect(s).toContain('Navi Mumbai')
    expect(s).toContain('Godrej Properties')
    expect(s).toContain('₹95 L')
  })

  it('caps at 50 words', () => {
    const s = buildIntro(seed)
    expect(s.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(50)
  })

  it('reads with pre-launch language for pre_launch status', () => {
    const s = buildIntro(seed)
    expect(s.toLowerCase()).toContain('pre-launch')
  })

  it('reads with new-launch language for new_launch status', () => {
    const s = buildIntro({ ...seed, status: 'new_launch' })
    expect(s.toLowerCase()).toContain('new launch')
  })

  it('reads with under-construction language', () => {
    const s = buildIntro({ ...seed, status: 'under_construction' })
    expect(s.toLowerCase()).toContain('under construction')
  })

  it('does not contain em-dash or en-dash characters', () => {
    const s = buildIntro(seed)
    expect(s).not.toMatch(/[—–]/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/lib/intro-template.test.ts
```
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/intro-template.ts
import { formatINRShort } from '@/lib/indian-numerals'

type Status = 'pre_launch' | 'new_launch' | 'under_construction'

type IntroInput = {
  name: string
  status: Status
  city: string
  locality: string
  builder: string
  price_from_inr: number
  configurations: Array<{ bhk: string }>
  possession_target?: { month?: string | null; year?: number | null } | null
}

const STATUS_LABEL: Record<Status, string> = {
  pre_launch: 'pre-launch',
  new_launch: 'new launch',
  under_construction: 'under construction',
}

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatPossession(p: IntroInput['possession_target']): string | null {
  if (!p?.year) return null
  const m = p.month && Number(p.month) >= 1 && Number(p.month) <= 12 ? MONTH_NAMES[Number(p.month)] : null
  return m ? `${m} ${p.year}` : `${p.year}`
}

function bhkSummary(configs: Array<{ bhk: string }>): string {
  const labels = configs.map((c) => c.bhk.replace(/\s*BHK\s*$/i, '')).filter(Boolean)
  if (labels.length === 0) return 'apartments'
  if (labels.length === 1) return `${labels[0]} BHK apartments`
  if (labels.length === 2) return `${labels[0]} and ${labels[1]} BHK apartments`
  return `${labels.slice(0, -1).join(', ')} and ${labels.slice(-1)[0]} BHK apartments`
}

export function buildIntro(p: IntroInput): string {
  const statusLabel = STATUS_LABEL[p.status]
  const possession = formatPossession(p.possession_target)
  const bhks = bhkSummary(p.configurations)
  const price = formatINRShort(p.price_from_inr)
  const possessionClause = possession ? `, possession targeted ${possession}` : ''
  return `${p.name} is a ${statusLabel} residential project in ${p.locality}, ${p.city}, by ${p.builder}. ${bhks} from ${price}${possessionClause}. MahaRERA registered.`
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/lib/intro-template.test.ts
```
Expected: 6 passed. Word count assert is the tightest — if you change the template, re-run.

- [ ] **Step 5: Commit**

```bash
git add src/lib/intro-template.ts tests/lib/intro-template.test.ts
git commit -m "feat(lib): 50-word answer-first intro template"
```

---

## Task 5: `src/lib/similar-projects.ts` + `revalidate.ts` + `payload-client.ts` (light tests)

**Files:**
- Create: `src/lib/payload-client.ts`
- Create: `src/lib/similar-projects.ts`
- Create: `src/lib/revalidate.ts`
- Test: `tests/lib/similar-projects.test.ts`

`payload-client.ts` is a thin server-only wrapper around `getPayload({ config })` with memoization (`'use server'` is unnecessary; we just want one Payload instance per server process). `similar-projects.ts` queries 3 by locality then falls back to builder. `revalidate.ts` exposes `revalidateProject(project)` used by collection hooks.

- [ ] **Step 1: Write `payload-client.ts`**

```ts
// src/lib/payload-client.ts
import { getPayload } from 'payload'
import config from '@/payload.config'

let cached: Awaited<ReturnType<typeof getPayload>> | null = null

export async function getPayloadClient() {
  if (cached) return cached
  cached = await getPayload({ config })
  return cached
}
```

- [ ] **Step 2: Write the failing test for similar-projects**

```ts
// tests/lib/similar-projects.test.ts
import { describe, it, expect, vi } from 'vitest'
import { pickSimilar } from '@/lib/similar-projects'

const p = (id: number, locality: number, builder: number) => ({ id, locality, builder, slug: `p${id}` })

describe('pickSimilar', () => {
  it('picks up to 3 from same locality first', () => {
    const current = p(1, 10, 100)
    const pool = [p(2, 10, 200), p(3, 10, 200), p(4, 10, 200), p(5, 11, 100)]
    const out = pickSimilar(current, pool)
    expect(out.map((x) => x.id)).toEqual([2, 3, 4])
  })

  it('falls back to same builder when locality is sparse', () => {
    const current = p(1, 10, 100)
    const pool = [p(2, 10, 200), p(5, 11, 100), p(6, 12, 100)]
    const out = pickSimilar(current, pool)
    expect(out.map((x) => x.id)).toEqual([2, 5, 6])
  })

  it('caps at 3', () => {
    const current = p(1, 10, 100)
    const pool = [p(2, 10, 100), p(3, 10, 100), p(4, 10, 100), p(5, 10, 100)]
    expect(pickSimilar(current, pool)).toHaveLength(3)
  })

  it('excludes the current project', () => {
    const current = p(1, 10, 100)
    const pool = [current, p(2, 10, 200)]
    expect(pickSimilar(current, pool).map((x) => x.id)).toEqual([2])
  })

  it('returns [] when no candidates', () => {
    expect(pickSimilar(p(1, 10, 100), [])).toEqual([])
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm test tests/lib/similar-projects.test.ts
```
Expected: FAIL.

- [ ] **Step 4: Write `similar-projects.ts`**

```ts
// src/lib/similar-projects.ts
import { getPayloadClient } from '@/lib/payload-client'

type ProjectLite = { id: number | string; locality: number | string; builder: number | string; slug: string }

export function pickSimilar<T extends ProjectLite>(current: T, pool: T[]): T[] {
  const filtered = pool.filter((p) => p.id !== current.id)
  const sameLocality = filtered.filter((p) => p.locality === current.locality)
  const sameBuilder = filtered.filter((p) => p.builder === current.builder && p.locality !== current.locality)
  return [...sameLocality, ...sameBuilder].slice(0, 3)
}

export async function fetchSimilarProjects(currentSlug: string, localityId: number | string, builderId: number | string) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'projects',
    where: {
      and: [
        { slug: { not_equals: currentSlug } },
        { published: { equals: true } },
        { or: [{ locality: { equals: localityId } }, { builder: { equals: builderId } }] },
      ],
    },
    depth: 1,
    limit: 12,
  })
  return result.docs
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm test tests/lib/similar-projects.test.ts
```
Expected: 5 passed.

- [ ] **Step 6: Write `revalidate.ts`**

```ts
// src/lib/revalidate.ts
import { revalidatePath } from 'next/cache'

type RefSlug = { slug?: string | null } | string | number | null | undefined

function slugOf(ref: RefSlug): string | null {
  if (ref == null) return null
  if (typeof ref === 'string' || typeof ref === 'number') return null
  return ref.slug ?? null
}

export function revalidateProject(project: {
  slug: string
  city?: RefSlug
  locality?: RefSlug
  builder?: RefSlug
}) {
  revalidatePath(`/projects/${project.slug}`)
  const citySlug = slugOf(project.city)
  const localitySlug = slugOf(project.locality)
  const builderSlug = slugOf(project.builder)
  if (citySlug) revalidatePath(`/${citySlug}`)
  if (citySlug && localitySlug) revalidatePath(`/${citySlug}/${localitySlug}`)
  if (builderSlug) revalidatePath(`/builders/${builderSlug}`)
}
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/payload-client.ts src/lib/similar-projects.ts src/lib/revalidate.ts tests/lib/similar-projects.test.ts
git commit -m "feat(lib): payload client + similar-projects + revalidate helpers"
```

---

## Task 6: `src/components/lexical/RichTextRender.tsx`

**Files:**
- Create: `src/components/lexical/RichTextRender.tsx`

Renders Lexical content using Payload's React serializer, wrapped with brand-tinted `prose` classes.

- [ ] **Step 1: Write the component**

```tsx
// src/components/lexical/RichTextRender.tsx
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { RichText } from '@payloadcms/richtext-lexical/react'

type Props = {
  data: SerializedEditorState | null | undefined
  className?: string
}

export function RichTextRender({ data, className }: Props) {
  if (!data) return null
  return (
    <div
      className={
        'prose prose-ink max-w-prose ' +
        'prose-headings:font-display prose-headings:text-ink ' +
        'prose-p:font-body prose-p:text-ink prose-li:text-ink ' +
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline ' +
        (className ?? '')
      }
    >
      <RichText data={data} />
    </div>
  )
}
```

- [ ] **Step 2: Add a brand `prose` variant in `tailwind.config.ts`**

Append to `theme.extend`:

```ts
typography: () => ({
  ink: {
    css: {
      '--tw-prose-body': '#1A1A1A',
      '--tw-prose-headings': '#1A1A1A',
      '--tw-prose-links': '#0032FF',
      '--tw-prose-bold': '#1A1A1A',
      '--tw-prose-quotes': '#1A1A1A',
      '--tw-prose-quote-borders': '#0032FF',
      '--tw-prose-bullets': '#6B7280',
      '--tw-prose-counters': '#6B7280',
    },
  },
}),
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/lexical/RichTextRender.tsx tailwind.config.ts
git commit -m "feat(lexical): RichTextRender with brand prose variant"
```

---

## Task 7: UI primitives — `StatusPill`, `ReraBadge`, `Breadcrumb`

**Files:**
- Create: `src/components/listing/StatusPill.tsx`
- Create: `src/components/listing/ReraBadge.tsx`
- Create: `src/components/listing/Breadcrumb.tsx`

Three small server components used in multiple sections.

- [ ] **Step 1: Write `StatusPill.tsx`**

```tsx
// src/components/listing/StatusPill.tsx
type Status = 'pre_launch' | 'new_launch' | 'under_construction'

const LABEL: Record<Status, string> = {
  pre_launch: 'Pre-launch',
  new_launch: 'New launch',
  under_construction: 'Under construction',
}

const CLASS: Record<Status, string> = {
  pre_launch: 'bg-urgency/10 text-ink border-l-2 border-urgency',
  new_launch: 'bg-primary text-white',
  under_construction: 'bg-ink-muted/15 text-ink',
}

export function StatusPill({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center rounded-btn px-2 py-0.5 font-body text-sm ${CLASS[status]}`}>
      {LABEL[status]}
    </span>
  )
}
```

- [ ] **Step 2: Write `ReraBadge.tsx`**

```tsx
// src/components/listing/ReraBadge.tsx
import { Check } from '@phosphor-icons/react/dist/ssr'

export function ReraBadge({ reraNumber, authority = 'maharera' }: { reraNumber: string; authority?: string }) {
  const authorityLabel = authority === 'maharera' ? 'MahaRERA' : authority.toUpperCase()
  return (
    <span className="inline-flex items-center gap-1 rounded-btn bg-success/10 px-2 py-0.5 font-body text-sm text-success">
      <Check size={14} weight="bold" aria-hidden="true" />
      <span className="sr-only">{authorityLabel} registered: </span>
      <span>{reraNumber}</span>
    </span>
  )
}
```

- [ ] **Step 3: Write `Breadcrumb.tsx`**

```tsx
// src/components/listing/Breadcrumb.tsx
import Link from 'next/link'

type Crumb = { label: string; href?: string }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-5xl px-2 py-3">
      <ol className="flex flex-wrap items-center gap-1 font-body text-sm text-ink-muted">
        {items.map((c, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={c.label} className="flex items-center gap-1">
              {c.href && !isLast ? (
                <Link href={c.href} className="hover:text-ink">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'text-ink' : ''}>
                  {c.label}
                </span>
              )}
              {!isLast && <span aria-hidden="true">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
```

- [ ] **Step 4: Typecheck**

```bash
pnpm typecheck
```
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/listing/StatusPill.tsx src/components/listing/ReraBadge.tsx src/components/listing/Breadcrumb.tsx
git commit -m "feat(listing): StatusPill + ReraBadge + Breadcrumb primitives"
```

---

## Task 8: Layout shell — `Header`, `Footer`, update `(public)/layout.tsx`

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/Footer.tsx`
- Modify: `src/app/(public)/layout.tsx`

- [ ] **Step 1: Write `Header.tsx`**

```tsx
// src/components/layout/Header.tsx
import Link from 'next/link'
import Image from 'next/image'

export function Header() {
  return (
    <header className="border-b border-ink/8 bg-bg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-2 py-2">
        <Link href="/" className="flex items-center gap-1" aria-label="Realest home">
          <Image src="/logo/logo-Default.svg" alt="Realest" width={112} height={28} priority />
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-3 font-body text-sm">
            <li><Link href="/projects" className="text-ink hover:text-primary">Projects</Link></li>
            <li><Link href="/builders" className="text-ink hover:text-primary">Builders</Link></li>
            <li><Link href="/about" className="text-ink hover:text-primary">About</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Write `Footer.tsx`**

```tsx
// src/components/layout/Footer.tsx
import Link from 'next/link'

export function Footer() {
  const reraAgent = process.env.MAHARERA_AGENT_REG_NO
  return (
    <footer className="border-t border-ink/8 bg-bg">
      <div className="mx-auto max-w-5xl px-2 py-6 font-body text-sm text-ink-muted">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p>© Realest. Verified new-launch, pre-launch, and under-construction property.</p>
          <ul className="flex gap-3">
            <li><Link href="/about" className="hover:text-ink">About</Link></li>
            <li><Link href="/privacy" className="hover:text-ink">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-ink">Terms</Link></li>
          </ul>
        </div>
        {reraAgent && (
          <p className="mt-3 text-xs">
            MahaRERA Agent Registration No: <span className="text-ink">{reraAgent}</span>
          </p>
        )}
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Update `src/app/(public)/layout.tsx`**

Replace the `<body>` block:

```tsx
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

// ... (existing imports, fonts, metadata)

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${switzer.variable} ${generalSans.variable}`}>
      <body className="flex min-h-[100dvh] flex-col">
        <a href="#main" className="skip-link">Skip to main content</a>
        <Header />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Header.tsx src/components/layout/Footer.tsx src/app/(public)/layout.tsx
git commit -m "feat(layout): minimal Header + Footer, env-gated MahaRERA line"
```

---

## Task 9: `ProjectHero.tsx`

**Files:**
- Create: `src/components/listing/ProjectHero.tsx`

Server component. Handles both variants: image-split (when `hero_image` present) and typographic-only (when null).

- [ ] **Step 1: Write the component**

```tsx
// src/components/listing/ProjectHero.tsx
import Image from 'next/image'
import { StatusPill } from './StatusPill'
import { ReraBadge } from './ReraBadge'
import { formatINRShort } from '@/lib/indian-numerals'

type Status = 'pre_launch' | 'new_launch' | 'under_construction'

type HeroProject = {
  name: string
  status: Status
  rera_number?: string | null
  rera_authority?: string | null
  price_from_inr: number
  possession_target?: { month?: string | null; year?: number | null } | null
  hero_image?: { url: string; width: number; height: number; alt?: string | null } | null
}

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function possessionLabel(p: HeroProject['possession_target']): string | null {
  if (!p?.year) return null
  const m = p.month ? MONTHS[Number(p.month)] : null
  return m ? `Possession ${m} ${p.year}` : `Possession ${p.year}`
}

type Props = {
  project: HeroProject
  locality: { name: string; slug: string }
  city: { name: string; slug: string }
  builder: { name: string; slug: string }
}

export function ProjectHero({ project, locality, city, builder }: Props) {
  const possession = possessionLabel(project.possession_target)
  const hasImage = project.hero_image?.url

  return (
    <section className="mx-auto max-w-5xl px-2 pt-6 md:pt-8">
      <div className={hasImage ? 'grid gap-4 md:grid-cols-2 md:items-center' : 'flex flex-col gap-3'}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={project.status} />
            {project.rera_number && (
              <ReraBadge reraNumber={project.rera_number} authority={project.rera_authority ?? 'maharera'} />
            )}
            {possession && <span className="font-body text-sm text-ink-muted">{possession}</span>}
          </div>
          <h1 className="font-display text-h1-mobile sm:text-h1 text-ink">{project.name}</h1>
          <p className="font-display text-h3-mobile sm:text-h3 text-ink-muted">
            {locality.name} · {city.name} · by {builder.name}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="font-display font-semibold text-ink">From {formatINRShort(project.price_from_inr)}</span>
            <a
              href="#lead-form"
              className="inline-flex items-center rounded-btn bg-primary px-3 py-2 font-display font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              Request callback
            </a>
          </div>
        </div>
        {hasImage && project.hero_image && (
          <div className="overflow-hidden rounded-card">
            <Image
              src={project.hero_image.url}
              alt={project.hero_image.alt ?? `${project.name} hero`}
              width={project.hero_image.width}
              height={project.hero_image.height}
              priority
              className="h-auto w-full"
            />
          </div>
        )}
      </div>
      <div id="hero-end" aria-hidden="true" />
    </section>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/components/listing/ProjectHero.tsx
git commit -m "feat(listing): ProjectHero with image-split + typographic-fallback variants"
```

---

## Task 10: `KeyFactsTable.tsx` + `ConfigurationsTable.tsx`

**Files:**
- Create: `src/components/listing/KeyFactsTable.tsx`
- Create: `src/components/listing/ConfigurationsTable.tsx`

- [ ] **Step 1: Write `KeyFactsTable.tsx`**

```tsx
// src/components/listing/KeyFactsTable.tsx
import Link from 'next/link'
import { StatusPill } from './StatusPill'

type Row = { label: string; value: React.ReactNode }

type Props = {
  status: 'pre_launch' | 'new_launch' | 'under_construction'
  rera_number?: string | null
  rera_authority?: string | null
  possession?: string | null
  total_units?: number | null
  towers?: number | null
  builder: { name: string; slug: string }
  locality: { name: string; slug: string }
  city: { name: string; slug: string }
}

export function KeyFactsTable(p: Props) {
  const authorityLabel = (p.rera_authority ?? 'maharera') === 'maharera' ? 'MahaRERA' : p.rera_authority!.toUpperCase()
  const rows: Row[] = [
    { label: 'Status', value: <StatusPill status={p.status} /> },
    { label: authorityLabel, value: p.rera_number ?? '-' },
    { label: 'Possession', value: p.possession ?? '-' },
    { label: 'Total units', value: p.total_units ?? '-' },
    { label: 'Towers', value: p.towers ?? '-' },
    {
      label: 'Builder',
      value: <Link href={`/builders/${p.builder.slug}`} className="text-primary hover:underline">{p.builder.name}</Link>,
    },
    {
      label: 'Locality',
      value: <Link href={`/${p.city.slug}/${p.locality.slug}`} className="text-primary hover:underline">{p.locality.name}, {p.city.name}</Link>,
    },
  ]

  return (
    <section className="mx-auto max-w-5xl px-2 py-6">
      <h2 className="font-display text-h3-mobile sm:text-h3 text-ink">Key facts</h2>
      <dl className="mt-3 grid grid-cols-1 md:grid-cols-2 divide-y divide-ink/8 md:divide-y-0 md:gap-y-0">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-2 py-2 md:border-b md:border-ink/8">
            <dt className="font-body text-sm text-ink-muted">{r.label}</dt>
            <dd className="font-body text-sm text-ink text-right">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
```

- [ ] **Step 2: Write `ConfigurationsTable.tsx`**

```tsx
// src/components/listing/ConfigurationsTable.tsx
import { formatINRShort } from '@/lib/indian-numerals'

type Config = {
  bhk: string
  carpet_sqft?: number | null
  super_sqft?: number | null
  price_inr?: number | null
  units_available?: number | null
}

export function ConfigurationsTable({ configurations }: { configurations: Config[] }) {
  if (!configurations?.length) return null
  return (
    <section className="mx-auto max-w-5xl px-2 py-6">
      <h2 className="font-display text-h3-mobile sm:text-h3 text-ink">Configurations</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-ink/8 text-left text-ink-muted">
              <th className="py-2 pr-3 font-medium">Configuration</th>
              <th className="py-2 pr-3 font-medium">Carpet area</th>
              <th className="py-2 pr-3 font-medium">Super area</th>
              <th className="py-2 pr-3 font-medium">Price</th>
              <th className="py-2 font-medium">Available</th>
            </tr>
          </thead>
          <tbody>
            {configurations.map((c, i) => (
              <tr key={i} className="border-b border-ink/8 last:border-0 text-ink">
                <td className="py-2 pr-3 font-medium">{c.bhk}</td>
                <td className="py-2 pr-3">{c.carpet_sqft ? `${c.carpet_sqft} sqft` : '-'}</td>
                <td className="py-2 pr-3">{c.super_sqft ? `${c.super_sqft} sqft` : '-'}</td>
                <td className="py-2 pr-3">{c.price_inr ? formatINRShort(c.price_inr) : '-'}</td>
                <td className="py-2">{c.units_available ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add src/components/listing/KeyFactsTable.tsx src/components/listing/ConfigurationsTable.tsx
git commit -m "feat(listing): KeyFactsTable + ConfigurationsTable"
```

---

## Task 11: `AmenitiesGrid.tsx` + `FloorPlans.tsx` + `Gallery.tsx`

**Files:**
- Create: `src/components/listing/AmenitiesGrid.tsx`
- Create: `src/components/listing/FloorPlans.tsx`
- Create: `src/components/listing/Gallery.tsx`

- [ ] **Step 1: Write `AmenitiesGrid.tsx`**

```tsx
// src/components/listing/AmenitiesGrid.tsx
type Amenity = { id: number | string; name: string; slug: string }

export function AmenitiesGrid({ amenities }: { amenities: Amenity[] }) {
  if (!amenities?.length) return null
  return (
    <section className="mx-auto max-w-5xl px-2 py-6">
      <h2 className="font-display text-h3-mobile sm:text-h3 text-ink">Amenities</h2>
      <ul className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {amenities.map((a) => (
          <li key={a.id} className="rounded-card bg-white p-3 shadow-card font-body text-sm text-ink">
            {a.name}
          </li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 2: Write `FloorPlans.tsx`**

```tsx
// src/components/listing/FloorPlans.tsx
import Image from 'next/image'

type Plan = { id: number | string; url: string; alt?: string | null; width?: number; height?: number; mimeType?: string }

export function FloorPlans({ plans }: { plans: Plan[] }) {
  if (!plans?.length) return null
  return (
    <section className="mx-auto max-w-5xl px-2 py-6">
      <h2 className="font-display text-h3-mobile sm:text-h3 text-ink">Floor plans</h2>
      <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {plans.map((p) => {
          const isPdf = p.mimeType?.includes('pdf')
          return (
            <li key={p.id} className="rounded-card bg-white p-2 shadow-card">
              {isPdf ? (
                <a href={p.url} className="block font-body text-sm text-primary hover:underline" target="_blank" rel="noopener">
                  Download floor plan (PDF)
                </a>
              ) : (
                <Image
                  src={p.url}
                  alt={p.alt ?? 'Floor plan'}
                  width={p.width ?? 800}
                  height={p.height ?? 600}
                  className="h-auto w-full rounded-card"
                />
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
```

- [ ] **Step 3: Write `Gallery.tsx` (scroll-snap row, NOT a carousel)**

```tsx
// src/components/listing/Gallery.tsx
import Image from 'next/image'

type Img = { id: number | string; url: string; alt?: string | null; width: number; height: number }

export function Gallery({ images }: { images: Img[] }) {
  if (!images?.length) return null
  return (
    <section className="mx-auto max-w-5xl px-2 py-6">
      <h2 className="font-display text-h3-mobile sm:text-h3 text-ink">Gallery</h2>
      <ul className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2">
        {images.map((img) => (
          <li key={img.id} className="snap-start shrink-0">
            <Image
              src={img.url}
              alt={img.alt ?? ''}
              width={img.width}
              height={img.height}
              className="h-56 w-auto rounded-card"
              loading="lazy"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm typecheck
git add src/components/listing/AmenitiesGrid.tsx src/components/listing/FloorPlans.tsx src/components/listing/Gallery.tsx
git commit -m "feat(listing): AmenitiesGrid + FloorPlans + Gallery (scroll-snap, not carousel)"
```

---

## Task 12: `LocalityContext.tsx` + `LeadForm.tsx`

**Files:**
- Create: `src/components/listing/LocalityContext.tsx`
- Create: `src/components/listing/LeadForm.tsx`
- Create: `src/app/(public)/_actions/submit-lead.ts` (stub)

- [ ] **Step 1: Write `LocalityContext.tsx`**

```tsx
// src/components/listing/LocalityContext.tsx
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { RichTextRender } from '@/components/lexical/RichTextRender'

type Props = {
  localityName: string
  blurb: SerializedEditorState | null | undefined
}

export function LocalityContext({ localityName, blurb }: Props) {
  if (!blurb) return null
  return (
    <section className="mx-auto max-w-5xl px-2 py-6">
      <h2 className="font-display text-h3-mobile sm:text-h3 text-ink">About {localityName}</h2>
      <div className="mt-3">
        <RichTextRender data={blurb} />
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Write stub server action `src/app/(public)/_actions/submit-lead.ts`**

```ts
// src/app/(public)/_actions/submit-lead.ts
'use server'

export async function submitLeadStub(_formData: FormData) {
  // Phase 5.2 wires this to Payload Local API with overrideAccess.
  console.log('[lead stub]', Object.fromEntries(_formData.entries()))
  return { ok: true, message: "Thanks. We will call back shortly." }
}
```

- [ ] **Step 3: Write `LeadForm.tsx`**

```tsx
// src/components/listing/LeadForm.tsx
'use client'

import { useState } from 'react'
import { submitLeadStub } from '@/app/(public)/_actions/submit-lead'

type Props = { projectName: string; projectId: number | string; sourceUrl: string }

export function LeadForm({ projectName, projectId, sourceUrl }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('loading')
    try {
      const data = new FormData(e.currentTarget)
      const res = await submitLeadStub(data)
      setMessage(res.message)
      setState('success')
    } catch {
      setMessage('Something went wrong. Please try again.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <section id="lead-form" className="mx-auto max-w-5xl px-2 py-6">
        <div className="rounded-card bg-white p-4 shadow-card">
          <p className="font-display font-semibold text-ink">{message}</p>
          <p className="mt-1 font-body text-sm text-ink-muted">A Realest team member will call you about {projectName}.</p>
        </div>
      </section>
    )
  }

  return (
    <section id="lead-form" className="mx-auto max-w-5xl px-2 py-6">
      <h2 className="font-display text-h3-mobile sm:text-h3 text-ink">Request a callback</h2>
      <form onSubmit={onSubmit} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2" aria-live="polite">
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="source_url" value={sourceUrl} />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="font-body text-sm text-ink">Name</label>
          <input id="name" name="name" required className="rounded-btn border border-ink/15 px-2 py-2 font-body text-ink" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="font-body text-sm text-ink">Phone</label>
          <input id="phone" name="phone" type="tel" required pattern="[0-9 +-]{7,16}" className="rounded-btn border border-ink/15 px-2 py-2 font-body text-ink" />
        </div>
        <div className="flex flex-col gap-1 md:col-span-2">
          <label htmlFor="email" className="font-body text-sm text-ink">Email <span className="text-ink-muted">(optional)</span></label>
          <input id="email" name="email" type="email" className="rounded-btn border border-ink/15 px-2 py-2 font-body text-ink" />
        </div>
        <div className="flex flex-col gap-1 md:col-span-2">
          <label htmlFor="message" className="font-body text-sm text-ink">Message <span className="text-ink-muted">(optional)</span></label>
          <textarea id="message" name="message" rows={3} className="rounded-btn border border-ink/15 px-2 py-2 font-body text-ink" />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={state === 'loading'}
            className="inline-flex items-center rounded-btn bg-primary px-3 py-2 font-display font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {state === 'loading' ? 'Sending...' : 'Request callback'}
          </button>
          {state === 'error' && <p className="mt-2 font-body text-sm text-urgency">{message}</p>}
        </div>
      </form>
    </section>
  )
}
```

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm typecheck
git add src/components/listing/LocalityContext.tsx src/components/listing/LeadForm.tsx src/app/(public)/_actions/submit-lead.ts
git commit -m "feat(listing): LocalityContext + LeadForm (stubbed submit)"
```

---

## Task 13: `ProjectCard.tsx` + `SimilarProjects.tsx` + `RelatedLinks.tsx`

**Files:**
- Create: `src/components/listing/ProjectCard.tsx`
- Create: `src/components/listing/SimilarProjects.tsx`
- Create: `src/components/listing/RelatedLinks.tsx`

- [ ] **Step 1: Write `ProjectCard.tsx`**

```tsx
// src/components/listing/ProjectCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import { StatusPill } from './StatusPill'
import { formatINRShort } from '@/lib/indian-numerals'

type Status = 'pre_launch' | 'new_launch' | 'under_construction'

export type ProjectCardData = {
  slug: string
  name: string
  status: Status
  price_from_inr: number
  hero_image?: { url: string; width: number; height: number; alt?: string | null } | null
  locality: { name: string; slug: string }
  city: { name: string; slug: string }
  builder: { name: string }
}

export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block overflow-hidden rounded-card bg-white shadow-card transition-transform hover:-translate-y-px"
    >
      <div className="relative aspect-[16/9] bg-ink/5">
        {project.hero_image?.url ? (
          <Image
            src={project.hero_image.url}
            alt={project.hero_image.alt ?? project.name}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3">
            <span className="font-display text-lg font-semibold text-ink">{project.name}</span>
          </div>
        )}
        <div className="absolute left-2 top-2"><StatusPill status={project.status} /></div>
      </div>
      <div className="p-3">
        <h3 className="font-display font-semibold text-ink">{project.name}</h3>
        <p className="mt-1 font-body text-sm text-ink-muted">{project.locality.name} · {project.city.name} · by {project.builder.name}</p>
        <p className="mt-1 font-display font-semibold text-ink">From {formatINRShort(project.price_from_inr)}</p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Write `SimilarProjects.tsx`**

```tsx
// src/components/listing/SimilarProjects.tsx
import { ProjectCard, type ProjectCardData } from './ProjectCard'

export function SimilarProjects({ projects }: { projects: ProjectCardData[] }) {
  if (!projects?.length) return null
  return (
    <section className="mx-auto max-w-5xl px-2 py-6">
      <h2 className="font-display text-h3-mobile sm:text-h3 text-ink">Similar projects</h2>
      <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        {projects.map((p) => (
          <li key={p.slug}><ProjectCard project={p} /></li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 3: Write `RelatedLinks.tsx`**

```tsx
// src/components/listing/RelatedLinks.tsx
import Link from 'next/link'

type Props = {
  city: { name: string; slug: string }
  locality: { name: string; slug: string }
  builder: { name: string; slug: string }
  possessionYear?: number | null
}

export function RelatedLinks({ city, locality, builder, possessionYear }: Props) {
  const links = [
    { label: city.name, href: `/${city.slug}` },
    { label: locality.name, href: `/${city.slug}/${locality.slug}` },
    { label: `by ${builder.name}`, href: `/builders/${builder.slug}` },
  ]
  if (possessionYear) {
    links.push({ label: `Possession ${possessionYear}`, href: `/projects` })
  }
  return (
    <section className="mx-auto max-w-5xl px-2 py-6">
      <h2 className="sr-only">Related links</h2>
      <p className="font-body text-sm text-ink-muted">
        {links.map((l, i) => (
          <span key={l.href}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            <Link href={l.href} className="text-primary hover:underline">{l.label}</Link>
          </span>
        ))}
      </p>
    </section>
  )
}
```

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm typecheck
git add src/components/listing/ProjectCard.tsx src/components/listing/SimilarProjects.tsx src/components/listing/RelatedLinks.tsx
git commit -m "feat(listing): ProjectCard (shared) + SimilarProjects + RelatedLinks"
```

---

## Task 14: `ProjectFAQ.tsx` (native `<details>` accordion)

**Files:**
- Create: `src/components/listing/ProjectFAQ.tsx`
- Modify: `src/app/(public)/globals.css` (add `interpolate-size` rule)

- [ ] **Step 1: Add `interpolate-size` to `globals.css`**

Append inside `@layer base`:

```css
:root {
  interpolate-size: allow-keywords;
}
```

- [ ] **Step 2: Write `ProjectFAQ.tsx`**

```tsx
// src/components/listing/ProjectFAQ.tsx
import { CaretDown } from '@phosphor-icons/react/dist/ssr'

type FAQ = { question: string; answer: string }

export function ProjectFAQ({ faqs }: { faqs: FAQ[] }) {
  if (!faqs?.length) return null
  return (
    <section className="mx-auto max-w-5xl px-2 py-6">
      <h2 className="font-display text-h3-mobile sm:text-h3 text-ink">Frequently asked</h2>
      <div className="mt-3 divide-y divide-ink/8 border-y border-ink/8">
        {faqs.map((f) => (
          <details key={f.question} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 font-display font-semibold text-ink">
              <span>{f.question}</span>
              <CaretDown
                size={18}
                weight="bold"
                className="shrink-0 transition-transform duration-150 ease-out group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="pb-3 font-body text-ink">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add src/components/listing/ProjectFAQ.tsx src/app/(public)/globals.css
git commit -m "feat(listing): ProjectFAQ accordion (native <details>)"
```

---

## Task 15: `StickyMobileCTA.tsx` (`'use client'`, IntersectionObserver)

**Files:**
- Create: `src/components/listing/StickyMobileCTA.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/listing/StickyMobileCTA.tsx
'use client'

import { useEffect, useState } from 'react'

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const heroEnd = document.getElementById('hero-end')
    const leadForm = document.getElementById('lead-form')
    if (!heroEnd || !leadForm) return

    let pastHero = false
    let atForm = false
    const update = () => setVisible(pastHero && !atForm)

    const heroObs = new IntersectionObserver(
      ([entry]) => {
        pastHero = !entry.isIntersecting && entry.boundingClientRect.top < 0
        update()
      },
      { threshold: 0 },
    )
    const formObs = new IntersectionObserver(
      ([entry]) => {
        atForm = entry.isIntersecting
        update()
      },
      { threshold: 0.1 },
    )
    heroObs.observe(heroEnd)
    formObs.observe(leadForm)
    return () => {
      heroObs.disconnect()
      formObs.disconnect()
    }
  }, [])

  return (
    <aside
      aria-label="Quick contact"
      data-visible={visible}
      className={
        'fixed inset-x-0 bottom-0 z-40 border-t border-ink/8 bg-white shadow-card md:hidden ' +
        'pb-[max(env(safe-area-inset-bottom),12px)] ' +
        'transition-[opacity,transform] duration-200 ease-out ' +
        'translate-y-2 opacity-0 data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 ' +
        'motion-reduce:transition-none'
      }
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-2 py-2">
        <span className="font-body text-sm text-ink-muted">Interested?</span>
        <a
          href="#lead-form"
          className="inline-flex items-center rounded-btn bg-primary px-3 py-2 font-display font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          Request callback
        </a>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add src/components/listing/StickyMobileCTA.tsx
git commit -m "feat(listing): StickyMobileCTA via IntersectionObserver"
```

---

## Task 16: `not-found.tsx` + the page orchestrator `page.tsx`

**Files:**
- Create: `src/app/(public)/projects/[slug]/not-found.tsx`
- Create: `src/app/(public)/projects/[slug]/page.tsx`

- [ ] **Step 1: Write `not-found.tsx`**

```tsx
// src/app/(public)/projects/[slug]/not-found.tsx
import Link from 'next/link'

export default function ProjectNotFound() {
  return (
    <section className="mx-auto max-w-prose px-2 py-12">
      <h1 className="font-display text-h2-mobile sm:text-h2 text-ink">We couldn&apos;t find that project</h1>
      <p className="mt-3 font-body text-ink-muted">It may have been removed, renamed, or not yet published.</p>
      <p className="mt-3"><Link href="/projects" className="text-primary hover:underline">See all projects</Link></p>
    </section>
  )
}
```

- [ ] **Step 2: Write `page.tsx`**

```tsx
// src/app/(public)/projects/[slug]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload-client'
import { realEstateListing, faqPage, breadcrumbList } from '@/lib/jsonld'
import { buildIntro } from '@/lib/intro-template'
import { fetchSimilarProjects, pickSimilar } from '@/lib/similar-projects'
import { Breadcrumb } from '@/components/listing/Breadcrumb'
import { ProjectHero } from '@/components/listing/ProjectHero'
import { KeyFactsTable } from '@/components/listing/KeyFactsTable'
import { ConfigurationsTable } from '@/components/listing/ConfigurationsTable'
import { AmenitiesGrid } from '@/components/listing/AmenitiesGrid'
import { FloorPlans } from '@/components/listing/FloorPlans'
import { Gallery } from '@/components/listing/Gallery'
import { RichTextRender } from '@/components/lexical/RichTextRender'
import { LocalityContext } from '@/components/listing/LocalityContext'
import { LeadForm } from '@/components/listing/LeadForm'
import { SimilarProjects } from '@/components/listing/SimilarProjects'
import { RelatedLinks } from '@/components/listing/RelatedLinks'
import { ProjectFAQ } from '@/components/listing/ProjectFAQ'
import { StickyMobileCTA } from '@/components/listing/StickyMobileCTA'

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

type RouteParams = { params: Promise<{ slug: string }> }

async function loadProject(slug: string) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'projects',
    where: { and: [{ slug: { equals: slug } }, { published: { equals: true } }] },
    depth: 2,
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'projects',
    where: { published: { equals: true } },
    depth: 0,
    limit: 1000,
    pagination: false,
  })
  return result.docs.map((d: { slug: string }) => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params
  const project = await loadProject(slug)
  if (!project) return {}
  const title = project.seo?.meta_title ?? `${project.name} - ${project.locality?.name ?? ''}`
  const description = project.seo?.meta_description ?? `New launch by ${project.builder?.name} in ${project.locality?.name}. RERA registered.`
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/projects/${project.slug}` },
  }
}

function possessionLabel(p: { month?: string | null; year?: number | null } | null | undefined): string | null {
  if (!p?.year) return null
  const m = p.month ? MONTHS[Number(p.month)] : null
  return m ? `${m} ${p.year}` : `${p.year}`
}

export default async function ProjectPage({ params }: RouteParams) {
  const { slug } = await params
  const project = await loadProject(slug)
  if (!project) notFound()

  const city = project.city as { name: string; slug: string }
  const locality = project.locality as { name: string; slug: string; blurb?: any }
  const builder = project.builder as { name: string; slug: string }

  const ldCtx = { siteUrl: SITE_URL, project, city, locality, builder }
  const ld = [
    realEstateListing(ldCtx),
    faqPage(project.faqs ?? []),
    breadcrumbList(ldCtx),
  ].filter(Boolean)

  const intro = buildIntro({
    name: project.name,
    status: project.status,
    city: city.name,
    locality: locality.name,
    builder: builder.name,
    price_from_inr: project.price_from_inr,
    configurations: project.configurations ?? [],
    possession_target: project.possession_target,
  })

  const pool = await fetchSimilarProjects(project.slug, locality.id, builder.id)
  const similar = pickSimilar({ ...project, locality: locality.id, builder: builder.id }, pool.map((p: any) => ({
    ...p,
    locality: typeof p.locality === 'object' ? p.locality.id : p.locality,
    builder: typeof p.builder === 'object' ? p.builder.id : p.builder,
  }))) as any[]

  const heroImage = project.hero_image && typeof project.hero_image === 'object'
    ? { url: project.hero_image.url, width: project.hero_image.width, height: project.hero_image.height, alt: project.hero_image.alt }
    : null

  return (
    <>
      {ld.map((json, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
      ))}

      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: city.name, href: `/${city.slug}` },
          { label: locality.name, href: `/${city.slug}/${locality.slug}` },
          { label: project.name },
        ]}
      />

      <ProjectHero
        project={{ ...project, hero_image: heroImage }}
        city={city}
        locality={locality}
        builder={builder}
      />

      <section className="mx-auto max-w-5xl px-2 py-4">
        <p className="font-body text-ink max-w-prose">{intro}</p>
      </section>

      <KeyFactsTable
        status={project.status}
        rera_number={project.rera_number}
        rera_authority={project.rera_authority}
        possession={possessionLabel(project.possession_target)}
        total_units={project.total_units}
        towers={project.towers}
        builder={builder}
        locality={locality}
        city={city}
      />

      <ConfigurationsTable configurations={project.configurations ?? []} />

      <AmenitiesGrid amenities={(project.amenities ?? []) as any[]} />

      <FloorPlans plans={(project.floor_plans ?? []).map((p: any) => ({ id: p.id, url: p.url, alt: p.alt, width: p.width, height: p.height, mimeType: p.mimeType }))} />

      <Gallery images={(project.gallery ?? []).map((g: any) => ({ id: g.id, url: g.url, alt: g.alt, width: g.width, height: g.height }))} />

      {project.description && (
        <section className="mx-auto max-w-5xl px-2 py-6">
          <RichTextRender data={project.description} />
        </section>
      )}

      <LocalityContext localityName={locality.name} blurb={locality.blurb ?? null} />

      <LeadForm projectName={project.name} projectId={project.id} sourceUrl={`${SITE_URL}/projects/${project.slug}`} />

      <SimilarProjects
        projects={similar.map((p): any => ({
          slug: p.slug,
          name: p.name,
          status: p.status,
          price_from_inr: p.price_from_inr,
          hero_image: typeof p.hero_image === 'object' && p.hero_image
            ? { url: p.hero_image.url, width: p.hero_image.width, height: p.hero_image.height, alt: p.hero_image.alt }
            : null,
          locality: typeof p.locality === 'object' ? p.locality : { name: locality.name, slug: locality.slug },
          city: typeof p.city === 'object' ? p.city : { name: city.name, slug: city.slug },
          builder: typeof p.builder === 'object' ? { name: p.builder.name } : { name: builder.name },
        }))}
      />

      <RelatedLinks
        city={city}
        locality={locality}
        builder={builder}
        possessionYear={project.possession_target?.year ?? null}
      />

      <ProjectFAQ faqs={project.faqs ?? []} />

      <StickyMobileCTA />
    </>
  )
}

export const dynamicParams = true
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```
Expected: clean. If Payload Local API result types complain about untyped relationship docs, narrow with `as` where the page uses concrete shapes — this is acceptable at the page orchestrator layer.

- [ ] **Step 4: Commit**

```bash
git add src/app/(public)/projects/[slug]/page.tsx src/app/(public)/projects/[slug]/not-found.tsx
git commit -m "feat(projects): page orchestrator + JSON-LD + not-found"
```

---

## Task 17: Revalidation hooks on collections

**Files:**
- Modify: `src/collections/projects.ts`
- Modify: `src/collections/builders.ts`
- Modify: `src/collections/cities.ts`
- Modify: `src/collections/localities.ts`

Each collection adds `afterChange` and `afterDelete` hooks calling `revalidateProject` from `src/lib/revalidate.ts`. For builders/cities/localities, we additionally re-query their dependent projects and revalidate each.

- [ ] **Step 1: Update `src/collections/projects.ts`** — append to `hooks`:

```ts
import { revalidateProject } from '@/lib/revalidate'

// inside Projects: ...
hooks: {
  beforeChange: [setBudgetBand, setPublishedAt],
  afterChange: [
    ({ doc }) => {
      revalidateProject({
        slug: doc.slug,
        city: typeof doc.city === 'object' ? doc.city : null,
        locality: typeof doc.locality === 'object' ? doc.locality : null,
        builder: typeof doc.builder === 'object' ? doc.builder : null,
      })
    },
  ],
  afterDelete: [
    ({ doc }) => {
      revalidateProject({
        slug: doc.slug,
        city: typeof doc.city === 'object' ? doc.city : null,
        locality: typeof doc.locality === 'object' ? doc.locality : null,
        builder: typeof doc.builder === 'object' ? doc.builder : null,
      })
    },
  ],
},
```

- [ ] **Step 2: Add a generic `revalidateDependentProjects` helper to `revalidate.ts`**

```ts
// append to src/lib/revalidate.ts
import { getPayloadClient } from '@/lib/payload-client'

type DependencyField = 'builder' | 'city' | 'locality'

export async function revalidateDependentProjects(field: DependencyField, id: number | string) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'projects',
    where: { [field]: { equals: id } },
    depth: 1,
    limit: 1000,
    pagination: false,
  })
  for (const doc of result.docs) {
    revalidateProject({
      slug: doc.slug,
      city: typeof doc.city === 'object' ? doc.city : null,
      locality: typeof doc.locality === 'object' ? doc.locality : null,
      builder: typeof doc.builder === 'object' ? doc.builder : null,
    })
  }
}
```

- [ ] **Step 3: Update `builders.ts` / `cities.ts` / `localities.ts`** — add to each:

```ts
import { revalidatePath } from 'next/cache'
import { revalidateDependentProjects } from '@/lib/revalidate'

// inside the collection config:
hooks: {
  afterChange: [
    async ({ doc }) => {
      // revalidate own archive (Phase 3 builds the page; safe to call now)
      // adjust path per collection:
      // builders: `/builders/${doc.slug}`
      // cities:   `/${doc.slug}`
      // localities: needs city.slug too — query if not denormalized
      revalidatePath(`/<ARCHIVE_PATH_FOR_THIS_COLLECTION>`) // see notes below
      await revalidateDependentProjects('<FIELD>', doc.id) // 'builder' | 'city' | 'locality'
    },
  ],
  afterDelete: [
    async ({ doc }) => {
      await revalidateDependentProjects('<FIELD>', doc.id)
    },
  ],
},
```

Per-collection wiring:
- `builders.ts` → `revalidatePath(`/builders/${doc.slug}`)`, `revalidateDependentProjects('builder', doc.id)`.
- `cities.ts` → `revalidatePath(`/${doc.slug}`)`, `revalidateDependentProjects('city', doc.id)`.
- `localities.ts` → look up the city slug via the relationship (`doc.city` may be an id; if so, query the city), then `revalidatePath(`/${citySlug}/${doc.slug}`)` and `revalidateDependentProjects('locality', doc.id)`.

- [ ] **Step 4: Regenerate types + importmap (defensive; required by [[importmap-after-schema-changes]])**

```bash
pnpm generate:types
pnpm generate:importmap
```

- [ ] **Step 5: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/collections src/lib/revalidate.ts src/payload-types.ts
git commit -m "feat(collections): on-demand revalidation hooks for projects + parents"
```

---

## Task 18: Verification — typecheck, lint, build, dev smoke, commit

**Files:** none (verification only).

- [ ] **Step 1: Stop any running dev server** (per [[no-build-during-dev]] memory; `pnpm build` and `pnpm dev` corrupt each other in `.next`).

If a background dev server is running, stop it first.

- [ ] **Step 2: Delete `.next`**

```powershell
Remove-Item -Recurse -Force .next
```

- [ ] **Step 3: Run all three checkpoint commands**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
Expected: all four exit 0.

- [ ] **Step 4: Start dev server and smoke test**

```bash
pnpm dev
```
Then in another shell:

```bash
for slug in lodha-park-worli runwal-gardens-bhandup godrej-hill-retreat-kharghar hiranandani-meadows-kolshet-road; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/projects/$slug" --max-time 90)
  echo "$code  /projects/$slug"
done
curl -s -o /dev/null -w "%{http_code}  /projects/does-not-exist\n" "http://localhost:3000/projects/does-not-exist"
```
Expected: 4 × 200, 1 × 404.

- [ ] **Step 5: Spot-check the typographic-fallback hero**

Open `http://localhost:3000/projects/godrej-hill-retreat-kharghar` in a real browser. Confirm: no broken image icon, pill row + H1 + locality line + price + CTA render cleanly, no horizontal scroll, sticky CTA appears after scrolling past hero.

- [ ] **Step 6: Validate JSON-LD on the page source**

In the browser DevTools Network tab, view the HTML response. Confirm three `<script type="application/ld+json">` blocks. Copy the `RealEstateListing` block to `validator.schema.org` — should validate. Confirm `additionalProperty` does NOT contain a `RERA` entry (all seed projects are `[SEED]`-prefixed).

- [ ] **Step 7: Final commit + push**

```bash
git add -A
git commit -m "chore: Phase 2 verification + checkpoint green" --allow-empty
git push
```

---

## Self-review (run BEFORE handing this plan to an executor)

**Spec coverage** — every spec section mapped:

| Spec § | Plan task |
|---|---|
| 3 anatomy item 1 Breadcrumb | Task 7 + 16 |
| 3 anatomy item 2 Hero | Task 9 |
| 3 anatomy item 3 50-word block | Task 4 + 16 |
| 3 anatomy item 4 Key facts | Task 10 |
| 3 anatomy item 5 Configurations | Task 10 |
| 3 anatomy item 6 Amenities | Task 11 |
| 3 anatomy item 7 Floor plans | Task 11 |
| 3 anatomy item 8 Gallery | Task 11 |
| 3 anatomy item 9 Description + Locality context | Task 6 + 12 + 16 |
| 3 anatomy item 10 Lead form | Task 12 |
| 3 anatomy item 11 Similar projects | Task 13 |
| 3 anatomy item 12 Related links | Task 13 |
| 3 anatomy item 13 FAQ | Task 14 |
| 3 anatomy item 14 Sticky mobile CTA | Task 15 |
| 4 Hero treatments | Task 9 |
| 8 JSON-LD + [SEED] filter | Task 3 (+ Task 16 inlines them) |
| 9 Revalidation | Task 17 |
| 10 Lead form a11y + stub | Task 12 |
| 11 50-word answer-first | Task 4 |
| 12 Configurations table | Task 10 |
| 13 Key facts | Task 10 |
| 14 Similar projects ordering | Task 5 + 13 |
| 15 Related links belt | Task 13 |
| 16.1 ProjectCard | Task 13 |
| 16.2 RichTextRender | Task 6 |
| 17 New deps (Phosphor + typography) | Task 1 |
| 18 `next.config.mjs` remotePatterns | Task 1 |
| 19 Brand + copy rules | Enforced in every component (no em-dashes, locked palette/radii) |
| 20 Acceptance | Task 18 |

**Placeholder scan** — none ("TBD", "TODO", "fill in later" all absent).

**Type consistency** — `ProjectCardData` shape is the single source for `ProjectCard` props (Task 13) used by `SimilarProjects` (Task 13). `LdContext` shape is the single source for JSON-LD builders (Task 3) used by `page.tsx` (Task 16). Naming consistent: `formatINRShort` (Task 2) used in Task 9, 10, 13.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-28-project-detail-page.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
