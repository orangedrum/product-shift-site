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
        'brand-red': 'rgb(250, 66, 91)',
        'brand-lightblue': '#4dd2ff',
        'brand-tag-bg': '#f3f4f6', // Equivalent to gray-100
      },
      backgroundImage: {
        'purple-gradient': 'linear-gradient(to right, #4f46e5, #a855f7)', // indigo-600 to purple-600
        'marketing-gradient': 'linear-gradient(135deg, hsl(20 100% 60%), hsl(300 100% 70%), hsl(195 100% 65%))',
        'orange-pink-gradient': 'linear-gradient(to right, #ff8c00, #ff1493)',
        'gradient-subtle': 'linear-gradient(to bottom, white, #f9fafb)', // white to gray-50
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 124, 240, 0.2)',
        'elegant': '0 25px 50px -12px rgb(0 0 0 / 0.15)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0.5' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-in-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}