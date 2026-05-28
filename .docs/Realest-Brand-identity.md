# Realest — Brand Identity (Visual System)

Scope: how Realest *looks*. Voice and messaging live in `brand-voice-and-about`. This is the source of truth for every page, listing, and asset.

## Logo
- Wordmark **"Realest"** in Switzer Bold — primary blue `#0032FF` on light, off-white on dark. (No final logomark yet; use the wordmark until one exists.)
- Clear space: minimum 1× cap-height on all sides.
- Minimum width: 96px digital.
- Don't: stretch, add gradients/shadows, recolor outside the palette, or place on a busy photo without a scrim.

## Color
| Token | Hex | Role | Usage |
|---|---|---|---|
| Primary | `#0032FF` | Electric blue — brand, primary CTAs, links | The one memorable color; differentiates from MagicBricks red / 99acres green. Keep to ~10% of any screen. |
| Primary-dark | `#001A80` | Hover/active states | |
| BG | `#FAFAFA` | Page background | Default canvas |
| Text | `#1A1A1A` | Charcoal — body + headings | |
| Secondary text | `#6B7280` | Captions, meta, labels | |
| Success | `#10B981` | RERA-verified badge, confirmations | Trust signal — verified/positive states only |
| Urgency | `#F59E0B` | "Pre-launch", "few units left" | Sparingly; never on CTAs |

Accessibility: body text on BG must clear WCAG AA (charcoal on off-white passes). Never blue text on a blue field.

## Typography
- Display / headings / CTAs: **Switzer** (700 / 600 / 500)
- Body / forms / UI: **General Sans** (400 / 500 / 600)
- v1 fallback before license: **Inter / system** — ship the demo on this, swap before public launch.
- Stack: `'Switzer', 'Inter', system-ui, sans-serif`

| Element | Desktop | Mobile |
|---|---|---|
| H1 | 56 | 36 |
| H2 | 40 | 28 |
| H3 | 32 | 24 |
| Body | 16 | 16 |

Line-height: 1.2 headings, 1.6 body. Max line length ~70ch.

## Layout & UI
- Spacing base: 8px (8 / 16 / 24 / 32 / 48 / 64).
- Radius: 8px cards/inputs, 6px buttons — consistent.
- Elevation: one soft card shadow (`0 1px 3px rgba(0,0,0,.08)`). No heavy/stacked shadows.
- Grid: 12-col desktop, single-col mobile. **Design mobile-first** — 60%+ of property research is mobile.

## Components
- **Primary button:** primary-blue bg, white text, 6px radius, Switzer 600. Hover → primary-dark.
- **RERA-verified badge:** success green, check icon, "MahaRERA Verified" + number. The single most important trust element — prominent on every project card and page.
- **Listing card:** image (16:9) → status pill (top-left) → project name → locality · builder → price-from → RERA badge → CTA. Facts over adjectives.
- **Forms:** General Sans, clear labels, 44px min tap targets, blue focus ring.

## Imagery
- Real renders/photos only. No generic stock interiors, no AI clichés.
- WebP, compressed, lazy-loaded, explicit width/height (protects CLS).
- Ratios: 16:9 banners, 1:1 logos, 4:3 floor plans.

## Don't
- No decorative gradients, no shadow stacks, no colors beyond the palette.
- No exclamation-mark visual energy — trust comes from clarity, not hype.
- No carousels for critical content (hurts CWV and usability).