/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf5ec',
          100: '#f2e7d2',
          200: '#e8d3a8',
          300: '#dbbc83',
          400: '#d1aa6a',
          500: '#c79a55',
          600: '#b3823f',
          700: '#93682f',
          800: '#765224',
          900: '#5d411d',
        },
        secondary: {
          50: '#f0f7f4',
          100: '#d7ebe4',
          200: '#b5d8cb',
          300: '#8dc2af',
          400: '#62a88f',
          500: '#478d75',
          600: '#36735f',
          700: '#2d5b4d',
          800: '#26493f',
          900: '#213c35',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
} 