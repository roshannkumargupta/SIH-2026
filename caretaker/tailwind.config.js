/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#2B2419',          // primary dark text
        surface: '#FFFFFF',      // card backgrounds
        cream: '#F5EFE0',        // page background
        sun: '#E5B93C',          // accents, highlights
        fire: '#E87A3A',         // active states, medicine
        'tea-confirm': '#7A9E7E',// success
        tea: '#7A9E7E',          // alias for compatibility
        clay: '#D9CFBF',         // borders, muted
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}