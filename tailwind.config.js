/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#111111',
          800: '#1a1a1a',
          700: '#222222',
          600: '#2d2d2d',
          500: '#3d3d3d',
          400: '#555555',
          300: '#888888',
          200: '#aaaaaa',
          100: '#cccccc',
        },
        accent: '#4d7cfe',
      },
    },
  },
  plugins: [],
}

