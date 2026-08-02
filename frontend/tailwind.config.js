/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316', // Indian Saffron / Orange
          600: '#ea580c', // Deep Saffron
          700: '#c2410c',
        },
        darkbg: {
          900: '#051026', // Deep NDMA Navy Blue
          800: '#0c2147', // Card NDMA Navy Blue
          700: '#122e5e',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
