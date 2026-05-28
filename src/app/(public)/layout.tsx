import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

/* Self-host the brand fonts for predictable CLS and India-network latency.
 * Switzer + General Sans are shipped from /src/app/(public)/_fonts/ as variable
 * WOFF2. Brand doc allows Inter / system fallback before licenses are confirmed;
 * the Tailwind font-family stack cascades to system-ui automatically. */
const switzer = localFont({
  src: './_fonts/Switzer-Variable.woff2',
  variable: '--font-switzer',
  display: 'swap',
  weight: '100 900',
  preload: true, // above-the-fold (display)
})

const generalSans = localFont({
  src: './_fonts/GeneralSans-Variable.woff2',
  variable: '--font-general-sans',
  display: 'swap',
  weight: '100 900',
  preload: false, // body — not above-the-fold critical
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Realest — new launches, RERA-verified.',
    template: '%s · Realest',
  },
  description:
    'Verified new-launch, pre-launch, and under-construction property. Every listing tied to its RERA registration.',
  alternates: {
    languages: { 'en-IN': '/' },
  },
  icons: {
    icon: '/logo/logo-icon-Blue.svg',
  },
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${switzer.variable} ${generalSans.variable}`}>
      <body>
        <a href="#main" className="skip-link">Skip to main content</a>
        <main id="main">{children}</main>
      </body>
    </html>
  )
}
