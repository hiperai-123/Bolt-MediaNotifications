/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#edf8fd',
          100: '#d1eefa',
          200: '#a8ddf6',
          300: '#6ec8ef',
          400: '#3aaee0',
          500: '#1e96d0',
          600: '#1478b0',
          700: '#125f8e',
          800: '#134f76',
          900: '#154363',
        },
      },
    },
  },
  plugins: [],
};
