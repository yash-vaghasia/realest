# Project Detail Page — Phase 2 Design Spec

**Date:** 2026-05-28
**Phase:** 2.1 + 2.2 + 2.3 (shipped together)
**Route:** `/projects/[slug]`
**Authoritative source:** [PLAN.md](../../../PLAN.md) §Phase 2, [CLAUDE.md](../../../CLAUDE.md) — Brand tokens + banned UI habits override design-skill defaults on conflict.

## 1. Purpose

The project detail page is the SEO money page of Realest's public site. It earns long-tail rankings, anchors trust via RERA mapping, and converts buyer interest into a lead row in Payload. This phase ships:

- A static / ISR-rendered page driven by the Payload Local API.
- Inline JSON-LD for `RealEstateListing`, `FAQPage`, `BreadcrumbList`.
- Revalidation hooks on `projects` and its referenced collections.

Lead form markup is rendered but the submit handler is a stub until Phase 5.

## 2. Design read

Trust-first real-estate marketplace, Linear-style clean / utility-credible language. Indian property buyers (Mumbai launch cluster), mobile-first. Brand tokens locked in [CLAUDE.md](../../../CLAUDE.md):

- Primary `#0032FF`, primary-dark `#001A80`, bg `#FAFAFA`, ink `#1A1A1A`, ink-muted `#6B7280`, success `#10B981`, urgency `#F59E0B`.
- Switzer (display) + General Sans (body), single shadow token, 6px buttons / 8px cards, 8px spacing base.

Dials: VARIANCE 5, MOTION 4, DENSITY 5.

## 3. Page anatomy

Top to bottom. Each section is a separate file under `src/components/listing/`.

| # | Section | Conditional | Component |
|---|---|---|---|
| 1 | Breadcrumb | always | `Breadcrumb.tsx` |
| 2 | Hero | always | `ProjectHero.tsx` |
| 3 | Answer-first 50-word block | always | inline in page |
| 4 | Key facts table | always | `KeyFactsTable.tsx` |
| 5 | Configurations table | always | `ConfigurationsTable.tsx` |
| 6 | Amenities grid | `amenities.length > 0` | `AmenitiesGrid.tsx` |
| 7 | Floor plans | `floor_plans.length > 0` | `FloorPlans.tsx` |
| 8 | Gallery | `gallery.length > 0` | `Gallery.tsx` |
| 9 | Description (Lexical) + Locality context | `description` and/or `locality.blurb` present | `RichTextRender.tsx` + `LocalityContext.tsx` |
| 10 | Lead form | always | `LeadForm.tsx` |
| 11 | Similar projects | always (may render 0–3 cards) | `SimilarProjects.tsx` + `ProjectCard.tsx` |
| 12 | Related links belt | always | `RelatedLinks.tsx` |
| 13 | FAQ accordion | `faqs.length > 0` | `ProjectFAQ.tsx` |
| 14 | Sticky mobile CTA | mobile only, after hero | `StickyMobileCTA.tsx` |

Footer is the shared public-layout footer (built in this phase since absent: minimal — logo, RERA disclaimer gated on `MAHARERA_AGENT_REG_NO` env, links). Header is the shared public-layout header (built in this phase since absent: minimal — logo + home link for now). Both are added to the component map (§5) and rendered from `src/app/(public)/layout.tsx`.

## 4. Hero treatments

PLAN.md §2.1 anchors the hero on `image + status pill + RERA badge + name + locality/builder + price-from + lead CTA`. Two variants based on `project.hero_image`:

### 4.1 With `hero_image`

- Desktop (`md+`): `grid-cols-2`. Left column: pill row → H1 → locality/builder → price-from + CTA. Right column: `<Image>` with `priority`, explicit `width`/`height` from Payload media doc (`hero_image.width`, `hero_image.height`), `aspect-[4/3]`, `rounded-card` (`8px`).
- Mobile: image full-width on top (`aspect-[16/9]`), content stacked below in same order.
- Hero top padding: `pt-6 md:pt-8` — under the `pt-24` cap.

### 4.2 Without `hero_image` (typographic fallback)

