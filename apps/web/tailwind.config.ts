import type { Config } from 'tailwindcss';

// Same palette/type tokens as the vanilla ledger build, so the two projects
// read as siblings rather than unrelated apps.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['"Public Sans"', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ground: 'var(--ground)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        ink: 'var(--ink)',
        inkdim: 'var(--ink-dim)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        accentink: 'var(--accent-ink)',
        accentsoft: 'var(--accent-soft)',
        accentstrong: 'var(--accent-strong)',
        amber: 'var(--amber)',
        ambersoft: 'var(--amber-soft)',
        danger: 'var(--danger)',
        dangersoft: 'var(--danger-soft)',
        success: 'var(--success)',
        successsoft: 'var(--success-soft)',
      },
      borderRadius: { xl: '12px' },
    },
  },
  plugins: [],
} satisfies Config;
