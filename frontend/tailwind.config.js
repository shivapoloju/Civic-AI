/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '12px',
        '3xl': '16px',
      },
      colors: {
        brand: {
          50: '#f5f6ff',
          100: '#ebedff',
          200: '#d6daff',
          300: '#b3bcff',
          400: '#8a96ff',
          500: '#5e6ad2', // Premium Linear Indigo
          600: '#4b52ad', // Deep Indigo
          700: '#393d8a',
        },
        darkbg: {
          900: '#0c0d12', // Obsidian Dark
          800: '#161720', // Surface Panel
          700: '#242636', // Borders
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
