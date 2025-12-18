/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#007cf0',
        'brand-cyan': '#00dfd8',
        'brand-orange': '#ff7733',
        'brand-pink': '#ff66ff',
        'brand-lightblue': '#4dd2ff',
        'brand-tag-bg': '#f3f4f6', // Equivalent to gray-100
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 124, 240, 0.2)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0.5' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
}