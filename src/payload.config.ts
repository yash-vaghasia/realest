import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'

import { Users } from '@/collections/users'
import { Media } from '@/collections/media'
import { Cities } from '@/collections/cities'
import { Localities } from '@/collections/localities'
import { Builders } from '@/collections/builders'
import { Amenities } from '@/collections/amenities'
import { UnitTypes } from '@/collections/unit_types'
import { Projects } from '@/collections/projects'
import { Leads } from '@/collections/leads'
import { SiteSettings } from '@/globals/site_settings'
import { SeoDefaults } from '@/globals/seo_defaults'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(__dirname) },
    meta: {
      titleSuffix: ' — Realest admin',
    },
  },
  collections: [
    Users,
    Media,
    Cities,
    Localities,
    Builders,
    Amenities,
    UnitTypes,
    Projects,
    Leads,
  ],
  globals: [SiteSettings, SeoDefaults],
  editor: lexicalEditor({}),
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    // Migrations run against the DIRECT (port 5432) URL, not Supavisor pooled.
    push: false,
    migrationDir: path.resolve(__dirname, 'migrations'),
  }),
  sharp,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  plugins: [
    s3Storage({
      collections: {
        media: { prefix: 'media' },
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        region: 'auto',
        forcePathStyle: true,
      },
    }),
  ],
})
