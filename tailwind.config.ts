import type { Config } from 'tailwindcss'

// Brand tokens — single source of truth (mirrors CLAUDE.md).
// Do not extend with new palette colors, gradients, or shadow stacks.
const config: Config = {
  content: [
    './src/app/(public)/**/*.{ts,tsx,mdx}',
    './src/components/**/*.{ts,tsx}',
    './src/blocks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Locked palette — see CLAUDE.md → Brand tokens.
        primary: {
          DEFAULT: '#0032FF',
          dark: '#001A80',
        },
        bg: '#FAFAFA',
        ink: {
          DEFAULT: '#1A1A1A',
          muted: '#6B7280',
        },
        success: '#10B981',
        urgency: '#F59E0B', // backgrounds only — see brand doc
      },
      fontFamily: {
        // Switzer + General Sans, self-hosted via next/font/local in
        // src/app/(public)/layout.tsx. System-ui is the cascade fallback until
        // license confirmation is decided.
        display: ['var(--font-switzer)', 'system-ui', 'sans-serif'],
        body: ['var(--font-general-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Mobile / desktop ramp from brand doc.
        'h1-mobile': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }], // 36
        'h1': ['3.5rem', { lineHeight: '1.2', fontWeight: '700' }],         // 56
        'h2-mobile': ['1.75rem', { lineHeight: '1.2', fontWeight: '600' }], // 28
        'h2': ['2.5rem', { lineHeight: '1.2', fontWeight: '600' }],         // 40
        'h3-mobile': ['1.5rem', { lineHeight: '1.25', fontWeight: '600' }], // 24
        'h3': ['2rem', { lineHeight: '1.25', fontWeight: '600' }],          // 32
        body: ['1rem', { lineHeight: '1.6', fontWeight: '400' }],           // 16
      },
      spacing: {
        // 8px base.
        '1': '0.5rem',  // 8
        '2': '1rem',    // 16
        '3': '1.5rem',  // 24
        '4': '2rem',    // 32
        '6': '3rem',    // 48
        '8': '4rem',    // 64
      },
      borderRadius: {
        // Locked: 6px buttons, 8px cards/inputs. Nothing else.
        btn: '6px',
        card: '8px',
      },
      boxShadow: {
        // Single shadow token — never stack.
        card: '0 1px 3px rgba(0,0,0,.08)',
      },
      maxWidth: {
        prose: '70ch',
      },
    },
  },
  plugins: [],
}

export default config
