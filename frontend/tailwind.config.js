/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fff9e6',
          100: '#ffecb3',
          200: '#ffdf80',
          300: '#ffd24d',
          400: '#ffc61a',
          500: '#ffd700',
          600: '#e6c200',
          700: '#b39b00',
          800: '#807300',
          900: '#4d4c00',
        },
        dark: {
          100: '#1a1a2e',
          200: '#16213e',
          300: '#0f3460',
          400: '#0a1628',
        },
      },
    },
  },
  plugins: [],
};