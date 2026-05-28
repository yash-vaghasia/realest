/* Phase 1.2 — seed validation.
 *
 * Loads the catalog with realistic, realistically-sized data so Phase 1.1's
 * schema can be exercised end-to-end through /admin BEFORE frontend work in
 * Phase 2. PLAN.md acceptance: 4 stress-test projects (mid-market Mumbai,
 * luxury Mumbai, pre-launch Navi Mumbai, Thane mid-market) saved without
 * reaching for "Other" / freeform escape hatches.
 *
 * NOT FOR PRODUCTION. RERA numbers are prefixed [SEED] so they can never
 * pass for verified data. Hero image is a sharp-generated placeholder.
 *
 * Idempotent: re-running skips records that already exist (by slug).
 *
 * Run with:  pnpm exec tsx scripts/seed.ts
 */
import { getPayload } from 'payload'
import sharp from 'sharp'
import config from '../src/payload.config'

const log = (label: string, value?: unknown) =>
  console.log(`  ${label}${value !== undefined ? ' → ' + JSON.stringify(value) : ''}`)

async function upsertBySlug<TCollection extends string>(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: TCollection,
  slug: string,
  data: Record<string, unknown>,
): Promise<{ id: number | string; isNew: boolean }> {
  // @ts-expect-error — collection slug is dynamic; Local API resolves at runtime
  const existing = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1 })
  if (existing.docs.length > 0) {
    return { id: existing.docs[0].id, isNew: false }
  }
  // @ts-expect-error — see above
  const created = await payload.create({ collection, data: { ...data, slug } })
  return { id: created.id, isNew: true }
}

