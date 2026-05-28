/* Phase 0.3 acceptance: a brand-token smoke page. Linked from nowhere — visit
 * directly at /_design. Renders every color, type ramp, button, and card so a
 * Lighthouse run can confirm zero font-related CLS before we build real pages.
 *
 * Not indexable.
 */
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Design tokens (internal)',
  robots: { index: false, follow: false },
}

const swatches: { name: string; hex: string; className: string; textClass: string }[] = [
  { name: 'primary', hex: '#0032FF', className: 'bg-primary', textClass: 'text-white' },
  { name: 'primary-dark', hex: '#001A80', className: 'bg-primary-dark', textClass: 'text-white' },
  { name: 'bg', hex: '#FAFAFA', className: 'bg-bg', textClass: 'text-ink' },
  { name: 'ink', hex: '#1A1A1A', className: 'bg-ink', textClass: 'text-white' },
  { name: 'ink-muted', hex: '#6B7280', className: 'bg-ink-muted', textClass: 'text-white' },
  { name: 'success', hex: '#10B981', className: 'bg-success', textClass: 'text-white' },
  { name: 'urgency', hex: '#F59E0B', className: 'bg-urgency', textClass: 'text-ink' },
]

export default function DesignTokens() {
  return (
    <div className="mx-auto max-w-5xl px-2 py-6 space-y-8">
      <header>
        <h1 className="font-display text-h1-mobile sm:text-h1">Design tokens</h1>
        <p className="mt-2 text-ink-muted">Brand-locked palette, type, spacing, radius, shadow.</p>
      </header>

      <section>
        <h2 className="font-display text-h2-mobile sm:text-h2 mb-3">Palette</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {swatches.map((s) => (
            <div key={s.name} className={`rounded-card p-3 shadow-card ${s.className} ${s.textClass}`}>
              <div className="font-display font-semibold">{s.name}</div>
              <div className="text-sm opacity-90">{s.hex}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-h2-mobile sm:text-h2 mb-3">Type ramp</h2>
        <div className="space-y-3">
          <div className="font-display text-h1-mobile sm:text-h1">H1 — Switzer 700</div>
          <div className="font-display text-h2-mobile sm:text-h2">H2 — Switzer 600</div>
          <div className="font-display text-h3-mobile sm:text-h3">H3 — Switzer 600</div>
          <div className="font-body text-body max-w-prose">
            Body — General Sans 400. Realest is a national real-estate data company,
            launching in Mumbai, Thane, and Navi Mumbai. Every listing is mapped to
            its RERA registration.
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-h2-mobile sm:text-h2 mb-3">Components</h2>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-btn bg-primary px-3 py-2 font-display font-semibold text-white hover:bg-primary-dark transition-colors">
            Primary button
          </button>
          <button className="rounded-btn border border-ink px-3 py-2 font-display font-medium text-ink hover:bg-ink/5 transition-colors">
            Secondary button
          </button>
          <span className="inline-flex items-center gap-1 rounded-btn bg-success/10 px-2 py-1 font-body text-sm text-success">
            <span aria-hidden="true">✓</span>
            <span>MahaRERA verified</span>
          </span>
          <span className="inline-flex items-center rounded-btn border-l-2 border-urgency bg-urgency/10 px-2 py-1 font-body text-sm text-ink">
            Pre-launch
          </span>
        </div>

        <article className="mt-4 max-w-md rounded-card bg-white shadow-card overflow-hidden">
          <div className="aspect-[16/9] bg-ink/10" aria-hidden="true" />
          <div className="p-3 space-y-1">
            <span className="inline-block rounded-btn bg-primary/10 px-1 py-0.5 font-body text-xs text-primary">
              New launch
            </span>
            <h3 className="font-display font-semibold text-ink">Sample Project</h3>
            <p className="font-body text-sm text-ink-muted">Worli · Sample Builder</p>
            <p className="font-display font-semibold text-ink">From ₹2.4 Cr</p>
          </div>
        </article>
      </section>
    </div>
  )
}
