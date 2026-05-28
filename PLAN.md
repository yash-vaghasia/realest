# Realest — v1 Build Plan

Dependency-ordered path from empty repo → live v1 on realest.co.in. Every task has **What / Why / Touches / Acceptance**. Items marked **[SKIP v1]** are deliberately deferred.

Read `CLAUDE.md` before any task — locked stack, conventions, guardrails apply throughout. **Before any public-UI component work in Phases 2, 3, and 5, load both `emilkowalski/skill` and `taste-skill` via the Skill tool** (see `CLAUDE.md → Design skills`). Brand tokens and banned UI habits override any skill suggestion on conflict.

## Phase 0 — Provision & scaffold (prerequisite, not in the user-supplied a–f)

### 0.1 Provision external services
- **What:** Create Supabase project (Mumbai), Cloudflare R2 bucket + API token, Resend domain `realest.co.in` (SPF/DKIM), Vercel project linked to the repo. Add MX/forward rule so `leads@realest.co.in` actually delivers somewhere humans read.
- **Why:** Nothing else can be tested end-to-end without these. Doing it once now prevents stop-the-world later.
- **Touches:** External dashboards only. Credentials land in Vercel env + local `.env`.
- **Acceptance:** `psql` against the pooled URI returns; `aws s3 ls --endpoint $R2_ENDPOINT $R2_BUCKET` works; a test email from Resend lands in `leads@realest.co.in`.

### 0.2 Scaffold Next.js + Payload 3 monorepo (single app)
- **What:** `pnpm create payload-app` with the Next.js + Postgres template. Add Tailwind, configure App Router groups `(public)` and `(payload)`, register `@payloadcms/storage-s3` for R2, wire Lexical with the v1 feature set (headings 2–4, lists, links, blockquote, upload). Configure `DATABASE_URL` (pooled) + `DIRECT_DATABASE_URL` (direct).
- **Why:** Everything else assumes this layout. Locking pooled vs direct now avoids the classic "migrations fail in CI" footgun.
- **Touches:** `package.json`, `payload.config.ts`, `next.config.mjs`, `tailwind.config.ts`, `src/app/(payload)/admin/[[...segments]]/page.tsx`, `src/app/(public)/layout.tsx`, `.env.example`, `.gitignore`.
- **Acceptance:** `pnpm dev` serves `/admin` (Payload) and `/` (placeholder homepage). `pnpm payload migrate` against the direct URI succeeds.

