/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Matches the storefront "Royal Maheshwari" palette: wine + gold + ivory.
        brand: {
          DEFAULT: '#9B2D3B',
          deep: '#6B1E2B',
          mid: '#551621',
          soft: '#EFD3D6',
        },
        ivory: '#FBF6EE',
        cream: '#FEFBF6',
        sage: '#F7E7E8',
        gold: '#A67C24',
        charcoal: '#2C1A1E',
        muted: '#806A6D',
        line: '#ECDFD2',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
