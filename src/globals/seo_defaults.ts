import type { GlobalConfig } from 'payload'

/* Site-wide SEO defaults used as fallbacks when a page-level value is absent,
 * and as inputs to the Organization JSON-LD emitted in the public layout. */
export const SeoDefaults: GlobalConfig = {
  slug: 'seo_defaults',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Settings',
  },
  fields: [
    {
      name: 'default_og_image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Used when a page does not set its own og_image.' },
    },
    {
      type: 'collapsible',
      label: 'Organization JSON-LD',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'organization_name',
          type: 'text',
          required: true,
          defaultValue: 'Realest',
        },
        {
          name: 'organization_url',
          type: 'text',
          required: true,
          defaultValue: 'https://realest.co.in',
        },
        {
          name: 'organization_logo',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'same_as',
          type: 'array',
          admin: { description: 'Social / authoritative profile URLs. Powers Organization.sameAs.' },
          fields: [{ name: 'url', type: 'text', required: true }],
        },
      ],
    },
  ],
}