- Full-width content stack on `bg-bg`. Same content order as 4.1, no image column, no decorative shape.
- The H1 carries the visual weight (Switzer 700, `text-h1-mobile sm:text-h1`).
- This variant must read as intentional — not as "image missing." Generous vertical spacing (`py-8 md:py-12`).

### 4.3 Pill row contents (in order, left to right)

1. **Status pill** — colored by status:
    - `pre_launch` → `bg-urgency/10 text-ink border-l-2 border-urgency` (urgency-as-background, ink-on-bg per CLAUDE.md WCAG rule).
    - `new_launch` → `bg-primary text-white`.
    - `under_construction` → `bg-ink-muted/15 text-ink`.
2. **RERA badge** — `bg-success/10 text-success`, check icon (Phosphor `Check`), RERA number including any `[SEED]` prefix.
3. **Possession label** — `text-ink-muted`, no chip, just text: `Possession Jun 2028`.

Max 4 hero text elements (per design-skill 4.7): (1) pill row, (2) H1, (3) locality/builder line, (4) price + CTA row.

### 4.4 H1, locality, price, CTA

- H1 = `project.name`. Switzer 700, `text-h1-mobile sm:text-h1`. Max 2 lines.
- Locality/builder line = `Worli · Mumbai · by Lodha`. Switzer 500 `text-h3-mobile sm:text-h3 text-ink-muted`.
- Price = `From ₹7.5 Cr` (or `From ₹95 L` etc — Indian numeric formatter). Display 600.
- Primary CTA = `Request callback` button, scrolls to `#lead-form` anchor. `bg-primary text-white rounded-btn px-3 py-2 font-display font-semibold`.

## 5. Component map

```
src/
  app/(public)/projects/[slug]/
    page.tsx                   # orchestrator: fetch + JSON-LD + sections
    not-found.tsx              # 404 for unknown slugs
  components/
    layout/
      Header.tsx               # minimal: logo + home link (rendered from (public)/layout.tsx)
      Footer.tsx               # minimal: logo + MAHARERA disclaimer (env-gated) + links
    listing/
      Breadcrumb.tsx
      ProjectHero.tsx
      StatusPill.tsx
      ReraBadge.tsx
      KeyFactsTable.tsx
      ConfigurationsTable.tsx
      AmenitiesGrid.tsx
      FloorPlans.tsx
      Gallery.tsx
      LocalityContext.tsx      # "About <locality>" block; renders inside section 9 when locality.blurb is present
      LeadForm.tsx
      SimilarProjects.tsx
      ProjectCard.tsx          # SHARED — also used by home / builder / city / locality archives later
      RelatedLinks.tsx
      ProjectFAQ.tsx
      StickyMobileCTA.tsx
    lexical/
      RichTextRender.tsx
  lib/
    payload-client.ts          # getPayload + selective queries
    jsonld.ts                  # RealEstateListing + FAQPage + BreadcrumbList builders
    intro-template.ts          # 50-word answer-first block from project aggregates
    similar-projects.ts        # query: 3 by locality, fallback builder
    revalidate.ts              # revalidatePath helpers
    indian-numerals.ts         # ₹95 L / ₹2.5 Cr formatter
```

`src/lib/payload-client.ts` is the single entrypoint to `getPayload({ config })` from server components. All page reads go through it with explicit `depth` and `select`.

## 6. Sticky mobile CTA

Mounted always (`<aside aria-label="Quick contact">`), opacity-controlled.

- Position: `fixed bottom-0 inset-x-0`, padding includes `pb-[max(env(safe-area-inset-bottom),12px)]` for iOS home-indicator clearance.
- Implementation: `'use client'` leaf. `useRef` on a sentinel element placed at the bottom of `ProjectHero` AND a second sentinel just above `LeadForm`. `IntersectionObserver` watches both: visible when first is OUT of view AND second is NOT yet in view. State controls `data-visible` attribute.
- Motion: `opacity 0 → 1` and `transform: translateY(8px) → 0`. Duration 200ms, `ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`).
- Single button label: `Request callback`. Clicks scroll smooth-to `#lead-form` and focus the first input.
- `prefers-reduced-motion`: instant snap, no transform.
- Hidden at `md+` via Tailwind (`md:hidden`).
- Banned: `window.addEventListener('scroll')`. Mandatory: `IntersectionObserver` per design-skill 5.D.