### 0.3 Design tokens + brand primitives
- **What:** Tailwind theme extends with the brand colors, font stacks (Switzer + General Sans, Inter fallback), spacing scale (8px base), radius (6/8), single shadow token. Self-host fonts from `public/fonts/` with `font-display: swap`. Ship logo SVGs from `assets/` into `public/`.
- **Why:** Every page from Task 2 onward consumes these. Building pages before the tokens is rework guaranteed.
- **Touches:** `tailwind.config.ts`, `src/app/globals.css`, `src/app/(public)/layout.tsx`, `public/fonts/*`, `public/logo-*.svg`.
- **Acceptance:** A `/design` smoke page (route is `noindex`; underscore-prefixed folder names are private in Next.js so they don't route) renders all color swatches + type ramp + a button + a card; Lighthouse on it shows no font-related CLS.

## Phase 1 — Schema design + seed validation (the user's task **a**)

### 1.1 Design Payload collections + globals
- **What:** Author collections in `src/collections/` (all field `name`s in snake_case; Payload system fields `id` / `createdAt` / `updatedAt` stay camelCase — we do NOT add parallel `created_at` / `updated_at` fields):
  - `projects` — name, slug, builder (rel), city (rel), locality (rel), status (`pre_launch|new_launch|under_construction`), rera_authority (default `maharera`; future-proofs Phase 2 metros), rera_number, rera_registered_on, rera_expires_on, possession_target (month+year), configurations (array: `bhk`, `carpet_sqft`, `super_sqft`, `price_inr`, `units_available`), price_from_inr, price_to_inr, **budget_band** (`under_75l|75l_1cr|1_2cr|2_5cr|5cr_plus`, derived in a `beforeChange` hook from `price_from_inr`; powers the budget combo pages), total_units, towers, amenities (rel many), unit_types (rel many), hero_image (upload), gallery (upload many), floor_plans (upload many), brochure (upload), description (Lexical), faqs (array: `question`, `answer`), seo (group: meta_title, meta_description, og_image), published, published_at.
  - `builders` — name, slug, logo, about (Lexical), website, founded_year, hq_city, total_projects (computed via afterChange counter or rendered live).
  - `cities` — name, slug, blurb (Lexical), hero_image, parent (self-rel, nullable — supports future metro groupings).
  - `localities` — name, slug, city (rel), blurb (Lexical), centroid (group: lat, lng), hero_image.
  - `amenities` — name, slug, icon (upload, optional).
  - `unit_types` — name, slug (e.g. `1_bhk`, `2_bhk`, `studio`, `shop`, `office`).
  - `leads` — name, phone, email, message, project (rel, nullable for site-wide enquiries), **status** (`new|contacted|qualified|site_visit|booked|disqualified|won|lost`), **booking_value_inr** (nullable; populated when status → `booked` for brokerage tracking), assigned_to (rel `users`), source (`project_page|locality_page|builder_page|home|combo_page`), source_url, utm_source, utm_medium, utm_campaign, notes (array of `users` + Lexical), notified_at (nullable; set by the new-lead email hook for idempotency). No `created_at` field — Payload's `createdAt` is the source of truth.
  - `media` — Payload upload collection backed by R2; focal point enabled.
  - `users` — Payload auth (Realest team only in v1). Include a `role` enum (`admin|editor`) so a future `builder_rep` role is a one-line addition.
- **Globals:** `site_settings` (logo refs, footer disclaimer toggle, rera_agent_reg_no, contact email/phone), `seo_defaults` (default OG image, organization JSON-LD fields).
- **Why:** Schema is the moat. Designing it before seeding is cheap; redesigning after content exists is not. `budget_band` and the extended lead statuses are added now because both feed live revenue lines and can't be cleanly backfilled from existing rows.
- **Source-of-truth rule:** `src/collections/` is the canonical schema. If anyone has dropped Batch-1 collection files in there, treat them as the base and reconcile this spec INTO them — never duplicate.
- **Touches:** `src/collections/*.ts`, `src/globals/*.ts`, `payload.config.ts`.
- **Acceptance:** `pnpm payload generate:types` produces a clean `payload-types.ts`. `/admin` shows every collection with sensible labels. Saving a project with `price_from_inr = 95_00_000` writes `budget_band = "75l_1cr"`. Lead status dropdown shows `new → contacted → qualified → site_visit → booked → won/lost/disqualified`.

### 1.2 Validate schema with 3–5 hand-entered MahaRERA projects
- **What:** Through `/admin`, enter 4 projects deliberately chosen to stress the schema: one mid-market Mumbai (e.g. Godrej / Runwal), one luxury Mumbai (e.g. Lodha), one pre-launch in Navi Mumbai, one Thane mid-market. Each must have its real RERA number, real configuration table, real floor plans, a hero image, and 5+ FAQs.
- **Why:** This is the only honest test of the schema before frontend work. Adjust collections immediately when something doesn't fit.
- **Touches:** Data only (no code), but expect 1–3 follow-up edits to `src/collections/projects.ts` and a regenerated migration.
- **Acceptance:** All 4 projects saved without "Other" / freeform fields used as escape hatches. No required field had to be made optional. RERA number, possession, and price-from render correctly in `/admin` list view.

## Phase 2 — Project detail page (the user's task **b**, the SEO money page)

> **Before this phase:** load both `emilkowalski/skill` (motion / interaction polish) and `taste-skill` (visual judgment) via the Skill tool. Apply them to listing card, hero, sticky CTA, FAQ accordion, gallery. Brand tokens + banned UI habits in `CLAUDE.md` win on conflict.

### 2.1 Build `/projects/[slug]`
- **What:** Static generation via `generateStaticParams` driven by the Payload Local API. Page sections (top → bottom): hero (image + status pill + RERA badge + name + locality/builder + price-from + lead CTA), key facts table, configurations table, amenities grid, floor plans, gallery, description (Lexical render), location + locality context, similar projects (3 same locality/builder), FAQ accordion, sticky lead CTA on mobile.
- **Why:** This is the page that earns the long-tail rankings.
- **Touches:** `src/app/(public)/projects/[slug]/page.tsx`, `src/lib/payload-client.ts`, `src/components/listing/*`, `src/components/lexical/RichTextRender.tsx`.
- **Acceptance:** Lighthouse mobile ≥ 90 perf / 95 SEO / 100 accessibility on a populated project. No CLS on hero or images (explicit `width`/`height` from R2 metadata).

### 2.2 Structured data
- **What:** Inject JSON-LD inline in the server-rendered HTML (not via `<Script strategy="lazyOnload">`): `RealEstateListing` (name, url, address, geo, image, brand=Builder, offers price range, additionalProperty for RERA number), `FAQPage` (from the FAQs array), `BreadcrumbList`.
- **Why:** This markup is for **AEO / LLMs / Bing**, not for Google rich results. Google has no real-estate rich result, and FAQ rich results are restricted to government / health domains, so do not expect SERP visual treatment. The markup still helps AI-search citations and Bing snippets, which is the actual GEO bet.
- **Touches:** `src/lib/jsonld.ts`, `src/app/(public)/projects/[slug]/page.tsx`.
- **Acceptance:**
  1. `RealEstateListing` validates without errors at `validator.schema.org` (use this, not Google's Rich Results test, which won't recognise the type).
  2. `BreadcrumbList` passes Google's Rich Results test — that's the **only** type expected to surface visually in Google.
  3. `FAQPage` validates structurally but is **not** counted as a launch success criterion — its purpose is AI-search visibility, not snippets.

### 2.3 On-demand revalidation
- **What:** `afterChange` and `afterDelete` hooks on `projects` (and on related `builders`, `localities`, `cities`) call `revalidatePath('/projects/[slug]')` and the parent archive paths.
- **Why:** Static delivery without manual rebuilds; CMS edits feel instant.
- **Touches:** `src/collections/projects.ts` (hooks), `src/lib/revalidate.ts`.
- **Acceptance:** Editing a project in `/admin` updates the live page within ~2s without a deploy.

## Phase 3 — Remaining templates (the user's task **c**)

> **Before this phase:** reload (or confirm still loaded) `emilkowalski/skill` and `taste-skill`. Apply to builder page, city archive, locality archive, filter chips, internal-link belts. Brand tokens + banned UI habits in `CLAUDE.md` win on conflict.

### 3.1 Builder page `/builders/[slug]`
- **What:** Builder hero (logo, about, founded, HQ, website), list of all their currently-covered projects grouped by status (in v1 that's the launch-cluster cities; scope expands automatically as the dataset grows), FAQs, breadcrumb. JSON-LD: `Organization` + `BreadcrumbList` + `ItemList` of projects.
- **Touches:** `src/app/(public)/builders/[slug]/page.tsx`, `src/components/listing/ProjectCard.tsx`.
- **Acceptance:** Renders correctly for a builder with 1 project and one with many; sorts by status (new launches first).

### 3.2 City + locality archives via the catch-all route
- **What:** Build `src/lib/route-resolver.ts` (the single source of truth used by the page, 404 logic, and sitemap) and `src/app/(public)/[...slug]/page.tsx` driven by it. Resolution order is locked in `CLAUDE.md → Routing layout`. This phase implements the **city** branch (`/mumbai`, `/thane`, `/navi-mumbai`) and the **locality** branch (`/mumbai/worli`, `/thane/kolshet-road`). Each renders: intro paragraph templated from real aggregates (count, min price, top builders), link-based filter chips (status / BHK / budget) so the navigation is crawlable, grid of project cards, FAQ, internal links to localities (from city) or sibling localities (from locality), breadcrumb. JSON-LD: `BreadcrumbList` + `ItemList`.
- **Why:** Centralising resolution in one resolver is what makes the ≥3-listing gate, the sitemap, and the 404 path stay consistent forever.
- **Touches:** `src/lib/route-resolver.ts`, `src/app/(public)/[...slug]/page.tsx`, `src/lib/intro-template.ts`, `src/components/listing/*`.
- **Acceptance:** Intro reads as written, not templated (test: read aloud). `/mumbai/some-fake-locality` returns a real 404 (status 404, not 200 with empty state). Empty intermediate routes do not render until there are ≥3 projects. The catch-all does **not** intercept `/projects/...` or `/builders/...` (Next routes those to the explicit files first).

## Phase 4 — Programmatic SEO engine (the user's task **d**)

### 4.1 Combo branch inside the catch-all
- **What:** Extend `src/lib/route-resolver.ts` with combo handling: 1-segment slugs that match the combo grammar (`[bhk]-[status]-projects-in-[place]`, `[status]-projects-by-[builder]`, `[bhk]-projects-under-[budget_band]-in-[place]`) → fixed token order, one canonical slug per filter set. Build `src/lib/combo-generator.ts` that enumerates valid combos with **≥3 matching projects** from the catalog. Page anatomy (rendered by the same `[...slug]/page.tsx`): 50-word answer-first intro from aggregates → filter context → project grid → FAQ → internal links to parent (city/locality) and sibling combos. Every combo page sets a self-canonical `<link rel="canonical">` to its own URL.
- **Why:** Long-tail SEO without thin pages, single source of truth for which combo URLs exist.
- **Touches:** `src/lib/route-resolver.ts`, `src/lib/combo-generator.ts`, `src/app/(public)/[...slug]/page.tsx`, `src/lib/intro-template.ts`.
- **Acceptance:** Given the seed catalog, the generator produces only combos with ≥3 matches. Any `<3` combo returns a real 404 (not a 200 with empty state). All generated combos appear in `sitemap.xml`. Two different filter sets cannot produce the same canonical URL (deterministic token order verified by a unit test).

### 4.2 Internal linking belt
- **What:** Every project page links **up** (city, locality, builder, possession year), **sideways** (3 similar by locality / builder), and **into** any matching combo pages.
- **Touches:** `src/components/listing/RelatedLinks.tsx`, `src/lib/similar-projects.ts`.
- **Acceptance:** Each project page has ≥6 internal links to other Realest URLs; none broken.

## Phase 5 — Public lead capture + CRM (the user's task **e**)

> **Before this phase:** reload (or confirm still loaded) `emilkowalski/skill` and `taste-skill`. Apply to the lead form (focus states, inline validation, submit-loading motion), sticky mobile CTA, success state. Admin CRM views are Payload's own UI — skills do not apply there. Brand tokens + banned UI habits in `CLAUDE.md` win on conflict.

### 5.1 Public lead form
- **What:** Compact form (name, phone, email, optional message) on project / locality / builder / combo pages and home. Sticky mobile CTA on project pages. Phone is required; email optional. Honeypot + 30s minimum fill time as cheap spam defense; revisit hCaptcha later only if spam materializes.
- **Touches:** `src/components/lead/LeadForm.tsx`, `src/components/lead/StickyMobileCTA.tsx`.
- **Acceptance:** Submitting on a project page creates a `leads` row with `project` correctly populated and `source_url` captured.

### 5.2 Server action with `overrideAccess`
- **What:** Server action `submitLead` validates with zod, calls Payload Local API `create({ collection: 'leads', overrideAccess: true })`. `leads` collection access is otherwise admin-only.
- **Touches:** `src/app/(public)/_actions/submit-lead.ts`, `src/collections/leads.ts`.
- **Acceptance:** Direct POST to the action without a valid input fails closed; valid input creates a row visible in `/admin/collections/leads`.

### 5.3 Lead notification email
- **What:** `afterChange` hook on `leads` (on create) sends a Resend email to `leads@realest.co.in` containing all lead fields, the project name + admin deep-link, and the `source_url`. Idempotent via a `notified_at` field so re-saves don't re-email.
- **Touches:** `src/collections/leads.ts`, `src/lib/email.ts`, `emails/NewLead.tsx` (React Email).
- **Acceptance:** Submitting a test lead delivers an email within ~10s; manually re-saving the lead in admin does not re-send.

### 5.4 Payload-as-CRM (lightweight)
- **What:** Status workflow (`new → contacted → qualified → site_visit → booked → won/lost/disqualified`), `assigned_to` defaulting unassigned in v1, free-text notes array, filterable list view in admin (by status, source, project). No external CRM integration in v1.
- **Touches:** `src/collections/leads.ts` (list-view config + access).
- **Acceptance:** Team can triage from `/admin/collections/leads` end-to-end without leaving Payload.

## Phase 6 — Discoverability surfaces (the user's task **f**)

### 6.1 `sitemap.xml`
- **What:** Dynamic route emitting `lastmod` from each entity's `updatedAt` (Payload system field — see CLAUDE.md timestamp exception). Reads its URL list from `src/lib/route-resolver.ts` so it cannot diverge from what the catch-all renders. Includes home, every published project, every builder, every city, every locality, every gated combo, blog posts (when blog ships).
- **Touches:** `src/app/sitemap.ts`, `src/lib/route-resolver.ts`, `src/lib/combo-generator.ts`.
- **Acceptance:** `curl https://realest.co.in/sitemap.xml` is valid XML; no URL returns 404; URLs are absolute on `NEXT_PUBLIC_SITE_URL`; every `<lastmod>` is the entity's `updatedAt`.

### 6.2 `robots.txt`
- **What:** Allow all on production, block `/admin`, `/api`, `/_next`, and any `?utm_*` paths via `Disallow`. Reference the sitemap.
- **Touches:** `src/app/robots.ts`.
- **Acceptance:** Robots tester in GSC passes.

### 6.3 `llms.txt`
- **What:** Hand-curated index of the highest-value pages (home, about, top localities, top builders, top projects, locality guides) with a one-line description each. Generated at build from the same source as the sitemap but filtered to "evergreen, high-quality" pages.
- **Touches:** `src/app/llms.txt/route.ts`, `src/lib/llms-index.ts`.
- **Acceptance:** Served as `text/plain` at `/llms.txt`; manually readable.

## What we deliberately SKIP for v1

- **[SKIP v1]** External search infrastructure (Algolia / Meilisearch). Postgres `ILIKE` + a few indexed columns is enough; revisit at 5k+ listings.
- **[SKIP v1]** RERA importer / scraper. Hand-entry through Payload is faster and more accurate at 4–50 projects.
- **[SKIP v1]** Builder portal / self-service listing. Realest team enters everything.
- **[SKIP v1]** Saved searches, accounts, favorites for buyers. No buyer auth at all.
- **[SKIP v1]** Paid features (featured listings, promoted placements).
- **[SKIP v1]** Reports product. Free locality pages double as the sample; sell only once coverage is credible.
- **[SKIP v1]** Push to Acrez CRM. Re-evaluate after first 50 leads.
- **[SKIP v1]** hCaptcha / Turnstile. Honeypot + min-fill-time is fine until spam appears.
- **[SKIP v1]** Multilingual (Hindi/Marathi). English only.
- **[SKIP v1]** Map view, polygon search, proximity ranking. Centroid lat/lng is captured for future use only.
- **[SKIP v1]** A/B testing framework. Single design, measure with GSC + PostHog.
- **[SKIP v1]** PWA / offline / push notifications.
- **[SKIP v1]** GraphQL endpoints, public REST. Local API only; the site is the API for v1.
- **[SKIP v1]** Cloudflare Image Transformations / Polish. Sharp at upload + R2 caching is enough at <5k listings.
- **[SKIP v1]** Pre-warming popular routes via `unstable_cache` / `revalidateTag`. Indexed Postgres queries are sub-ms at v1 scale; revisit only on observed cold-start regression.
- **[SKIP v1]** Pre-computed static combo→project map. Indexed DB query is fast enough; static map adds build complexity + staleness window.
- **[SKIP v1]** Per-project OG image via `next/og`. Defer to a post-Phase-6 polish task.
- **[SKIP v1]** `defineCollection()` TS wrapper enforcing snake_case. Only 8 collections; manual review catches drift.

## Build order & per-phase checkpoint (locked)
Build Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 in order. **After every phase**:
1. Run `pnpm typecheck && pnpm lint && pnpm build` — all must pass.
2. Run that phase's acceptance criteria (see each task above).
3. **STOP.** Post a summary of what changed + any new open questions, and wait for explicit go before the next phase.

**First shippable milestone = Phases 0–2.** That's: scaffold → schema → 3–5 seed projects → project detail page. The smallest live, indexable thing.

## Verification — end-to-end gate before "live v1"

1. `pnpm typecheck && pnpm lint && pnpm build` all green.
2. From `/admin`, create a new project → public `/projects/[slug]` reflects it within ~2s without redeploy.
3. `RealEstateListing` validates at `validator.schema.org` on a live project URL; `BreadcrumbList` passes Google's Rich Results test; `FAQPage` validates structurally (not expected to surface in Google).
4. Submit a lead from a project page → row appears in `/admin/collections/leads` → email lands in `leads@realest.co.in` within ~10s.
5. `/mumbai` renders only when ≥3 projects exist in that city; otherwise 404 (not a 200 with empty state). Same gate for every locality and combo URL.
6. `/sitemap.xml` lists every published page with valid `lastmod` (from `updatedAt`); no URLs return 404; sitemap and route resolver are seeded from the same source.
7. Lighthouse mobile run on a project URL: Perf ≥ 90, SEO ≥ 95, Accessibility = 100, BP ≥ 95. LCP < 2.5s, INP < 200ms, CLS < 0.1.
8. `curl /robots.txt` and `curl /llms.txt` return the expected content.

## Approved optimization items (built in alongside the phases)

These were approved in the planning session and are folded into the build, not bolt-ons:

- R2 images via `next/image` with explicit `width`/`height` from Payload media; `priority` on hero, lazy elsewhere.
- Self-host fonts via `next/font/local`, preload Switzer 700 + General Sans 400, `display: 'swap'`, Latin subset.
- Inline JSON-LD in server HTML (no deferred script tags).
- Postgres indexes on `projects`: (`city_id`,`status`), (`locality_id`,`status`), (`builder_id`,`status`), (`city_id`,`status`,`budget_band`), partial (`published_at desc`) where `published=true`.
- Local API reads with explicit `depth` / `select` projections.
- `<link rel="alternate" hreflang="en-IN">` on every public page.
- Self-canonical on every public page; query-strip for sort/filter/UTM.
- `/admin/*` `noindex` at both robots.txt and `X-Robots-Tag` (`middleware.ts`).
- 50-word answer-first block under H1 on project + combo + city + locality pages.
- Semantic landmarks (`<header>`/`<main>`/`<footer>`/`<nav>`), skip-to-main link, `aria-current="page"`.
- Visible `:focus-visible` ring in primary blue everywhere.
- Respect `prefers-reduced-motion` for all motion.
- One `ListingCard` reused across home / builder / city / locality / combo / similar.
- Zod schemas as the single source of truth for server-action inputs (`z.infer` for TS types).
- Sentry (server + client errors).
- Vercel Analytics (route-level CWV).
- PostHog snippet for the lead funnel (pending property-decision answer).
- Failure-resilient lead notification: lead row exists with `notified_at = null` if email fails, surfaced in admin with a retry.
- Lead idempotency on (phone, project_id, 30-min window).

## Blocked on you (feature-flagged so the build is not blocked)

- **Legal entity name + registered address** — block publishing `/privacy` and `/terms`; pages built with `[PLACEHOLDER]` substitution so swap-in is one config change. Until then, policy pages are `noindex`.
- **MahaRERA agent registration number** — footer disclaimer line is gated on `MAHARERA_AGENT_REG_NO` env var; absent ⇒ hidden.
- **The 5 seed projects** — Phase 1.2 cannot run without them. Phases 0–1.1 are unblocked.
- **Switzer + General Sans commercial license** — fonts shipped on Inter fallback until confirmed, then one swap in `tailwind.config.ts` + `src/app/layout.tsx`.

## Open follow-ups (informational)

- **`leads@realest.co.in` delivery** — confirm the mailbox / forwarding rule exists and a human reads it.
- **Resend** as the transactional email provider, unless you want AWS SES / Postmark / etc.
- **PostHog property** — reuse the existing Acrez project or create a new property for Realest. Defaulting to new.
- **Possession-target field shape** — month+year (assumed) or a free-form quarter string?
- **Configuration table extent** — flat (assumed) or per-row sold-out + per-config floor plan?
