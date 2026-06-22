/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0a0a0c',
          800: '#111114',
          700: '#16161a',
          600: '#1d1d22',
          500: '#26262d',
        },
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
