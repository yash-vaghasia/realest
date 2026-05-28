import type { CollectionConfig } from 'payload'

export const Localities: CollectionConfig = {
  slug: 'localities',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'city', 'updatedAt'],
    group: 'Geography',
  },
  access: {
    read: () => true,
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
      index: true,
      admin: {
        description: 'Kebab-case. URL is /<city.slug>/<slug>. Unique within a city, not globally.',
      },
      validate: (value: unknown) => {
        if (typeof value !== 'string') return 'Required.'
        return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) || 'Use lowercase kebab-case.'
      },
    },
    {
      name: 'city',
      type: 'relationship',
      relationTo: 'cities',
      required: true,
      index: true,
    },
    {
      name: 'blurb',
      type: 'richText',
    },
    {
      name: 'centroid',
      type: 'group',
      admin: { description: 'Captured for future map / proximity use. Not rendered in v1.' },
      fields: [
        { name: 'lat', type: 'number', min: -90, max: 90 },
        { name: 'lng', type: 'number', min: -180, max: 180 },
      ],
    },
    {
      name: 'hero_image',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
