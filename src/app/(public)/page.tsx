/* Homepage stub. Real homepage lands in a later phase — Phase 0 only needs a
 * placeholder so `/` returns 200 and the layout chain is exercised. */

export default function Home() {
  return (
    <section className="mx-auto max-w-prose px-2 py-8">
      <h1 className="font-display text-h1-mobile sm:text-h1 text-ink">
        Realest
      </h1>
      <p className="mt-3 text-body text-ink-muted">
        Verified new-launch, pre-launch, and under-construction property — every
        listing tied to its RERA registration. Launching in Mumbai, Thane, and Navi Mumbai.
      </p>
      <p className="mt-6 text-body text-ink-muted">
        This is a Phase 0 placeholder. Real homepage ships with the public templates.
      </p>
    </section>
  )
}
