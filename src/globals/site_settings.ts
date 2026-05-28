import type { GlobalConfig } from 'payload'

/* Site-wide settings editable by the Realest team without a deploy.
 *
 * Note on the MahaRERA disclaimer:
 *   - The footer line is gated on the MAHARERA_AGENT_REG_NO env var (CLAUDE.md).
 *   - This global's `rera_agent_reg_no` is an admin-friendly mirror; the env var
 *     wins in code. The `footer_disclaimer_enabled` toggle is a kill-switch
 *     useful for staging or legal-hold scenarios. */
export const SiteSettings: GlobalConfig = {
  slug: 'site_settings',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Settings',
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Branding',
      admin: { initCollapsed: false },
      fields: [
        { name: 'logo_full', type: 'upload', relationTo: 'media' },
        { name: 'logo_mark', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Contact',
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'contact_email', type: 'email' },
            { name: 'contact_phone', type: 'text' },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Compliance',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'footer_disclaimer_enabled',
          type: 'checkbox',
          defaultValue: true,
          admin: { description: 'Master toggle. Disclaimer also requires MAHARERA_AGENT_REG_NO env var to be set.' },
        },
        {
          name: 'rera_agent_reg_no',
          type: 'text',
          admin: { description: 'Admin-friendly mirror. The MAHARERA_AGENT_REG_NO env var takes precedence in code.' },
        },
      ],
    },
  ],
}
