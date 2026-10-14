/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './context/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a', // primary accent
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // The golfer web look (same values as lib/theme.ts)
        flx: {
          green: '#12301f',
          card: '#1a3c28',
          line: '#2b5139',
          gold: '#e6cf8a',
          mist: '#d5e1d7',
          'mist-dim': '#9fb2a4',
        },
        surface: {
          DEFAULT: '#1a3c28',
          raised: '#1a3c28',
          overlay: '#2b5139',
        },
        bg: '#12301f',
      },
    },
  },
  plugins: [],
}
