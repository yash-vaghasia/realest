import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    reactCompiler: false,
  },
  images: {
    remotePatterns: [
      // R2 public bucket. R2_PUBLIC_BASE_URL is set per env; we keep a permissive
      // protocol/host pattern derived from it so dev/prod can both serve the same code.
      ...(process.env.R2_PUBLIC_BASE_URL
        ? [
            {
              protocol: new URL(process.env.R2_PUBLIC_BASE_URL).protocol.replace(':', ''),
              hostname: new URL(process.env.R2_PUBLIC_BASE_URL).hostname,
            },
          ]
        : []),
    ],
  },
  // We do not expose a public REST/GraphQL surface — Local API only.
  // robots/sitemap headers are emitted by middleware.ts.
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
