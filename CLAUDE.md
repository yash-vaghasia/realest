# Realest — Engineering Context

This file is the source of truth for every Claude/Claude Code session in this repo.
Read it fully before doing anything. Do not re-decide locked items below.

## Product, one line
A national real-estate data company, launching in Mumbai / Thane / Navi Mumbai, then expanding to metros and pan-India. We cover **only** new-launch / pre-launch / under-construction property, and every listing is mapped to its RERA registration. The asset is the dataset + the organic / AI-search traffic it earns.

## Locked stack — do not change
- **Framework:** Next.js (App Router) + Payload 3.0 in the same app. Payload IS the admin and CRM.
- **DB:** Supabase Postgres (Mumbai region). App reads/writes via the **pooled** Supavisor connection (transaction mode, port **6543**). Direct **5432** is used **only** for migrations.
- **Media:** Cloudflare R2 via `@payloadcms/storage-s3` (S3-compatible).
- **Host:** Vercel.
- **CSS:** Tailwind.
- **Rich text:** Lexical (Payload default).
- **Package manager:** pnpm.
- **Rendering:** Static / ISR on the public site. Server reads use the **Payload Local API** (no HTTP to ourselves). Revalidation is on-demand from `afterChange` / `afterDelete` hooks.

## Conventions — do not change
- **snake_case everywhere** — DB columns, Payload field `name`s, slugs, URL params, Lexical block keys, env vars (UPPER_SNAKE_CASE).
- **Exception:** Payload's system fields (`id`, `createdAt`, `updatedAt`) stay camelCase — Payload owns those names and we do not add a parallel `created_at` / `updated_at`. Sitemap, "last updated" UI, and any freshness query read `updatedAt`.
- Folder layout: `src/app/(public)` for the site, `src/app/(payload)` for Payload's mounted admin, `src/collections/`, `src/globals/`, `src/lib/`, `src/blocks/` (Lexical), `src/components/`.
- One Payload collection per concept. Relationships are explicit; no untyped JSON catch-all fields.
- All public lead writes go through a **server action** that calls Payload Local API with `overrideAccess: true` (collection access is otherwise locked to admins).

## Routing layout (locked)
Next.js forbids two dynamic slug names at the same path level, so the public site uses **explicit prefixes for typed resources + one catch-all for everything else**:

- `src/app/(public)/projects/[slug]/page.tsx` — project detail.
- `src/app/(public)/builders/[slug]/page.tsx` — builder page.
- `src/app/(public)/[...slug]/page.tsx` — cities, localities, and combos.

