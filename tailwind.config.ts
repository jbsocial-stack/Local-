import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Regulars Design System v1.0 (9 Sep 2026) token values — see
        // CLAUDE.md. `ink` is the system's --navy; kept under its existing
        // Tailwind name since it's used across hundreds of call sites.
        coral: '#F26B5B',
        'coral-soft': '#FBE1DC',
        cream: '#F4F2ED',
        'cream-muted': '#B9C1CF',
        ink: '#1C2B44',
        'ink-2': '#243452', // --navy-2: table stripes/inset panels on navy
        'ink-muted': '#7C8698',
        paper: '#FAF8F4',
        line: '#E6E9EE',
        success: '#2E8B57',
        error: '#C0392B',
      },
      fontFamily: {
        // Windsor Pro Ultra Heavy — wordmark, H1, H2. Only weight loaded
        // under this family name, so `font-display`/`font-logo` alone
        // (no weight utility) always renders as Ultra Heavy.
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        logo: ['"Windsor Pro"', 'var(--font-display)', 'system-ui', 'sans-serif'],
        // Windsor Pro Bold — H3 and card titles only. Separate family name
        // (not a second weight under "Windsor Pro") so it never depends on
        // browser font-weight matching.
        h3: ['"Windsor Pro Bold"', 'var(--font-display)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
