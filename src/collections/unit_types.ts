import type { CollectionConfig } from 'payload'

export const UnitTypes: CollectionConfig = {
  slug: 'unit_types',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
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
      admin: { description: 'Display name (e.g. "1 BHK", "Studio", "Shop").' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Snake-case identifier (e.g. "1_bhk"). Combo generator transforms to kebab-case for URLs.',
      },
      validate: (value: unknown) => {
        if (typeof value !== 'string') return 'Required.'
        return /^[a-z0-9]+(_[a-z0-9]+)*$/.test(value) || 'Use lowercase snake_case (e.g. "1_bhk", "studio").'
      },
    },
  ],
}
