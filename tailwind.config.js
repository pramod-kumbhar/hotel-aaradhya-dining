/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        maroon: {
          800: '#581c87',
          900: '#3b0764',
          950: '#230240',
        },
        royal: {
          800: '#7a1c1c',
          900: '#4a0e0e',
        }
      },
      fontFamily: {
        devanagari: ['"Noto Sans Devanagari"', 'sans-serif'],
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
