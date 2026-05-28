import type { CollectionConfig } from 'payload'

export const Builders: CollectionConfig = {
  slug: 'builders',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'hq_city', 'updatedAt'],
    group: 'Catalog',
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
      unique: true,
      index: true,
      admin: { description: 'Kebab-case. Becomes the URL: /builders/<slug>.' },
      validate: (value: unknown) => {
        if (typeof value !== 'string') return 'Required.'
        return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) || 'Use lowercase kebab-case.'
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'about',
      type: 'richText',
    },
    {
      name: 'website',
      type: 'text',
      validate: (value: unknown) => {
        if (value == null || value === '') return true
        if (typeof value !== 'string') return 'Must be a URL.'
        try {
          new URL(value)
          return true
        } catch {
          return 'Must be a valid URL (https://...).'
        }
      },
    },
    {
      name: 'founded_year',
      type: 'number',
      min: 1800,
      max: new Date().getFullYear(),
    },
    {
      name: 'hq_city',
      type: 'relationship',
      relationTo: 'cities',
    },
  ],
}