Explicit routes (`/about`, `/projects`, `/builders`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`) win; the catch-all only handles what's left. Resolution order in the catch-all (first match wins) lives in `src/lib/route-resolver.ts` and is read by the page, the 404 logic, and the sitemap generator:

- **1 segment:**
  1. exact match to a city slug → city archive.
  2. else matches a combo pattern (contains a `bhk` / status / `-in-` / `-by-` token) AND `>= 3` matching projects → combo page.
  3. else `notFound()`.
- **2 segments:**
  1. `[0]` is a city AND `[1]` is a locality of that city → locality archive.
  2. else `notFound()`.

Combos are **always single-segment** and self-contained (place is baked into the slug). No 2-segment combos — that prevents duplicate-content URLs for the same result set. The combo generator emits exactly **one canonical slug per filter set** using a fixed token order (`[bhk]-[status]-projects-in-[place]` / `[status]-projects-by-[builder]` / `[bhk]-projects-under-[budget_band]-in-[place]`), and every combo page sets a self-canonical `<link>`.

## Guardrails — do not violate
- **Stack is locked.** Do not propose Algolia, Elasticsearch, Meilisearch, GraphQL layers, Prisma, or a different DB. Postgres full-text search is enough for <5,000 listings.
- **Payload is the admin and the CRM.** Do not build a custom admin UI.
- **Data sources:** MahaRERA + builder sites only. **Never** scrape MagicBricks / 99acres / Housing — ToS violation and inferior pre-launch data anyway.
- **No RERA importer / scraper yet.** Seed data is hand-entered through the Payload admin.
- **No thin programmatic pages.** Every `/[combo]` route must gate render on **≥3 matching projects**.
- **No over-engineering.** For <5,000 listings: no external search infra, no recommender, no event streaming.
- **No buyer-side fees, ever.** Buyers do not pay.
- **No resale, no rentals, no ready-to-move.** Status is restricted to `pre_launch | new_launch | under_construction`.

## Geography (launch cluster, v1)
Mumbai city, Thane, Navi Mumbai. Pune is Phase 2 (same MahaRERA portal). Metros (Bengaluru, Hyderabad, Delhi-NCR, Chennai, Kolkata) then pan-India after that. **v1 data scope is MahaRERA only** — every metro outside Maharashtra is a different state RERA portal with a different schema, integrated state by state. Plan accordingly: don't bake "MahaRERA" into shared abstractions (collection names, components, copy templates) where a generic `rera_authority` field would let Phase 2 metros plug in without a rewrite.

## Brand tokens
- **Primary:** `#0032FF`
- **Primary-dark (hover/active):** `#001A80`
- **BG:** `#FAFAFA`
- **Text:** `#1A1A1A`
- **Secondary text:** `#6B7280`
- **Success (RERA-verified):** `#10B981`
- **Urgency (pre-launch, few units left):** `#F59E0B` — backgrounds only (chip / left border) with `#1A1A1A` text on top; never urgency-on-bg for body text (WCAG AA borderline).
- **Type:** Switzer (display / headings / CTAs, 500/600/700) + General Sans (body / UI, 400/500/600). Inter is the v1 fallback if the licenses are not yet bought.
- **Spacing base:** 8px. **Radius:** 8px cards/inputs, 6px buttons. **Shadow:** `0 1px 3px rgba(0,0,0,.08)` only.
- **Mobile-first.** Targets: LCP < 2.5s, INP < 200ms, CLS < 0.1.

## Banned UI/UX habits
No carousels for critical content. No gradient backgrounds. No stacked shadows. No colors outside the palette. No emoji icons in the product. Banned copy: "dream home", "world-class", "nestled", "luxurious living", "prime location" (without specifics), exclamation marks, ALL-CAPS hype, unsourced superlatives.

## Key commands
```bash
pnpm install                # install
pnpm dev                    # Next + Payload locally on :3000 (/admin for Payload)
pnpm build                  # production build
pnpm start                  # serve the build
pnpm payload migrate:create # create a migration (uses DIRECT_DATABASE_URL, port 5432)
pnpm payload migrate        # apply migrations (DIRECT_DATABASE_URL)
pnpm payload generate:types # regenerate `payload-types.ts`
pnpm lint                   # ESLint
pnpm typecheck              # tsc --noEmit
```

## Env vars (UPPER_SNAKE_CASE)
- `DATABASE_URL` — Supavisor pooled URI, port **6543** (runtime).
- `DIRECT_DATABASE_URL` — direct Postgres URI, port **5432** (migrations only).
- `PAYLOAD_SECRET` — Payload signing secret.
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_BASE_URL`.
- `RESEND_API_KEY`, `LEAD_NOTIFICATION_EMAIL` (defaults to `leads@realest.co.in`).
- `NEXT_PUBLIC_SITE_URL` (`https://realest.co.in` in prod).
- `MAHARERA_AGENT_REG_NO` (string; if unset, the footer disclaimer line is hidden).

## House rules for Claude
- Edit existing files before creating new ones.
- One concern per PR.
- Tests: typecheck + lint must pass; add unit tests only where behaviour is non-obvious.
- Never write migrations by hand — generate via Payload, then commit.
- Never bypass Payload access control on the client; public writes go through server actions that use `overrideAccess`.
- Never index an empty programmatic page — verify the `≥3 listings` gate before adding any new combo route.
- If asked to add a feature outside the locked scope, push back and link this file.

## Design skills — load before any public UI
Two design skills govern HOW public-facing components look and feel:
- **`emilkowalski/skill`** — interaction, motion, component polish.
- **`taste-skill`** (Leonxlnx) — visual taste / design judgment.

Rules:
1. **Load both skills via the Skill tool before writing any public component** in Phases 2, 3, or 5 (project detail, builder/city/locality archives, combo pages, lead form, listing cards). Internal admin UI is Payload's own — skills do not apply there.
2. **Brand tokens + banned UI habits in this file WIN on any conflict.** Palette is fixed (no extra colors, no gradients). Single shadow token only. No carousels for critical content. If a skill recommends a glass-morphism background, a gradient CTA, or stacked shadows — ignore it; the brand doc is authoritative.
3. Skills inform motion choices, micro-interactions, hierarchy, density, and detail-level — they do not override geometry (8px spacing base, 6/8 radius), type (Switzer + General Sans), or color tokens.
4. If a skill is unavailable in a session, do not silently proceed — surface that to the user before continuing the component work.