## 7. FAQ accordion

Native `<details>` per question — zero JS for the open/close mechanic, accessible by default.

- Custom-styled `<summary>` with chevron rotation on `[open]` (CSS only). 150ms `ease-out`.
- Height transition: `interpolate-size: allow-keywords` on `:root` + `transition: block-size 200ms ease-out` on `<details>`. Fallback: no animation in browsers without `interpolate-size` (graceful — Safari support still rolling).
- Multi-open allowed (FAQs are independent).
- `prefers-reduced-motion`: snap, no chevron rotation.
- All questions render in the SSR HTML for SEO; `FAQPage` JSON-LD mirrors them exactly.

## 8. JSON-LD (Phase 2.2)

Inline in server HTML — NOT `<Script strategy="lazyOnload">` (per PLAN.md §2.2 — needed for AEO / Bing crawlers).

Three blocks:

1. **`RealEstateListing`** — `name`, `url`, `address` (locality + city), `image` (only when `hero_image` present), `brand` = Builder, `offers.priceCurrency = INR`, `offers.lowPrice = project.price_from_inr`, `offers.highPrice = project.price_to_inr ?? null`, `additionalProperty` array with `numberOfRooms` per configuration, etc.
2. **`FAQPage`** — `mainEntity` array from `project.faqs[]`.
3. **`BreadcrumbList`** — Home → city → locality → project.

