/** @type {import('tailwindcss').Config} */
const rgb = (v) => `rgb(var(${v}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware via CSS variables (see index.css). Switching data-theme
        // on <html> flips every bg-ink-*, text-gray-*, text-white, *-white/x usage.
        ink: {
          900: rgb('--ink-900'),
          800: rgb('--ink-800'),
          700: rgb('--ink-700'),
          600: rgb('--ink-600'),
          500: rgb('--ink-500'),
        },
        gray: {
          200: rgb('--gray-200'),
          300: rgb('--gray-300'),
          400: rgb('--gray-400'),
          500: rgb('--gray-500'),
          600: rgb('--gray-600'),
        },
        white: rgb('--white'),
        brand: {
          DEFAULT: '#f7941e',
          500: '#f7941e',
          600: '#e07e0a',
          400: '#ffae4d',
        },
      },
      fontFamily: {
        display: ['"Oswald"', 'Impact', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(247,148,30,0.45)',
      },
    },
  },
  plugins: [],
}
