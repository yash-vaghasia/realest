# Realest — Business Model & Strategy (Data-first)

## What Realest is
A **data company** for Indian primary real estate — new-launch / pre-launch / under-construction residential and commercial. The asset is the most complete, structured, RERA-verified dataset of these projects, plus the SEO / AI-search traffic it generates. We launch in Mumbai and expand outward. The dataset + traffic is the moat; revenue rides on top.

## Geographic roadmap
We are **not** an "MMR company" — that's just the starting line.

| Stage | Markets | Goal |
|---|---|---|
| **1 — Launch cluster (now)** | Mumbai city, Thane, Navi Mumbai | Build a deep, verified dataset + win organic / AI-search traffic; run leads + reports |
| **2 — Metros** | Pune first, then Bengaluru, Hyderabad, Delhi-NCR, Chennai, Kolkata | Replicate the depth playbook, metro by metro |
| **3 — Pan-India** | Tier-1 → Tier-2 | National coverage once the metro engine is repeatable |

**Discipline: depth before width.** Don't open a new market until the current one's dataset is deep, verified, and ranking. Shallow national coverage is exactly the portal weakness we're attacking — don't recreate it.

**The real expansion constraint (flag):** RERA is state-by-state. Mumbai / Thane / Navi Mumbai all sit under one source — **MahaRERA**. So does **Pune**, which makes Pune the cheapest possible second market (same portal, same data structure). Every metro *outside* Maharashtra is a different RERA portal with a different schema (K-RERA, TG-RERA, HARERA, UP-RERA, TN-RERA, WB…). Expansion cost is "integrate another state's RERA," not "add a city to a dropdown." Sequence metros by RERA data quality and accessibility, not just market size.

## Why data-first
- The moat is the dataset + traffic, not transactions. Competitors republish portal data; we structure primary RERA data better and rank for it.
- A clean, complete, fresh dataset compounds and is hard to copy. Revenue layered onto it converts better, and on better terms.
- Cost base is near-zero, so we build the asset and monetize in parallel.

## Monetization
**Live from Phase 1 (launch cluster):**
1. **Leads** — per-lead fee and/or brokerage on booking, builder-funded. Buyers never pay. Fastest line; needs builder / channel-partner takers for the leads (see flag).
2. **Market intelligence / reports** — pricing, absorption, launch-pipeline by locality; sold to builders, brokerages, banks/HFCs, investors. **Gated by coverage:** a market is only "report-ready" once you hold enough verified projects to be credible. Until then, the v1 is free locality data pages that double as SEO *and* as the sales sample.

**Later (don't build yet):**
3. Featured / promoted listings — once traffic is real.
4. Data licensing / API — to proptech tools, valuers, lenders.
5. Internal feed — power Acrez / Shashwat with the dataset + audience.

**Flags:**
- **Leads in Phase 1 reverses last turn's "don't chase builders yet."** If leads are live now, you need a handful of builders / channel partners willing to take and pay for leads. Not the old "5 signed deals" gate — but not zero either.
- **Reports can't sell off a thin dataset.** Pushing paid reports before coverage is credible burns trust. Sell them only once a market is report-ready; before that, give the data away as SEO + sales proof.

## Revenue stance (reconciled)
This updates the earlier "no near-term revenue" line: **leads and reports run from Phase 1.** Revenue is welcome from day one. It is simply **not the metric we optimize around** — the asset (coverage, accuracy, freshness, traffic) is. We take revenue opportunistically while the asset is what compounds.

## KPIs
**Primary — the asset:**
| Metric | Why |
|---|---|
| Projects covered (live, structured) | The asset itself |
| % matched to a valid RERA registration | Accuracy = the moat |
| Data freshness (days to add a launch; age of stale records) | A dataset rots without upkeep |
| Indexed pages + organic clicks (GSC) | Distribution |
| AI-search citations / surfacing | GEO traction |

**Secondary — early revenue:**
| Metric | Why |
|---|---|
| Leads delivered + lead/brokerage revenue | First cash line |
| Report inquiries → sales | Validates the data-as-product thesis |
| Builders / partners taking leads | Whether leads can actually monetize |

## Cost & runway
Near-zero cash cost — hosting (Vercel + Supabase + R2, low double-digit $/mo), one-time font license, founder time. The genuine risk is **opportunity cost**: hours here are hours not on Acrez / Shashwat, which already make money. Expansion adds real cost only at Stage 2 (per-state RERA integration + content). Make the time trade deliberately.

## What we are NOT
- Not "depth-last" — no new market until the current one is deep and verified.
- No resale, no rent, no ready-to-move.
- No buyer-side fees, ever.
- No portal-scraped data — clean primary RERA data is the entire point.