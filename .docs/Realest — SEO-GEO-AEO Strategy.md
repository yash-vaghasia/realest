# Realest — SEO / GEO / AEO Strategy

SEO-first is the entire distribution strategy. No paid acquisition at launch — rankings are the moat.

## Niche philosophy
Win long-tail intent on new-launch queries where portals are weak. Never chase generic "flats in Mumbai" — off-niche and portal-dominated.

## Keyword tiers
- **Tier 1 (build first — highest intent, winnable):** `[builder] [project]` · `new launch in [locality]` · `pre launch projects in [city]` · `[X]bhk new launch [locality]` · `[project] floor plan / brochure / rera`
- **Tier 2 (volume, more competition):** `new projects in [city]` · `upcoming projects in [city]` · `under construction flats [locality]`
- **Tier 3 (top-funnel content):** `is [project] rera approved` · `[locality] price trend 2026` · `best builders in [city]` · `how to verify rera number` · `pre-launch vs new launch`
- **Avoid:** generic flats-for-sale, resale/rent queries, broad "best property 2026".

## Programmatic page system (~400–500 pages)
From category combinations: status × location, BHK × status × location, budget × location, type × location, builder × city.
Non-negotiable rules:
1. **Gate:** generate only combos with **≥3 matching projects**. No thin/empty pages.
2. **Unique intro** from real aggregates (count, min price, builder names) — never templated lorem.
3. Each page = intro + listing grid + FAQ + internal links.

## URL & internal linking
- `/projects/[slug]` · `/builders/[slug]` · `/[city]` · `/[city]/[locality]` · `/[combo]`
- Every project links **up** (city, locality, builder, possession-year), **sideways** (3 similar — same locality/builder), and **into** relevant guides. Breadcrumbs sitewide (visual + schema).

## Schema (mandatory)
| Page | Schema |
|---|---|
| Project | RealEstateListing + FAQPage + BreadcrumbList |
| City / Locality / Combo | BreadcrumbList + ItemList of projects |
| Home | Organization + LocalBusiness |
| Blog | Article + FAQPage |

## GEO (AI search — ChatGPT, Perplexity, AI Overviews, Claude)
- `/llms.txt` listing key pages + descriptions.
- Answer-first: the first sentence states what the page is. Short paragraphs, clear H2/H3.
- Cite RERA numbers + sources — AI rewards verifiable claims.
- Comparison tables — easily parsed, frequently surfaced.

## AEO (featured snippets, People Also Ask)
- 5–10 FAQs per project (feeds FAQPage).
- Mine PAA for each Tier-1 keyword; answer it in content.
- 50-word direct answer at the top of each page (snippet bait).
- Numeric specifics ("from ₹2.4 Cr") beat adjectives.

## Technical SEO / CWV (non-negotiable)
HTTPS · mobile-first · static/ISR + CDN · WebP + lazy-load + explicit dimensions · deferred non-critical JS · auto XML sitemap → GSC + Bing · robots.txt + llms.txt · self-canonical on programmatic pages · maintained 301 map · Google Business Profile.
Targets: **LCP < 2.5s · INP < 200ms · CLS < 0.1.**

## Content engine (Week-5 seed — 10 articles)
Locality guides (Worli, Kharghar, Thane W vs E, BKC), buyer guides (verify RERA, pre-launch vs new launch, UC checklist, Maharashtra stamp duty), builder spotlights (Lodha MMR, Godrej Mumbai).
Template: H1 (primary kw) → 50-word intro → 3–5 H2 → FAQ (schema) → 3–5 internal links → 1 lead CTA.

## Measure
GSC rankings + impressions/CTR by page type · leads attributed by landing page · which programmatic combos rank → double down on those patterns.