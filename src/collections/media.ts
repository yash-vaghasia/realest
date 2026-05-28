import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  upload: {
    focalPoint: true,
    // Sharp at upload writes width/height onto the doc — used by next/image for
    // explicit dimensions (zero CLS).
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 225, position: 'centre' },
      { name: 'card', width: 768, height: 432, position: 'centre' },
      { name: 'hero', width: 1600, height: 900, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'application/pdf'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describe the image for screen readers + SEO.' },
    },
    {
      name: 'credit',
      type: 'text',
      required: false,
      admin: { description: 'Photographer / source attribution if applicable.' },
    },
  ],
}