**CRITICAL: `[SEED]` filter.** In `src/lib/jsonld.ts`, when building `RealEstateListing.additionalProperty`, if `project.rera_number?.startsWith('[SEED]')` — OMIT the `RERA` property entirely. The page UI still renders the value visibly (that's the local-dev signal), but seed data must never claim verified compliance in machine-readable structured data. This is a brand-integrity guard. A unit test asserts this.

Validation targets (per PLAN.md §2.2 acceptance):
- `RealEstateListing` validates at `validator.schema.org` (NOT Google's tester — it doesn't recognise the type).
- `BreadcrumbList` passes Google's Rich Results Test.
- `FAQPage` validates structurally — NOT a launch criterion (Google restricts FAQ rich results to government/health).

## 9. Revalidation (Phase 2.3)

In `src/collections/projects.ts`:

- `afterChange` → `revalidatePath('/projects/' + doc.slug)`, `revalidatePath('/' + city.slug)`, `revalidatePath('/' + city.slug + '/' + locality.slug)`, `revalidatePath('/builders/' + builder.slug)`.
- `afterDelete` → same set.

In `src/collections/builders.ts`, `cities.ts`, `localities.ts`:
- `afterChange` / `afterDelete` → revalidate dependent project pages (queried via the relationship index) + own archive.

All revalidation logic in `src/lib/revalidate.ts` to keep collection hooks one-liners.

## 10. Lead form

Phase 2 ships markup + a11y states + the empty/loading/error visuals. Submit handler is a stub — `'use server'` action that just `console.log`s for now. Phase 5.2 wires it to Payload.

- Fields: `name` (required), `phone` (required, India `+91` prefix), `email` (optional), `message` (optional).
- Labels ABOVE inputs (design-skill 4.6). Helper text optional present in markup. Error text BELOW input.
- Inline validation with native `:invalid` + custom error rendering on blur.
- Submit button states: idle / loading (spinner + disabled) / success (replaces form with confirmation block) / error (inline below button).
- `aria-live="polite"` region for state announcements.
- Honeypot: hidden `<input>` named `website` (Phase 5 ignores submissions where this is non-empty).
- Min-fill-time guard: timestamp on mount, reject if submit fires < 30s later (Phase 5 implements).

## 11. 50-word answer-first block

Templated from project aggregates — short paragraph under H1 / above key facts. Example:

> Godrej Hill Retreat is a pre-launch residential project in Kharghar, Navi Mumbai, by Godrej Properties. 1 and 2 BHK apartments from ₹95 L, possession targeted March 2030. MahaRERA registered.

Lives in `src/lib/intro-template.ts`, takes `{ name, status_label, configurations, city, locality, builder, price_from_inr, possession_target }`, returns a string. Capped at 50 words by construction; sentences vary by status (`pre_launch` vs `new_launch` vs `under_construction`).

## 12. Configurations table

Header row: `Configuration · Carpet area · Super area · Price · Units available`.
Body: one row per `project.configurations[]` entry.
Layout: CSS Grid (not `<table>` for mobile readability), `divide-y divide-ink/8` between rows. No `border-t` on every row (design-skill 4.9 ban).
Empty `units_available` shown as `–` (regular hyphen, not em-dash).

## 13. Key facts

2-column grid on `md+`, single-column on mobile. Each row: label (ink-muted) + value (ink). No card boxes.

Rows:
- Status (with pill)
- RERA number + authority
- Possession (`Possession Jun 2028`)
- Total units
- Towers
- Builder (linked to `/builders/<slug>`)
- Locality (linked to `/<city>/<locality>`)

## 14. Similar projects

Query (`src/lib/similar-projects.ts`):
1. Up to 3 projects where `locality === current.locality` AND `id !== current.id` AND `published = true`.
2. If fewer than 3, fill from `builder === current.builder` AND `id !== current.id` AND `published = true`, skipping already-included ids.
3. Cap at 3. If still 0, the section renders nothing (no empty state — this is rare and silent is fine).

Renders `ProjectCard` × N (1, 2, or 3). Single grid row on `md+`, vertical stack on mobile.

## 15. Related links belt

Footer of page content, above the FAQ. Plain text links, separated by `·` (one middle-dot — see design-skill 9.F restriction: max 1 per line). No decorative dots.

Links:
- `<city.name>` → `/<city.slug>`
- `<locality.name>` → `/<city.slug>/<locality.slug>`
- `<builder.name>` → `/builders/<builder.slug>`
- `Possession <year>` → eventual combo URL `/<status>-projects-in-<city>` (Phase 4)

Phase 4 will add combo links here when those routes exist. Phase 2 emits placeholders that resolve to the parent archives.

## 16. Component-level details

### 16.1 `ProjectCard.tsx`

Used here AND in builder / city / locality archives later — single source of truth.

- Image (`hero_image` if present, else solid `bg-ink/5` block with name typesetting fallback).
- Status pill (top-left over image).
- Name (Switzer 600), locality + builder line, price-from.
- Whole card is a link to `/projects/<slug>`.
- `:focus-visible` ring in `bg-primary` (CLAUDE.md a11y).
- Hover: subtle `translateY(-1px)` + shadow opacity bump. 160ms ease-out.

### 16.2 `RichTextRender.tsx`

Wraps `@payloadcms/richtext-lexical/react`'s `RichText` component with:
- Tailwind prose classes for headings, lists, links, blockquote.
- Custom link rendering: external `target="_blank" rel="noopener"`, internal `<Link>`.
- Image rendering via `next/image` with R2 url.

## 17. New dependencies

- `@phosphor-icons/react` — icons (Check, ChevronDown for FAQ, MapPin for locality, etc.). `strokeWidth=1.5` global default. One icon family project-wide (design-skill 3.C).
- `@tailwindcss/typography` — Tailwind prose plugin, used by `RichTextRender.tsx` to style Lexical output (headings, lists, links, blockquote). Configured with a brand-tinted variant in `tailwind.config.ts` (ink for body, primary for links).

Two new dev/runtime deps. Both pinned in package.json.

## 18. Config changes

`next.config.mjs` — add `images.remotePatterns` for the R2 public domain (parsed from `process.env.R2_PUBLIC_BASE_URL`):

```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: new URL(process.env.R2_PUBLIC_BASE_URL).hostname },
  ],
},
```

(Build-time guard: when env is unset, the array is empty — `next/image` `src=...` will throw a clear error pointing at the missing env.)

## 19. Brand + copy rules (enforced inline)

From [CLAUDE.md](../../../CLAUDE.md) + design-skill pre-flight:

- ZERO em-dashes (`—` or `–`) anywhere visible. Headlines, body, alt text, button labels, JSON-LD strings.
- Banned phrases: "dream home", "world-class", "nestled", "luxurious living", "prime location" (without specifics), exclamation marks, ALL-CAPS hype.
- No emoji icons in product UI.
- One accent color (`#0032FF`). No gradients. Single shadow token (`shadow-card`).
- 6px buttons, 8px cards/inputs. No other radii.
- All numbers use Indian numeral formatting (`₹95 L`, `₹2.5 Cr`, `1,25,00,000`).
- Status labels: `Pre-launch`, `New launch`, `Under construction` (sentence case, no ALL-CAPS).

## 20. Acceptance criteria

Combined from [PLAN.md](../../../PLAN.md) §2.1–2.3 + design-skill pre-flight:

**Functional:**
- Page renders for all 4 seed projects.
- Godrej Hill Retreat (no `hero_image`) renders the typographic-fallback hero cleanly.
- Lodha Park (`5cr_plus` band, `new_launch`) renders the image-split hero.
- 50-word answer-first block reads naturally aloud per project.
- Lead form submit reaches the stub action (visible in dev console).
- FAQ accordion opens/closes without JS errors; reduced-motion mode snaps.
- Sticky mobile CTA appears after scrolling past the hero, hides near the lead form.

**SEO / structured data:**
- `RealEstateListing` validates at `validator.schema.org` for every seed project — the structural fields (name/url/address/offers/brand) are valid even when the optional RERA `additionalProperty` is filtered out by the `[SEED]` guard. Re-validate against a real (non-seed) project once one is entered.
- `BreadcrumbList` passes Google Rich Results Test.
- `FAQPage` validates structurally.
- `[SEED]`-prefixed RERA numbers DO NOT appear in `RealEstateListing.additionalProperty`. Unit test asserts this.
- Self-canonical `<link rel="canonical">` on every project page.
- `<link rel="alternate" hreflang="en-IN">` per CLAUDE.md.

**Performance:**
- Lighthouse mobile: Perf ≥ 90, SEO ≥ 95, Accessibility = 100, BP ≥ 95.
- LCP < 2.5s, INP < 200ms, CLS < 0.1.
- No CLS on hero or images (explicit `width`/`height` from Payload media).
- `next/image priority` on hero, lazy elsewhere.

**Revalidation:**
- Editing a project in `/admin` updates the live page within ~2s without redeploy.
- Editing a referenced builder/city/locality re-renders the dependent project pages.

**Code quality:**
- `pnpm typecheck`, `pnpm lint`, `pnpm build` all green.
- New code is in components with single responsibility (per design-skill 3 isolation principle).

## 21. Out of scope (deferred)

- City / locality / builder archive pages (Phase 3).
- Combo pages and the `[...slug]` catch-all (Phase 4).
- Lead form submit handler + email notification (Phase 5).
- `sitemap.xml` / `robots.txt` / `llms.txt` (Phase 6).
- Per-project OG image generation via `next/og` (PLAN.md SKIP v1 — post-Phase 6 polish).
- Search / filters (Postgres `ILIKE` covers v1 — not for this phase).
- A/B testing of CTA copy.

## 22. Risks

| Risk | Mitigation |
|---|---|
| `[SEED]` RERA leaking into JSON-LD | Dedicated filter in `jsonld.ts` + unit test. Memory entry [[importmap-after-schema-changes]] is also updated to remind. |
| Hero CLS from missing media dimensions | `next/image` requires `width`/`height`; we read from Payload media doc fields populated by sharp at upload. If a media doc is missing dimensions, the build fails loudly via TS narrowing (good — surfaces missing migration / regen). |
| FAQ `interpolate-size` browser support | Graceful — falls back to instant open/close in browsers without it (no broken state). |
| Sticky CTA + IntersectionObserver edge cases | Polyfill not needed (IE-free). Test on iOS Safari (the relevant edge case). |
| 50-word block reading as templated | Variant sentence shapes by status; review the 4 seed outputs aloud during implementation. |
| R2 `remotePatterns` env mis-set in CI | Build fails fast on missing env — better than silently shipping broken images. |

## 23. References

- [PLAN.md](../../../PLAN.md) §Phase 2.
- [CLAUDE.md](../../../CLAUDE.md) — brand tokens, banned UI habits, routing layout, locked stack.
- Emil Kowalski's design-engineering framework (loaded via skill).
- design-taste-frontend pre-flight checklist (loaded via skill).
- Payload Local API: `@payloadcms/richtext-lexical/react` for server-rendered Lexical.
- `next/image` remotePatterns: required for R2-hosted media.
