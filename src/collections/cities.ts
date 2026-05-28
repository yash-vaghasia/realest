import type { CollectionConfig } from 'payload'

export const Cities: CollectionConfig = {
  slug: 'cities',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'parent', 'updatedAt'],
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
      unique: true,
      index: true,
      admin: { description: 'Kebab-case. Becomes the URL: /<slug>.' },
      validate: (value: unknown) => {
        if (typeof value !== 'string') return 'Required.'
        return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) || 'Use lowercase kebab-case (e.g. "navi-mumbai").'
      },
    },
    {
      name: 'blurb',
      type: 'richText',
    },
    {
      name: 'hero_image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'cities',
      admin: { description: 'Optional. Used for future metro groupings.' },
    },
  ],
}