async function makePlaceholderHero(
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<number | string | null> {
  const existing = await payload.find({
    collection: 'media',
    where: { alt: { equals: 'Seed placeholder hero' } },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    return existing.docs[0].id
  }
  // R2 needs configured creds. When empty (local dev without R2 set up), skip
  // upload — projects.hero_image is optional so seed still completes.
  if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.log('  (skipping — R2 not configured)')
    return null
  }
  // 1600x900 brand-bg with a primary-blue band — clearly a placeholder.
  const png = await sharp({
    create: { width: 1600, height: 900, channels: 3, background: { r: 250, g: 250, b: 250 } },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
            <rect width="1600" height="160" y="370" fill="#0032FF" />
            <text x="800" y="475" font-family="system-ui" font-size="56" font-weight="700"
                  fill="white" text-anchor="middle">SEED PLACEHOLDER</text>
          </svg>`,
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer()

  try {
    const media = await payload.create({
      collection: 'media',
      data: { alt: 'Seed placeholder hero' },
      file: { data: png, mimetype: 'image/png', name: 'seed-placeholder-hero.png', size: png.length },
    })
    return media.id
  } catch (err) {
    console.warn('  (placeholder upload failed; continuing without hero)', err instanceof Error ? err.message : err)
    return null
  }
}

async function run() {
  const payload = await getPayload({ config })
  console.log('\nSeeding Realest…')

  // --- Cities ---
  console.log('\n[cities]')
  const mumbai = await upsertBySlug(payload, 'cities', 'mumbai', { name: 'Mumbai' })
  log('mumbai', mumbai)
  const thane = await upsertBySlug(payload, 'cities', 'thane', { name: 'Thane' })
  log('thane', thane)
  const naviMumbai = await upsertBySlug(payload, 'cities', 'navi-mumbai', { name: 'Navi Mumbai' })
  log('navi-mumbai', naviMumbai)

  // --- Localities ---
  console.log('\n[localities]')
  const worli = await upsertBySlug(payload, 'localities', 'worli', { name: 'Worli', city: mumbai.id })
  log('worli', worli)
  const bhandup = await upsertBySlug(payload, 'localities', 'bhandup', { name: 'Bhandup', city: mumbai.id })
  log('bhandup', bhandup)
  const kolshetRoad = await upsertBySlug(payload, 'localities', 'kolshet-road', {
    name: 'Kolshet Road',
    city: thane.id,
  })
  log('kolshet-road', kolshetRoad)
  const kharghar = await upsertBySlug(payload, 'localities', 'kharghar', {
    name: 'Kharghar',
    city: naviMumbai.id,
  })
  log('kharghar', kharghar)

  // --- Builders ---
  console.log('\n[builders]')
  const lodha = await upsertBySlug(payload, 'builders', 'lodha', {
    name: 'Lodha',
    founded_year: 1980,
    hq_city: mumbai.id,
  })
  log('lodha', lodha)
  const godrej = await upsertBySlug(payload, 'builders', 'godrej-properties', {
    name: 'Godrej Properties',
    founded_year: 1990,
    hq_city: mumbai.id,
  })
  log('godrej', godrej)
  const runwal = await upsertBySlug(payload, 'builders', 'runwal', {
    name: 'Runwal',
    founded_year: 1978,
    hq_city: mumbai.id,
  })
  log('runwal', runwal)
  const hiranandani = await upsertBySlug(payload, 'builders', 'hiranandani', {
    name: 'Hiranandani',
    founded_year: 1978,
    hq_city: mumbai.id,
  })
  log('hiranandani', hiranandani)

  // --- Unit types ---
  console.log('\n[unit_types]')
  const oneBhk = await upsertBySlug(payload, 'unit_types', '1_bhk', { name: '1 BHK' })
  const twoBhk = await upsertBySlug(payload, 'unit_types', '2_bhk', { name: '2 BHK' })
  const threeBhk = await upsertBySlug(payload, 'unit_types', '3_bhk', { name: '3 BHK' })
  const fourBhk = await upsertBySlug(payload, 'unit_types', '4_bhk', { name: '4 BHK' })
  log('unit_types', { oneBhk: oneBhk.id, twoBhk: twoBhk.id, threeBhk: threeBhk.id, fourBhk: fourBhk.id })

  // --- Amenities ---
  console.log('\n[amenities]')
  const amenitySlugs = [
    ['clubhouse', 'Clubhouse'],
    ['swimming-pool', 'Swimming pool'],
    ['gym', 'Gym'],
    ['kids-play-area', "Kids' play area"],
    ['landscaped-gardens', 'Landscaped gardens'],
    ['power-backup', 'Power backup'],
    ['24x7-security', '24×7 security'],
    ['ev-charging', 'EV charging'],
  ] as const
  const amenities: Record<string, number | string> = {}
  for (const [slug, name] of amenitySlugs) {
    const a = await upsertBySlug(payload, 'amenities', slug, { name })
    amenities[slug] = a.id
  }
  log('amenities', Object.keys(amenities).length + ' rows')

  // --- Hero placeholder media (single, shared across all seed projects) ---
  console.log('\n[media]')
  const heroId = await makePlaceholderHero(payload)
  log('hero_image', heroId)

  // --- Projects ---
  console.log('\n[projects]')
  const allAmenityIds = Object.values(amenities)

  const projects = [
    {
      slug: 'runwal-gardens-bhandup',
      name: 'Runwal Gardens',
      builder: runwal.id,
      city: mumbai.id,
      locality: bhandup.id,
      status: 'under_construction',
      rera_authority: 'maharera',
      rera_number: '[SEED] P51800012345',
      rera_registered_on: new Date('2024-08-15').toISOString(),
      rera_expires_on: new Date('2028-12-31').toISOString(),
      possession_target: { month: '6', year: 2028 },
      price_from_inr: 1_25_00_000, // 1.25 Cr — mid-market Mumbai
      price_to_inr: 2_40_00_000,
      configurations: [
        { bhk: '2 BHK', carpet_sqft: 680, super_sqft: 950, price_inr: 1_25_00_000, units_available: 12 },
        { bhk: '3 BHK', carpet_sqft: 960, super_sqft: 1340, price_inr: 2_10_00_000, units_available: 6 },
      ],
      total_units: 220,
      towers: 3,
      amenities: allAmenityIds,
      unit_types: [twoBhk.id, threeBhk.id],
      ...(heroId != null ? { hero_image: heroId } : {}),
      faqs: [
        { question: 'When is possession?', answer: 'Targeted Jun 2028 per RERA filing.' },
        { question: 'Is the project RERA-registered?', answer: 'Yes. RERA: [SEED] P51800012345 (MahaRERA).' },
        { question: 'What is the lowest available price?', answer: '₹1.25 Cr for a 2 BHK (680 sqft carpet).' },
        { question: 'Are home loans pre-approved?', answer: 'Pre-approval is available with all leading banks; share details on enquiry.' },
        { question: 'Is parking included?', answer: 'One covered parking is included per unit.' },
      ],
      seo: {
        meta_title: 'Runwal Gardens, Bhandup — 2 & 3 BHK from ₹1.25 Cr',
        meta_description:
          'New launch by Runwal in Bhandup. 2 & 3 BHK, possession Jun 2028. RERA-registered. From ₹1.25 Cr.',
      },
      published: true,
    },
    {
      slug: 'lodha-park-worli',
      name: 'Lodha Park',
      builder: lodha.id,
      city: mumbai.id,
      locality: worli.id,
      status: 'new_launch',
      rera_authority: 'maharera',
      rera_number: '[SEED] P51800067890',
      rera_registered_on: new Date('2025-02-01').toISOString(),
      rera_expires_on: new Date('2029-12-31').toISOString(),
      possession_target: { month: '12', year: 2028 },
      price_from_inr: 7_50_00_000, // 7.5 Cr — luxury Mumbai
      price_to_inr: 22_00_00_000,
      configurations: [
        { bhk: '3 BHK', carpet_sqft: 1450, super_sqft: 2030, price_inr: 7_50_00_000, units_available: 8 },
        { bhk: '4 BHK', carpet_sqft: 2100, super_sqft: 2940, price_inr: 14_50_00_000, units_available: 4 },
      ],
      total_units: 96,
      towers: 2,
      amenities: allAmenityIds,
      unit_types: [threeBhk.id, fourBhk.id],
      ...(heroId != null ? { hero_image: heroId } : {}),
      faqs: [
        { question: 'When is possession?', answer: 'Targeted Dec 2028 per the RERA filing.' },
        { question: 'Is the project RERA-registered?', answer: 'Yes. RERA: [SEED] P51800067890 (MahaRERA).' },
        { question: 'What is the lowest entry price?', answer: '₹7.5 Cr for a 3 BHK (1450 sqft carpet).' },
        { question: 'How many towers are planned?', answer: 'Two towers, ~48 units each, ground + 36 floors.' },
        { question: 'Are sea views available?', answer: 'Higher floors (25+) offer Arabian Sea views; lower floors face the landscaped podium.' },
      ],
      seo: {
        meta_title: 'Lodha Park, Worli — 3 & 4 BHK luxury from ₹7.5 Cr',
        meta_description:
          'New-launch luxury residences in Worli by Lodha. 3 & 4 BHK, Arabian Sea views. RERA-registered. Possession Dec 2028.',
      },
      published: true,
    },
    {
      slug: 'godrej-hill-retreat-kharghar',
      name: 'Godrej Hill Retreat',
      builder: godrej.id,
      city: naviMumbai.id,
      locality: kharghar.id,
      status: 'pre_launch',
      rera_authority: 'maharera',
      rera_number: '[SEED] P52000011223',
      rera_registered_on: new Date('2026-02-12').toISOString(),
      rera_expires_on: new Date('2030-12-31').toISOString(),
      possession_target: { month: '3', year: 2030 },
      price_from_inr: 95_00_000, // exactly the PLAN.md acceptance edge case → 75l_1cr
      price_to_inr: 1_80_00_000,
      configurations: [
        { bhk: '1 BHK', carpet_sqft: 410, super_sqft: 575, price_inr: 95_00_000, units_available: 20 },
        { bhk: '2 BHK', carpet_sqft: 620, super_sqft: 870, price_inr: 1_45_00_000, units_available: 14 },
      ],
      total_units: 380,
      towers: 5,
      amenities: allAmenityIds,
      unit_types: [oneBhk.id, twoBhk.id],
      ...(heroId != null ? { hero_image: heroId } : {}),
      faqs: [
        { question: 'When is possession?', answer: 'Targeted Mar 2030 per the RERA filing.' },
        { question: 'Is the project RERA-registered?', answer: 'Yes. RERA: [SEED] P52000011223 (MahaRERA).' },
        { question: 'What is the lowest entry price?', answer: '₹95 L for a 1 BHK (410 sqft carpet).' },
        { question: 'Is this a pre-launch?', answer: 'Yes — bookings are open at pre-launch pricing for a limited cohort.' },
        { question: 'How far is the upcoming Navi Mumbai airport?', answer: 'Approx. 12 km by road; expected 18–25 min drive once NMIA opens.' },
      ],
      seo: {
        meta_title: 'Godrej Hill Retreat, Kharghar — pre-launch 1 & 2 BHK',
        meta_description:
          'Pre-launch by Godrej in Kharghar. 1 & 2 BHK from ₹95 L. RERA-registered. Possession Mar 2030.',
      },
      published: true,
    },
    {
      slug: 'hiranandani-meadows-kolshet-road',
      name: 'Hiranandani Meadows',
      builder: hiranandani.id,
      city: thane.id,
      locality: kolshetRoad.id,
      status: 'under_construction',
      rera_authority: 'maharera',
      rera_number: '[SEED] P51700033445',
      rera_registered_on: new Date('2023-11-20').toISOString(),
      rera_expires_on: new Date('2027-12-31').toISOString(),
      possession_target: { month: '9', year: 2027 },
      price_from_inr: 1_45_00_000, // mid-market Thane
      price_to_inr: 2_85_00_000,
      configurations: [
        { bhk: '2 BHK', carpet_sqft: 720, super_sqft: 1010, price_inr: 1_45_00_000, units_available: 18 },
        { bhk: '3 BHK', carpet_sqft: 1080, super_sqft: 1510, price_inr: 2_30_00_000, units_available: 10 },
      ],
      total_units: 410,
      towers: 4,
      amenities: allAmenityIds,
      unit_types: [twoBhk.id, threeBhk.id],
      ...(heroId != null ? { hero_image: heroId } : {}),
      faqs: [
        { question: 'When is possession?', answer: 'Targeted Sep 2027 per the RERA filing.' },
        { question: 'Is the project RERA-registered?', answer: 'Yes. RERA: [SEED] P51700033445 (MahaRERA).' },
        { question: 'What is the lowest entry price?', answer: '₹1.45 Cr for a 2 BHK (720 sqft carpet).' },
        { question: 'How is connectivity to Mumbai?', answer: 'Eastern Express Highway ~5 min; Thane railway ~15 min.' },
        { question: 'Are common amenities ready?', answer: 'Clubhouse, pool, and gym are scheduled to be ready at the time of possession.' },
      ],
      seo: {
        meta_title: 'Hiranandani Meadows, Kolshet Road — 2 & 3 BHK from ₹1.45 Cr',
        meta_description:
          'Under-construction Thane residences by Hiranandani. 2 & 3 BHK. RERA-registered. Possession Sep 2027.',
      },
      published: true,
    },
  ] as const

  for (const p of projects) {
    const { slug, ...data } = p
    const result = await upsertBySlug(payload, 'projects', slug, data)
    log(slug, result)
  }

  console.log('\n✓ Seed complete.')
  process.exit(0)
}

run().catch((err) => {
  console.error('\n✗ Seed failed:', err)
  process.exit(1)
})
