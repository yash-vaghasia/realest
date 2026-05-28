import type { CollectionConfig } from 'payload'

/* CRM-grade lead collection.
 *
 * Access is locked down to admins/editors. Public submissions land via the
 * `submitLead` server action in Phase 5.2 with `overrideAccess: true` — never
 * by exposing this collection's REST/GraphQL surface.
 *
 * The `notified_at` field is the idempotency key for the new-lead email hook
 * in Phase 5.3: hook only fires when it is null, and stamps it on send. */
export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'project', 'status', 'source', 'createdAt'],
    group: 'CRM',
  },
  access: {
    // Reads/writes are admin-only. Public writes go through a server action
    // that calls Payload Local API with overrideAccess: true.
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'phone', type: 'text', required: true, index: true },
        { name: 'email', type: 'email' },
      ],
    },
    {
      name: 'message',
      type: 'textarea',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'project',
          type: 'relationship',
          relationTo: 'projects',
          index: true,
          admin: { description: 'Nullable for site-wide enquiries.' },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'new',
          index: true,
          options: [
            { label: 'New', value: 'new' },
            { label: 'Contacted', value: 'contacted' },
            { label: 'Qualified', value: 'qualified' },
            { label: 'Site visit', value: 'site_visit' },
            { label: 'Booked', value: 'booked' },
            { label: 'Won', value: 'won' },
            { label: 'Lost', value: 'lost' },
            { label: 'Disqualified', value: 'disqualified' },
          ],
        },
      ],
    },
    {
      name: 'booking_value_inr',
      type: 'number',
      min: 0,
      admin: {
        description: 'Populated when status → booked. Used for brokerage tracking.',
        condition: (data) => ['booked', 'won'].includes(data?.status),
      },
    },
    {
      name: 'assigned_to',
      type: 'relationship',
      relationTo: 'users',
      admin: { description: 'v1: unassigned by default.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'source',
          type: 'select',
          required: true,
          index: true,
          options: [
            { label: 'Project page', value: 'project_page' },
            { label: 'Locality page', value: 'locality_page' },
            { label: 'Builder page', value: 'builder_page' },
            { label: 'Home', value: 'home' },
            { label: 'Combo page', value: 'combo_page' },
          ],
        },
        { name: 'source_url', type: 'text' },
      ],
    },
    {
      type: 'collapsible',
      label: 'UTM',
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'utm_source', type: 'text' },
            { name: 'utm_medium', type: 'text' },
            { name: 'utm_campaign', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'notes',
      type: 'array',
      fields: [
        {
          name: 'author',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
        { name: 'body', type: 'richText' },
      ],
    },
    {
      name: 'notified_at',
      type: 'date',
      index: true,
      admin: {
        readOnly: true,
        description: 'Set by the new-lead email hook (Phase 5.3). Null ⇒ not yet emailed.',
        position: 'sidebar',
      },
    },
  ],
}
