/* Mounts the Payload admin at /admin/* — see CLAUDE.md → Routing layout. */
import type { Metadata } from 'next'
import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap.js'

/* Payload declares `segments: string[]` even though Next.js's optional catch-all
 * makes it nominally optional — Payload handles the empty case internally.
 * Matching Payload's type signature avoids unsafe casts. */
type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, params, searchParams, importMap })

export default Page
