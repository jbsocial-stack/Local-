import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        coral: '#F76C5E',
        cream: '#F3F1EC',
        ink: '#1B263B',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        // The wordmark only — "Windsor Pro" is a @font-face declared in
        // globals.css (public/fonts/windsor-pro-bold.ttf), not a next/font
        // Google font like display/body, since it's used in exactly the
        // handful of places the logo itself is rendered.
        logo: ['"Windsor Pro"', 'var(--font-display)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
