import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

/* Budget band thresholds in INR. Boundaries are tested via the
 * acceptance criterion in PLAN.md §1.1: price_from_inr = 95,00,000 → "75l_1cr".
 * Indian numerals: 1 lakh = 1,00,000 = 100_000; 1 crore = 1,00,00,000 = 10_000_000. */
const LAKH = 100_000
const CRORE = 100 * LAKH

export type BudgetBand = 'under_75l' | '75l_1cr' | '1_2cr' | '2_5cr' | '5cr_plus'

export function deriveBudgetBand(priceFromInr: number | null | undefined): BudgetBand | null {
  if (priceFromInr == null || Number.isNaN(priceFromInr)) return null
  if (priceFromInr < 75 * LAKH) return 'under_75l'
  if (priceFromInr < 1 * CRORE) return '75l_1cr'
  if (priceFromInr < 2 * CRORE) return '1_2cr'
  if (priceFromInr < 5 * CRORE) return '2_5cr'
  return '5cr_plus'
}

const setBudgetBand: CollectionBeforeChangeHook = ({ data }) => {
  return {
    ...data,
    budget_band: deriveBudgetBand(data?.price_from_inr),
  }
}

const setPublishedAt: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  // Stamp published_at the first time `published` flips true; preserve thereafter.
  if (data?.published && !originalDoc?.published_at) {
    return { ...data, published_at: data.published_at ?? new Date().toISOString() }
  }
  return data
}

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'locality', 'status', 'price_from_inr', 'published', 'updatedAt'],
    group: 'Inventory',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeChange: [setBudgetBand, setPublishedAt],
    // Phase 2.3 will add an afterChange + afterDelete hook for revalidatePath('/projects/[slug]')
    // and parent archives.
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Kebab-case. URL is /projects/<slug>.' },
      validate: (value: unknown) => {
        if (typeof value !== 'string') return 'Required.'
        return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) || 'Use lowercase kebab-case.'
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'builder',
          type: 'relationship',
          relationTo: 'builders',
          required: true,
          index: true,
        },
        {
          name: 'city',
          type: 'relationship',
          relationTo: 'cities',
          required: true,
          index: true,
        },
        {
          name: 'locality',
          type: 'relationship',
          relationTo: 'localities',
          required: true,
          index: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          required: true,
          index: true,
          options: [
            { label: 'Pre-launch', value: 'pre_launch' },
            { label: 'New launch', value: 'new_launch' },
            { label: 'Under construction', value: 'under_construction' },
          ],
        },
        {
          name: 'possession_target',
          type: 'group',
          admin: { description: 'Targeted possession month + year.' },
          fields: [
            {
              name: 'month',
              type: 'select',
              options: [
                { label: 'Jan', value: '1' },
                { label: 'Feb', value: '2' },
                { label: 'Mar', value: '3' },
                { label: 'Apr', value: '4' },
                { label: 'May', value: '5' },
                { label: 'Jun', value: '6' },
                { label: 'Jul', value: '7' },
                { label: 'Aug', value: '8' },
                { label: 'Sep', value: '9' },
                { label: 'Oct', value: '10' },
                { label: 'Nov', value: '11' },
                { label: 'Dec', value: '12' },
              ],
            },
            { name: 'year', type: 'number', min: new Date().getFullYear(), max: 2099 },
          ],
        },
      ],
    },

    {
      type: 'collapsible',
      label: 'RERA registration',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'rera_authority',
          type: 'select',
          required: true,
          defaultValue: 'maharera',
          admin: { description: 'Future-proofs Phase 2 metros (different state RERA portals).' },
          options: [
            { label: 'MahaRERA (Maharashtra)', value: 'maharera' },
            // Phase 2+: { label: 'K-RERA (Karnataka)', value: 'krera' }, etc.
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'rera_number',
              type: 'text',
              required: true,
              admin: { description: 'As printed on the RERA certificate (e.g. P51800000000).' },
            },
            { name: 'rera_registered_on', type: 'date' },
            { name: 'rera_expires_on', type: 'date' },
          ],
        },
      ],
    },

    {
      type: 'collapsible',
      label: 'Pricing & configurations',
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'price_from_inr',
              type: 'number',
              required: true,
              min: 0,
              index: true,
              admin: { description: 'Lowest available price across all configurations. Drives budget_band.' },
            },
            {
              name: 'price_to_inr',
              type: 'number',
              min: 0,
              admin: { description: 'Optional. Highest available price; used in price-range UI.' },
            },
          ],
        },
        {
          name: 'budget_band',
          type: 'select',
          index: true,
          admin: {
            readOnly: true,
            description: 'Derived from price_from_inr on save. Do not edit by hand.',
          },
          options: [
            { label: 'Under ₹75L', value: 'under_75l' },
            { label: '₹75L – ₹1Cr', value: '75l_1cr' },
            { label: '₹1Cr – ₹2Cr', value: '1_2cr' },
            { label: '₹2Cr – ₹5Cr', value: '2_5cr' },
            { label: '₹5Cr+', value: '5cr_plus' },
          ],
        },
        {
          name: 'configurations',
          type: 'array',
          admin: { description: 'One row per configuration on offer.' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'bhk', type: 'text', required: true, admin: { description: 'e.g. "1 BHK", "2.5 BHK", "Studio".' } },
                { name: 'carpet_sqft', type: 'number', min: 0 },
                { name: 'super_sqft', type: 'number', min: 0 },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'price_inr', type: 'number', min: 0 },
                { name: 'units_available', type: 'number', min: 0 },
              ],
            },
          ],
        },
      ],
    },

    {
      type: 'row',
      fields: [
        { name: 'total_units', type: 'number', min: 0 },
        { name: 'towers', type: 'number', min: 0 },
      ],
    },

    {
      name: 'amenities',
      type: 'relationship',
      relationTo: 'amenities',
      hasMany: true,
    },
    {
      name: 'unit_types',
      type: 'relationship',
      relationTo: 'unit_types',
      hasMany: true,
    },

    {
      type: 'collapsible',
      label: 'Media',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'hero_image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description:
              'Optional. Pre-launch projects often have no hero photography; Phase 2 renders a typographic hero from name + builder when absent.',
          },
        },
        { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true },
        { name: 'floor_plans', type: 'upload', relationTo: 'media', hasMany: true },
        {
          name: 'brochure',
          type: 'upload',
          relationTo: 'media',
          filterOptions: { mimeType: { contains: 'pdf' } },
        },
      ],
    },

    {
      name: 'description',
      type: 'richText',
    },

    {
      name: 'faqs',
      type: 'array',
      admin: { description: 'Surface real buyer questions. Renders FAQPage JSON-LD.' },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },

    {
      type: 'collapsible',
      label: 'SEO',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'seo',
          type: 'group',
          fields: [
            { name: 'meta_title', type: 'text', maxLength: 70 },
            { name: 'meta_description', type: 'textarea', maxLength: 180 },
            { name: 'og_image', type: 'upload', relationTo: 'media' },
          ],
        },
      ],
    },

    {
      type: 'row',
      fields: [
        {
          name: 'published',
          type: 'checkbox',
          defaultValue: false,
          index: true,
        },
        {
          name: 'published_at',
          type: 'date',
          index: true,
          admin: {
            readOnly: true,
            description: 'Stamped automatically the first time published flips true.',
          },
        },
      ],
    },
  ],
}
