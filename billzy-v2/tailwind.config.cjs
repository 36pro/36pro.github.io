const { heroui } = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        bricolage: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        outfit: ['Outfit', 'system-ui', 'sans-serif'],
        bangla: ['"Tiro Bangla"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        logo: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius, 0.125rem)',
        card: 'var(--radius, 0.125rem)',
        field: 'var(--field-radius, 0.75rem)',
      },
      colors: {
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          foreground: 'var(--surface-foreground)',
          secondary: 'var(--surface-secondary)',
          'secondary-foreground': 'var(--surface-secondary-foreground)',
          tertiary: 'var(--surface-tertiary)',
          'tertiary-foreground': 'var(--surface-tertiary-foreground)',
        },
        field: {
          background: 'var(--field-background)',
          foreground: 'var(--field-foreground)',
          border: 'var(--field-border)',
          placeholder: 'var(--field-placeholder)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          foreground: 'var(--danger-foreground)',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
        },
        overlay: {
          DEFAULT: 'var(--overlay)',
          foreground: 'var(--overlay-foreground)',
        },
        separator: 'var(--separator)',
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      addCommonColors: false,
      layout: {
        radius: {
          small: "0.125rem",
          medium: "0.125rem",
          large: "0.125rem",
        },
      },
    }),
  ],
};
